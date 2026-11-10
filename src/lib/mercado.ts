import { alimentoDe, type Compra, type Dieta, type Letra } from "./dieta";
import { refeicoesComTrocas, type Swap } from "./trocas";

export type ItemCompra = { id: string; desc: string; loja: string; grupo: string; qtd: number; texto: string; preco: number; unit: number; extra?: boolean; gramas?: number };
const br = (n: number, f = 1) => n.toLocaleString("pt-BR", { maximumFractionDigits: f });
const plural = (n: number, u: string) => (n > 1 && !/s$|\.$/.test(u) ? `${u.replace(/ão$/, "õe").replace(/m$/, "n")}s` : u);

export const compraDe = (d: Dieta, id: string): Compra | undefined => alimentoDe(d, id)?.compra;

/** Gramas da semana, como se come, por alimento. */
function consumo(d: Dieta, letra: Letra, swaps: Swap[], porc: Record<string, number>) {
  const g = new Map<string, number>();
  for (const r of refeicoesComTrocas(d, letra, swaps)) for (const it of r.itens) g.set(it.alimento, (g.get(it.alimento) ?? 0) + it.g * (porc[r.id] ?? 7));
  return g;
}

/** Lista da semana; `precos` (média aprendida) sobrescreve o preço da dieta por alimento. */
export function listaCompras(d: Dieta, letra: Letra, precos: Record<string, number> = {}, swaps: Swap[] = [], porc: Record<string, number> = {}): ItemCompra[] {
  const g = consumo(d, letra, swaps, porc);
  const out: ItemCompra[] = [];
  for (const a of d.alimentos) {
    const c = a.compra; const gs = g.get(a.id);
    if (!c || !gs) continue;
    const q = gs * c.fator; const unit = precos[a.id] ?? c.preco;
    let n: number, texto: string;
    if (c.modo === "kg") { n = Math.ceil(q / 100 - 1e-9) / 10; texto = `${br(n)} kg`; }
    else { n = Math.max(1, Math.ceil(q / c.embalagemG - 0.06)); texto = `${n} ${plural(n, c.unidade)}`; }
    out.push({ id: a.id, desc: c.descricao, loja: c.loja, grupo: a.grupo, qtd: n, texto, preco: n * unit, unit, gramas: gramasDe(c, n) });
  }
  d.extrasSemana.forEach((e, i) => out.push({ id: `extra${i}`, desc: e.descricao, loja: e.loja, grupo: "outros", qtd: 1, texto: e.quantidade, preco: e.preco, unit: e.preco, extra: true }));
  return out;
}

export const primeiraCompra = (d: Dieta): ItemCompra[] =>
  d.primeiraCompra.map((p, i) => ({ id: `kit${i}`, desc: p.descricao, loja: d.mercado.lojas[0]?.id ?? "", grupo: "outros", qtd: 1, texto: p.quantidade, preco: p.preco, unit: p.preco, extra: true }));

export const total = (l: ItemCompra[], fora: Set<string> = new Set()) => l.reduce((s, i) => s + (fora.has(i.id) ? 0 : i.preco), 0);

/** Gramas (como comprado) de n unidades de compra. */
export const gramasDe = (c: Compra, n: number) => (c.modo === "kg" ? n * 1000 : n * c.embalagemG);

/** Necessidade da semana em gramas como comprado (cru), por alimento. */
export function necessidade(d: Dieta, letra: Letra, swaps: Swap[] = [], porc: Record<string, number> = {}) {
  const out: Record<string, number> = {};
  for (const [id, gr] of consumo(d, letra, swaps, porc)) out[id] = gr * (compraDe(d, id)?.fator ?? 1);
  return out;
}

/** Medida caseira de uma quantidade em gramas como comprado. */
export function caseira(d: Dieta, id: string, g: number) {
  const a = alimentoDe(d, id);
  const comido = g / (a?.compra?.fator ?? 1);
  if (!a?.medida.g) return `${Math.round(g)} g`;
  const q = comido / a.medida.g;
  return `${br(q, q < 10 ? 1 : 0)} ${a.medida.nome}`;
}

export type PrecoRow = { food_id: string; price: number; price_date: string; store?: string | null };
/** Média dos últimos 90 dias + último preço, por alimento. */
export function mediaPreco(rows: PrecoRow[], hoje = new Date()) {
  const lim = hoje.getTime() - 90 * 864e5;
  const by: Record<string, PrecoRow[]> = {};
  for (const r of rows) if (new Date(`${r.price_date}T12:00:00`).getTime() >= lim) (by[r.food_id] ??= []).push(r);
  const out: Record<string, { media: number; ultimo: number }> = {};
  for (const [id, rs] of Object.entries(by)) {
    rs.sort((a, b) => a.price_date.localeCompare(b.price_date));
    out[id] = { media: rs.reduce((s, r) => s + r.price, 0) / rs.length, ultimo: rs[rs.length - 1]!.price };
  }
  return out;
}
