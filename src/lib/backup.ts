/**
 * Backup e restauração: um arquivo .json com tudo o que está guardado no aparelho.
 * Um backup parcial (só preços e tempos, por exemplo) restaura só o que traz e não apaga o resto.
 */
import { limparAjustes, carregarAjustes } from "./ajustes";
import { dietaSchema } from "./dieta";
import { carregarDieta } from "./dietaAtual";
import { carregarCuriosidades } from "./curiosidades";
import { carregarPrecos, limparPrecos } from "./precos";
import { carregarSemana } from "./semana";
import { getItem, listKeys, setItem } from "./store";
import { carregarTempos, limparTempos } from "./tempos";

export const FORMATO_BACKUP = "mise-backup";
export const CHAVES = ["dieta", "semana", "curiosidades", "precos", "tempos", "ajustes"] as const;
export type Chave = (typeof CHAVES)[number];
export type Backup = { formato: typeof FORMATO_BACKUP; versao: 1; criadoEm: string; dados: Partial<Record<Chave, unknown>> };

export const nomeDoBackup = (d = new Date()) => `mise-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.json`;

/** Junta o que está guardado agora. */
export async function montarBackup(agora = new Date()): Promise<Backup> {
  const guardadas = new Set(await listKeys());
  const dados: Backup["dados"] = {};
  for (const c of CHAVES) {
    if (!guardadas.has(c)) continue;
    const v = await getItem<unknown>(c);
    if (v !== undefined) dados[c] = v;
  }
  return { formato: FORMATO_BACKUP, versao: 1, criadoEm: agora.toISOString(), dados };
}

export const backupEmTexto = (b: Backup) => JSON.stringify(b);

export type Restauro = { ok: true; itens: Chave[] } | { ok: false; erro: string };

const NOMES: Record<Chave, string> = { dieta: "dieta", semana: "semana", curiosidades: "curiosidades", precos: "preços", tempos: "tempos de preparo", ajustes: "lembretes" };
export const nomeDoItem = (c: Chave) => NOMES[c];

/** Confere o arquivo, grava o que veio e recarrega tudo. Nada é gravado se alguma parte estiver estragada. */
export async function restaurarBackup(texto: string): Promise<Restauro> {
  let j: unknown;
  try {
    j = JSON.parse(texto);
  } catch {
    return { ok: false, erro: "Esse arquivo não é um backup do Mise (não consegui ler)." };
  }
  if (!j || typeof j !== "object" || (j as Backup).formato !== FORMATO_BACKUP || typeof (j as Backup).dados !== "object" || !(j as Backup).dados) {
    return { ok: false, erro: "Esse arquivo não é um backup do Mise." };
  }
  const dados = (j as Backup).dados;
  const gravar: [Chave, unknown][] = [];
  for (const c of CHAVES) {
    const v = dados[c];
    if (v === undefined || v === null) continue;
    if (c === "dieta") {
      const p = dietaSchema.safeParse(v);
      if (!p.success) return { ok: false, erro: "A dieta que está no backup não passou na conferência. Nada foi alterado." };
      gravar.push([c, p.data]);
    } else if (c === "precos") gravar.push([c, limparPrecos(v)]);
    else if (c === "tempos") gravar.push([c, limparTempos(v)]);
    else if (c === "ajustes") gravar.push([c, limparAjustes(v)]);
    else gravar.push([c, v]);
  }
  if (!gravar.length) return { ok: false, erro: "O backup está vazio." };
  for (const [c, v] of gravar) await setItem(c, v);
  await Promise.all([carregarDieta(), carregarSemana(), carregarCuriosidades(), carregarPrecos(), carregarTempos(), carregarAjustes()]);
  return { ok: true, itens: gravar.map(([c]) => c) };
}
