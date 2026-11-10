/**
 * Gera src/data/exemplo.json: a dieta de exemplo no formato "mise-dieta" v1.
 * Fonte: os dados da v2 (dados_base.json, receitas.json, regras.json), só com comida,
 * treino e suplementos comuns. Rodar: node scripts/gerar-exemplo.mjs
 */
import { writeFileSync } from "node:fs";

// id|nome|grupo|medida|g|kcal|P|C|G|fibras|descrição da compra|modo|embalagemG|unidade|preço|fator|loja
const ALIMENTOS = `
pao|Pão Nutrella Aveia e Sementes|pao|fatia|25|272|13.6|40|6.4|6|Pão Nutrella Aveia e Sementes|emb|500|pacote|13.9|1|atacado
whey|Whey concentrado morango|suplemento|dosador|20|370|60|26|6|0
ovo|Ovo|proteina|ovo médio|50|146|13.3|0.6|9.5|0|Ovos médios (cartela 30)|emb|1500|cartela|21.9|1|atacado
muss|Mussarela fatiada|laticinio|fatia|15|330|22.6|3|25.2|0|Mussarela fatiada (bandeja 200 g)|emb|200|bandeja|7.5|1|atacado
requeijao|Requeijão light|laticinio|col. sopa|15|143|10|4|9.7|0|Requeijão Light (200 g)|emb|200|pote|8.99|1|atacado
ricota|Ricota light|laticinio|col. sopa|20|110|10|3|6.5|0|Ricota Light (~250 g)|emb|250|peça|8.5|1|atacado
frango|Frango desfiado (cozido)|proteina|col. sopa cheia|22|163|31.5|0|3.2|0|Peito de frango com osso congelado|kg|1000|kg|9.9|1.905|atacado
musculo|Músculo moído (cozido)|proteina|concha|60|194|31.2|0|6.7|0|Músculo bovino moído 2x (açougue)|kg|1000|kg|40|1.429|atacado
sardinha|Sardinha em lata (escorrida)|proteina|lata|84|190|21|1|11|0|Sardinha em lata 125 g|emb|84|lata|5.99|1|atacado
flocao|Flocão de milho|carbo|col. sopa cheia|10|360|7.2|78|1.9|4.7|Flocão de milho (500 g)|emb|500|pacote|3.49|1|atacado
aveia|Aveia em flocos|carbo|col. sopa|10|394|13.9|66.6|8.5|9.1|Aveia em flocos (500 g)|emb|500|pacote|8.9|1|atacado
batata|Batata (cozida)|carbo|xícara de purê|200|52|1.2|11.9|0.1|1.3|Batata|kg|1000|kg|8.69|1.1|hortifruti
abobora|Abóbora cabotiá (cozida)|carbo|xícara de purê|200|48|1.4|10.8|0.7|2.5|Abóbora cabotiá|kg|1000|kg|3.69|1.3|hortifruti
bdoce|Batata-doce (cozida)|carbo|xícara de purê|200|90|1.6|21|0.1|2.8|Batata-doce|kg|1000|kg|3.99|1.25|hortifruti
banana|Banana nanica|fruta|banana média sem casca|80|98|1.3|26|0.1|2|Banana nanica|kg|1000|kg|5.99|1.5|hortifruti
maca|Maçã fuji|fruta|maçã média|130|56|0.3|15.2|0.2|2|Maçã fuji|kg|1000|kg|4.49|1.1|hortifruti
laranja|Laranja pera|fruta|laranja média|150|37|1|8.9|0.1|0.8|Laranja pera|kg|1000|kg|2.99|1.4|hortifruti
leite|Leite integral|laticinio|copo|200|61|3.2|4.6|3.3|0|Leite integral 1 L|emb|1000|caixa|5.29|1|atacado
doceleite|Doce de leite|doce|col. sopa|20|306|5.5|59.5|6|0|Doce de leite (400 g)|emb|400|pote|11.9|1|atacado
maionese|Maionese light|gordura|col. sopa|12|250|0.5|7|24|0|Maionese light (250 g)|emb|250|pote|7.49|1|atacado
cenoura|Cenoura ralada|legume|col. sopa|15|34|1.3|7.7|0.2|3.2|Cenoura|kg|1000|kg|6.19|1.1|hortifruti
tomate|Tomate|legume|tomate médio|100|15|1.1|3.1|0.2|1.2|Tomate|kg|1000|kg|5.99|1.05|hortifruti
cebola|Cebola|tempero|cebola média|100|39|1.7|8.9|0.1|2.2|Cebola|kg|1000|kg|5.99|1.1|hortifruti
couve|Couve-manteiga fatiada|verde|punhado|30|45|2.5|4.5|2.2|3.1|Couve-manteiga fatiada (maço ~200 g)|emb|200|maço|3.99|1.2|hortifruti
repolho|Repolho|verde|col. sopa ralado|20|25|1.3|5.8|0.1|2.5|Repolho (1/4 de cabeça)|kg|1000|kg|3.99|1.15|hortifruti
seleta|Seleta de legumes congelada|legume|xícara|130|65|2.9|13.1|0.2|4.4|Seleta de legumes congelada (1 kg)|emb|1000|pacote|17.9|1|atacado
espinafre|Espinafre congelado|verde|xícara|150|23|3|3.8|0.3|2.4|Espinafre congelado (1 kg)|emb|1000|pacote|22|1|atacado
linhaca|Linhaça dourada triturada|semente|col. sopa|10|534|18.3|28.9|42.2|27.3|Linhaça dourada triturada (200 g)|emb|200|pacote|8.9|1|atacado
girassol|Semente de girassol sem casca|semente|col. sopa|10|582|19.3|24|49.8|9|Semente de girassol sem casca (200 g)|emb|200|pacote|7|1|atacado
oleo|Óleo de soja|gordura|col. sopa|13|884|0|0|100|0
ervilha|Ervilha congelada|legume|xícara|130|78|5.2|14.3|0.3|4.5
brocolis|Brócolis congelado|verde|xícara|90|28|3.1|5.4|0.1|3
abobrinha|Abobrinha|legume|xícara|120|20|1.1|3.3|0.3|1.2
beterraba|Beterraba cozida|legume|xícara|140|32|1.3|7.2|0.1|1.9
morango|Morango|fruta|xícara|150|32|0.7|7.7|0.3|2
mandioca|Mandioca cozida|carbo|xícara|140|125|0.6|30.1|0.3|1.6
arroz|Arroz branco cozido|carbo|col. servir|45|128|2.5|28.1|0.2|1.6
macarrao_int|Macarrão integral cozido|carbo|xícara|140|149|6|30|1.7|3.9
mamao|Mamão|fruta|fatia média|150|40|0.5|10.4|0.1|1
manga|Manga|fruta|xícara em cubos|165|72|0.4|19.4|0.2|1.6
patinho|Patinho moído (cozido)|proteina|concha|60|219|35.9|0|7.3|0
minas|Queijo minas frescal|laticinio|fatia|30|264|17.4|3.2|20.2|0
iogurte|Iogurte natural integral|laticinio|pote|170|51|4.1|1.9|3|0
`;

const alimentos = ALIMENTOS.trim().split("\n").map((l) => {
  const [id, nome, grupo, mn, mg, kcal, P, C, G, fibras, desc, modo, emb, unidade, preco, fator, loja] = l.split("|");
  const a = { id, nome, grupo, medida: { nome: mn, g: +mg }, por100g: { kcal: +kcal, P: +P, C: +C, G: +G, fibras: +fibras } };
  if (desc) a.compra = { descricao: desc, modo, embalagemG: +emb, unidade, preco: +preco, fator: +fator, loja };
  return a;
});

const REFEICOES = [
  { id: "pre", nome: "Pré-treino", hora: "07:00" },
  { id: "cafe", nome: "Café pós-treino", hora: "10:00" },
  { id: "almoco", nome: "Almoço", hora: "13:30" },
  { id: "jantar", nome: "Jantar", hora: "18:30" },
  { id: "lanche", nome: "Doce da noite", hora: "20:30" },
];
const CONGELA = new Set(["almoco", "jantar", "lanche"]);

// refeição: [id, prato, receita, "alimento g medida; ...", [kcal, P, C, G]]
const ref = ([id, prato, receita, itens, m]) => ({
  id, prato, receita, congela: CONGELA.has(id),
  itens: itens.split("; ").map((s) => { const [alimento, g, ...medida] = s.split(" "); return { alimento, g: +g, medida: medida.join(" ") }; }),
  macros: { kcal: m[0], P: m[1], C: m[2], G: m[3] },
});
const PRE_PAO = ["pre", "Pão com doce de leite + banana", null, "pao 25 1 fatia; doceleite 20 1 col. sopa; banana 80 1 banana média sem casca", [208, 6, 43, 3]];

const cardapios = {
  A: { nome: "Carne", tempoPreparo: "~1h20", refeicoes: [
    PRE_PAO,
    ["cafe", "4 ovos mexidos com requeijão + 2 fatias de pão + laranja", "R7", "ovo 200 4 ovos médios; pao 50 2 fatias; requeijao 30 2 col. sopa; laranja 150 1 laranja média", [526, 38, 36, 25]],
    ["almoco", "Escondidinho de carne com seleta e couve (purê de abóbora e batata)", "R5", "musculo 120 2 conchas; seleta 80 ½ xícara; couve 30 1 punhado; aveia 10 1 col. sopa; cebola 15 ¼ cebola média; oleo 4 ¼ col. sopa; abobora 180 1 xícara de purê; batata 125 ½ xícara de purê; leite 30 ¼ copo; muss 15 1 fatia", [598, 51, 56, 20]],
    ["jantar", "Lanche de frango na airfryer + maçã", "R6", "pao 50 2 fatias; frango 110 5 col. sopa cheias; maionese 12 1 col. sopa; cenoura 30 2 col. sopa; muss 15 1 fatia; maca 130 1 maçã média", [478, 46, 43, 14]],
    ["lanche", "Sorvete de banana com whey, linhaça e girassol", "R10", "banana 100 1¼ bananas médias sem casca; whey 40 2 dosadores; leite 50 ¼ copo; linhaca 15 1½ col. sopa; girassol 10 1 col. sopa", [415, 32, 45, 15]],
  ] },
  B: { nome: "Frango", tempoPreparo: "~1h45", refeicoes: [
    ["pre", "Banana na mussarela com aveia", "R13", "muss 30 2 fatias; banana 80 1 banana média sem casca; aveia 10 1 col. sopa", [217, 9, 28, 8]],
    ["cafe", "Vitamina de leite, whey, banana, aveia e linhaça", "R13", "leite 250 1¼ copos; whey 40 2 dosadores; banana 80 1 banana média sem casca; aveia 30 3 col. sopa; linhaca 10 1 col. sopa", [550, 39, 66, 18]],
    ["almoco", "Escondidinho de frango com seleta e espinafre (purê de batata-doce e abóbora)", "R5", "frango 130 6 col. sopa cheias; seleta 100 ¾ xícara; espinafre 50 ¼ xícara; tomate 40 ½ tomate médio; cebola 15 ¼ cebola média; oleo 3 ¼ col. sopa; bdoce 150 ¾ xícara de purê; abobora 100 ½ xícara de purê; requeijao 30 2 col. sopa; muss 15 1 fatia", [602, 56, 62, 15]],
    ["jantar", "Lanche de frango cremoso na airfryer + laranja", "R6", "pao 50 2 fatias; frango 110 5 col. sopa cheias; requeijao 20 1¼ col. sopa; cenoura 30 2 col. sopa; muss 15 1 fatia; laranja 150 1 laranja média", [459, 49, 37, 13]],
    ["lanche", "Creme de ricota com whey e doce de leite", "R11", "ricota 60 3 col. sopa; whey 30 1½ dosadores; doceleite 20 1 col. sopa; banana 40 ½ banana média sem casca; leite 30 ¼ copo; linhaca 10 1 col. sopa; girassol 10 1 col. sopa", [407, 30, 39, 17]],
  ] },
  C: { nome: "Carne e sardinha", tempoPreparo: "~1h", refeicoes: [
    PRE_PAO,
    ["cafe", "Cuscuz + 3 ovos mexidos com mussarela + laranja", "R8", "flocao 40 4 col. sopa cheias; ovo 150 3 ovos médios; muss 15 1 fatia; laranja 150 1 laranja média", [468, 28, 46, 19]],
    ["almoco", "Escondidinho de carne com seleta e espinafre (purê de batata)", "R5", "musculo 120 2 conchas; seleta 120 1 xícara; espinafre 50 ¼ xícara; tomate 40 ½ tomate médio; aveia 15 1½ col. sopa; cebola 15 ¼ cebola média; oleo 4 ¼ col. sopa; batata 200 1 xícara de purê; leite 30 ¼ copo; muss 15 1 fatia", [600, 52, 56, 19]],
    ["jantar", "Sanduíche de sardinha cremosa (sem fogão) + ovo cozido + maçã", "R9", "pao 50 2 fatias; sardinha 84 1 lata; requeijao 20 1¼ col. sopa; cenoura 30 2 col. sopa; repolho 40 2 col. sopa ralado; ovo 50 1 ovo médio; maca 130 1 maçã média", [490, 34, 46, 19]],
    ["lanche", "Mingau de aveia com whey e banana", "R12", "leite 150 ¾ copo; aveia 25 2½ col. sopa; whey 30 1½ dosadores; banana 40 ½ banana média sem casca; girassol 10 1 col. sopa; linhaca 10 1 col. sopa", [452, 31, 47, 18]],
  ] },
};
for (const c of Object.values(cardapios)) c.refeicoes = c.refeicoes.map(ref);

// passo: [título, detalhe, ação, "ingredientes", segundos|0, opções { p: paralelo, m: momento, s: só letras }]
const passo = ([titulo, detalhe, acao, ing = "", seg = 0, o = {}]) => ({
  titulo, detalhe, acao, ingredientes: ing ? ing.split(" ") : [],
  ...(seg ? { segundos: seg } : {}), ...(o.p ? { paralelo: true } : {}), ...(o.m ? { momento: o.m } : {}), ...(o.s ? { so: o.s.split("") } : {}),
});
const receita = (id, nome, porcoes, passos, extra = {}) => ({ id, nome, porcoes, ...extra, passos: passos.map(passo) });
const H = { m: "na_hora" }, S = { m: "servir" };

const receitas = [
  receita("R0", "Temperos da casa", null, [
    ["Solte a casca do alho", "Separe os dentes de 2 cabeças de alho (~100 g), ponha num pote com tampa e sacuda forte por 20 s: a casca solta.", "misturar", "alho", 20],
    ["Bata a pasta de alho", "Mixer ou liquidificador: o alho + 1 col. sopa de sal + 3 col. sopa de óleo. Pulse 30–40 s raspando as laterais até virar pasta.", "liquidificador", "alho sal"],
    ["Guarde na geladeira", "Pote de vidro com tampa, até 2 semanas. Sempre colher limpa e seca.", "geladeira", "alho"],
    ["Monte o mix seco vermelho", "Num pote: 3 col. sopa de páprica defumada, 2 de colorau, 1 de cominho, 1 de orégano e 1 col. chá de pimenta-do-reino. Tampe e sacuda. Rende ~8 col. sopa e dura 1 mês no armário.", "misturar", "paprica colorau cominho oregano"],
    ["Regra de ouro", "Por kg de carne ou frango: 1 col. sopa de pasta de alho + 1 col. chá de mix seco. Sal extra só depois de provar: a pasta já tem sal.", "polvilhar", "sal"],
  ]),
  receita("R1", "Frango desfiado na panela de pressão elétrica", null, [
    ["Lave as mãos e escorra", "Abra a embalagem na pia, escorra o líquido e ponha o frango numa tigela grande. Não lave o frango: espalha bactérias pela pia.", "lavar", "frango"],
    ["Marine", "Para cada 1 kg: 1 col. sopa de pasta de alho, suco de 1 limão, 1 col. chá de mix seco e ½ col. chá de pimenta. Esfregue em todos os pedaços e deixe 20 min (ou de um dia para o outro, tampado, na geladeira). Lave as mãos.", "marinar", "frango limao alho", 1200],
    ["Pique a cebola", "Enquanto marina: 1 cebola média por kg, em cubinhos.", "cortar", "cebola"],
    ["Refogue a cebola", "Panela elétrica em Refogar/Dourar. Espere 2 min, 1 col. sopa de óleo e a cebola; mexa 3 min até ficar transparente.", "refogar", "cebola", 180],
    ["Frango + água + louro", "Junte o frango com toda a marinada, 2 folhas de louro e 1 xícara de água por kg. Não passe de ⅔ da panela. Cancele o Refogar.", "montar", "frango louro"],
    ["Pressão: 15 min", "Tampe, trave, válvula em vedar. 15 min em pressão alta (25 min se congelado). A panela trabalha sozinha: siga para a próxima tarefa.", "pressao", "frango", 900, { p: 1 }],
    ["Solte o vapor com cuidado", "Quando apitar, deixe a pressão sair sozinha 10 min. Depois vire a válvula com uma colher de pau, rosto longe. Abra só quando o pino baixar.", "soltar_vapor", "", 600],
    ["Tire para a assadeira", "Pedaços com escumadeira para uma assadeira; o caldo fica na panela. Espere 5–10 min até dar para pegar.", "esfriar", "", 420],
    ["Desfie", "Dois garfos puxando em sentidos opostos (ou mãos de luva). Osso, pele e cartilagem: descarte.", "desfiar", "frango"],
    ["Seque no caldo", "Volte o desfiado para a panela com ½ concha de caldo por kg, Refogar 3–5 min mexendo até absorver. Prove o sal, desligue e misture 2 col. sopa de cheiro-verde.", "refogar", "frango cheiro_verde", 240],
  ], { vespera: "Passe {frango:cru} do freezer para a geladeira, dentro de um pote (descongela em ~24 h). Esqueceu? Cozinhe congelado com +10 min de pressão." }),
  receita("R2", "Carne com legumes (panela 1 de A e C)", "almoco", [
    ["Prepare a bancada", "Tire {musculo:cru} da geladeira 15 min antes. Pique {cebola} (no C, também {tomate} sem sementes).", "cortar", "cebola tomate"],
    ["Aqueça a panela vazia", "A maior panela, vazia, em fogo alto por 2 min. Depois 1 col. sopa de óleo.", "ferver", "", 120],
    ["Doure sem mexer", "Metade da carne em camada fina e NÃO mexa por 2 min: ela doura em vez de cozinhar no vapor. Quebre com a colher e mexa até secar e ficar marrom (5 min). Repita com a outra metade.", "dourar", "musculo", 420],
    ["Tempere", "Fogo médio. Junte a cebola, 1½ col. sopa de pasta de alho e 1½ col. chá de mix seco. Mexa 3 min.", "refogar", "cebola alho paprica", 180],
    ["Legumes direto do pacote", "Despeje {seleta} ainda congelada (no C, junte também o tomate e {espinafre} congelado). Mexa, tampe e cozinhe 8 min mexendo na metade: o gelo dos legumes vira o molho.", "cozinhar_tampado", "seleta espinafre tomate", 480],
    ["Aveia para engrossar", "Destampe, polvilhe {aveia} e mexa 2 min até o molho engrossar.", "polvilhar", "aveia", 120],
    ["Couve no calor da panela", "Desligue o fogo, junte {couve} fatiada e misture: o calor cozinha a couve em 2 min sem amargar.", "misturar", "couve", 120, { s: "A" }],
    ["Prove o sal", "Acerte o sal. Panela 1 pronta.", "misturar"],
  ], { so: ["A", "C"] }),
  receita("R3", "Frango com legumes (panela 1 de B)", "almoco", [
    ["Refogue a cebola", "Panela grande em fogo médio, 1 col. sopa de óleo e {cebola} picada por 3 min.", "refogar", "cebola", 180],
    ["Tomate até desmanchar", "Junte {tomate} picado e cozinhe 4 min amassando com a colher.", "refogar", "tomate", 240],
    ["Legumes congelados", "Despeje {seleta} e {espinafre} direto do pacote. Tampe e cozinhe 8 min mexendo na metade.", "cozinhar_tampado", "seleta espinafre", 480],
    ["Frango + caldo", "Junte {frango} desfiado e ½ xícara do caldo. Mexa 3 min até ficar úmido e sem água no fundo. Prove o sal.", "misturar", "frango", 180],
  ], { so: ["B"] }),
  receita("R4", "Purê (panela 2)", "almoco", [
    ["Corte a abóbora", "Lave a casca; se estiver dura, 3 min no micro-ondas. Corte ao meio com a faca bem apoiada, tire as sementes, descasque e corte {abobora:cru} em cubos de 3 cm.", "cortar", "abobora", 0, { s: "AB" }],
    ["Descasque e corte", "Descasque {batata:cru} (A e C) ou {bdoce:cru} (B) e corte em cubos de 3 cm.", "descascar", "batata bdoce"],
    ["Água fria + sal", "Cubos de batata (ou batata-doce) na panela grande, água fria 2 dedos acima, 1 col. chá de sal. Fogo alto até ferver, depois médio.", "ferver", "batata bdoce sal"],
    ["Abóbora depois", "Depois de 5 min fervendo, junte a abóbora (cozinha mais rápido). Mais 12–15 min: pronto quando o garfo entra sem resistência.", "ferver", "abobora", 900, { p: 1 }],
    ["Escorra e seque", "Escorra muito bem. Volte à panela em fogo baixo 1 min, mexendo, para secar a água (purê aguado fica sem gosto).", "escorrer", "", 60],
    ["Amasse quente", "Desligue e amasse ainda quente com espremedor ou garfo (liquidificador deixa o purê com textura de cola).", "amassar", "batata"],
    ["Cremosidade", "Junte {leite} morno (A e C) ou {requeijao} (B) e mexa até ficar cremoso. Acerte o sal.", "misturar", "leite requeijao"],
  ]),
  receita("R5", "Montagem dos escondidinhos", "almoco", [
    ["Potes enfileirados", "Alinhe {porcoes} potes de 750 ml na bancada.", "montar"],
    ["Panela 1 no fundo", "Divida a panela 1 igualmente no fundo dos potes: uma colherada em cada, rodando até acabar.", "montar"],
    ["Purê por cima", "Divida o purê do mesmo jeito e alise com as costas da colher.", "montar"],
    ["Mussarela", "Uma fatia de mussarela em cima de cada pote.", "montar", "muss"],
    ["Esfrie e congele", "Esfrie destampado até 30 min, tampe, etiquete com letra e dia e leve ao freezer.", "congelar", "congelar", 1800],
    ["Para comer", "Na noite anterior, passe para a geladeira. Micro-ondas 4–5 min com a tampa apoiada, sem travar.", "microondas", "", 270, S],
  ]),
  receita("R6", "Lanches de frango para airfryer (jantar A e B)", "jantar", [
    ["Frango cremoso", "Numa tigela, misture {frango} com {requeijao}.", "misturar", "frango requeijao", 0, { s: "B" }],
    ["Papéis cortados", "Bancada limpa e seca. Um quadrado de papel manteiga (~30 × 30 cm) e um de filme por lanche.", "cortar"],
    ["Monte os lanches", "A: 2 fatias de pão, ½ col. sopa de maionese light em cada, 5 col. sopa cheias de frango, 2 col. sopa de cenoura ralada fina, 1 fatia de mussarela. B: 2 fatias de pão, 6 col. sopa do frango cremoso, 2 col. sopa de cenoura, 1 fatia de mussarela. Feche e aperte com a palma.", "montar", "pao frango cenoura muss maionese"],
    ["Embrulhe duplo", "Papel manteiga como presente e, por fora, filme bem justo.", "embrulhar"],
    ["Congele deitado", "Etiquete e congele deitado. Dura 2 meses.", "congelar", "congelar"],
    ["Para comer", "Tire o filme, mantenha o papel manteiga. Airfryer 170 °C: 8 min descongelado ou 14 min congelado, virando na metade; abra o papel nos últimos 3 min.", "airfryer", "airfryer", 480, S],
  ], { so: ["A", "B"] }),
  receita("R7", "Ovos", "jantar", [
    ["Bata os ovos", "Mexidos (A: 4; C: 3): quebre numa tigela, 1 pitada de sal, bata com garfo 30 s.", "misturar", "ovo", 30, H],
    ["Fogo baixo", "Frigideira antiaderente em fogo baixo, sem óleo (ou ½ col. chá).", "frigideira", "", 0, H],
    ["Empurre devagar", "Despeje, espere 20 s e empurre das bordas para o centro, devagar, por 2–3 min.", "frigideira", "ovo", 150, H],
    ["Tire brilhante", "Desligue ainda brilhantes: terminam no calor da frigideira. A: misture 1 col. sopa de requeijão. C: rasgue 1 fatia de mussarela por cima e tampe 30 s.", "frigideira", "ovo requeijao muss", 30, H],
    ["Água fervendo", "Cozidos (C, {porcoes} de uma vez): panela média com água para cobrir, fogo alto.", "ferver", "", 0, { s: "C" }],
    ["10 minutos", "Ferveu: baixe os ovos com escumadeira, um a um. 10 min em fervura baixa.", "ferver", "ovo", 600, { s: "C", p: 1 }],
    ["Choque frio", "Tigela com água fria por 5 min. Guarde com casca na geladeira: 7 dias.", "esfriar", "ovo", 300, { s: "C" }],
  ]),
  receita("R8", "Cuscuz no micro-ondas (café C)", "cafe", [
    ["Saquinhos do flocão", "No dia do preparo: {porcoes} saquinhos com 4 col. sopa cheias de flocão (40 g) e 1 pitada de sal.", "montar", "flocao"],
    ["Hidrate 5 min", "De manhã: 1 saquinho numa tigela funda + 4 col. sopa de água, misture e espere 5 min (faça os ovos nesse tempo).", "esperar", "flocao", 300, H],
    ["Micro-ondas", "Tampe com um prato, 1½–2 min. Solte com garfo.", "microondas", "", 105, H],
  ], { so: ["C"] }),
  receita("R9", "Sanduíche de sardinha cremosa (jantar C, sem fogão)", "jantar", [
    ["Abra e escorra", "Abra a lata e escorra o óleo na pia segurando com a tampa.", "abrir_lata", "sardinha"],
    ["Amasse com espinha", "Numa tigela, amasse com garfo; a espinha é mole e vai junto: é cálcio.", "amassar", "sardinha"],
    ["Cremosa", "Misture 1 col. sopa de requeijão light, gotas de limão e pimenta.", "misturar", "requeijao limao"],
    ["Monte", "Numa fatia de pão, a sardinha; por cima 2 col. sopa de cenoura e de repolho ralados e 1 ovo cozido em rodelas. Feche.", "montar", "pao cenoura repolho ovo"],
    ["Para a rua", "Monte em casa, embrulhe em papel alumínio e leve na bolsa térmica com gelo.", "embrulhar", "", 0, S],
  ], { so: ["C"] }),
  receita("R10", "Sorvete de banana (doce A)", "lanche", [
    ["Congele as bananas", "Véspera: descasque {banana:cru} bem maduras (com pintinhas), rodelas de 1 cm, sobre papel manteiga numa assadeira, freezer por pelo menos 2 h.", "congelar", "banana", 0, { m: "vespera" }],
    ["Bata em 2 levas", "Cada leva: metade das bananas + metade de {whey} + metade de {leite} + metade de {linhaca} + metade de {girassol}.", "liquidificador", "banana whey linhaca girassol"],
    ["Até virar creme", "Pulse e raspe as laterais 2–3 min. Travou? Leite de 1 em 1 col. sopa.", "liquidificador", "", 150],
    ["Potinhos no freezer", "Divida em {porcoes} potinhos, tampe e congele. Para comer, tire 10–15 min antes.", "congelar", "congelar"],
  ], { so: ["A"] }),
  receita("R11", "Creme de ricota (doce B)", "lanche", [
    ["Tudo no liquidificador", "{ricota}, {whey}, {doceleite}, {banana}, {leite}, {linhaca}, {girassol} e 1 col. chá de canela.", "liquidificador", "ricota whey doceleite canela"],
    ["Bata até ficar liso", "1–2 min, raspando as laterais.", "liquidificador", "", 90],
    ["Potinhos no freezer", "Divida em {porcoes} potinhos e congele. Na véspera, para a geladeira: vira mousse gelado.", "congelar", "congelar"],
  ], { so: ["B"] }),
  receita("R12", "Mingau de aveia (doce C)", "lanche", [
    ["Saquinhos secos", "No dia do preparo: {porcoes} saquinhos com 2½ col. sopa de aveia, 1 col. sopa de linhaça e 1 col. sopa de girassol.", "montar", "aveia linhaca girassol"],
    ["Micro-ondas 1+1 min", "À noite, tigela grande (o mingau sobe): ¾ copo de leite + ¼ copo de água + 1 saquinho. 1 min, mexa, mais 1 min.", "microondas", "leite aveia", 120, H],
    ["Whey fora do fogo", "Espere 1 min e misture 1½ dosador de whey (sem ferver, senão empelota), ½ banana em rodelas e canela.", "misturar", "whey banana canela", 60, H],
  ], { so: ["C"] }),
  receita("R13", "Vitamina e banana na mussarela (B)", "cafe", [
    ["Kits da vitamina", "No dia do preparo: {porcoes} saquinhos com 3 col. sopa de aveia + 1 col. sopa de linhaça; congele {porcoes} bananas em rodelas, uma por saquinho.", "montar", "aveia linhaca banana"],
    ["Bata 40 s", "De manhã: 250 ml de leite gelado, 2 dosadores de whey, 1 saquinho de aveia e 1 de banana. Rua: garrafa térmica com 2 cubos de gelo, tome em até 2 h.", "liquidificador", "leite whey", 40, H],
    ["Queijo na frigideira", "Pré-treino: frigideira antiaderente, fogo médio, sem óleo. 2 fatias de mussarela lado a lado (sobrepondo 1 cm), ~1 min até derreter e dourar as bordas.", "frigideira", "muss", 60, H],
    ["Banana e dobra", "1 banana em rodelas no centro, canela, dobre como pastel, mais 30 s. No prato, 1 col. sopa de aveia por cima.", "frigideira", "banana canela", 30, H],
  ], { so: ["B"] }),
  receita("R14", "Salada de repolho (opcional, 5 dias)", null, [
    ["Fatie fino", "¼ de repolho bem fino com faca afiada (ou lado grosso do ralador). Rale 2 cenouras.", "ralar", "repolho cenoura"],
    ["Tempere no pote", "Pote grande: repolho, cenoura, suco de 2 limões, 1 col. sopa de óleo, ½ col. chá de sal. Tampe e sacuda.", "misturar", "limao"],
    ["Geladeira", "Sirva 3–4 col. sopa ao lado da marmita ou dentro do sanduíche.", "geladeira"],
  ]),
];

const etapas = (linhas) => linhas.map(([minuto, tarefa, rec, passos]) => ({ minuto, tarefa, receita: rec, ...(passos ? { passos } : {}) }));
const roteiros = {
  A: { tempo: "~1h20", vespera: ["Passe {frango:cru} para a geladeira (+0,4 kg se for repor 2 coringas)", "Congele {banana@lanche:cru} maduras em rodelas (R10 passo 1)"], etapas: etapas([
    [0, "Separe potes, potinhos, papel manteiga, filme e etiquetas; R0 se acabou", "R0"],
    [5, "Marine o frango", "R1", [1, 3]],
    [10, "Abóbora e batata no fogo (panela 2)", "R4", [1, 4]],
    [25, "Frango na panela elétrica (trabalha sozinha ~25 min)", "R1", [4, 7]],
    [30, "Panela 1: carne com seleta, aveia e couve", "R2"],
    [45, "Termine o purê com leite", "R4", [5, 7]],
    [50, "Monte os escondidinhos", "R5"],
    [60, "Desfie o frango e rale a cenoura", "R1", [8, 10]],
    [70, "Monte os lanches (+ coringas)", "R6"],
    [80, "Sorvete; tudo para o freezer", "R10", [2, 4]],
  ]) },
  B: { tempo: "~1h45 (≈1 h de mão na massa)", vespera: ["Passe {frango:cru} para a geladeira (+0,4 kg se for repor 2 coringas)", "Congele {banana@cafe:cru} em rodelas, uma por saquinho (R13)"], etapas: etapas([
    [0, "Separe potes, potinhos, papéis, saquinhos zip e etiquetas; R0 se precisar", "R0"],
    [5, "Marine o frango em 2 tigelas (uma por leva)", "R1", [1, 3]],
    [10, "Batata-doce e abóbora no fogo (panela 2)", "R4", [1, 4]],
    [25, "Leva 1 na panela elétrica", "R1", [4, 7]],
    [30, "Saquinhos de aveia e linhaça da vitamina", "R13", [1, 1]],
    [40, "Termine o purê com requeijão", "R4", [5, 7]],
    [50, "Desfie a leva 1; leva 2 na panela elétrica", "R1", [8, 10]],
    [75, "Desfie a leva 2; separe o frango do almoço e dos lanches", "R1", [8, 10]],
    [80, "Panela 1: frango com seleta, espinafre e tomate", "R3"],
    [95, "Monte escondidinhos e lanches cremosos", "R5"],
    [105, "Creme de ricota; tudo para o freezer", "R11"],
  ]) },
  C: { tempo: "~1h", vespera: ["Nada: a carne pode ser comprada no dia"], etapas: etapas([
    [0, "Separe potes, saquinhos zip e etiquetas; R0 se precisar", "R0"],
    [5, "Batata no fogo (panela 2) e água para os ovos na panela média", "R4", [2, 4]],
    [15, "Panela 1: carne com seleta, espinafre, tomate e aveia", "R2"],
    [20, "Ovos cozidos 10 min + choque frio", "R7", [5, 7]],
    [35, "Termine o purê com leite", "R4", [5, 7]],
    [40, "Monte os escondidinhos", "R5"],
    [50, "Saquinhos de flocão e do mingau; ovos com casca na geladeira", "R8", [1, 1]],
    [55, "Opcional: salada de repolho (separe repolho e cenoura para os sanduíches)", "R14"],
  ]) },
};

const dieta = {
  formato: "mise-dieta",
  versao: 1,
  pessoa: {
    nome: "Daniel", sexo: "m", idade: 31, alturaCm: 175, pesoKg: 82, atividade: 1.55, objetivo: "recomposicao", seguranca: "ok",
    gostos: ["ama ovos mexidos com requeijão ou mussarela", "forte queda por doce", "pão Nutrella é inegociável", "não pesa comida: tudo em medida caseira", "marmitas congeladas, descongela na véspera", "refeições portáteis"],
    naoCome: ["fígado", "feijão"], doce: "todo_dia", alergias: [], restricoes: ["sem chocolate à noite", "não comer perto de dormir"], observacoes: "",
  },
  habitos: { acordar: "06:45", dormir: "23:00", levaComida: true, foraDeCasa: [], treino: { faz: true, tipo: "musculação", dias: [0, 1, 2, 3, 4], hora: "08:00" } },
  metas: { kcal: 2200, P: 160, C: 231, G: 75, fibras: 32 },
  refeicoes: REFEICOES,
  rotina: [
    { hora: "07:30", texto: "Intra: pré-treino meia dose em 400 ml de água + creatina 3–5 g", tipo: "suplemento" },
    { hora: "08:00", texto: "Treino (até ~09:15) + 500 ml de água", tipo: "treino" },
    { hora: "21:00", texto: "Passar as refeições de amanhã do freezer para a geladeira", tipo: "lembrete" },
    { hora: "23:00", texto: "Dormir", tipo: "sono" },
  ],
  suplementos: [
    { nome: "Whey concentrado morango", dose: "conforme cardápio (dosador ≈ 20 g)", obs: "entra nas receitas" },
    { nome: "Creatina", dose: "3–5 g/dia", obs: "horário livre; junto do intra" },
    { nome: "Pré-treino", dose: "meia dose", obs: "cafeína: somar com o café; até 200 mg por vez e 400 mg/dia para adultos saudáveis (EFSA)" },
    { nome: "Ômega-3 (cápsula)", dose: "1 cápsula ~300 mg EPA+DHA", obs: "opcional; no C a sardinha já cobre" },
    { nome: "Multivitamínico", dose: "conforme rótulo", obs: "opcional: a comida cobre quase tudo, exceto vitamina D e E" },
  ],
  cozinha: { equipamentos: ["fogao", "microondas", "airfryer", "panela_pressao_eletrica", "liquidificador", "mixer"], bocas: 4, freezerMarmitas: 21, habilidade: "basico", diaPreparo: "domingo", tempoMaxMin: 120, congela: true, lanchesEmLote: true },
  mercado: { orcamentoSemanal: 250, lojas: [
    { id: "atacado", nome: "Atacado", uso: "carne, frango, ovos, laticínios, congelados e despensa" },
    { id: "hortifruti", nome: "Hortifrúti", uso: "frutas, legumes e reposição" },
  ] },
  pessoaExtra: null,
  cardapios,
  alimentos,
  receitas,
  roteiros,
  trocas: {
    grupos: {
      proteina: ["musculo", "patinho", "frango", "sardinha", "ovo"], carbo_pure: ["batata", "abobora", "bdoce", "mandioca"], carbo_cafe: ["pao", "flocao", "aveia"], carbo_extra: ["arroz", "macarrao_int"],
      fruta: ["banana", "laranja", "maca", "mamao", "manga", "morango"], verde: ["couve", "espinafre", "brocolis", "repolho"], legume: ["seleta", "ervilha", "cenoura", "abobrinha", "beterraba", "tomate"],
      laticinio_cremoso: ["requeijao", "ricota", "iogurte"], queijo: ["muss", "minas"], semente: ["linhaca", "girassol"],
    },
    proibidos: ["figado", "feijao", "chocolate à noite", "soja (proteína)"],
  },
  coringas: [
    { id: "lanche_extra", nome: "Lanche de frango extra (freezer)", kcal: 430, P: 45, custo: 4.5, obs: "mesmo do jantar A; airfryer ou micro-ondas" },
    { id: "salada_macarrao", nome: "Salada de macarrão com frango, azeitona e passas", kcal: 520, P: 35, custo: 5.5, obs: "geladeira até 4 dias; não congela" },
    { id: "sardinha_rua", nome: "Sanduíche de sardinha (R9) na bolsa térmica", kcal: 400, P: 30, custo: 7, obs: "até 4 h na bolsa com gelo" },
  ],
  extrasSemana: [{ descricao: "Alho, limão e cheiro-verde", quantidade: "1 cabeça, 4 limões, 1 maço", preco: 7, loja: "hortifruti" }],
  primeiraCompra: [
    ["Sal", "1 kg", 3], ["Pimenta-do-reino moída", "1 pote", 5], ["Páprica defumada", "1 pote", 6], ["Cominho em pó", "1 pote", 5], ["Orégano", "1 pote", 4], ["Colorau", "1 pote", 3],
    ["Louro em folha", "1 pacote", 3], ["Canela em pó", "1 pote", 5], ["Óleo de soja", "900 ml", 8],
    ["Potes 750 ml com tampa (micro-ondas e freezer)", "7", 30], ["Potinhos 250 ml com tampa (doces)", "7", 20], ["Papel manteiga", "1 rolo", 8],
    ["Filme PVC (só freezer, nunca na airfryer)", "1 rolo", 8], ["Saquinhos zip para freezer", "1 pacote", 10], ["Bolsa térmica + 2 gelos reutilizáveis", "1 kit", 40],
  ].map(([descricao, quantidade, preco]) => ({ descricao, quantidade, preco })),
  seguranca: [
    "Esfriar destampado até 30 min, depois tampar e congelar; nada mais de 2 h fora da geladeira", "Descongelar sempre na geladeira (véspera)", "Reaquecer até sair vapor por igual",
    "Filme PVC só no freezer; tirar antes da airfryer (papel manteiga pode ir)", "Não lavar frango cru", "Salada de macarrão com maionese não congela",
  ],
};

writeFileSync(new URL("../src/data/exemplo.json", import.meta.url), JSON.stringify(dieta, null, 1) + "\n");
console.log(`exemplo.json: ${alimentos.length} alimentos, ${receitas.length} receitas`);
