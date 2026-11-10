import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { restoredMode, validLetter, type Letra, type Mode } from "./appearance";

const KEY = "mise-theme";
type Ctx = { letter: Letra; setLetter: (letter: Letra) => void; mode: Mode; setMode: (mode: Mode) => void };
const ThemeCtx = createContext<Ctx | null>(null);

function read(): { letter: Letra; mode: Mode } {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { letter: validLetter(saved.letter), mode: restoredMode(saved.mode) };
  } catch {
    return { letter: "A", mode: "light" };
  }
}

/** Tema fica em localStorage (e não no store) para o script do index.html aplicar antes de pintar. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(read);
  useEffect(() => {
    document.documentElement.dataset["theme"] = state.letter;
    document.documentElement.classList.toggle("dark", state.mode === "dark");
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage indisponível */
    }
  }, [state]);
  const value: Ctx = {
    letter: state.letter,
    mode: state.mode,
    // devolver o mesmo objeto quando nada muda evita re-render em cadeia
    setLetter: (letter) => setState((s) => (s.letter === letter ? s : { ...s, letter })),
    setMode: (mode) => setState((s) => (s.mode === mode ? s : { ...s, mode })),
  };
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeCtx);
  if (!context) throw new Error("useTheme fora do ThemeProvider");
  return context;
}
