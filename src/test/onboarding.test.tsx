import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { App } from "@/App";
import { dietaExemplo, getDieta, salvarDieta, usandoExemplo, voltarAoExemplo } from "@/lib/dietaAtual";
import { exportarDieta } from "@/lib/importar";
import { getOnboarding, reiniciarOnboarding } from "@/lib/onboarding";
import { comQuantidade, montarPromptEntrevista, numerarRefeicoes, REFEICOES_SUGERIDAS } from "@/lib/promptEntrevista";
import { reiniciarSemana } from "@/lib/semana";
import { setItem } from "@/lib/store";
import { ThemeProvider } from "@/lib/theme";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(async () => {
  await voltarAoExemplo();
  await reiniciarSemana("A");
  await reiniciarOnboarding(false);
  // reiniciarOnboarding(false) apaga a chave: o App lê "nunca abriu"
});

describe("prompt da entrevista", () => {
  it("leva as refeições escolhidas e não deixa marca solta", () => {
    const p = montarPromptEntrevista(REFEICOES_SUGERIDAS);
    expect(p).toContain("r1 · Café da manhã · 07:00");
    expect(p).toContain("r4 · Jantar · 20:00");
    expect(p).not.toContain("{{");
    expect(p).toContain("Use exatamente esta lista");
    expect(p).toContain('"formato": "mise-dieta"');
  });
  it("sem lista, manda a IA perguntar as refeições", () => {
    const p = montarPromptEntrevista();
    expect(p).toContain("Ainda não defini no app");
    expect(p).not.toContain("{{");
  });
  it("numera por horário e respeita 3 a 7 refeições", () => {
    const n = numerarRefeicoes([{ nome: "Jantar", hora: "20:00" }, { nome: "Café", hora: "07:00" }]);
    expect(n.map((r) => r.id + r.nome)).toEqual(["r1Café", "r2Jantar"]);
    expect(comQuantidade(REFEICOES_SUGERIDAS, 9)).toHaveLength(7);
    expect(comQuantidade(REFEICOES_SUGERIDAS, 1)).toHaveLength(3);
    expect(comQuantidade(REFEICOES_SUGERIDAS, 6).slice(0, 4)).toEqual(REFEICOES_SUGERIDAS);
  });
});

describe("onboarding", () => {
  it("abre na primeira vez e deixa usar a dieta de exemplo", async () => {
    render(<ThemeProvider><App /></ThemeProvider>);
    expect(await screen.findByRole("dialog", { name: "Configuração inicial" })).toBeInTheDocument();
    expect(screen.getByText("Passo 1 de 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Usar a dieta de exemplo" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Configuração inicial" })).not.toBeInTheDocument());
    expect(getOnboarding().feito).toBe(true);
    expect(usandoExemplo()).toBe(true);
  });

  it("percorre os 4 passos e cola a dieta", async () => {
    render(<ThemeProvider><App /></ThemeProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "Criar minha dieta com IA" }));
    expect(await screen.findByText("Suas refeições")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mais uma refeição" }));
    expect(screen.getByLabelText("Nome da refeição 5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Menos uma refeição" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Entrevista com a IA")).toBeInTheDocument();
    let copiado = "";
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async (t: string) => void (copiado = t) }, configurable: true });
    fireEvent.click(screen.getByRole("button", { name: "Copiar prompt da entrevista" }));
    await waitFor(() => expect(copiado).toContain("r2 · Almoço · 12:30"));
    fireEvent.click(screen.getByRole("button", { name: "Já tenho a minha dieta" }));
    const caixa = await screen.findByLabelText("Colar minha dieta");
    const nova = { ...dietaExemplo, pessoa: { ...dietaExemplo.pessoa, nome: "Bia" } };
    fireEvent.change(caixa, { target: { value: exportarDieta(nova) } });
    fireEvent.click(screen.getByRole("button", { name: "Conferir" }));
    fireEvent.click(await screen.findByRole("button", { name: "Começar" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Configuração inicial" })).not.toBeInTheDocument());
    expect(getDieta().pessoa.nome).toBe("Bia");
    expect(await screen.findByText("Olá, Bia")).toBeInTheDocument();
  });

  it("não aparece para quem já tem dieta própria", async () => {
    await salvarDieta({ ...dietaExemplo, pessoa: { ...dietaExemplo.pessoa, nome: "Caio" } });
    render(<ThemeProvider><App /></ThemeProvider>);
    await waitFor(() => expect(getOnboarding().feito).toBe(true));
    expect(screen.queryByRole("dialog", { name: "Configuração inicial" })).not.toBeInTheDocument();
  });

  it("restaura um backup na primeira tela", async () => {
    render(<ThemeProvider><App /></ThemeProvider>);
    await screen.findByRole("dialog", { name: "Configuração inicial" });
    const backup = JSON.stringify({ formato: "mise-backup", versao: 1, dados: { precos: { ovo: 20 } } });
    const entrada = screen.getByTestId("backup-inicial");
    fireEvent.change(entrada, { target: { files: [new File([backup], "b.json", { type: "application/json" })] } });
    await waitFor(() => expect(getOnboarding().feito).toBe(true));
  });

  it("guarda o passo para continuar depois", async () => {
    await setItem("onboarding", { feito: false, etapa: 2, refeicoes: REFEICOES_SUGERIDAS });
    render(<ThemeProvider><App /></ThemeProvider>);
    expect(await screen.findByText("Entrevista com a IA")).toBeInTheDocument();
  });
});
