import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { App } from "@/App";
import { ThemeProvider } from "@/lib/theme";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const montar = () =>
  render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );

describe("casca do app", () => {
  it("mostra o dock com as 4 abas e o selo da letra A", () => {
    montar();
    for (const nome of ["Hoje", "Semana", "Mercado", "Preparo"]) {
      expect(screen.getByRole("button", { name: nome })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Semana A" })).toBeInTheDocument();
  });

  it("alterna claro e escuro", async () => {
    montar();
    fireEvent.click(screen.getByRole("button", { name: "Modo escuro" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Modo claro" }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("troca a letra pelo painel Semana e aplica o tema no html", async () => {
    montar();
    fireEvent.click(screen.getByRole("button", { name: "Semana A" }));
    fireEvent.click(await screen.findByRole("button", { name: "B" }));
    expect(document.documentElement.dataset["theme"]).toBe("B");
  });
});
