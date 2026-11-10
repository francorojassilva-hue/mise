export type Anim = "ferver" | "refogar" | "pressao" | "airfryer" | "microondas" | "forno" | "cortar" | "temperar" | "desfiar" | "montar" | "congelar" | "padrao";

const REGRAS: [Anim, RegExp][] = [
  ["airfryer", /air ?fryer/],
  ["microondas", /micro-?ondas/],
  ["forno", /\bforno\b|assadeira|asse\b/],
  ["pressao", /press[aã]o|v[aá]lvula|vapor|panela el[eé]trica/],
  ["congelar", /congel|freezer/],
  ["desfiar", /desfi/],
  ["montar", /mont|potes?\b|potinho|marmita|porcion/],
  ["cortar", /cort|pic|fatie|rale|descasq/],
  ["temperar", /temper|marin|polvilh|sal\b|pitada/],
  ["ferver", /ferv|cozinh|escald|água/],
  ["refogar", /refog|mex|doure|frigideira|salte/],
];
const POR_ACAO: Record<string, Anim> = {
  ferver: "ferver", cozinhar_tampado: "ferver", refogar: "refogar", dourar: "refogar", frigideira: "refogar",
  pressao: "pressao", soltar_vapor: "pressao", airfryer: "airfryer", microondas: "microondas", forno: "forno",
  cortar: "cortar", ralar: "cortar", descascar: "cortar", marinar: "temperar", temperar: "temperar", polvilhar: "temperar",
  desfiar: "desfiar", montar: "montar", embrulhar: "montar", congelar: "congelar", geladeira: "congelar",
};
const pelaFrase = (txt: string): Anim | null => { const t = txt.toLowerCase(); return REGRAS.find(([, re]) => re.test(t))?.[0] ?? null; };

/** Animação do passo: a ação declarada manda; sem ação conhecida, tenta pelo texto; senão, panela genérica. */
export function acaoDoTexto(txt: string, acao?: string): Anim {
  return (acao && POR_ACAO[acao]) || pelaFrase(txt) || "padrao";
}

export const TRILHAS = ["Boca 1", "Boca 2", "Panela elétrica", "Airfryer", "Micro-ondas", "Forno", "Montagem"] as const;
export type Trilha = (typeof TRILHAS)[number];
const FOGAO = new Set(["refogar", "dourar", "frigideira", "ferver", "cozinhar_tampado"]);
const BANCADA = new Set(["lavar", "cortar", "ralar", "descascar", "marinar", "temperar", "polvilhar", "liquidificador", "misturar", "amassar", "escorrer", "esfriar", "desfiar", "montar", "embrulhar", "congelar", "geladeira", "esperar", "abrir_lata"]);

/** Equipamento do passo (linha do cronograma); fogão vira "boca" e a boca livre é escolhida depois. */
export function equipamento(txt: string, acao?: string): Trilha | "boca" {
  if (acao === "airfryer") return "Airfryer";
  if (acao === "microondas") return "Micro-ondas";
  if (acao === "forno") return "Forno";
  if (acao === "pressao" || acao === "soltar_vapor") return "Panela elétrica";
  if (acao && FOGAO.has(acao)) return /panela el[eé]trica/i.test(txt) ? "Panela elétrica" : "boca";
  if (acao && BANCADA.has(acao)) return "Montagem";
  const a = pelaFrase(txt);
  if (a === "airfryer") return "Airfryer";
  if (a === "microondas") return "Micro-ondas";
  if (a === "forno") return "Forno";
  if (a === "pressao") return "Panela elétrica";
  return a === "ferver" || a === "refogar" ? "boca" : "Montagem";
}

export type PassoTrilha = { minuto: number; tarefa: string; titulo: string; detalhe: string; acao: string; segundos?: number | undefined; paralelo?: boolean | undefined };
export type Bloco = { i: number; trilha: Trilha; ini: number; dur: number };
export const DURACAO_PADRAO = 120;

/** Blocos no tempo (s): cada tarefa começa no seu minuto; passos em sequência; paralelos liberam o próximo. */
export function montarTrilhas(passos: PassoTrilha[], est: (i: number) => number | null = () => null): Bloco[] {
  const out: Bloco[] = [];
  let cursor = 0; let tarefa: string | null = null;
  passos.forEach((p, i) => {
    if (p.tarefa !== tarefa) { tarefa = p.tarefa; cursor = Math.max(cursor, p.minuto * 60); }
    const dur = est(i) ?? p.segundos ?? DURACAO_PADRAO;
    let eq = equipamento(`${p.titulo} ${p.detalhe}`, p.acao);
    if (eq === "boca") eq = out.some((b) => b.trilha === "Boca 1" && b.ini + b.dur > cursor) ? "Boca 2" : "Boca 1";
    out.push({ i, trilha: eq, ini: cursor, dur });
    cursor += p.paralelo ? 30 : dur;
  });
  return out;
}

/** Linhas que o cronograma mostra: só as usadas, na ordem fixa (Forno aparece quando algum passo usa forno). */
export const trilhasUsadas = (blocos: Bloco[]): Trilha[] => TRILHAS.filter((t) => blocos.some((b) => b.trilha === t));
/** Duração total do preparo, em segundos. */
export const duracaoTotal = (blocos: Bloco[]) => blocos.reduce((m, b) => Math.max(m, b.ini + b.dur), 0);

/** Intervalos (s) em que 3 ou mais equipamentos estão ativos ao mesmo tempo. */
export function intervalosFoco(blocos: Bloco[], minimo = 3): { ini: number; fim: number }[] {
  const pontos = [...new Set(blocos.flatMap((b) => [b.ini, b.ini + b.dur]))].sort((a, b) => a - b);
  const out: { ini: number; fim: number }[] = [];
  for (let k = 0; k < pontos.length - 1; k++) {
    const a = pontos[k]!, z = pontos[k + 1]!;
    const ativos = new Set(blocos.filter((b) => b.ini < z && b.ini + b.dur > a).map((b) => b.trilha));
    if (ativos.size < minimo) continue;
    const ult = out.at(-1);
    if (ult && ult.fim === a) ult.fim = z; else out.push({ ini: a, fim: z });
  }
  return out;
}
