import { alimentoDe, arredondar, nutrientesItem, refeicoesDaLetra, semAcento, somaItens, type Dieta, type Item, type Letra, type RefeicaoDia } from "./dieta";

export type Swap = { refeicao: string; de: string; para: string; gramas: number };
export type Equivalente = { id: string; gramas: number; medida: string; dKcal: number; dP: number };

const br = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
export const grupoDe = (d: Dieta, id: string) => Object.entries(d.trocas.grupos).find(([, ids]) => ids.includes(id))?.[0];

/** "figado", "chocolate à noite", "Fígado": vale o id ou o nome do alimento. */
function proibido(d: Dieta, id: string) {
  const a = alimentoDe(d, id);
  const alvos = new Set([semAcento(id), a ? semAcento(a.nome) : ""]);
  return d.trocas.proibidos.some((p) => alvos.has(semAcento(p)) || alvos.has(semAcento(p).split(" ")[0]!));
}

/** Equivalentes: proteína e carbo pelo gramas do macro; o resto 1:1 na medida caseira. */
export function equivalentes(d: Dieta, id: string, gramas: number): Equivalente[] {
  const g = grupoDe(d, id); const de = alimentoDe(d, id); const base = nutrientesItem(d, id, gramas);
  if (!g || !de || !base) return [];
  const macro = g === "proteina" ? "P" : g.startsWith("carbo") ? "C" : null;
  return d.trocas.grupos[g]!.filter((x) => x !== id && !proibido(d, x)).flatMap((x) => {
    const a = alimentoDe(d, x);
    if (!a) return [];
    let gr: number;
    if (macro) { const per = a.por100g[macro]; if (!per) return []; gr = (base[macro] * 100) / per; }
    else gr = (gramas / de.medida.g) * a.medida.g;
    gr = Math.round(gr);
    const n = nutrientesItem(d, x, gr)!;
    return [{ id: x, gramas: gr, medida: `${br(gr / a.medida.g)} ${a.medida.nome}`, dKcal: Math.round(n.kcal - base.kcal), dP: Math.round(n.P - base.P) }];
  });
}

export function aplicarItens(d: Dieta, r: { id: string; itens: Item[] }, swaps: Swap[]): Item[] {
  return r.itens.map((it) => {
    const s = swaps.find((x) => x.refeicao === r.id && x.de === it.alimento);
    if (!s) return it;
    const a = alimentoDe(d, s.para);
    return { alimento: s.para, g: s.gramas, medida: a ? `${br(s.gramas / a.medida.g)} ${a.medida.nome}` : `${s.gramas} g` };
  });
}

/** Refeições da letra com as trocas da semana aplicadas (macros recalculados pela soma). */
export function refeicoesComTrocas(d: Dieta, l: Letra, swaps: Swap[] = []): RefeicaoDia[] {
  return refeicoesDaLetra(d, l).map((r) => {
    if (!swaps.some((s) => s.refeicao === r.id && r.itens.some((i) => i.alimento === s.de))) return r;
    const itens = aplicarItens(d, r, swaps);
    return { ...r, itens, macros: arredondar(somaItens(d, itens)) };
  });
}
