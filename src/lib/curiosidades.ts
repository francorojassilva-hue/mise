/**
 * Curiosidades do modo cozinhar. O catálogo é fixo no app e casa com os ingredientes
 * dos passos pelo id (sem acento); o que já foi visto e curtido fica no aparelho (store.ts).
 */
import { CURIOSIDADES } from "@/data/curiosidades";
import { semAcento } from "./dieta";
import { getItem, setItem } from "./store";

const TIPOS = { f: "fato", m: "mito", d: "dica", h: "historia" } as const;
export type Curio = { id: number; ing: string; tipo: (typeof TIPOS)[keyof typeof TIPOS]; t: string; fonte: string };

export const CURIOS: Curio[] = CURIOSIDADES.trim().split("\n").map((linha, id) => {
  const [ing = "", tipo = "f", t = "", fonte = ""] = linha.split("|");
  return { id, ing, tipo: TIPOS[tipo as keyof typeof TIPOS] ?? "fato", t, fonte };
});

const CHAVE = "curiosidades";
type Guardado = { vistos: number[]; curtidas: number[] };
let estado: Guardado = { vistos: [], curtidas: [] };
const gravar = () => { void setItem(CHAVE, estado); };
const numeros = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : []);

/** Lê o que já foi visto e curtido ao abrir o app. Dado ilegível vira lista vazia. */
export async function carregarCuriosidades() {
  const g = await getItem<Partial<Guardado>>(CHAVE);
  estado = { vistos: numeros(g?.vistos), curtidas: numeros(g?.curtidas) };
}

export const curtida = (id: number) => estado.curtidas.includes(id);
/** Liga ou desliga a curtida; devolve o estado novo. */
export function curtir(id: number) {
  estado = { ...estado, curtidas: curtida(id) ? estado.curtidas.filter((x) => x !== id) : [...estado.curtidas, id] };
  gravar();
  return curtida(id);
}

/** Prioriza as nunca vistas; esgotou, recomeça; nunca repete a anterior. */
export function proxima(ings: string[], anterior?: number, sorteio: () => number = Math.random): Curio | null {
  const chaves = new Set(ings.map(semAcento));
  const pool = CURIOS.filter((c) => chaves.has(c.ing));
  if (!pool.length) return null;
  let cand = pool.filter((c) => !estado.vistos.includes(c.id) && c.id !== anterior);
  if (!cand.length) {
    estado = { ...estado, vistos: estado.vistos.filter((v) => !pool.some((c) => c.id === v)) };
    cand = pool.filter((c) => c.id !== anterior);
    if (!cand.length) return null;
  }
  const c = cand[Math.min(cand.length - 1, Math.floor(sorteio() * cand.length))]!;
  estado = { ...estado, vistos: [...estado.vistos, c.id] };
  gravar();
  return c;
}

/** Curiosidade fixa do dia (a mesma o dia inteiro). */
export function doDia(d = new Date()): Curio {
  const n = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
  return CURIOS[((n * 2654435761) >>> 0) % CURIOS.length]!;
}
