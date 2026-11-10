import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { App } from "@/App";
import { formatarDuracao } from "@/components/mise/Preparo";
import { expandirRoteiro, instrucao } from "@/lib/cozinhar";
import { porcoes } from "@/lib/porcoes";
import { dietaExemplo, voltarAoExemplo } from "@/lib/dietaAtual";
import { reiniciarSemana, setLetra } from "@/lib/semana";
import { estimativaDe, getTempos, registrarTempo, reiniciarTempos } from "@/lib/tempos";
import { ThemeProvider } from "@/lib/theme";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  Element.prototype.scrollTo ??= () => {};
});
beforeEach(async () => {
  await voltarAoExemplo();
  await reiniciarSemana("A");
  await reiniciarTempos();
});

const abrirPreparo = async () => {
  render(<ThemeProvider><App /></ThemeProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Preparo" }));
  return screen.findByRole("button", { name: "Começar" });
};

describe("tempos aprendidos", () => {
  it("guarda só medições razoáveis e estima pela média das 3 últimas", () => {
    registrarTempo("r1:1", 2); // curto demais, ignora
    expect(getTempos()["r1:1"]).toBeUndefined();
    for (const s of [60, 100, 120, 140]) registrarTempo("r1:1", s);
    expect(estimativaDe(getTempos(), "r1:1")).toBe(120);
    expect(estimativaDe(getTempos(), "nunca")).toBeNull();
    expect(estimativaDe(getTempos(), undefined)).toBeNull();
  });
  it("formata a duração", () => {
    expect(formatarDuracao(45 * 60)).toBe("45 min");
    expect(formatarDuracao(100 * 60)).toBe("1h40");
  });
});

describe("tela Preparo", () => {
  it("mostra a letra, o tempo, as marmitas, os equipamentos, a véspera e o cronograma", async () => {
    await abrirPreparo();
    expect(screen.getByText("Preparo A")).toBeInTheDocument();
    expect(screen.getByText("Tempo estimado")).toBeInTheDocument();
    expect(screen.getByText("Marmitas")).toBeInTheDocument();
    expect(screen.getByText("Véspera")).toBeInTheDocument();
    expect(screen.getByLabelText("Cronograma do preparo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Prompt IA/ })).toBeInTheDocument();
  });

  it("os itens da véspera se marcam", async () => {
    await abrirPreparo();
    const caixa = screen.getAllByRole("checkbox")[0]!;
    expect(caixa).toHaveAttribute("aria-checked", "false");
    fireEvent.click(caixa);
    expect(screen.getAllByRole("checkbox")[0]).toHaveAttribute("aria-checked", "true");
  });

  it("o cronograma acompanha a letra", async () => {
    await abrirPreparo();
    setLetra("C");
    expect(await screen.findByText("Preparo C")).toBeInTheDocument();
  });
});

describe("modo cozinhar", () => {
  const passosA = expandirRoteiro(dietaExemplo, "A");

  it("abre no primeiro passo com a instrução completa visível, sem botão 'mais'", async () => {
    await abrirPreparo();
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    const instrucao = await screen.findByTestId("instrucao");
    expect(instrucao.textContent!.length).toBeGreaterThan(10);
    expect(instrucao.textContent).not.toMatch(/\{/); // nenhuma ficha sem preencher
    expect(screen.queryByRole("button", { name: /^mais$/ })).not.toBeInTheDocument();
    expect(screen.getByText(passosA[0]!.titulo)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Voltar/ })).toBeDisabled();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("Próximo avança, Voltar volta e tocar numa barra do cronograma pula para o passo", async () => {
    await abrirPreparo();
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    await screen.findByTestId("instrucao");
    fireEvent.click(screen.getByRole("button", { name: /Próximo/ }));
    await screen.findByText(passosA[1]!.titulo);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    fireEvent.click(screen.getByRole("button", { name: /Voltar/ }));
    await screen.findByText(passosA[0]!.titulo);
    fireEvent.click(screen.getByRole("button", { name: "Passo 3" }));
    await screen.findByText(passosA[2]!.titulo);
  });

  it("chega ao 'Tudo pronto!' e fecha", { timeout: 30000 }, async () => {
    await abrirPreparo();
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    for (let k = 0; k < passosA.length; k++) {
      fireEvent.click(await screen.findByRole("button", { name: /Próximo/ }));
    }
    expect(await screen.findByText("Tudo pronto!", {}, { timeout: 5000 })).toBeInTheDocument();
    const fechar = screen.getAllByRole("button", { name: "Fechar" }).at(-1)!;
    fireEvent.click(fechar);
    await waitFor(() => expect(screen.queryByText("Tudo pronto!")).not.toBeInTheDocument());
  });

  it("o tempo gasto no passo vira estimativa para a próxima vez (ignora passo de menos de 5 s)", async () => {
    await abrirPreparo();
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    await screen.findByTestId("instrucao");
    fireEvent.click(screen.getByRole("button", { name: /Próximo/ }));
    expect(Object.keys(getTempos())).toHaveLength(0);
  });

  it("o Prompt IA copia o roteiro com a cozinha da pessoa", async () => {
    let copiado = "";
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async (t: string) => { copiado = t; } }, configurable: true });
    await abrirPreparo();
    fireEvent.click(screen.getByRole("button", { name: /Prompt IA/ }));
    await waitFor(() => expect(copiado).toContain("parceiro de cozinha"));
    expect(copiado).toContain("Passo 1");
    expect(copiado).toContain("cardápio A");
  });

  it("a instrução de cada passo das três letras sai sem ficha solta nem 'sem dado' (alimento de outra letra vira só o nome)", () => {
    for (const l of ["A", "B", "C"] as const) {
      const porc = porcoes(dietaExemplo);
      for (const p of expandirRoteiro(dietaExemplo, l)) {
        const t = instrucao(dietaExemplo, p, l, porc);
        expect(t, `${l}: ${p.titulo}`).not.toMatch(/[{}]/);
        expect(t, `${l}: ${p.titulo}`).not.toContain("sem dado");
      }
    }
  });
});
