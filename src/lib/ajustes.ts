/**
 * Ajustes do aparelho (por enquanto, quais lembretes estão ligados). Guardados na chave "ajustes".
 * Tudo começa desligado: a pessoa liga nos Ajustes.
 */
import { useSyncExternalStore } from "react";
import type { AjustesLembretes, Tipo } from "./lembretes";
import { TIPOS } from "./lembretes";
import { getItem, removeItem, setItem } from "./store";

const CHAVE = "ajustes";
export type Ajustes = AjustesLembretes;
export const PADRAO: Ajustes = { tipos: {} };

let estado: Ajustes = PADRAO;
const ouvintes = new Set<() => void>();
const assinar = (f: () => void) => {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
};
const trocar = (a: Ajustes) => {
  estado = a;
  ouvintes.forEach((f) => f());
};

export const getAjustes = () => estado;
export const useAjustes = () => useSyncExternalStore(assinar, () => estado, () => estado);

/** Aceita só os tipos conhecidos, com valor verdadeiro ou falso. */
export function limparAjustes(x: unknown): Ajustes {
  const tipos = x && typeof x === "object" && "tipos" in x ? (x as { tipos: unknown }).tipos : null;
  if (!tipos || typeof tipos !== "object") return PADRAO;
  const out: Partial<Record<Tipo, boolean>> = {};
  for (const t of Object.keys(TIPOS) as Tipo[]) {
    const v = (tipos as Record<string, unknown>)[t];
    if (typeof v === "boolean") out[t] = v;
  }
  return { tipos: out };
}

export async function carregarAjustes() {
  trocar(limparAjustes(await getItem<unknown>(CHAVE)));
}
export async function salvarAjustes(a: Ajustes) {
  const limpo = limparAjustes(a);
  await setItem(CHAVE, limpo);
  trocar(limpo);
}
export const alternarTipo = (t: Tipo) => salvarAjustes({ tipos: { ...estado.tipos, [t]: !estado.tipos[t] } });
/** Só para testes. */
export async function reiniciarAjustes() {
  await removeItem(CHAVE);
  trocar(PADRAO);
}
