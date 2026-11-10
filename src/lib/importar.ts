/**
 * Subir e baixar a dieta: lê o texto colado (com ```json, texto em volta ou em partes),
 * valida com mensagens humanas e devolve a dieta pronta. Exportar é o caminho de volta.
 */
import type { ZodIssue } from "zod";
import { ACOES, LETRAS, alimentoDe, dietaSchema, receitaDe, refeicoesDaLetra, totalDia, type Dieta, type Letra } from "./dieta";

export type Resultado = { ok: true; dieta: Dieta; avisos: string[] } | { ok: false; erros: string[]; avisos: string[] };
type Obj = Record<string, unknown>;
const ehObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

/* ---------- texto → objeto ---------- */
/** Tira vírgulas sobrando antes de } ou ], respeitando o que está entre aspas. */
function semVirgulaSobrando(s: string) {
  let out = ""; let aspas = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (aspas) { out += c; if (c === "\\") out += s[++i] ?? ""; else if (c === '"') aspas = false; continue; }
    if (c === '"') { aspas = true; out += c; continue; }
    if (c === ",") { const r = s.slice(i + 1).match(/^\s*([}\]])/); if (r) continue; }
    out += c;
  }
  return out;
}

/** Acha o JSON dentro do que foi colado. Devolve o objeto ou uma mensagem para a pessoa. */
export function extrairJson(texto: string): { ok: true; valor: Obj } | { ok: false; erro: string } {
  const t = texto.replace(/﻿/g, "").replace(/[“”]/g, '"').trim();
  if (!t) return { ok: false, erro: "A caixa está vazia. Copie o bloco que a IA gerou e cole aqui." };
  const ini = t.indexOf("{"); const fim = t.lastIndexOf("}");
  if (ini < 0) return { ok: false, erro: "Não achei a dieta nesse texto. Copie o bloco de código inteiro que a IA gerou (ele começa com { e termina com })." };
  const cortado = "O texto parece cortado no fim. Volte à IA, espere ela terminar de escrever e copie o bloco de novo.";
  if (fim <= ini) return { ok: false, erro: cortado };
  const miolo = t.slice(ini, fim + 1);
  const retas = miolo.replace(/[\u201C\u201D]/g, '"');
  for (const tentativa of [miolo, semVirgulaSobrando(miolo), semVirgulaSobrando(retas)]) {
    try {
      const v: unknown = JSON.parse(tentativa);
      if (ehObj(v)) return { ok: true, valor: v };
    } catch { /* tenta a próxima */ }
  }
  const abre = (miolo.match(/[{[]/g) ?? []).length; const fecha = (miolo.match(/[}\]]/g) ?? []).length;
  return { ok: false, erro: abre > fecha ? cortado : "O texto colado tem um erro de escrita e não deu para ler. Peça à IA: \"gere o arquivo de novo, em JSON válido\"." };
}

/* ---------- validação ---------- */
const NOMES: Record<string, string> = { pessoa: "os dados da pessoa", metas: "as metas do dia", refeicoes: "a lista de refeições", cardapios: "os cardápios", alimentos: "a lista de alimentos", receitas: "as receitas", roteiros: "os roteiros de preparo" };
const caminho = (p: (string | number)[]) => p.map((x, i) => (typeof x === "number" ? `[${x + 1}]` : i ? `.${x}` : x)).join("");

function mensagem(i: ZodIssue, bruto: Obj): string {
  const [a, b, c] = i.path;
  const falta = i.code === "invalid_type" && i.received === "undefined";
  if (a === "formato") return "Esse texto não é uma dieta do Mise (faltou \"formato\": \"mise-dieta\"). Copie o bloco inteiro que a IA gerou.";
  if (a === "pessoa" && b === "nome") return "Faltou o nome da pessoa.";
  if (a === "cardapios" && typeof b === "string" && i.path.length === 2 && falta) return `Faltou o cardápio ${b}.`;
  if (i.path.length === 1 && falta) return `Faltou ${NOMES[String(a)] ?? `"${String(a)}"`}.`;
  if (a === "refeicoes" && i.path.length === 1) return "O Mise aceita de 3 a 7 refeições por dia.";
  if (a === "refeicoes" && c === "hora") return `O horário da refeição ${Number(b) + 1} precisa estar no formato HH:MM (ex.: 07:30).`;
  if (a === "alimentos" && typeof b === "number") {
    const al = Array.isArray(bruto["alimentos"]) ? (bruto["alimentos"] as unknown[])[b] : null;
    const nome = ehObj(al) ? String(al["nome"] ?? al["id"] ?? `nº ${b + 1}`) : `nº ${b + 1}`;
    if (c === "por100g") return `O alimento "${nome}" está sem os valores por 100 g (kcal, P, C, G).`;
    if (c === "medida") return `O alimento "${nome}" precisa de uma medida caseira com gramas maior que zero.`;
  }
  const negativo = i.code === "too_small" && i.type === "number";
  const motivo = falta ? "faltou" : negativo ? "não pode ser negativo nem zero onde precisa de valor" : i.code === "invalid_type" ? `veio ${i.received}, esperava ${i.expected}` : "valor inválido";
  return `Problema em "${caminho(i.path)}": ${motivo}.`;
}

const FICHA = /\{([^}]+)\}/g;
const SEM_COMPRA_OK = new Set(["suplemento", "tempero", "gordura", "bebida"]);

/** Valida um objeto já lido. Erros bloqueiam; avisos deixam começar. */
export function validarDieta(bruto: unknown): Resultado {
  if (!ehObj(bruto)) return { ok: false, erros: ["Não achei a dieta nesse texto."], avisos: [] };
  const p = dietaSchema.safeParse(bruto);
  if (!p.success) return { ok: false, erros: [...new Set(p.error.issues.map((i) => mensagem(i, bruto)))].slice(0, 8), avisos: [] };
  const d = p.data; const erros: string[] = []; const avisos: string[] = [];
  const nomeRef = new Map(d.refeicoes.map((r) => [r.id, r.nome]));

  if (nomeRef.size !== d.refeicoes.length) erros.push("Há refeições com o mesmo id na lista. Cada uma precisa de um id diferente (r1, r2, r3...).");
  const vistos = new Set<string>();
  d.alimentos = d.alimentos.filter((a) => (vistos.has(a.id) ? (avisos.push(`O alimento "${a.id}" aparece duas vezes; usei o primeiro.`), false) : (vistos.add(a.id), true)));

  for (const l of LETRAS) {
    const c = d.cardapios[l]; const ids = new Set(c.refeicoes.map((r) => r.id));
    for (const def of d.refeicoes) if (!ids.has(def.id)) erros.push(`No cardápio ${l} falta "${def.nome}" (${def.id}).`);
    for (const r of c.refeicoes) {
      if (!nomeRef.has(r.id)) { erros.push(`O cardápio ${l} tem uma refeição a mais ("${r.id}") que não está na sua lista de refeições.`); continue; }
      const nome = nomeRef.get(r.id)!;
      for (const it of r.itens) if (!alimentoDe(d, it.alimento)) erros.push(`"${nome}" do cardápio ${l} usa "${it.alimento}", que não está na lista de alimentos.`);
      if (r.receita && !receitaDe(d, r.receita)) erros.push(`"${nome}" do cardápio ${l} cita a receita "${r.receita}", que não existe.`);
    }
    for (const e of d.roteiros[l].etapas) {
      const rec = receitaDe(d, e.receita);
      if (!rec) { erros.push(`O roteiro ${l} cita a receita "${e.receita}", que não existe.`); continue; }
      if (e.passos && (e.passos[0] < 1 || e.passos[1] > rec.passos.length || e.passos[0] > e.passos[1])) erros.push(`No roteiro ${l}, "${e.tarefa}" pede os passos ${e.passos[0]} a ${e.passos[1]} de "${rec.nome}", que só tem ${rec.passos.length}.`);
    }
    if (!d.roteiros[l].etapas.length) avisos.push(`O cardápio ${l} veio sem roteiro de preparo.`);
  }
  if (erros.length) return { ok: false, erros: [...new Set(erros)].slice(0, 8), avisos };

  for (const l of LETRAS) {
    const calc = refeicoesDaLetra(d, l);
    for (const r of d.cardapios[l].refeicoes) {
      const soma = calc.find((x) => x.id === r.id)?.macros.kcal ?? 0;
      if (r.macros && soma > 0 && Math.abs(r.macros.kcal - soma) / soma > 0.1) avisos.push(`"${nomeRef.get(r.id)}" do ${l}: a IA declarou ${Math.round(r.macros.kcal)} kcal, mas os itens somam ${soma}. O app usa a soma.`);
    }
    const t = totalDia(d, l);
    if (Math.abs(t.kcal - d.metas.kcal) / d.metas.kcal > 0.1) avisos.push(`O cardápio ${l} soma ${Math.round(t.kcal)} kcal, longe da meta de ${Math.round(d.metas.kcal)}.`);
    if (t.P < d.metas.P * 0.9) avisos.push(`O cardápio ${l} tem ${Math.round(t.P)} g de proteína, abaixo da meta de ${Math.round(d.metas.P)} g.`);
  }
  const usados = new Set(LETRAS.flatMap((l) => d.cardapios[l].refeicoes.flatMap((r) => r.itens.map((i) => i.alimento))));
  const semCompra = [...usados].map((id) => alimentoDe(d, id)!).filter((a) => !a.compra && !SEM_COMPRA_OK.has(a.grupo)).map((a) => a.nome);
  if (semCompra.length) avisos.push(`Sem dados de compra (não entram na lista do mercado): ${semCompra.join(", ")}.`);
  const fichas = new Set<string>(); const acoes = new Set<string>();
  const olhar = (txt: string) => { for (const m of txt.matchAll(FICHA)) { const id = m[1]!.split(/[@:]/)[0]!; if (id !== "porcoes" && !alimentoDe(d, id)) fichas.add(id); } };
  for (const r of d.receitas) { if (r.vespera) olhar(r.vespera); for (const s of r.passos) { olhar(`${s.titulo} ${s.detalhe}`); if (s.acao && !(ACOES as readonly string[]).includes(s.acao)) acoes.add(s.acao); } }
  for (const l of LETRAS) d.roteiros[l].vespera.forEach(olhar);
  if (fichas.size) avisos.push(`Algumas quantidades das receitas citam alimentos que não existem (${[...fichas].join(", ")}); nesses pontos o texto mostra "sem dado".`);
  if (acoes.size) avisos.push(`Alguns passos usam ações que o app não conhece (${[...acoes].join(", ")}); eles aparecem com a animação padrão.`);
  return { ok: true, dieta: d, avisos };
}

/** Texto colado (dieta inteira, num bloco só) → dieta validada. */
export function importarDieta(texto: string): Resultado {
  const j = extrairJson(texto);
  return j.ok ? validarDieta(j.valor) : { ok: false, erros: [j.erro], avisos: [] };
}

/** Dieta → texto para copiar ou compartilhar. Compacto por padrão (cabe melhor na área de transferência). */
export const exportarDieta = (d: Dieta, formatado = false) => JSON.stringify(d, null, formatado ? 2 : undefined);

/* ---------- colar em partes ---------- */
export type Colagem = { base: Obj | null; partes: number[] };
export const COLAGEM_VAZIA: Colagem = { base: null, partes: [] };
export type Recebido =
  | { estado: "erro"; colagem: Colagem; mensagem: string }
  | { estado: "aguardando"; colagem: Colagem; mensagem: string }
  | { estado: "pronta"; colagem: Colagem; mensagem: string; resultado: Resultado };

const porId = (a: unknown[], b: unknown[]) => {
  const m = new Map<unknown, unknown>(); let solto = 0;
  for (const x of [...a, ...b]) m.set(ehObj(x) && "id" in x ? x["id"] : `#${solto++}`, x);
  return [...m.values()];
};
function juntar(base: Obj, parte: Obj): Obj {
  const out: Obj = { ...base };
  for (const [k, v] of Object.entries(parte)) {
    if (k === "parte" || k === "ultima" || k === "formato" || k === "versao") continue;
    const atual = out[k];
    if (Array.isArray(v) && Array.isArray(atual)) out[k] = k === "receitas" || k === "alimentos" || k === "coringas" ? porId(atual, v) : v;
    else if (ehObj(v) && ehObj(atual) && (k === "roteiros" || k === "cardapios")) out[k] = { ...atual, ...v };
    else out[k] = v;
  }
  return out;
}

/** Recebe mais um bloco colado. Só valida (e libera "Começar") quando chega a última parte. */
export function receberParte(c: Colagem, texto: string): Recebido {
  const j = extrairJson(texto);
  if (!j.ok) return { estado: "erro", colagem: c, mensagem: j.erro };
  const v = j.valor;
  const n = typeof v["parte"] === "number" ? v["parte"] : "pessoa" in v || "cardapios" in v ? 1 : 0;
  if (n === 0) return { estado: "erro", colagem: c, mensagem: "Esse bloco não parece uma dieta do Mise. Copie o bloco de código inteiro que a IA gerou." };
  let col: Colagem;
  if (n === 1) col = { base: juntar({}, v), partes: [1] };
  else {
    if (!c.base) return { estado: "erro", colagem: c, mensagem: `Essa é a parte ${n}. Cole primeiro a parte 1.` };
    const esperada = Math.max(...c.partes) + 1;
    if (n > esperada) return { estado: "erro", colagem: c, mensagem: `Faltou a parte ${esperada}. Volte à IA, copie a parte ${esperada} e cole aqui.` };
    col = { base: juntar(c.base, v), partes: [...new Set([...c.partes, n])].sort((a, b) => a - b) };
  }
  const base = col.base!;
  const fim = v["ultima"] === true || (v["ultima"] === undefined && "receitas" in base && "roteiros" in base);
  if (!fim) return { estado: "aguardando", colagem: col, mensagem: `Parte ${n} recebida ✓. Volte à IA, digite ok e cole a próxima.` };
  const resultado = validarDieta({ formato: "mise-dieta", ...base });
  return { estado: "pronta", colagem: col, resultado, mensagem: resultado.ok ? (col.partes.length > 1 ? `Parte ${n} recebida ✓. Dieta completa.` : "Dieta recebida ✓") : "A dieta chegou, mas tem pontos para corrigir." };
}

/** Para quando a IA esqueceu de marcar a última parte: valida o que já chegou. */
export const concluirColagem = (c: Colagem): Resultado => (c.base ? validarDieta({ formato: "mise-dieta", ...c.base }) : { ok: false, erros: ["Ainda não chegou nenhuma parte da dieta."], avisos: [] });

/* ---------- resumo antes de "Começar" ---------- */
export type Resumo = { nome: string; metas: Dieta["metas"]; letras: { letra: Letra; tema: string; kcal: number; refeicoes: { nome: string; hora: string; prato: string; kcal: number }[] }[] };
export function resumoDieta(d: Dieta): Resumo {
  return {
    nome: d.pessoa.nome, metas: d.metas,
    letras: LETRAS.map((letra) => {
      const rs = refeicoesDaLetra(d, letra);
      return { letra, tema: d.cardapios[letra].nome, kcal: rs.reduce((s, r) => s + r.macros.kcal, 0), refeicoes: rs.map((r) => ({ nome: r.nome, hora: r.hora, prato: r.prato, kcal: r.macros.kcal })) };
    }),
  };
}
