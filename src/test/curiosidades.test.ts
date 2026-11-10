import { beforeEach, describe, expect, it } from "vitest";
import { carregarCuriosidades, CURIOS, curtida, curtir, doDia, proxima } from "@/lib/curiosidades";
import { dietaExemplo } from "@/lib/dietaAtual";
import { removeItem, setItem } from "@/lib/store";

describe("curiosidades", () => {
  beforeEach(async () => { await removeItem("curiosidades"); await carregarCuriosidades(); });

  it("catálogo completo, sem detalhe que era só do plano do Daniel", () => {
    expect(CURIOS.length).toBeGreaterThan(120);
    for (const c of CURIOS) { expect(c.ing).not.toBe(""); expect(c.t.length).toBeGreaterThan(10); expect(c.fonte).not.toBe(""); }
    const tudo = CURIOS.map((c) => `${c.ing} ${c.t} ${c.fonte}`).join(" ").toLowerCase();
    for (const fora of ["coca", "escondidinho", "do plano", "salada de macarrão"]) expect(tudo).not.toContain(fora);
  });

  it("os ingredientes dos passos da dieta de exemplo encontram curiosidade", () => {
    const ings = [...new Set(dietaExemplo.receitas.flatMap((r) => r.passos.flatMap((p) => p.ingredientes)))];
    const comCurio = ings.filter((i) => CURIOS.some((c) => c.ing === i));
    expect(comCurio.length).toBe(ings.length);
  });

  it("mostra todas antes de repetir e nunca repete a anterior", () => {
    const total = CURIOS.filter((c) => c.ing === "ovo").length;
    const vistas: number[] = [];
    let anterior: number | undefined;
    for (let i = 0; i < total; i++) { const c = proxima(["ovo"], anterior)!; vistas.push(c.id); anterior = c.id; }
    expect(new Set(vistas).size).toBe(total);
    const depois = proxima(["ovo"], anterior)!;
    expect(depois.id).not.toBe(anterior);
    expect(proxima(["ingrediente_que_nao_existe"])).toBeNull();
    expect(proxima(["Limão"])?.ing).toBe("limao");
  });

  it("curtida e vistos ficam guardados no aparelho", async () => {
    const c = proxima(["frango"], undefined, () => 0)!;
    expect(curtir(c.id)).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    await carregarCuriosidades();
    expect(curtida(c.id)).toBe(true);
    expect(proxima(["frango"], undefined, () => 0)!.id).not.toBe(c.id);
    expect(curtir(c.id)).toBe(false);
  });

  it("dado guardado ilegível vira lista vazia; a do dia é estável", async () => {
    await setItem("curiosidades", { vistos: "x", curtidas: [1, "a"] });
    await carregarCuriosidades();
    expect(curtida(1)).toBe(true);
    expect(curtida(2)).toBe(false);
    const dia = new Date(2026, 10, 10, 8);
    expect(doDia(dia)).toBe(doDia(new Date(2026, 10, 10, 22)));
  });
});
