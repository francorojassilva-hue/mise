import { alimentoDe, receitaDe, refeicoesDaLetra, type Dieta, type Letra, type Passo } from "./dieta";
import { porcoesPadrao, type Porcoes } from "./porcoes";

export type PassoPlano = Passo & { tarefa: string; minuto: number; receita: string; ingReceita: string[]; rid: string; idx: number; porcoesRef?: string | undefined };
export const roteiro = (d: Dieta, l: Letra) => d.roteiros[l];
const ehRefeicao = (d: Dieta, id: string | null) => !!id && d.refeicoes.some((r) => r.id === id);
const fmt = (n: number, c = 1) => n.toLocaleString("pt-BR", { maximumFractionDigits: c });

/** Passos do dia do preparo, na ordem do roteiro (sem véspera, sem "na hora" e sem "servir"). */
export function expandirRoteiro(d: Dieta, l: Letra): PassoPlano[] {
  const out: PassoPlano[] = [];
  for (const e of d.roteiros[l].etapas) {
    const rec = receitaDe(d, e.receita);
    if (!rec) continue;
    const [ini, fim] = e.passos ?? [1, rec.passos.length];
    const ingReceita = [...new Set(rec.passos.flatMap((x) => x.ingredientes))];
    rec.passos.slice(ini - 1, fim).forEach((p, j) => {
      if (p.so && !p.so.includes(l)) return;
      if (p.momento !== "preparo") return;
      out.push({ ...p, tarefa: e.tarefa, minuto: e.minuto, receita: rec.nome, rid: rec.id, idx: ini + j, ingReceita, porcoesRef: ehRefeicao(d, rec.porcoes) ? rec.porcoes! : undefined });
    });
  }
  return out;
}

/** Gramas de uma porção (por pessoa, por dia), somando as refeições ou só uma. */
export function gramasPorcao(d: Dieta, l: Letra, id: string, refeicao?: string) {
  let g = 0;
  for (const r of d.cardapios[l].refeicoes) if (!refeicao || r.id === refeicao) for (const it of r.itens) if (it.alimento === id) g += it.g;
  return g;
}
/** Gramas da semana, como se come. */
export function gramasSemana(d: Dieta, l: Letra, id: string, refeicao?: string, porc: Porcoes = porcoesPadrao(d)) {
  let g = 0;
  for (const r of d.cardapios[l].refeicoes) {
    if (refeicao && r.id !== refeicao) continue;
    for (const it of r.itens) if (it.alimento === id) g += it.g * (porc[r.id] ?? 7);
  }
  return g;
}

/** Potes que vão para o freezer: porções das refeições marcadas com `congela` na letra. */
export function potesFreezer(d: Dieta, l: Letra, porc: Porcoes = porcoesPadrao(d)) {
  return Math.ceil(d.cardapios[l].refeicoes.reduce((s, r) => s + (r.congela ? porc[r.id] ?? 0 : 0), 0));
}
/** Avisos (sem bloquear): potes da semana acima da capacidade do freezer. */
export function avisosCapacidade(d: Dieta, l: Letra, porc: Porcoes = porcoesPadrao(d)): string[] {
  const n = potesFreezer(d, l, porc); const cap = d.cozinha.freezerMarmitas;
  return cap > 0 && n > cap ? [`${n} potes pro freezer: passa de ${cap}`] : [];
}

export type Preencher = { ref?: string | undefined; porcao?: boolean | undefined };
/**
 * Troca as fichas do texto pelas quantidades: {id}, {id:cru}, {id@refeicao} e {porcoes}.
 * Com `porcao: true` (passos "na hora" e "servir") escreve a quantidade de UMA porção, nunca a da semana.
 */
export function preencher(d: Dieta, txt: string, l: Letra, porc: Porcoes = porcoesPadrao(d), o: Preencher = {}) {
  return txt.replace(/\{([^}]+)\}/g, (_m, tok: string) => {
    if (tok.trim() === "porcoes") {
      if (o.porcao) return "1";
      const n = o.ref ? porc[o.ref] ?? 7 : Math.max(0, ...Object.values(porc));
      return fmt(Math.ceil(n), 0);
    }
    const m = tok.trim().match(/^([a-z0-9_]+)(?:@([a-z0-9_]+))?(:cru)?$/i);
    if (!m) return tok;
    const [, id, refM, cru] = m;
    const a = alimentoDe(d, id!);
    let g = o.porcao ? gramasPorcao(d, l, id!, refM ?? o.ref) || gramasPorcao(d, l, id!) : gramasSemana(d, l, id!, refM, porc);
    if (!a || g === 0) return "sem dado";
    const nome = a.nome.toLowerCase();
    if (cru) {
      g *= a.compra?.fator ?? 1;
      return `${g >= 1000 ? `${fmt(g / 1000)} kg` : `${Math.round(g)} g`} de ${nome}`;
    }
    return `${fmt(g / a.medida.g)} ${a.medida.nome} de ${nome} (${Math.round(g)} g)`;
  });
}

/** Instrução completa de um passo, já com as quantidades certas para o momento dele. */
export function instrucao(d: Dieta, p: Passo & { porcoesRef?: string | undefined }, l: Letra, porc: Porcoes = porcoesPadrao(d), ref = p.porcoesRef) {
  return preencher(d, p.detalhe, l, porc, { ref, porcao: p.momento === "na_hora" || p.momento === "servir" });
}

/** Checklist da véspera: o que o roteiro pede + os passos de véspera das receitas usadas. */
export function vespera(d: Dieta, l: Letra, porc: Porcoes = porcoesPadrao(d)): string[] {
  const out = d.roteiros[l].vespera.map((t) => preencher(d, t, l, porc));
  const usadas = new Set(d.roteiros[l].etapas.map((e) => e.receita));
  for (const r of d.receitas) {
    if (!usadas.has(r.id) || (r.so && !r.so.includes(l))) continue;
    const ref = ehRefeicao(d, r.porcoes) ? r.porcoes! : undefined;
    for (const p of r.passos) if (p.momento === "vespera" && (!p.so || p.so.includes(l))) out.push(`${p.titulo}: ${preencher(d, p.detalhe, l, porc, { ref })}`);
  }
  return out;
}

/** Como fazer ou reaquecer uma refeição no dia de comer (passos "na hora" e "servir" da receita dela). */
export function passosDoDia(d: Dieta, l: Letra, refeicaoId: string): { titulo: string; detalhe: string; acao: string; segundos?: number | undefined; momento: Passo["momento"] }[] {
  const r = refeicoesDaLetra(d, l).find((x) => x.id === refeicaoId);
  const rec = receitaDe(d, r?.receita);
  if (!rec) return [];
  return rec.passos
    .filter((p) => (p.momento === "na_hora" || p.momento === "servir") && (!p.so || p.so.includes(l)))
    .map((p) => ({ titulo: p.titulo, detalhe: preencher(d, p.detalhe, l, undefined, { ref: refeicaoId, porcao: true }), acao: p.acao, segundos: p.segundos, momento: p.momento }));
}

/** Estimativa aprendida: média das últimas 3 medições (mais recentes por último). */
export function estimativa(segs: number[]): number | null {
  const u = segs.slice(-3);
  return u.length ? Math.round(u.reduce((s, x) => s + x, 0) / u.length) : null;
}
