import { describe, expect, it } from "vitest";
import bruto from "@/data/exemplo.json";
import { LETRAS, refeicoesDaLetra, totalDia } from "@/lib/dieta";
import { COLAGEM_VAZIA, concluirColagem, exportarDieta, extrairJson, importarDieta, receberParte, resumoDieta, validarDieta } from "@/lib/importar";
import { dietaExemplo as D } from "@/lib/dietaAtual";

const copia = () => structuredClone(bruto) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
const erros = (o: unknown) => { const r = validarDieta(o); return r.ok ? [] : r.erros; };

describe("dieta de exemplo", () => {
  it("passa na validação sem erro e sem aviso", () => {
    const r = validarDieta(bruto);
    expect(r.ok).toBe(true);
    expect(r.avisos).toEqual([]);
  });
  it("não leva remédios nem detalhes pessoais", () => {
    const txt = JSON.stringify(bruto).toLowerCase();
    for (const p of ["minoxidil", "saw palmetto", "biotina", "coca", "capilar", "danilo"]) expect(txt).not.toContain(p);
    expect(D.rotina.some((r) => r.tipo === "remedio")).toBe(false);
  });
  it("tem as 5 refeições nas 3 letras, na ordem do dia", () => {
    for (const l of LETRAS) expect(refeicoesDaLetra(D, l).map((r) => r.id)).toEqual(["pre", "cafe", "almoco", "jantar", "lanche"]);
  });
  it("soma dos itens bate com os totais da v2", () => {
    const v2 = { A: [2225, 171], B: [2236, 184], C: [2218, 150] } as const;
    for (const l of LETRAS) {
      const t = totalDia(D, l);
      expect(Math.abs(t.kcal - v2[l][0])).toBeLessThan(15);
      expect(Math.abs(t.P - v2[l][1])).toBeLessThan(3);
    }
  });
});

describe("colar a dieta", () => {
  const json = JSON.stringify(bruto);
  it("aceita bloco ```json com texto em volta", () => {
    const r = importarDieta(`Seu arquivo está saindo.\n\`\`\`json\n${json}\n\`\`\`\nPronto! Toque em copiar.`);
    expect(r.ok).toBe(true);
  });
  it("aceita JSON formatado e com vírgula sobrando", () => {
    expect(importarDieta(JSON.stringify(bruto, null, 2)).ok).toBe(true);
    expect(extrairJson('{"a":[1,2,],"b":"x,}",}')).toEqual({ ok: true, valor: { a: [1, 2], b: "x,}" } });
  });
  it("explica quando o texto veio cortado ou vazio", () => {
    const r = importarDieta(json.slice(0, 5000));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0]).toMatch(/cortado/);
    const v = importarDieta("  ");
    if (!v.ok) expect(v.erros[0]).toMatch(/vazia/);
    const s = importarDieta("oi, tudo bem?");
    if (!s.ok) expect(s.erros[0]).toMatch(/Não achei/);
  });
  it("exportar e importar devolve a mesma dieta", () => {
    const r = importarDieta(exportarDieta(D));
    expect(r.ok && r.dieta).toEqual(D);
    expect(importarDieta(exportarDieta(D, true)).ok).toBe(true);
  });
  it("normaliza horário escrito de outro jeito", () => {
    const o = copia(); o.refeicoes[0].hora = "7h"; o.rotina[0].hora = "7:30";
    const r = validarDieta(o);
    expect(r.ok && r.dieta.refeicoes[0]!.hora).toBe("07:00");
    expect(r.ok && r.dieta.rotina[0]!.hora).toBe("07:30");
  });
});

describe("mensagens de erro humanas", () => {
  it("formato, nome, metas e letra faltando", () => {
    const a = copia(); delete a.formato; expect(erros(a)[0]).toMatch(/não é uma dieta do Mise/);
    const b = copia(); delete b.pessoa.nome; expect(erros(b)).toContain("Faltou o nome da pessoa.");
    const c = copia(); delete c.metas; expect(erros(c)).toContain("Faltou as metas do dia.");
    const d = copia(); delete d.cardapios.B; expect(erros(d)).toContain("Faltou o cardápio B.");
  });
  it("refeições: quantidade, id repetido e horário", () => {
    const a = copia(); a.refeicoes = a.refeicoes.slice(0, 2); expect(erros(a)).toContain("O Mise aceita de 3 a 7 refeições por dia.");
    const b = copia(); b.refeicoes[1].id = "pre"; expect(erros(b).join(" ")).toMatch(/mesmo id/);
    const c = copia(); c.refeicoes[2].hora = "meio-dia"; expect(erros(c)[0]).toMatch(/refeição 3.*HH:MM/);
  });
  it("letra sem refeição, com refeição a mais e alimento fora do catálogo", () => {
    const a = copia(); a.cardapios.A.refeicoes.pop(); expect(erros(a)).toContain('No cardápio A falta "Doce da noite" (lanche).');
    const b = copia(); b.cardapios.C.refeicoes.push({ ...b.cardapios.C.refeicoes[0], id: "ceia" }); expect(erros(b)[0]).toMatch(/cardápio C tem uma refeição a mais \("ceia"\)/);
    const c = copia(); c.cardapios.B.refeicoes[2].itens[0].alimento = "tilapia";
    expect(erros(c)).toContain('"Almoço" do cardápio B usa "tilapia", que não está na lista de alimentos.');
  });
  it("alimento sem por100g, medida zerada, receita e faixa de passos inexistentes, número negativo", () => {
    const a = copia(); delete a.alimentos[0].por100g; expect(erros(a)[0]).toMatch(/Pão Nutrella.*sem os valores por 100 g/);
    const b = copia(); b.alimentos[2].medida.g = 0; expect(erros(b)[0]).toMatch(/"Ovo" precisa de uma medida caseira/);
    const c = copia(); c.cardapios.A.refeicoes[1].receita = "R99"; expect(erros(c)[0]).toMatch(/cita a receita "R99"/);
    const d = copia(); d.roteiros.A.etapas[1].passos = [1, 30]; expect(erros(d)[0]).toMatch(/passos 1 a 30.*só tem 10/);
    const e = copia(); e.cardapios.A.refeicoes[0].itens[0].g = -5; expect(erros(e)[0]).toMatch(/cardapios\.A\.refeicoes\[1\]\.itens\[1\]\.g/);
  });
});

describe("avisos que deixam começar", () => {
  it("macros declarados longe da soma, meta distante, ação e ficha desconhecidas", () => {
    const o = copia();
    o.cardapios.A.refeicoes[0].macros.kcal = 90;
    o.metas.kcal = 3000;
    o.receitas[1].passos[0].acao = "flambar";
    o.receitas[2].passos[0].detalhe = "Pique {jilo}.";
    delete o.alimentos[3].compra;
    const r = validarDieta(o);
    expect(r.ok).toBe(true);
    const t = r.avisos.join("\n");
    expect(t).toMatch(/declarou 90 kcal, mas os itens somam/);
    expect(t).toMatch(/cardápio A soma \d+ kcal, longe da meta de 3000/);
    expect(t).toMatch(/flambar/);
    expect(t).toMatch(/jilo/);
    expect(t).toMatch(/Sem dados de compra.*Mussarela/);
  });
  it("campos secundários quebrados ganham padrão em vez de travar", () => {
    const o = copia(); o.cozinha = "pequena"; o.pessoa.objetivo = "ficar forte"; delete o.trocas; delete o.roteiros; o.alimentos[0].grupo = 7;
    const r = validarDieta(o);
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.dieta.cozinha.bocas).toBe(4); expect(r.dieta.pessoa.objetivo).toBe("manter"); expect(r.dieta.roteiros.A.etapas).toEqual([]); }
    expect(r.avisos.join(" ")).toMatch(/sem roteiro de preparo/);
  });
});

describe("colar em partes", () => {
  const { receitas, roteiros, trocas, ...base } = copia();
  const bloco = (o: unknown) => "```json\n" + JSON.stringify(o) + "\n```";
  it("2 blocos, como o prompt pede", () => {
    const p1 = receberParte(COLAGEM_VAZIA, bloco({ ...base, trocas }));
    expect(p1.estado).toBe("aguardando");
    expect(p1.mensagem).toMatch(/Parte 1 recebida ✓/);
    const p2 = receberParte(p1.colagem, bloco({ formato: "mise-dieta", parte: 2, receitas, roteiros }));
    expect(p2.estado).toBe("pronta");
    expect(p2.estado === "pronta" && p2.resultado.ok && p2.resultado.dieta).toEqual(D);
  });
  it("várias partes com receitas fatiadas e ultima: true", () => {
    let c = receberParte(COLAGEM_VAZIA, bloco({ ...base, parte: 1 }));
    c = receberParte(c.colagem, bloco({ parte: 2, receitas: receitas.slice(0, 8) }));
    expect(c.estado).toBe("aguardando");
    const repetida = receberParte(c.colagem, bloco({ parte: 2, receitas: receitas.slice(0, 8) }));
    expect(repetida.colagem.partes).toEqual([1, 2]);
    c = receberParte(repetida.colagem, bloco({ parte: 3, receitas: receitas.slice(8) }));
    expect(c.estado).toBe("aguardando");
    c = receberParte(c.colagem, bloco({ parte: 4, ultima: true, roteiros, trocas }));
    expect(c.estado === "pronta" && c.resultado.ok && c.resultado.dieta).toEqual(D);
  });
  it("avisa parte fora de ordem e bloco estranho", () => {
    expect(receberParte(COLAGEM_VAZIA, bloco({ parte: 2, receitas })).mensagem).toMatch(/Cole primeiro a parte 1/);
    const p1 = receberParte(COLAGEM_VAZIA, bloco(base));
    expect(receberParte(p1.colagem, bloco({ parte: 3, roteiros })).mensagem).toMatch(/Faltou a parte 2/);
    expect(receberParte(COLAGEM_VAZIA, '{"oi":1}').estado).toBe("erro");
    const forcada = concluirColagem(p1.colagem);
    expect(!forcada.ok && forcada.erros[0]).toMatch(/cita a receita/);
    expect(concluirColagem(COLAGEM_VAZIA).ok).toBe(false);
  });
  it("dieta inteira num bloco só fica pronta de primeira", () => {
    expect(receberParte(COLAGEM_VAZIA, bloco(bruto)).estado).toBe("pronta");
  });
});

describe("resumo antes de começar", () => {
  it("traz nome, metas e as letras com tema, horários e kcal", () => {
    const r = resumoDieta(D);
    expect(r.nome).toBe("Daniel");
    expect(r.letras.map((l) => l.tema)).toEqual(["Carne", "Frango", "Carne e sardinha"]);
    expect(r.letras[0]!.refeicoes[2]).toMatchObject({ nome: "Almoço", hora: "13:30" });
    expect(r.letras[0]!.kcal).toBeGreaterThan(2100);
  });
});
