import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { App } from "@/App";
import { textoDaLista } from "@/components/mise/Mercado";
import { dietaExemplo, voltarAoExemplo } from "@/lib/dietaAtual";
import { listaCompras } from "@/lib/mercado";
import { reiniciarPrecos } from "@/lib/precos";
import { getSemana, reiniciarSemana, setLetra } from "@/lib/semana";
import { ThemeProvider } from "@/lib/theme";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(async () => {
  await voltarAoExemplo();
  await reiniciarSemana("A");
  reiniciarPrecos();
});

const abrirMercado = async () => {
  render(<ThemeProvider><App /></ThemeProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Mercado" }));
  return screen.findByText("Estimado");
};

describe("tela Mercado", () => {
  it("mostra o total da semana A contra o orçamento", async () => {
    await abrirMercado();
    expect(screen.getByText(/254,22/)).toBeInTheDocument();
    expect(screen.getByText(/250,00/)).toBeInTheDocument();
  });

  it("o total acompanha a letra da semana", async () => {
    await abrirMercado();
    setLetra("B");
    await waitFor(() => expect(screen.getByText(/229,42/)).toBeInTheDocument());
  });

  it("agrupa em seções e marca 'Peguei' (com risco no nome) e limpa", async () => {
    await abrirMercado();
    expect(screen.getByText("Proteínas")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Limpar marcações/ })).not.toBeInTheDocument();
    const peguei = screen.getAllByRole("button", { name: /^Peguei / })[0]!;
    fireEvent.click(peguei);
    await waitFor(() => expect(getSemana().pegos).toHaveLength(1));
    expect(screen.getByText(/1 de \d+ pegos/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Peguei / })[0]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /Limpar marcações/ }));
    await waitFor(() => expect(getSemana().pegos).toHaveLength(0));
  });

  it("abre 'Custos e médias' com o gráfico A × B × C", async () => {
    await abrirMercado();
    fireEvent.click(screen.getByRole("button", { name: /Custos e médias/ }));
    expect(await screen.findByText("A × B × C")).toBeInTheDocument();
    expect(screen.getByText(/Ainda sem preços médios/)).toBeInTheDocument();
  });

  it("o texto de compartilhar agrupa por mercado e traz o total", () => {
    const itens = listaCompras(dietaExemplo, "A");
    const txt = textoDaLista(itens, (id) => dietaExemplo.mercado.lojas.find((l) => l.id === id || l.nome === id)?.nome ?? id, 123.4);
    expect(txt).toContain("*Atacado*");
    expect(txt).toContain("• ");
    expect(txt).toContain("Total ≈");
  });
});
