/**
 * Onde a pessoa está na configuração inicial. Fica guardado para ela poder sair, fazer a
 * entrevista na IA e voltar de onde parou. Chave "onboarding".
 */
import { useSyncExternalStore } from "react";
import { REFEICOES_SUGERIDAS, refeicoesValidas, type RefeicaoEscolhida } from "./promptEntrevista";
import { getItem, removeItem, setItem } from "./store";

const CHAVE = "onboarding";
export type Etapa = 0 | 1 | 2 | 3;
export type Onboarding = { pronto: boolean; feito: boolean; etapa: Etapa; refeicoes: RefeicaoEscolhida[] };

const INICIAL: Onboarding = { pronto: false, feito: false, etapa: 0, refeicoes: REFEICOES_SUGERIDAS };

let estado: Onboarding = INICIAL;
const ouvintes = new Set<() => void>();
const assinar = (f: () => void) => {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
};
function trocar(o: Onboarding, gravar = true) {
  estado = o;
  if (gravar && o.pronto) void setItem(CHAVE, { feito: o.feito, etapa: o.etapa, refeicoes: o.refeicoes });
  ouvintes.forEach((f) => f());
}

export const getOnboarding = () => estado;
export const useOnboarding = () => useSyncExternalStore(assinar, () => estado, () => estado);

function ler(x: unknown): Omit<Onboarding, "pronto"> | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Partial<Onboarding>;
  const etapa = o.etapa === 1 || o.etapa === 2 || o.etapa === 3 ? o.etapa : 0;
  const refeicoes = Array.isArray(o.refeicoes) && refeicoesValidas(o.refeicoes as RefeicaoEscolhida[]) ? (o.refeicoes as RefeicaoEscolhida[]) : REFEICOES_SUGERIDAS;
  return { feito: o.feito === true, etapa, refeicoes };
}

/** Lê o que foi guardado. Quem nunca abriu o app fica com `feito: false`. */
export async function carregarOnboarding() {
  const salvo = ler(await getItem<unknown>(CHAVE));
  trocar({ pronto: true, ...(salvo ?? { feito: false, etapa: 0 as Etapa, refeicoes: REFEICOES_SUGERIDAS }) }, false);
}
export const irParaEtapa = (etapa: Etapa) => trocar({ ...estado, etapa });
export const definirRefeicoes = (refeicoes: RefeicaoEscolhida[]) => trocar({ ...estado, refeicoes });
export const concluirOnboarding = () => trocar({ ...estado, feito: true, etapa: 0 });
/** Para "Criar dieta nova com IA" nos Ajustes: reabre a configuração já na escolha das refeições. */
export const reabrirOnboarding = () => trocar({ ...estado, pronto: true, feito: false, etapa: 1 });
/** Só para testes. */
export async function reiniciarOnboarding(feito = true) {
  await removeItem(CHAVE);
  estado = { ...INICIAL, pronto: true, feito };
  ouvintes.forEach((f) => f());
}
