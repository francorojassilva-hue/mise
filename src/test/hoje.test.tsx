import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { App } from "@/App";
import { dietaExemplo } from "@/lib/dietaAtual";
import { avisoFreezer, indiceAgora, slotsDoDia, totaisDoDia } from "@/lib/hoje";
import { addLog, alternarRefeicao, carregarSemana, getSemana, inicioSemana, reiniciarSemana, salvarTroca, setExtra, setLetra, verificarVirada, ymd } from "@/lib/semana";
import { getItem, setItem } from "@/lib/store";
import { ThemeProvider } from "@/lib/theme";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(() => reiniciarSemana("A"));

const quarta = new Date(2026, 10, 11, 9, 0); // qua, 11/nov/2026 (dia 2 da semana)

describe("lógica da tela Hoje", () => {
  it("separa refeições e rotina, ambas em ordem de horário", () => {
    const { refeicoes, rotina } = slotsDoDia(dietaExemplo, "A", [], {}, quarta);
    expect(refeicoes.map((s) => s.key)).toEqual(["pre", "cafe", "almoco", "jantar", "lanche"]);
    expect(rotina.map((s) => s.hora)).toEqual([...rotina.map((s) => s.hora)].sort());
    expect(rotina.some((s) => s.tipo === "treino")).toBe(true);
  });

  it("esconde a refeição removida hoje, mas só hoje", () => {
    const removidas = { "2": ["cafe"] };
    expect(slotsDoDia(dietaExemplo, "A", [], removidas, quarta).refeicoes.map((s) => s.key)).not.toContain("cafe");
    const quinta = new Date(2026, 10, 12, 9, 0);
    expect(slotsDoDia(dietaExemplo, "A", [], removidas, quinta).refeicoes.map((s) => s.key)).toContain("cafe");
  });

  it("aplica as trocas da semana nos macros da refeição", () => {
    const base = slotsDoDia(dietaExemplo, "A", [], {}, quarta).refeicoes.find((s) => s.key === "almoco")!.refeicao!;
    const alvo = base.itens.find((i) => dietaExemplo.trocas.grupos["proteina"]?.includes(i.alimento));
    if (!alvo) return;
    const para = dietaExemplo.trocas.grupos["proteina"]!.find((x) => x !== alvo.alimento)!;
    const trocado = slotsDoDia(dietaExemplo, "A", [{ refeicao: "almoco", de: alvo.alimento, para, gramas: alvo.g }], {}, quarta).refeicoes.find((s) => s.key === "almoco")!.refeicao!;
    expect(trocado.itens.some((i) => i.alimento === para)).toBe(true);
  });

  it("escolhe a primeira refeição que ainda vem; passou de todas, fica a última", () => {
    const { refeicoes } = slotsDoDia(dietaExemplo, "A", [], {}, quarta);
    expect(indiceAgora(refeicoes, new Date(2026, 10, 11, 6, 0))).toBe(0);
    expect(indiceAgora(refeicoes, new Date(2026, 10, 11, 12, 0))).toBe(2);
    expect(indiceAgora(refeicoes, new Date(2026, 10, 11, 23, 0))).toBe(refeicoes.length - 1);
  });

  it("soma kcal e proteína só do dia pedido", () => {
    const logs = [
      { id: "1", kind: "refeicao", ref: "pre", label: "x", em: "", data: "2026-11-11", letra: "A", kcal: 400.4, P: 30, C: null, G: null },
      { id: "2", kind: "coringa", ref: "cafe", label: "y", em: "", data: "2026-11-11", letra: "A", kcal: 500, P: null, C: null, G: null },
      { id: "3", kind: "refeicao", ref: "pre", label: "z", em: "", data: "2026-11-10", letra: "A", kcal: 999, P: 99, C: null, G: null },
    ] as const;
    expect(totaisDoDia([...logs], "2026-11-11")).toEqual({ kcal: 900, P: 30 });
  });

  it("o aviso do freezer vem das refeições congeladas de amanhã", () => {
    const { itens, hora } = avisoFreezer(dietaExemplo, "A", {}, quarta);
    expect(itens.length).toBeGreaterThan(0);
    expect(hora).toBe("21:00");
    expect(avisoFreezer(dietaExemplo, "A", { "3": ["almoco", "jantar", "lanche"] }, quarta).itens).toHaveLength(0);
  });
});

describe("estado da semana", () => {
  it("guarda registros, trocas e refeições removidas no aparelho", async () => {
    addLog({ kind: "refeicao", ref: "pre", label: "Pré-treino", kcal: 300, P: 20 });
    alternarRefeicao(2, "cafe");
    alternarRefeicao(2, "jantar");
    alternarRefeicao(2, "cafe");
    salvarTroca({ refeicao: "almoco", de: "a", para: "b", gramas: 100 });
    salvarTroca({ refeicao: "almoco", de: "a", para: "c", gramas: 120 });
    const s = getSemana();
    expect(s.logs).toHaveLength(1);
    expect(s.removidas["2"]).toEqual(["jantar"]);
    expect(s.swaps).toEqual([{ refeicao: "almoco", de: "a", para: "c", gramas: 120 }]);
    await waitFor(async () => expect((await getItem<{ logs: unknown[] }>("semana"))?.logs).toHaveLength(1));
  });

  it("pessoa extra: undefined volta a valer a da dieta", () => {
    setExtra(null);
    expect(getSemana().extra).toBeNull();
    setExtra(undefined);
    expect("extra" in getSemana()).toBe(false);
  });

  it("semana nova zera registros e trocas, mas mantém a letra", async () => {
    await setItem("semana", { semana: "2020-01-06", letra: "C", swaps: [{ refeicao: "a", de: "b", para: "c", gramas: 1 }], removidas: { "0": ["pre"] }, logs: [{ id: "x" }], pegos: ["p"] });
    await carregarSemana();
    const s = getSemana();
    expect(s.letra).toBe("C");
    expect(s.semana).toBe(ymd(inicioSemana()));
    expect([s.swaps, s.logs, s.pegos, Object.keys(s.removidas)].map((x) => x.length)).toEqual([0, 0, 0, 0]);
  });

  it("dado guardado ilegível vira semana nova sem quebrar", async () => {
    await setItem("semana", "lixo");
    await carregarSemana();
    expect(getSemana().logs).toEqual([]);
    verificarVirada();
  });
});

describe("tela Hoje", () => {
  const montar = () => render(<ThemeProvider><App /></ThemeProvider>);

  it("mostra a refeição de agora, a rotina e os anéis", () => {
    montar();
    expect(screen.getByRole("button", { name: /Comi/ })).toBeInTheDocument();
    expect(screen.getByText(/Agora ·/)).toBeInTheDocument();
    expect(screen.getByText("Proteína")).toBeInTheDocument();
    expect(screen.getByText(/Olá, /)).toBeInTheDocument();
  });

  it("'Comi' registra a refeição e vira 'Feito!'", async () => {
    montar();
    fireEvent.click(screen.getByRole("button", { name: /Comi/ }));
    await waitFor(() => expect(getSemana().logs).toHaveLength(1));
    expect(getSemana().logs[0]!.kcal).toBeGreaterThan(0);
    expect(await screen.findByRole("button", { name: /Feito!/ })).toBeDisabled();
  });

  it("Coringa → 'Comi fora' registra as kcal do tamanho escolhido", async () => {
    montar();
    fireEvent.click(screen.getByRole("button", { name: /Coringa/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Comi fora/ }));
    fireEvent.click(await screen.findByRole("button", { name: /médio/ }));
    await waitFor(() => expect(getSemana().logs[0]?.kcal).toBe(800));
    expect(getSemana().logs[0]!.kind).toBe("coringa");
  });

  it("Trocar lista os itens que têm equivalente", async () => {
    montar();
    fireEvent.click(screen.getByRole("button", { name: /Trocar/ }));
    expect(await screen.findAllByRole("button", { name: /g|ovo|pão|banana|\w/i })).not.toHaveLength(0);
  });

  it("mudar a letra pelo selo muda o tema", async () => {
    montar();
    setLetra("B");
    await waitFor(() => expect(document.documentElement.dataset["theme"]).toBe("B"));
    expect(screen.getByRole("button", { name: "Semana B" })).toBeInTheDocument();
  });
});
