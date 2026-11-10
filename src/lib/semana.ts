/**
 * Estado da semana, guardado no aparelho (store.ts): letra, trocas, refeições removidas,
 * pessoa extra, registros do que foi comido e itens "pegos" no mercado.
 * Ao virar a semana (segunda), trocas, removidas, registros e pegos zeram; letra e pessoa extra ficam.
 */
import { useSyncExternalStore } from "react";
import { validLetter } from "./appearance";
import type { Letra } from "./dieta";
import type { PessoaPorcao, Removidas } from "./porcoes";
import { getItem, removeItem, setItem } from "./store";
import type { Swap } from "./trocas";

const CHAVE = "semana";
const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Segunda-feira da semana de `d`, à meia-noite. */
export function inicioSemana(d = new Date()) {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  return s;
}
/** 0 = segunda … 6 = domingo. */
export const diaDaSemana = (d = new Date()) => (d.getDay() + 6) % 7;

export type Log = {
  id: string;
  kind: "refeicao" | "suplemento" | "coringa";
  ref: string;
  label: string;
  em: string;
  data: string;
  letra: Letra;
  kcal: number | null;
  P: number | null;
  C: number | null;
  G: number | null;
};
export type NovoLog = Pick<Log, "kind" | "ref" | "label"> & Partial<Pick<Log, "kcal" | "P" | "C" | "G">>;

export type Semana = {
  semana: string;
  letra: Letra;
  swaps: Swap[];
  removidas: Removidas;
  /** undefined = vale a pessoa extra da dieta; null = ninguém; objeto = ajustada na Semana. */
  extra?: PessoaPorcao | null;
  logs: Log[];
  pegos: string[];
};

function letraDoTema(): Letra {
  try {
    return validLetter((JSON.parse(localStorage.getItem("mise-theme") || "{}") as { letter?: unknown }).letter);
  } catch {
    return "A";
  }
}

const nova = (letra: Letra, extra?: PessoaPorcao | null): Semana => ({
  semana: ymd(inicioSemana()),
  letra,
  swaps: [],
  removidas: {},
  ...(extra !== undefined ? { extra } : {}),
  logs: [],
  pegos: [],
});

let estado: Semana = nova(letraDoTema());
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());
const assinar = (f: () => void) => {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
};
const gravar = () => {
  void setItem(CHAVE, estado);
};
function trocarEstado(s: Semana) {
  estado = s;
  gravar();
  avisar();
}
const mudar = (p: Partial<Semana>) => trocarEstado({ ...estado, ...p });

export const getSemana = () => estado;
export const useSemana = () => useSyncExternalStore(assinar, () => estado, () => estado);

function lerSalvo(x: unknown): Semana | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Partial<Semana>;
  if (typeof o.semana !== "string") return null;
  return {
    semana: o.semana,
    letra: validLetter(o.letra),
    swaps: Array.isArray(o.swaps) ? o.swaps : [],
    removidas: o.removidas && typeof o.removidas === "object" && !Array.isArray(o.removidas) ? o.removidas : {},
    ...(o.extra !== undefined ? { extra: o.extra } : {}),
    logs: Array.isArray(o.logs) ? o.logs : [],
    pegos: Array.isArray(o.pegos) ? o.pegos : [],
  };
}

/** Semana nova: zera o que é só dela e mantém letra e pessoa extra. */
function viradaDeSemana(s: Semana): Semana {
  return s.semana === ymd(inicioSemana()) ? s : nova(s.letra, s.extra);
}

/** Lê o estado guardado ao abrir o app. Dado ausente ou ilegível = semana nova. */
export async function carregarSemana() {
  const salvo = lerSalvo(await getItem<unknown>(CHAVE));
  estado = viradaDeSemana(salvo ?? estado);
  avisar();
}
/** Chamar quando o app volta a ficar visível: se virou a semana, zera. */
export function verificarVirada() {
  const v = viradaDeSemana(estado);
  if (v !== estado) trocarEstado(v);
}
/** Só para testes. */
export async function reiniciarSemana(letra: Letra = "A") {
  estado = nova(letra);
  await removeItem(CHAVE);
  avisar();
}

/* ---------- ações ---------- */
export const setLetra = (letra: Letra) => mudar({ letra });

export function addLog(l: NovoLog) {
  const agora = new Date();
  const log: Log = {
    id: `${agora.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: l.kind,
    ref: l.ref,
    label: l.label,
    em: agora.toISOString(),
    data: ymd(agora),
    letra: estado.letra,
    kcal: l.kcal ?? null,
    P: l.P ?? null,
    C: l.C ?? null,
    G: l.G ?? null,
  };
  mudar({ logs: [...estado.logs, log] });
}

/** Troca de alimento numa refeição; vale a semana toda. */
export const salvarTroca = (s: Swap) =>
  mudar({ swaps: [...estado.swaps.filter((x) => !(x.refeicao === s.refeicao && x.de === s.de)), s] });
export const desfazerTroca = (refeicao: string, de: string) =>
  mudar({ swaps: estado.swaps.filter((x) => !(x.refeicao === refeicao && x.de === de)) });

export const setRemovidas = (removidas: Removidas) => mudar({ removidas });
/** Liga ou desliga uma refeição num dia (0 = segunda). */
export function alternarRefeicao(dia: number, refeicao: string) {
  const k = String(dia);
  const atual = estado.removidas[k] ?? [];
  const novo = atual.includes(refeicao) ? atual.filter((r) => r !== refeicao) : [...atual, refeicao];
  mudar({ removidas: { ...estado.removidas, [k]: novo } });
}

/** `undefined` volta a valer a pessoa extra da dieta. */
export function setExtra(extra: PessoaPorcao | null | undefined) {
  if (extra === undefined) {
    const { extra: _descartado, ...resto } = estado;
    trocarEstado(resto);
  } else mudar({ extra });
}

export const alternarPego = (id: string) =>
  mudar({ pegos: estado.pegos.includes(id) ? estado.pegos.filter((x) => x !== id) : [...estado.pegos, id] });
export const limparPegos = () => mudar({ pegos: [] });
