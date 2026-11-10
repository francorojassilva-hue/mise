import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { App } from "@/App";
import { dietaExemplo, salvarDieta, voltarAoExemplo } from "@/lib/dietaAtual";
import { getSemana, reiniciarSemana } from "@/lib/semana";
import { ThemeProvider } from "@/lib/theme";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(async () => {
  await voltarAoExemplo();
  await reiniciarSemana("A");
});

const abrirSemana = async () => {
  render(<ThemeProvider><App /></ThemeProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Semana A" }));
  return screen.findByRole("group", { name: "Letra da semana" });
};

describe("tela Semana", () => {
  it("troca a letra e mostra o cardápio dela", async () => {
    await abrirSemana();
    expect(screen.getByText("Cardápio A")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Letra B" }));
    expect(await screen.findByText("Cardápio B")).toBeInTheDocument();
    expect(getSemana().letra).toBe("B");
  });

  it("liga e desliga uma refeição num dia", async () => {
    await abrirSemana();
    fireEvent.click(screen.getByRole("button", { name: "qua" }));
    const chip = screen.getByRole("button", { name: "Almoço qua" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip);
    expect(getSemana().removidas["2"]).toEqual(["almoco"]);
    expect(screen.getByRole("button", { name: "Almoço qua" })).toHaveAttribute("aria-pressed", "false");
  });

  it("mostra refeições, marmitas e a estimativa em reais", async () => {
    await abrirSemana();
    expect(screen.getByText(/refeições · .* marmitas · R\$/)).toBeInTheDocument();
  });

  it("porções por refeição seguem as refeições removidas", async () => {
    await abrirSemana();
    fireEvent.click(screen.getByRole("button", { name: "seg" }));
    fireEvent.click(screen.getByRole("button", { name: "Jantar seg" }));
    const jantar = screen.getByText("Jantar", { selector: "p" });
    expect(within(jantar.parentElement!).getByText("6")).toBeInTheDocument();
  });

  it("abre uma refeição, troca um alimento e desfaz", async () => {
    await abrirSemana();
    fireEvent.click(screen.getByText("Almoço", { selector: "span" }));
    const trocar = (await screen.findAllByRole("button", { name: /^Trocar / }))[0]!;
    fireEvent.click(trocar);
    const opcoes = await screen.findAllByRole("button", { name: /kcal/ });
    fireEvent.click(opcoes[0]!);
    fireEvent.click(await screen.findByRole("button", { name: /Confirmar/ }));
    await waitFor(() => expect(getSemana().swaps).toHaveLength(1));
    fireEvent.click(await screen.findByRole("button", { name: /Voltar ao original/ }));
    await waitFor(() => expect(getSemana().swaps).toHaveLength(0));
  });

  it("pessoa extra da dieta liga e desliga e muda as porções", async () => {
    await salvarDieta({ ...dietaExemplo, pessoaExtra: { nome: "Ana", fator: 0.8, refeicoes: ["almoco"], dias: [0, 1, 2, 3, 4, 5, 6] } });
    await abrirSemana();
    const chave = screen.getByRole("switch", { name: "Semana com Ana" });
    expect(chave).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("12.6")).toBeInTheDocument();
    fireEvent.click(chave);
    expect(getSemana().extra).toBeNull();
    expect(screen.queryByText("12.6")).not.toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Semana com Ana" })).toHaveAttribute("aria-checked", "false");
  });

  it("'Ver lista de compras' abre o Mercado", async () => {
    await abrirSemana();
    fireEvent.click(screen.getByRole("button", { name: /Ver lista de compras/ }));
    expect((await screen.findAllByRole("heading", { name: "Mercado" })).length).toBeGreaterThan(0);
  });
});
