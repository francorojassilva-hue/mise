/**
 * Armazenamento único do app. Tudo fica no aparelho.
 * Ordem: IndexedDB (idb-keyval) → localStorage → memória.
 * Nenhuma leitura ou escrita lança erro: no pior caso, devolve o padrão.
 */
import { del as idbDel, get as idbGet, keys as idbKeys, set as idbSet } from "idb-keyval";

const PREFIX = "mise:";
const memory = new Map<string, unknown>();

const k = (key: string) => PREFIX + key;

function lsGet<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(k(key));
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

function lsSet(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(k(key), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function lsDel(key: string) {
  try {
    localStorage.removeItem(k(key));
  } catch {
    /* storage indisponível */
  }
}

function lsKeys(): string[] {
  try {
    const out: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const name = localStorage.key(i);
      if (name?.startsWith(PREFIX)) out.push(name.slice(PREFIX.length));
    }
    return out;
  } catch {
    return [];
  }
}

export async function getItem<T>(key: string): Promise<T | undefined>;
export async function getItem<T>(key: string, fallback: T): Promise<T>;
export async function getItem<T>(key: string, fallback?: T): Promise<T | undefined> {
  try {
    const value = await idbGet<T>(k(key));
    if (value !== undefined) return value;
  } catch {
    /* tenta o próximo */
  }
  const fromLs = lsGet<T>(key);
  if (fromLs !== undefined) return fromLs;
  if (memory.has(key)) return memory.get(key) as T;
  return fallback;
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await idbSet(k(key), value);
    lsDel(key);
    memory.delete(key);
    return;
  } catch {
    /* tenta o próximo */
  }
  if (lsSet(key, value)) {
    memory.delete(key);
    return;
  }
  memory.set(key, value);
}

export async function removeItem(key: string): Promise<void> {
  try {
    await idbDel(k(key));
  } catch {
    /* segue */
  }
  lsDel(key);
  memory.delete(key);
}

/** Todas as chaves guardadas (sem o prefixo). Usado pelo backup. */
export async function listKeys(): Promise<string[]> {
  const found = new Set<string>();
  try {
    for (const key of await idbKeys()) {
      if (typeof key === "string" && key.startsWith(PREFIX)) found.add(key.slice(PREFIX.length));
    }
  } catch {
    /* segue */
  }
  for (const key of lsKeys()) found.add(key);
  for (const key of memory.keys()) found.add(key);
  return [...found].sort();
}
