import { beforeEach, describe, expect, it, vi } from "vitest";

const idb = vi.hoisted(() => ({ broken: false }));

vi.mock("idb-keyval", async () => {
  const real = await vi.importActual<typeof import("idb-keyval")>("idb-keyval");
  const guard =
    <A extends unknown[], R>(fn: (...args: A) => R) =>
    (...args: A): R => {
      if (idb.broken) throw new Error("IndexedDB indisponível");
      return fn(...args);
    };
  return { ...real, get: guard(real.get), set: guard(real.set), del: guard(real.del), keys: guard(real.keys) };
});

import { getItem, listKeys, removeItem, setItem } from "@/lib/store";

beforeEach(async () => {
  idb.broken = false;
  for (const key of await listKeys()) await removeItem(key);
  localStorage.clear();
});

describe("store com IndexedDB", () => {
  it("guarda e lê um objeto", async () => {
    await setItem("dieta", { nome: "Daniel", metas: { kcal: 2200 } });
    expect(await getItem("dieta")).toEqual({ nome: "Daniel", metas: { kcal: 2200 } });
  });

  it("devolve o padrão quando a chave não existe", async () => {
    expect(await getItem("nada")).toBeUndefined();
    expect(await getItem("nada", 42)).toBe(42);
  });

  it("remove uma chave", async () => {
    await setItem("a", 1);
    await removeItem("a");
    expect(await getItem("a")).toBeUndefined();
  });

  it("lista as chaves sem o prefixo, em ordem", async () => {
    await setItem("b", 1);
    await setItem("a", 2);
    expect(await listKeys()).toEqual(["a", "b"]);
  });
});

describe("store sem IndexedDB", () => {
  it("cai para o localStorage sem lançar erro", async () => {
    idb.broken = true;
    await setItem("tema", { letra: "B" });
    expect(localStorage.getItem("mise:tema")).toBe(JSON.stringify({ letra: "B" }));
    expect(await getItem("tema")).toEqual({ letra: "B" });
    expect(await listKeys()).toEqual(["tema"]);
  });

  it("cai para a memória quando o localStorage também falha", async () => {
    idb.broken = true;
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("cota");
    });
    await setItem("x", [1, 2, 3]);
    expect(await getItem("x")).toEqual([1, 2, 3]);
    spy.mockRestore();
  });

  it("lê do localStorage um dado salvo enquanto o IndexedDB estava fora", async () => {
    idb.broken = true;
    await setItem("y", "salvo");
    idb.broken = false;
    expect(await getItem("y")).toBe("salvo");
  });
});
