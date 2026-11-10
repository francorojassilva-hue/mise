/**
 * A dieta em uso. Fica guardada no aparelho (store.ts); sem dieta própria, vale a de exemplo.
 */
import { useSyncExternalStore } from "react";
import bruto from "@/data/exemplo.json";
import { dietaSchema, type Dieta } from "./dieta";
import { getItem, removeItem, setItem } from "./store";

const CHAVE = "dieta";
export const dietaExemplo: Dieta = dietaSchema.parse(bruto);

let estado: { dieta: Dieta; exemplo: boolean } = { dieta: dietaExemplo, exemplo: true };
const ouvintes = new Set<() => void>();
const trocar = (dieta: Dieta, exemplo: boolean) => { estado = { dieta, exemplo }; ouvintes.forEach((f) => f()); };
const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f); }; };

export const getDieta = () => estado.dieta;
export const usandoExemplo = () => estado.exemplo;
/** Dieta em uso + se é a de exemplo. Atualiza a tela quando a dieta muda. */
export const useDieta = () => useSyncExternalStore(assinar, () => estado, () => estado);

/** Lê a dieta guardada ao abrir o app. Se estiver ausente ou ilegível, fica na de exemplo. */
export async function carregarDieta(): Promise<Dieta> {
  const p = dietaSchema.safeParse(await getItem<unknown>(CHAVE));
  trocar(p.success ? p.data : dietaExemplo, !p.success);
  return estado.dieta;
}
export async function salvarDieta(d: Dieta) {
  await setItem(CHAVE, d);
  trocar(d, false);
}
/** Edita a dieta em uso (nome da refeição, perfil...) e guarda no aparelho. */
export const atualizarDieta = (editar: (d: Dieta) => Dieta) => salvarDieta(editar(estado.dieta));
export async function voltarAoExemplo() {
  await removeItem(CHAVE);
  trocar(dietaExemplo, true);
}
