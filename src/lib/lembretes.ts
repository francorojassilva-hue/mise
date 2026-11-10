import type { Dieta, Letra } from "./dieta";
import type { Removidas } from "./porcoes";

export const TIPOS = { refeicao: "Refeições", suplemento: "Suplementos", remedio: "Remédios", marmita: "Tirar do freezer", vespera: "Véspera do preparo", lembrete: "Outros lembretes" } as const;
export type Tipo = keyof typeof TIPOS;
/** Cada tipo começa desligado; a pessoa liga nos Ajustes. */
export type AjustesLembretes = { tipos: Partial<Record<Tipo, boolean>> };
export type Lembrete = { id: string; tipo: Tipo; at: Date; texto: string };

const DIA_JS: Record<Dieta["cozinha"]["diaPreparo"], number> = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
const FREEZER = /freezer|geladeira|descongel/i;
const seg0 = (dt: Date) => (dt.getDay() + 6) % 7;

/** Refeições de amanhã que saem do freezer (para o aviso da noite e o bloco da tela Hoje). */
export function congeladasDeAmanha(d: Dieta, letra: Letra, removidas: Removidas = {}, dia = new Date()) {
  const amanha = new Date(dia); amanha.setDate(dia.getDate() + 1);
  const fora = removidas[seg0(amanha)] ?? [];
  const nomes = new Map(d.refeicoes.map((r) => [r.id, r.nome]));
  return d.cardapios[letra].refeicoes.filter((r) => r.congela && !fora.includes(r.id) && nomes.has(r.id)).map((r) => ({ id: r.id, nome: nomes.get(r.id)!, prato: r.prato }));
}

/** Lembretes de um dia (só horários: o app nunca sugere dose). */
export function lembretesDoDia(d: Dieta, dia: Date, a: AjustesLembretes, letra: Letra, removidas: Removidas = {}): Lembrete[] {
  const out: Lembrete[] = [];
  const at = (hm: string) => { const [h = 0, m = 0] = hm.split(":").map(Number); const x = new Date(dia); x.setHours(h, m, 0, 0); return x; };
  const add = (id: string, tipo: Tipo, hm: string, texto: string) => { if (a.tipos[tipo]) out.push({ id, tipo, at: at(hm), texto }); };
  const fora = removidas[seg0(dia)] ?? [];
  for (const r of d.refeicoes) if (!fora.includes(r.id)) add(`refeicao-${r.id}`, "refeicao", r.hora, r.nome);

  const temFreezer = congeladasDeAmanha(d, letra, removidas, dia).length > 0;
  let avisoFreezer = false;
  d.rotina.forEach((r, i) => {
    if (r.tipo === "suplemento" || r.tipo === "remedio") add(`${r.tipo}-${i}`, r.tipo, r.hora, r.texto);
    else if (r.tipo === "lembrete" && FREEZER.test(r.texto)) { avisoFreezer = true; if (temFreezer) add("marmita", "marmita", r.hora, r.texto); }
    else if (r.tipo === "lembrete") add(`lembrete-${i}`, "lembrete", r.hora, r.texto);
  });
  if (!avisoFreezer && temFreezer) add("marmita", "marmita", "21:00", "Passar as refeições de amanhã do freezer para a geladeira");

  const amanha = new Date(dia); amanha.setDate(dia.getDate() + 1);
  if (amanha.getDay() === DIA_JS[d.cozinha.diaPreparo]) add("vespera", "vespera", "20:00", "Amanhã é dia de preparo: confira a véspera 🧊");
  return out.sort((x, y) => +x.at - +y.at);
}
