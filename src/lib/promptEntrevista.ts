/**
 * Prompt da entrevista: a pessoa cola numa IA (Gemini, ChatGPT ou Claude), responde ~12 perguntas
 * e recebe de volta o arquivo da dieta. O texto vive em src/data/prompt-entrevista.md.
 */
import modelo from "@/data/prompt-entrevista.md?raw";

export type RefeicaoEscolhida = { id: string; nome: string; hora: string };

export const MIN_REFEICOES = 3;
export const MAX_REFEICOES = 7;
const MARCA = "{{REFEICOES}}";

/** Sugestão pronta de 4 refeições. */
export const REFEICOES_SUGERIDAS: RefeicaoEscolhida[] = [
  { id: "r1", nome: "Café da manhã", hora: "07:00" },
  { id: "r2", nome: "Almoço", hora: "12:30" },
  { id: "r3", nome: "Lanche da tarde", hora: "16:00" },
  { id: "r4", nome: "Jantar", hora: "20:00" },
];

const NOMES_PADRAO = ["Café da manhã", "Lanche da manhã", "Almoço", "Lanche da tarde", "Jantar", "Ceia", "Pré-treino"];
const HORAS_PADRAO = ["07:00", "10:00", "12:30", "16:00", "20:00", "22:00", "18:00"];

/** Refeições com ids r1…rN em ordem do dia (ordena pelo horário). */
export function numerarRefeicoes(lista: { nome: string; hora: string }[]): RefeicaoEscolhida[] {
  return [...lista].sort((a, b) => a.hora.localeCompare(b.hora)).map((r, i) => ({ id: `r${i + 1}`, nome: r.nome.trim(), hora: r.hora }));
}

/** Ajusta a quantidade de refeições mantendo as que já estavam. */
export function comQuantidade(atual: RefeicaoEscolhida[], n: number): RefeicaoEscolhida[] {
  const alvo = Math.min(MAX_REFEICOES, Math.max(MIN_REFEICOES, n));
  if (alvo <= atual.length) return atual.slice(0, alvo).map((r, i) => ({ ...r, id: `r${i + 1}` }));
  const extras = Array.from({ length: alvo - atual.length }, (_, i) => {
    const k = atual.length + i;
    return { id: `r${k + 1}`, nome: NOMES_PADRAO[k] ?? `Refeição ${k + 1}`, hora: HORAS_PADRAO[k] ?? "21:00" };
  });
  return [...atual, ...extras];
}

export const horaValida = (h: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
export const refeicoesValidas = (l: RefeicaoEscolhida[]) => l.length >= MIN_REFEICOES && l.length <= MAX_REFEICOES && l.every((r) => r.nome.trim() && horaValida(r.hora));

const SEM_LISTA = "Ainda não defini no app. No bloco 2, pergunte quantas refeições eu faço por dia (de 3 a 7), o nome e o horário de cada uma, e se alguma eu como fora de casa. Dê ids r1, r2, r3... em ordem do dia.";

/** O prompt completo, já com as refeições que a pessoa definiu no app. */
export function montarPromptEntrevista(refeicoes?: RefeicaoEscolhida[]): string {
  const bloco =
    refeicoes && refeicoes.length
      ? `Eu já defini as minhas refeições no app. Use exatamente esta lista (mesma quantidade, mesmos ids, nomes e horários). Não acrescente nem tire refeições. No bloco 2, só confirme se alguma é fora de casa.\n\n${refeicoes.map((r) => `${r.id} · ${r.nome} · ${r.hora}`).join("\n")}`
      : SEM_LISTA;
  return modelo.replace(MARCA, bloco);
}
