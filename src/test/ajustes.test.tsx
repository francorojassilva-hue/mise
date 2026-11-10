import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { App } from "@/App";
import { faltamHoje } from "@/lib/agendador";
import { getAjustes, reiniciarAjustes } from "@/lib/ajustes";
import { backupEmTexto, montarBackup, restaurarBackup } from "@/lib/backup";
import { getDieta, salvarDieta, usandoExemplo, voltarAoExemplo, dietaExemplo } from "@/lib/dietaAtual";
import { exportarDieta } from "@/lib/importar";
import { lembretesDoDia } from "@/lib/lembretes";
import { getPrecos, reiniciarPrecos, salvarPrecos } from "@/lib/precos";
import { getSemana, reiniciarSemana } from "@/lib/semana";
import { getTempos, reiniciarTempos, salvarTempos } from "@/lib/tempos";
import { ThemeProvider } from "@/lib/theme";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(async () => {
  await voltarAoExemplo();
  await reiniciarSemana("A");
  await reiniciarPrecos();
  await reiniciarTempos();
  await reiniciarAjustes();
});

const abrirAjustes = async () => {
  render(<ThemeProvider><App /></ThemeProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Ajustes" }));
  return screen.findByText("Perfil");
};

describe("backup", () => {
  it("leva tudo e restaura depois de apagar", async () => {
    await salvarPrecos({ ovo: 21.5 });
    await salvarTempos({ "R1:0": [60, 70] });
    const texto = backupEmTexto(await montarBackup());
    await reiniciarPrecos();
    await reiniciarTempos();
    expect(getPrecos()).toEqual({});
    const r = await restaurarBackup(texto);
    expect(r.ok).toBe(true);
    expect(getPrecos()).toEqual({ ovo: 21.5 });
    expect(getTempos()).toEqual({ "R1:0": [60, 70] });
  });

  it("backup parcial não apaga a dieta nem os outros dados", async () => {
    await salvarDieta({ ...dietaExemplo, pessoa: { ...dietaExemplo.pessoa, nome: "Teste" } });
    const parcial = JSON.stringify({ formato: "mise-backup", versao: 1, dados: { precos: { arroz: 5, ruim: -1, texto: "x" } } });
    const r = await restaurarBackup(parcial);
    expect(r).toEqual({ ok: true, itens: ["precos"] });
    expect(getPrecos()).toEqual({ arroz: 5 });
    expect(getDieta().pessoa.nome).toBe("Teste");
  });

  it("recusa arquivo que não é backup ou com dieta estragada, sem gravar nada", async () => {
    expect((await restaurarBackup("oi")).ok).toBe(false);
    expect((await restaurarBackup(JSON.stringify({ formato: "outro" }))).ok).toBe(false);
    const ruim = JSON.stringify({ formato: "mise-backup", versao: 1, dados: { precos: { ovo: 9 }, dieta: { formato: "mise-dieta" } } });
    const r = await restaurarBackup(ruim);
    expect(r.ok).toBe(false);
    expect(getPrecos()).toEqual({});
  });
});

describe("agendador", () => {
  it("só agenda o que ainda não passou", () => {
    const ligados = { tipos: { refeicao: true } };
    const dia = new Date(2026, 10, 10, 0, 0);
    const todos = lembretesDoDia(dietaExemplo, dia, ligados, "A");
    expect(todos.length).toBe(dietaExemplo.refeicoes.length);
    const meioDia = new Date(2026, 10, 10, 12, 0);
    const faltam = faltamHoje(todos, meioDia);
    expect(faltam.length).toBeGreaterThan(0);
    expect(faltam.length).toBeLessThan(todos.length);
    expect(faltam.every((l) => +l.at > +meioDia)).toBe(true);
  });
});

describe("tela Ajustes", () => {
  it("edita o nome e o horário de uma refeição", async () => {
    await abrirAjustes();
    const nome = screen.getByLabelText("Nome (cafe)");
    fireEvent.change(nome, { target: { value: "Primeiro café" } });
    fireEvent.blur(nome);
    await waitFor(() => expect(getDieta().refeicoes.find((r) => r.id === "cafe")?.nome).toBe("Primeiro café"));
    const hora = screen.getByLabelText("Horário de Primeiro café");
    fireEvent.change(hora, { target: { value: "08:15" } });
    fireEvent.blur(hora);
    await waitFor(() => expect(getDieta().refeicoes.find((r) => r.id === "cafe")?.hora).toBe("08:15"));
    expect(usandoExemplo()).toBe(false);
  });

  it("muda o perfil e mostra o gasto estimado", async () => {
    await abrirAjustes();
    const peso = screen.getByLabelText("Peso (kg)");
    fireEvent.change(peso, { target: { value: "80" } });
    fireEvent.blur(peso);
    await waitFor(() => expect(getDieta().pessoa.pesoKg).toBe(80));
    fireEvent.click(screen.getByRole("button", { name: "Intenso" }));
    await waitFor(() => expect(getDieta().pessoa.atividade).toBe(1.725));
    expect(screen.getByText(/Gasto estimado/)).toBeInTheDocument();
  });

  it("não aceita idade inválida", async () => {
    await abrirAjustes();
    const idade = screen.getByLabelText("Idade");
    const antes = getDieta().pessoa.idade;
    fireEvent.change(idade, { target: { value: "abc" } });
    fireEvent.blur(idade);
    expect(getDieta().pessoa.idade).toBe(antes);
    expect(idade).toHaveValue(antes);
  });

  it("liga um lembrete, adiciona e tira a pessoa extra", async () => {
    await abrirAjustes();
    fireEvent.click(screen.getByRole("switch", { name: "Refeições" }));
    await waitFor(() => expect(getAjustes().tipos.refeicao).toBe(true));
    fireEvent.click(screen.getByRole("button", { name: /Cozinhar para mais uma pessoa/ }));
    await waitFor(() => expect(getDieta().pessoaExtra?.nome).toBe("Pessoa extra"));
    expect(getSemana().extra).toBeUndefined();
    fireEvent.click(screen.getByRole("button", { name: /Tirar a pessoa extra/ }));
    await waitFor(() => expect(getDieta().pessoaExtra).toBeNull());
  });

  it("sobe uma dieta colada e depois volta ao exemplo", async () => {
    await abrirAjustes();
    fireEvent.click(screen.getByRole("button", { name: "Subir nova dieta" }));
    const caixa = await screen.findByLabelText("Colar minha dieta");
    const nova = { ...dietaExemplo, pessoa: { ...dietaExemplo.pessoa, nome: "Maria" } };
    fireEvent.change(caixa, { target: { value: "```json\n" + exportarDieta(nova) + "\n```" } });
    fireEvent.click(screen.getByRole("button", { name: "Conferir" }));
    const usar = await screen.findByRole("button", { name: "Usar esta dieta" });
    expect(screen.getByText("Dieta de Maria")).toBeInTheDocument();
    fireEvent.click(usar);
    await waitFor(() => expect(getDieta().pessoa.nome).toBe("Maria"));
    expect(usandoExemplo()).toBe(false);
    fireEvent.click(await screen.findByRole("button", { name: /Voltar à dieta de exemplo/ }));
    fireEvent.click(screen.getByRole("button", { name: /Sim, voltar ao exemplo/ }));
    await waitFor(() => expect(usandoExemplo()).toBe(true));
  });

  it("mostra o erro humano quando a dieta colada não serve", async () => {
    await abrirAjustes();
    fireEvent.click(screen.getByRole("button", { name: "Subir nova dieta" }));
    const caixa = await screen.findByLabelText("Colar minha dieta");
    fireEvent.change(caixa, { target: { value: "oi, tudo bem?" } });
    fireEvent.click(screen.getByRole("button", { name: "Conferir" }));
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(usandoExemplo()).toBe(true);
    expect(within(screen.getByRole("status")).getByText(/.+/)).toBeInTheDocument();
  });
});
