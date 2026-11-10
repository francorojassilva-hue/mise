/**
 * Preço médio por alimento (aprendido com o uso e trazido da v2 pelo backup).
 * Sobrescreve o preço da dieta na lista do Mercado. Guardado no aparelho (chave "precos").
 */
import { useSyncExternalStore } from "react";
import { getItem, setItem } from "./store";

const CHAVE = "precos";
export type Precos = Record<string, number>;

let estado: Precos = {};
const ouvintes = new Set<() => void>();
const assinar = (f: () => void) => {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
};
const trocar = (p: Precos) => {
  estado = p;
  ouvintes.forEach((f) => f());
};

export const getPrecos = () => estado;
export const usePrecos = () => useSyncExternalStore(assinar, () => estado, () => estado);

/** Só aceita números positivos; o resto do que estiver guardado é ignorado. */
export function limparPrecos(x: unknown): Precos {
  if (!x || typeof x !== "object" || Array.isArray(x)) return {};
  return Object.fromEntries(Object.entries(x).filter((e): e is [string, number] => typeof e[1] === "number" && Number.isFinite(e[1]) && e[1] > 0));
}

export async function carregarPrecos() {
  trocar(limparPrecos(await getItem<unknown>(CHAVE)));
}
export async function salvarPrecos(p: Precos) {
  const limpo = limparPrecos(p);
  await setItem(CHAVE, limpo);
  trocar(limpo);
}
/** Só para testes. */
export const reiniciarPrecos = () => trocar({});
