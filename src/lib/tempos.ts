/**
 * Tempo real de cada passo do preparo, medido no modo cozinhar. A estimativa de um passo
 * é a média das 3 últimas medições. Guardado no aparelho (chave "tempos"); chave do passo = `receita:índice`.
 */
import { useSyncExternalStore } from "react";
import { estimativa } from "./cozinhar";
import { getItem, removeItem, setItem } from "./store";

const CHAVE = "tempos";
const MAX_POR_PASSO = 10;
export type Tempos = Record<string, number[]>;

let estado: Tempos = {};
const ouvintes = new Set<() => void>();
const assinar = (f: () => void) => {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
};
const trocar = (t: Tempos) => {
  estado = t;
  ouvintes.forEach((f) => f());
};

export const useTempos = () => useSyncExternalStore(assinar, () => estado, () => estado);
export const getTempos = () => estado;

/** Só aceita listas de segundos positivos; o resto do que estiver guardado é ignorado. */
export function limparTempos(x: unknown): Tempos {
  if (!x || typeof x !== "object" || Array.isArray(x)) return {};
  const out: Tempos = {};
  for (const [k, v] of Object.entries(x)) {
    const ok = Array.isArray(v) ? v.filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n > 0) : [];
    if (ok.length) out[k] = ok.slice(-MAX_POR_PASSO);
  }
  return out;
}

export async function carregarTempos() {
  trocar(limparTempos(await getItem<unknown>(CHAVE)));
}
export async function salvarTempos(t: Tempos) {
  const limpo = limparTempos(t);
  await setItem(CHAVE, limpo);
  trocar(limpo);
}
/** Guarda os segundos que o passo levou (ignora medições absurdas). */
export function registrarTempo(chave: string, segundos: number) {
  if (!(segundos >= 5)) return;
  trocar({ ...estado, [chave]: [...(estado[chave] ?? []), Math.round(segundos)].slice(-MAX_POR_PASSO) });
  void setItem(CHAVE, estado);
}
/** Estimativa aprendida (s) de um passo, ou null se nunca foi medido. */
export const estimativaDe = (t: Tempos, chave: string | undefined) => (chave ? estimativa(t[chave] ?? []) : null);
export const ultimoTempo = (t: Tempos, chave: string | undefined) => (chave ? t[chave]?.at(-1) ?? null : null);
/** Só para testes. */
export async function reiniciarTempos() {
  await removeItem(CHAVE);
  trocar({});
}
