import { beforeEach, describe, expect, it } from "vitest";
import { carregarDieta, dietaExemplo, getDieta, salvarDieta, usandoExemplo, voltarAoExemplo } from "@/lib/dietaAtual";
import { setItem } from "@/lib/store";

describe("dieta em uso", () => {
  beforeEach(async () => { await voltarAoExemplo(); });
  it("sem nada guardado, vale a de exemplo", async () => {
    expect(await carregarDieta()).toBe(dietaExemplo);
    expect(usandoExemplo()).toBe(true);
  });
  it("guarda a dieta da pessoa no aparelho e volta ao exemplo quando pedir", async () => {
    const minha = structuredClone(dietaExemplo); minha.pessoa.nome = "Mariana";
    await salvarDieta(minha);
    expect(getDieta().pessoa.nome).toBe("Mariana");
    expect((await carregarDieta()).pessoa.nome).toBe("Mariana");
    expect(usandoExemplo()).toBe(false);
    await voltarAoExemplo();
    expect((await carregarDieta()).pessoa.nome).toBe("Daniel");
  });
  it("dado guardado ilegível não derruba o app", async () => {
    await setItem("dieta", { formato: "outra-coisa" });
    expect(await carregarDieta()).toBe(dietaExemplo);
    expect(usandoExemplo()).toBe(true);
  });
});
