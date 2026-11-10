/** Lógica pura da tela Hoje: o que aparece agora, na rotina e nos anéis do dia. */
import type { Dieta, Letra, RefeicaoDia, RotinaItem } from "./dieta";
import { congeladasDeAmanha, ehAvisoFreezer } from "./lembretes";
import type { Removidas } from "./porcoes";
import { diaDaSemana, type Log } from "./semana";
import { refeicoesComTrocas, type Swap } from "./trocas";

export const PORTE_FORA = { leve: 500, médio: 800, pesado: 1100 } as const;

export type Slot = { key: string; hora: string; label: string; tipo: "refeicao" | RotinaItem["tipo"]; refeicao?: RefeicaoDia };

const porHora = (a: Slot, b: Slot) => (a.hora < b.hora ? -1 : a.hora > b.hora ? 1 : 0);

/**
 * Refeições do dia (já com as trocas da semana, menos as removidas hoje) e a rotina
 * (suplementos, remédios, treino, lembretes), cada lista em ordem de horário.
 */
export function slotsDoDia(d: Dieta, letra: Letra, swaps: Swap[], removidas: Removidas, dia = new Date()) {
  const fora = removidas[String(diaDaSemana(dia))] ?? [];
  const refeicoes: Slot[] = refeicoesComTrocas(d, letra, swaps)
    .filter((r) => !fora.includes(r.id))
    .map((r) => ({ key: r.id, hora: r.hora, label: r.nome, tipo: "refeicao" as const, refeicao: r }))
    .sort(porHora);
  const semFreezer = congeladasDeAmanha(d, letra, removidas, dia).length === 0;
  const rotina: Slot[] = d.rotina
    .map((r, i) => ({ key: `${r.tipo}-${i}`, hora: r.hora, label: r.texto, tipo: r.tipo }))
    .filter((s) => !(s.tipo === "lembrete" && semFreezer && ehAvisoFreezer(s.label)))
    .sort(porHora);
  return { refeicoes, rotina };
}

/** Só suplementos e remédios se marcam como tomados. */
export const marcavel = (s: Slot) => s.tipo === "refeicao" || s.tipo === "suplemento" || s.tipo === "remedio";

/** Primeira refeição ainda por vir; passou de todas, fica a última. */
export function indiceAgora(slots: Slot[], agora = new Date()) {
  const hm = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
  const k = slots.findIndex((s) => s.hora > hm);
  return k === -1 ? Math.max(0, slots.length - 1) : k;
}

export function totaisDoDia(logs: Log[], data: string) {
  const hoje = logs.filter((l) => l.data === data);
  const soma = (k: "kcal" | "P") => Math.round(hoje.reduce((s, l) => s + (l[k] ?? 0), 0));
  return { kcal: soma("kcal"), P: soma("P") };
}

/** Quem tirar do freezer hoje à noite para amanhã, e o horário do aviso. */
export function avisoFreezer(d: Dieta, letra: Letra, removidas: Removidas, dia = new Date()) {
  const itens = congeladasDeAmanha(d, letra, removidas, dia);
  const hora = d.rotina.find((r) => r.tipo === "lembrete" && ehAvisoFreezer(r.texto))?.hora ?? "21:00";
  return { itens, hora };
}
