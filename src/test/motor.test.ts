import { describe, expect, it } from "vitest";
import { dietaExemplo as D } from "@/lib/dietaAtual";
import { validarDieta } from "@/lib/importar";
import { fatorPorcao, kcalMeta, perfilDe, pessoasDaSemana, porcoes, porcoesPadrao, titular } from "@/lib/porcoes";
import { equivalentes, refeicoesComTrocas } from "@/lib/trocas";
import { caseira, listaCompras, mediaPreco, necessidade, primeiraCompra, total } from "@/lib/mercado";
import { acaoDoTexto, duracaoTotal, equipamento, intervalosFoco, montarTrilhas, trilhasUsadas } from "@/lib/acoes";
import { avisosCapacidade, estimativa, expandirRoteiro, instrucao, passosDoDia, potesFreezer, preencher, vespera } from "@/lib/cozinhar";
import { congeladasDeAmanha, lembretesDoDia } from "@/lib/lembretes";
import { batchSummary, householdNeed, porSecao, shoppingEstimate } from "@/lib/cycle";
import { cozinhaEmTexto, montarPromptIA, passosParaPrompt } from "@/lib/promptIA";

const item = (l: "A" | "B" | "C", id: string) => listaCompras(D, l).find((i) => i.id === id)!;

describe("porções", () => {
  it("padrão: 7 de cada refeição da dieta", () => {
    expect(porcoes(D)).toEqual(porcoesPadrao(D));
    expect(Object.keys(porcoes(D))).toEqual(["pre", "cafe", "almoco", "jantar", "lanche"]);
  });
  it("refeição removida e pessoa extra entram na conta", () => {
    const extra = { fator: 0.8, refeicoes: ["almoco", "jantar"], dias: [5, 6] };
    const p = porcoes(D, { 2: ["jantar"], 5: ["almoco"] }, pessoasDaSemana(D, extra));
    expect(p["jantar"]).toBe(7.6);
    expect(p["almoco"]).toBe(6.8);
    expect(p["pre"]).toBe(7);
    expect(pessoasDaSemana(D)).toEqual([titular(D)]);
  });
  it("gasto do dia e fator da porção", () => {
    expect(kcalMeta(perfilDe(D))).toBe(2734);
    expect(fatorPorcao(1760, D.metas.kcal)).toBe(0.8);
  });
});

describe("mercado", () => {
  it("totais da semana com os preços e as regras de arredondamento da v2", () => {
    expect(total(listaCompras(D, "A"))).toBeCloseTo(254.22, 2);
    expect(total(listaCompras(D, "B"))).toBeCloseTo(229.42, 2);
    expect(total(listaCompras(D, "C"))).toBeCloseTo(281.45, 2);
    expect(shoppingEstimate(D, "A", {}, [], porcoesPadrao(D))).toBeCloseTo(254.22, 2);
  });
  it("texto por modo de compra, com a unidade da dieta", () => {
    expect(item("A", "musculo").texto).toBe("1,3 kg");
    expect(item("A", "ovo").texto).toBe("1 cartela");
    expect(item("C", "sardinha").texto).toBe("7 latas");
    expect(item("A", "pao").texto).toBe("2 pacotes");
    expect(item("A", "couve").texto).toBe("2 maços");
    expect(listaCompras(D, "A").some((i) => i.id === "whey" || i.id === "oleo")).toBe(false);
  });
  it("preço aprendido, porções e extras", () => {
    expect(listaCompras(D, "A", { musculo: 50 }).find((i) => i.id === "musculo")!.preco).toBeCloseTo(65, 2);
    expect(listaCompras(D, "A", {}, [], { ...porcoesPadrao(D), almoco: 14 }).find((i) => i.id === "musculo")!.texto).toBe("2,5 kg");
    expect(listaCompras(D, "A").filter((i) => i.extra).map((i) => i.desc)).toEqual(["Alho, limão e cheiro-verde"]);
    expect(primeiraCompra(D)).toHaveLength(15);
    expect(total(primeiraCompra(D))).toBe(158);
  });
  it("necessidade, medida caseira, seções e média de preço", () => {
    expect(necessidade(D, "A")["frango"]).toBeCloseTo(110 * 7 * 1.905, 3);
    expect(caseira(D, "frango", 110 * 7 * 1.905)).toBe("35 col. sopa cheia");
    expect(householdNeed(D, item("A", "ovo"), "A", [], porcoesPadrao(D))).toBe("28 ovo médio");
    expect(porSecao(listaCompras(D, "A"))[0]).toMatchObject({ grupo: "pao", rotulo: "Pães" });
    const m = mediaPreco([{ food_id: "ovo", price: 20, price_date: "2026-11-01" }, { food_id: "ovo", price: 24, price_date: "2026-11-08" }, { food_id: "ovo", price: 9, price_date: "2026-01-01" }], new Date("2026-11-10T12:00:00"));
    expect(m["ovo"]).toEqual({ media: 22, ultimo: 24 });
  });
});

describe("trocas", () => {
  it("proteína troca por gramas de proteína; proibidos ficam fora", () => {
    const eq = equivalentes(D, "musculo", 120);
    expect(eq.map((e) => e.id)).toEqual(["patinho", "frango", "sardinha", "ovo"]);
    const frango = eq.find((e) => e.id === "frango")!;
    expect(frango.gramas).toBe(119);
    expect(frango.medida).toBe("5,4 col. sopa cheia");
    const d2 = structuredClone(D); d2.trocas.proibidos = ["Sardinha em lata (escorrida)", "ovo"];
    expect(equivalentes(d2, "musculo", 120).map((e) => e.id)).toEqual(["patinho", "frango"]);
  });
  it("fruta troca 1:1 na medida caseira e a troca muda itens, macros e compras", () => {
    expect(equivalentes(D, "laranja", 150).find((e) => e.id === "maca")!.gramas).toBe(130);
    const swaps = [{ refeicao: "almoco", de: "musculo", para: "frango", gramas: 119 }];
    const antes = refeicoesComTrocas(D, "A")[2]!; const depois = refeicoesComTrocas(D, "A", swaps)[2]!;
    expect(depois.itens[0]).toEqual({ alimento: "frango", g: 119, medida: "5,4 col. sopa cheia" });
    expect(depois.macros.kcal).toBeLessThan(antes.macros.kcal);
    expect(Math.abs(depois.macros.P - antes.macros.P)).toBeLessThanOrEqual(1);
    expect(listaCompras(D, "A", {}, swaps).some((i) => i.id === "musculo")).toBe(false);
  });
});

describe("roteiro e cronograma", () => {
  const passos = expandirRoteiro(D, "A");
  it("só entram passos do dia do preparo e da letra", () => {
    expect(passos).toHaveLength(42);
    expect(passos.every((p) => p.momento === "preparo")).toBe(true);
    expect(expandirRoteiro(D, "C").some((p) => p.titulo === "Couve no calor da panela")).toBe(false);
    expect(passos.find((p) => p.rid === "R5")!.porcoesRef).toBe("almoco");
  });
  it("equipamento e animação pela ação, com o texto como apoio", () => {
    expect(equipamento("Panela elétrica em Refogar/Dourar", "refogar")).toBe("Panela elétrica");
    expect(equipamento("Corte a abóbora; se dura, 3 min no micro-ondas", "cortar")).toBe("Montagem");
    expect(equipamento("Asse por 20 min", "forno")).toBe("Forno");
    expect(equipamento("Leve ao forno por 20 min", "assar")).toBe("Forno");
    expect(equipamento("Mexa até dourar", "refogar")).toBe("boca");
    expect(acaoDoTexto("qualquer coisa", "soltar_vapor")).toBe("pressao");
    expect(acaoDoTexto("Misture tudo", "flambar")).toBe("padrao");
    expect(acaoDoTexto("Desfie com dois garfos")).toBe("desfiar");
  });
  it("blocos respeitam o minuto da tarefa, paralelos e a segunda boca", () => {
    const b = montarTrilhas(passos);
    expect(b).toHaveLength(passos.length);
    expect(b[0]!.ini).toBe(0);
    expect(trilhasUsadas(b)).toEqual(["Boca 1", "Panela elétrica", "Montagem"]);
    expect(trilhasUsadas(montarTrilhas(expandirRoteiro(D, "C")))).toEqual(["Boca 1", "Boca 2", "Montagem"]);
    expect(duracaoTotal(b)).toBeGreaterThan(80 * 60);
    expect(intervalosFoco([{ i: 0, trilha: "Boca 1", ini: 0, dur: 100 }, { i: 1, trilha: "Airfryer", ini: 20, dur: 100 }, { i: 2, trilha: "Montagem", ini: 50, dur: 30 }])).toEqual([{ ini: 50, fim: 80 }]);
    const forno = montarTrilhas([{ minuto: 0, tarefa: "t", titulo: "Asse", detalhe: "", acao: "forno", segundos: 600, paralelo: true }, { minuto: 0, tarefa: "t", titulo: "Refogue", detalhe: "", acao: "refogar" }], (i) => (i === 1 ? 90 : null));
    expect(forno).toEqual([{ i: 0, trilha: "Forno", ini: 0, dur: 600 }, { i: 1, trilha: "Boca 1", ini: 30, dur: 90 }]);
  });
});

describe("quantidades nas receitas", () => {
  it("fichas da semana em medida caseira, cru e por refeição", () => {
    expect(preencher(D, "Refogue {frango}", "A")).toBe("Refogue 35 col. sopa cheia de frango desfiado (cozido) (770 g)");
    expect(preencher(D, "{frango:cru}", "A")).toBe("1,5 kg de frango desfiado (cozido)");
    expect(preencher(D, "{banana@lanche:cru}", "A")).toBe("1,1 kg de banana nanica");
    expect(preencher(D, "{porcoes} potes", "A", { ...porcoesPadrao(D), almoco: 8.6 }, { ref: "almoco" })).toBe("9 potes");
    // id desconhecido = "sem dado"; alimento que existe mas não entra nesta letra = só o nome, sem quantidade
    expect(preencher(D, "{jilo} e {naoexiste}", "C")).toBe("sem dado e sem dado");
    expect(preencher(D, "{couve}", "C")).toBe("couve-manteiga fatiada");
  });
  it("passo do dia a dia mostra uma porção, nunca a semana", () => {
    const d2 = structuredClone(D);
    d2.receitas.find((r) => r.id === "R7")!.passos[0]!.detalhe = "Mexa {ovo@cafe} com {requeijao}. Rende {porcoes}.";
    const p = passosDoDia(d2, "A", "cafe")[0]!;
    expect(p.detalhe).toBe("Mexa 4 ovo médio de ovo (200 g) com 2 col. sopa de requeijão light (30 g). Rende 1.");
    expect(passosDoDia(D, "A", "almoco").map((x) => x.titulo)).toEqual(["Para comer"]);
    expect(passosDoDia(D, "A", "pre")).toEqual([]);
  });
  it("instrução do preparo usa a refeição da receita; véspera junta roteiro e receitas", () => {
    const pote = expandirRoteiro(D, "A").find((p) => p.titulo === "Potes enfileirados")!;
    expect(instrucao(D, pote, "A")).toBe("Alinhe 7 potes de 750 ml na bancada.");
    const v = vespera(D, "A");
    expect(v[0]).toMatch(/^Passe 1,5 kg de frango/);
    expect(v.some((t) => t.startsWith("Congele as bananas"))).toBe(true);
    expect(vespera(D, "C")).toEqual(["Nada: a carne pode ser comprada no dia"]);
  });
  it("freezer: conta as refeições que congelam e avisa quando passa", () => {
    expect(potesFreezer(D, "A")).toBe(21);
    expect(avisosCapacidade(D, "A")).toEqual([]);
    const p = porcoes(D, {}, pessoasDaSemana(D, { fator: 1, refeicoes: ["almoco"], dias: [5, 6] }));
    expect(avisosCapacidade(D, "A", p)).toEqual(["23 potes pro freezer: passa de 21"]);
    expect(batchSummary(D, "A", p, {}, pessoasDaSemana(D, { fator: 1, refeicoes: ["almoco"], dias: [5, 6] }))).toEqual({ meals: 37, containers: 23 });
    expect(estimativa([100, 200, 300, 400])).toBe(300);
    expect(estimativa([])).toBeNull();
  });
});

describe("lembretes", () => {
  const sabado = new Date(2026, 10, 14, 9, 0);
  const tudo = { tipos: { refeicao: true, suplemento: true, remedio: true, marmita: true, vespera: true, lembrete: true } };
  it("refeições da dieta, suplemento, freezer e véspera do preparo", () => {
    const l = lembretesDoDia(D, sabado, tudo, "A");
    expect(l.map((x) => x.id)).toEqual(["refeicao-pre", "suplemento-0", "refeicao-cafe", "refeicao-almoco", "refeicao-jantar", "vespera", "refeicao-lanche", "marmita"]);
    expect(l.at(-1)!.at.getHours()).toBe(21);
    expect(lembretesDoDia(D, sabado, { tipos: {} }, "A")).toEqual([]);
  });
  it("o aviso do freezer depende das refeições que congelam amanhã", () => {
    const semNada = { 6: ["almoco", "jantar", "lanche"] };
    expect(congeladasDeAmanha(D, "A", {}, sabado).map((r) => r.id)).toEqual(["almoco", "jantar", "lanche"]);
    expect(lembretesDoDia(D, sabado, tudo, "A", semNada).some((x) => x.tipo === "marmita")).toBe(false);
    const d2 = structuredClone(D); d2.rotina = [];
    expect(lembretesDoDia(d2, sabado, tudo, "A").find((x) => x.tipo === "marmita")!.texto).toMatch(/freezer/);
  });
});

describe("prompt do parceiro de cozinha", () => {
  it("descreve a cozinha da dieta e leva o roteiro com quantidades", () => {
    const passos = expandirRoteiro(D, "A"); const blocos = montarTrilhas(passos);
    const txt = montarPromptIA(D, "A", passosParaPrompt(passos, blocos, (p) => instrucao(D, p, "A")));
    expect(cozinhaEmTexto(D)).toMatch(/fogão de 4 bocas, micro-ondas, airfryer, panela de pressão elétrica, liquidificador e mixer, não uso forno/);
    expect(txt).toContain("cardápio A: Carne");
    expect(txt).toContain("Passo 42 (");
    expect(txt).toContain("Alinhe 7 potes de 750 ml");
    expect(txt).not.toMatch(/\{[a-z_@:]+\}/);
  });
});

describe("dieta de outra pessoa (4 refeições r1…r4)", () => {
  it("o motor inteiro funciona sem nenhum id fixo", () => {
    const o = structuredClone(D) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const mapa: Record<string, string> = { cafe: "r1", almoco: "r2", jantar: "r3", lanche: "r4" };
    o.refeicoes = o.refeicoes.filter((r: any) => r.id !== "pre").map((r: any) => ({ ...r, id: mapa[r.id] })); // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const l of ["A", "B", "C"]) o.cardapios[l].refeicoes = o.cardapios[l].refeicoes.filter((r: any) => r.id !== "pre").map((r: any) => ({ ...r, id: mapa[r.id] })); // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const r of o.receitas) r.porcoes = r.porcoes ? mapa[r.porcoes] : null;
    o.pessoa.nome = "Mariana"; o.metas.kcal = 2000;
    const r = validarDieta(o);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const M = r.dieta;
    expect(Object.keys(porcoes(M))).toEqual(["r1", "r2", "r3", "r4"]);
    expect(potesFreezer(M, "A")).toBe(21);
    expect(total(listaCompras(M, "A"))).toBeGreaterThan(150);
    expect(instrucao(M, expandirRoteiro(M, "A").find((p) => p.titulo === "Potes enfileirados")!, "A")).toMatch(/^Alinhe 7 potes/);
    expect(lembretesDoDia(M, new Date(2026, 10, 11), { tipos: { refeicao: true } }, "B").map((x) => x.id)).toEqual(["refeicao-r1", "refeicao-r2", "refeicao-r3", "refeicao-r4"]);
  });
});
