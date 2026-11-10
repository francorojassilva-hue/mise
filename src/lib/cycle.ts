import { alimentoDe, type Dieta, type Letra } from "./dieta";
import { potesFreezer } from "./cozinhar";
import { caseira, listaCompras, necessidade, total, type ItemCompra } from "./mercado";
import type { PessoaPorcao, Porcoes, Removidas } from "./porcoes";
import type { Swap } from "./trocas";

/** Resumo do lote da semana: refeições servidas (todas as pessoas) e potes para o freezer. */
export function batchSummary(d: Dieta, letter: Letra, portions: Porcoes, removed: Removidas, people: PessoaPorcao[]) {
  const validas = new Set(d.refeicoes.map((r) => r.id));
  let meals = 0;
  for (const person of people) for (const day of person.dias) for (const meal of person.refeicoes) {
    if (validas.has(meal) && !(removed[day] ?? []).includes(meal)) meals++;
  }
  return { meals, containers: potesFreezer(d, letter, portions) };
}

export const foodGroup = (item: ItemCompra) => item.grupo || "outros";
export const GROUP_LABELS: Record<string, string> = { proteina: "Proteínas", carbo: "Carboidratos", pao: "Pães", fruta: "Frutas", verde: "Folhas", legume: "Legumes", laticinio: "Laticínios", queijo: "Queijos", semente: "Sementes", gordura: "Gorduras", tempero: "Temperos", doce: "Doces", bebida: "Bebidas", suplemento: "Suplementos", outros: "Outros" };
export const groupLabel = (g: string) => GROUP_LABELS[g] ?? GROUP_LABELS["outros"]!;
/** Itens agrupados por seção do mercado, na ordem em que as seções aparecem na dieta. */
export function porSecao(itens: ItemCompra[]): { grupo: string; rotulo: string; itens: ItemCompra[] }[] {
  const m = new Map<string, ItemCompra[]>();
  for (const i of itens) { const g = GROUP_LABELS[foodGroup(i)] ? foodGroup(i) : "outros"; m.set(g, [...(m.get(g) ?? []), i]); }
  return [...m].map(([grupo, lista]) => ({ grupo, rotulo: groupLabel(grupo), itens: lista }));
}

export function householdNeed(d: Dieta, item: ItemCompra, letter: Letra, swaps: Swap[], portions: Porcoes) {
  if (item.extra || !alimentoDe(d, item.id)) return item.texto;
  return caseira(d, item.id, necessidade(d, letter, swaps, portions)[item.id] ?? 0);
}
export function shoppingEstimate(d: Dieta, letter: Letra, prices: Record<string, number>, swaps: Swap[], portions: Porcoes) {
  return total(listaCompras(d, letter, prices, swaps, portions));
}
