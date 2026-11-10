/**
 * Formato "mise-dieta" v1: tipos, esquema (zod) e consultas básicas.
 * O app trabalha direto neste formato (sem tuplas internas): importar = validar e normalizar.
 * Só bloqueia o que quebraria o app; o resto ganha um padrão e segue.
 */
import { z } from "zod";
import type { Letra } from "./appearance";

export const LETRAS = ["A", "B", "C"] as const satisfies readonly Letra[];
export const ACOES = ["lavar", "cortar", "ralar", "descascar", "marinar", "temperar", "polvilhar", "refogar", "dourar", "frigideira", "ferver", "cozinhar_tampado", "pressao", "soltar_vapor", "airfryer", "microondas", "forno", "liquidificador", "misturar", "amassar", "escorrer", "esfriar", "desfiar", "montar", "embrulhar", "congelar", "geladeira", "esperar", "abrir_lata"] as const;
export const GRUPOS = ["proteina", "laticinio", "pao", "carbo", "fruta", "legume", "verde", "tempero", "semente", "gordura", "doce", "bebida", "suplemento", "outros"] as const;

/* ---------- peças do esquema ---------- */
const paraNumero = (v: unknown) => {
  if (typeof v !== "string") return v;
  const t = v.trim().replace(",", ".");
  return t !== "" && Number.isFinite(Number(t)) ? Number(t) : v;
};
const num = (min = 0) => z.preprocess(paraNumero, z.number().finite().min(min));
const positivo = z.preprocess(paraNumero, z.number().finite().positive());
/** Aceita "7:00", "07h00" e "07:00"; guarda sempre HH:MM. */
const hora = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  const m = v.trim().match(/^(\d{1,2})\s*[:hH]\s*(\d{2})?$/);
  return m ? `${m[1]!.padStart(2, "0")}:${m[2] ?? "00"}` : v;
}, z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/));
const texto = z.preprocess((v) => (typeof v === "number" ? String(v) : v), z.string());
const textoCheio = z.string().trim().min(1);
const lista = <T extends z.ZodTypeAny>(s: T) => z.array(s).catch([]).default([]);
const letra = z.enum(LETRAS);
const dias = lista(z.number().int().min(0).max(6));

const pessoa = z.object({
  nome: textoCheio,
  sexo: z.enum(["f", "m"]).catch("f"),
  idade: num().catch(30),
  alturaCm: num().catch(165),
  pesoKg: num().catch(70),
  atividade: num(1).catch(1.375),
  objetivo: z.enum(["perder_gordura", "ganhar_massa", "recomposicao", "manter"]).catch("manter"),
  seguranca: z.enum(["ok", "validar"]).catch("ok"),
  gostos: lista(texto),
  naoCome: lista(texto),
  doce: z.enum(["todo_dia", "as_vezes", "nao"]).catch("as_vezes"),
  alergias: lista(texto),
  restricoes: lista(texto),
  observacoes: texto.catch("").default(""),
});

const HABITOS = { acordar: "07:00", dormir: "23:00", levaComida: false, foraDeCasa: [], treino: { faz: false, tipo: "", dias: [], hora: "18:00" } };
const treino = z.object({ faz: z.boolean().catch(false), tipo: texto.catch("").default(""), dias, hora: hora.catch("18:00") });
const habitos = z.object({
  acordar: hora.catch("07:00"),
  dormir: hora.catch("23:00"),
  levaComida: z.boolean().catch(false),
  foraDeCasa: lista(z.string()),
  treino: treino.catch(HABITOS.treino).default(HABITOS.treino),
});

const metas = z.object({ kcal: positivo, P: positivo, C: num().catch(0).default(0), G: num().catch(0).default(0), fibras: num().catch(0).default(0) });
const refeicaoDef = z.object({ id: z.string().trim().regex(/^[A-Za-z0-9_]+$/), nome: textoCheio, hora });
const rotinaItem = z.object({ hora, texto: textoCheio, tipo: z.enum(["suplemento", "remedio", "treino", "lembrete", "agua", "sono"]).catch("lembrete") });
const suplemento = z.object({ nome: textoCheio, dose: texto.catch("").default(""), obs: texto.catch("").default("") });

const COZINHA = { equipamentos: ["fogao"], bocas: 4, freezerMarmitas: 14, habilidade: "basico" as const, diaPreparo: "domingo" as const, tempoMaxMin: 120, congela: true, lanchesEmLote: false };
const cozinha = z.object({
  equipamentos: lista(z.string()),
  bocas: num(1).catch(4),
  freezerMarmitas: num().catch(14),
  habilidade: z.enum(["iniciante", "basico", "avancado"]).catch("basico"),
  diaPreparo: z.enum(["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]).catch("domingo"),
  tempoMaxMin: num().catch(120),
  congela: z.boolean().catch(true),
  lanchesEmLote: z.boolean().catch(false),
});
const loja = z.object({ id: z.string(), nome: texto, uso: texto.catch("").default("") });
const mercado = z.object({ orcamentoSemanal: num().catch(0), lojas: lista(loja) });
const pessoaExtra = z.object({ nome: textoCheio, fator: positivo.catch(1), refeicoes: lista(z.string()), dias });

const macros = z.object({ kcal: num(), P: num(), C: num(), G: num() });
const item = z.object({ alimento: z.string().trim().min(1), g: num(), medida: texto.catch("").default("") });
const refeicao = z.object({
  id: z.string().trim().min(1),
  prato: texto.catch("").default(""),
  receita: z.string().nullable().catch(null).default(null),
  congela: z.boolean().catch(false).default(false),
  itens: z.array(item),
  macros: macros.optional().catch(undefined),
});
const cardapio = z.object({ nome: texto.catch("").default(""), tempoPreparo: texto.catch("").default(""), refeicoes: z.array(refeicao) });

const compra = z.object({
  descricao: textoCheio,
  modo: z.enum(["kg", "emb"]),
  embalagemG: positivo.catch(1000).default(1000),
  unidade: texto.catch("emb.").default("emb."),
  preco: num(),
  fator: positivo.catch(1).default(1),
  loja: texto.catch("").default(""),
});
const alimento = z.object({
  id: z.string().trim().min(1),
  nome: textoCheio,
  grupo: z.string().catch("outros").default("outros"),
  medida: z.object({ nome: texto, g: positivo }),
  por100g: z.object({ kcal: num(), P: num(), C: num(), G: num(), fibras: num().catch(0).default(0) }),
  compra: compra.optional().catch(undefined),
});

const passo = z.object({
  titulo: textoCheio,
  detalhe: texto.catch("").default(""),
  acao: z.string().catch("").default(""),
  ingredientes: lista(z.string()),
  segundos: num().optional().catch(undefined),
  paralelo: z.boolean().optional().catch(undefined),
  momento: z.enum(["preparo", "vespera", "na_hora", "servir"]).catch("preparo").default("preparo"),
  so: z.array(letra).optional().catch(undefined),
});
const receita = z.object({
  id: z.string().trim().min(1),
  nome: textoCheio,
  porcoes: z.string().nullable().catch(null).default(null),
  so: z.array(letra).optional().catch(undefined),
  vespera: z.string().optional().catch(undefined),
  passos: z.array(passo),
});
const etapa = z.object({ minuto: num(), tarefa: textoCheio, receita: z.string(), passos: z.tuple([z.number().int(), z.number().int()]).optional() });
const ROTEIRO = { tempo: "", vespera: [], etapas: [] };
const roteiro = z.object({ tempo: texto.catch("").default(""), vespera: lista(z.string()), etapas: z.array(etapa).default([]) });
const roteiros = z.object({ A: roteiro.default(ROTEIRO), B: roteiro.default(ROTEIRO), C: roteiro.default(ROTEIRO) });

const TROCAS = { grupos: {}, proibidos: [] };
const trocas = z.object({ grupos: z.record(z.array(z.string())).catch({}).default({}), proibidos: lista(z.string()) });
const nulo = num().nullable().catch(null).default(null);
const coringa = z.object({ id: z.string(), nome: textoCheio, kcal: nulo, P: nulo, custo: nulo, obs: texto.catch("").default("") });
const extra = z.object({ descricao: textoCheio, quantidade: texto.catch("").default(""), preco: num().catch(0), loja: texto.catch("").default("") });
const primeira = z.object({ descricao: textoCheio, quantidade: texto.catch("").default(""), preco: num().catch(0) });

export const dietaSchema = z.object({
  formato: z.literal("mise-dieta"),
  versao: num().catch(1).default(1),
  pessoa,
  habitos: habitos.catch(HABITOS).default(HABITOS),
  metas,
  refeicoes: z.array(refeicaoDef).min(3).max(7),
  rotina: lista(rotinaItem),
  suplementos: lista(suplemento),
  cozinha: cozinha.catch(COZINHA).default(COZINHA),
  mercado: mercado.catch({ orcamentoSemanal: 0, lojas: [] }).default({ orcamentoSemanal: 0, lojas: [] }),
  pessoaExtra: pessoaExtra.nullable().catch(null).default(null),
  cardapios: z.object({ A: cardapio, B: cardapio, C: cardapio }),
  alimentos: z.array(alimento),
  receitas: z.array(receita).default([]),
  roteiros: roteiros.default({ A: ROTEIRO, B: ROTEIRO, C: ROTEIRO }),
  trocas: trocas.catch(TROCAS).default(TROCAS),
  coringas: lista(coringa),
  extrasSemana: lista(extra),
  primeiraCompra: lista(primeira),
  seguranca: lista(texto),
});

export type Dieta = z.infer<typeof dietaSchema>;
export type RefeicaoDef = Dieta["refeicoes"][number];
export type Alimento = Dieta["alimentos"][number];
export type Compra = NonNullable<Alimento["compra"]>;
export type Item = z.infer<typeof item>;
export type Macros = z.infer<typeof macros>;
export type Receita = Dieta["receitas"][number];
export type Passo = Receita["passos"][number];
export type Roteiro = Dieta["roteiros"]["A"];
export type RotinaItem = Dieta["rotina"][number];
export type Coringa = Dieta["coringas"][number];
/** Refeição pronta para a tela: nome e horário vêm de `refeicoes`; macros = soma dos itens. */
export type RefeicaoDia = { id: string; nome: string; hora: string; prato: string; receita: string | null; congela: boolean; itens: Item[]; macros: Macros };
export type Nutrientes = Macros & { fibras: number };
export type { Letra };

/* ---------- consultas ---------- */
const indices = new WeakMap<Dieta, Map<string, Alimento>>();
export function alimentoDe(d: Dieta, id: string): Alimento | undefined {
  let m = indices.get(d);
  if (!m) { m = new Map(d.alimentos.map((a) => [a.id, a])); indices.set(d, m); }
  return m.get(id);
}
export const receitaDe = (d: Dieta, id: string | null | undefined) => (id ? d.receitas.find((r) => r.id === id) : undefined);
export const idsRefeicoes = (d: Dieta) => d.refeicoes.map((r) => r.id);

const ZERO: Nutrientes = { kcal: 0, P: 0, C: 0, G: 0, fibras: 0 };
/** Nutrientes de um item: por100g × gramas ÷ 100 (sem arredondar). */
export function nutrientesItem(d: Dieta, id: string, gramas: number): Nutrientes | null {
  const a = alimentoDe(d, id);
  if (!a) return null;
  const f = gramas / 100;
  return { kcal: a.por100g.kcal * f, P: a.por100g.P * f, C: a.por100g.C * f, G: a.por100g.G * f, fibras: a.por100g.fibras * f };
}
export function somaItens(d: Dieta, itens: Item[]): Nutrientes {
  return itens.reduce((s, it) => {
    const n = nutrientesItem(d, it.alimento, it.g) ?? ZERO;
    return { kcal: s.kcal + n.kcal, P: s.P + n.P, C: s.C + n.C, G: s.G + n.G, fibras: s.fibras + n.fibras };
  }, ZERO);
}
export const arredondar = (n: Nutrientes): Macros => ({ kcal: Math.round(n.kcal), P: Math.round(n.P), C: Math.round(n.C), G: Math.round(n.G) });

/** Refeições da letra, na ordem do dia. O app usa a soma dos itens, não o que a IA declarou. */
export function refeicoesDaLetra(d: Dieta, l: Letra): RefeicaoDia[] {
  const porId = new Map(d.cardapios[l].refeicoes.map((r) => [r.id, r]));
  return d.refeicoes.flatMap((def) => {
    const r = porId.get(def.id);
    return r ? [{ id: def.id, nome: def.nome, hora: def.hora, prato: r.prato, receita: r.receita, congela: r.congela, itens: r.itens, macros: arredondar(somaItens(d, r.itens)) }] : [];
  });
}
export function totalDia(d: Dieta, l: Letra): Nutrientes {
  return somaItens(d, d.cardapios[l].refeicoes.flatMap((r) => r.itens));
}
/** Minúsculas, sem acento: para comparar nomes escritos à mão. */
export const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
