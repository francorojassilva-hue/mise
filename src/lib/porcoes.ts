import { idsRefeicoes, type Dieta } from "./dieta";

export const DIAS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"] as const;
const SEMANA = [0, 1, 2, 3, 4, 5, 6];

/** Dia (0=seg) → refeições removidas da semana. */
export type Removidas = Record<string, string[]>;
export type PessoaPorcao = { fator: number; refeicoes: string[]; dias: number[] };
export type Porcoes = Record<string, number>;

/** Quem segue a dieta: todas as refeições, todos os dias. */
export const titular = (d: Dieta): PessoaPorcao => ({ fator: 1, refeicoes: idsRefeicoes(d), dias: SEMANA });
export const porcoesPadrao = (d: Dieta): Porcoes => Object.fromEntries(idsRefeicoes(d).map((r) => [r, 7]));
/** Titular + pessoa extra (a da dieta, ou a que a pessoa ajustou na Semana; null = sem ninguém). */
export function pessoasDaSemana(d: Dieta, extra: PessoaPorcao | null | undefined = d.pessoaExtra): PessoaPorcao[] {
  return extra ? [titular(d), extra] : [titular(d)];
}

/** porcoes[refeição] = Σ pessoas (dias ativos × fator). Refeição removida vale para a casa toda. */
export function porcoes(d: Dieta, removidas: Removidas = {}, pessoas: PessoaPorcao[] = [titular(d)]): Porcoes {
  const out: Porcoes = {};
  for (const r of idsRefeicoes(d)) {
    let s = 0;
    for (const p of pessoas) {
      if (!p.refeicoes.includes(r)) continue;
      for (const dia of p.dias) if (!(removidas[dia] ?? []).includes(r)) s += p.fator;
    }
    out[r] = Math.round(s * 100) / 100;
  }
  return out;
}

export type Perfil = { peso: number; altura: number; idade: number; sexo: "m" | "f"; atividade: number };
export const ATIVIDADE = [[1.2, "Parado"], [1.375, "Leve"], [1.55, "Moderado"], [1.725, "Intenso"], [1.9, "Atleta"]] as const;
export const perfilDe = (d: Dieta): Perfil => ({ peso: d.pessoa.pesoKg, altura: d.pessoa.alturaCm, idade: d.pessoa.idade, sexo: d.pessoa.sexo, atividade: d.pessoa.atividade });

/** Gasto do dia: Mifflin-St Jeor × fator de atividade. */
export function kcalMeta(p: Perfil) {
  const tmb = 10 * p.peso + 6.25 * p.altura - 5 * p.idade + (p.sexo === "m" ? 5 : -161);
  return Math.round(tmb * p.atividade);
}
/** Tamanho da porção de outra pessoa em relação à meta da dieta (ex.: 1.760 kcal ÷ 2.200 = 0,8). */
export const fatorPorcao = (kcal: number, metaKcal: number) => Math.round((kcal / metaKcal) * 100) / 100;
