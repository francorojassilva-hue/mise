/**
 * Curiosidades por ingrediente (vindas da v2, sem os itens que eram só do plano do Daniel).
 * Uma por linha: ingrediente|tipo|texto|fonte. Tipo: f fato, m mito, d dica, h história.
 */
export const CURIOSIDADES = `
musculo|f|Músculo é a perna do boi: cheio de colágeno, que no cozimento úmido e longo vira gelatina. Por isso fica macio na panela e duro na grelha.|McGee, On Food and Cooking
musculo|d|Moído 2 vezes, a carne fica mais fina e "pega" melhor o molho. Peça ao açougueiro para tirar a gordura aparente antes de moer.|prática de açougue
musculo|f|O ferro da carne vermelha é do tipo heme, absorvido com bem mais eficiência que o ferro dos vegetais.|NIH ODS — Iron
musculo|f|120 g de músculo cozido trazem quase todo o zinco do dia.|TACO/USDA
musculo|d|Carne amontoada solta água e cozinha no vapor (~100 °C). Em camada fina, sem mexer, passa dos ~140 °C e a reação de Maillard cria cor e sabor.|McGee, On Food and Cooking
frango|f|O Brasil é o maior exportador de carne de frango do mundo.|ABPA — Relatório anual
frango|d|Lavar frango cru espalha bactérias como Salmonella e Campylobacter pela pia e bancada. O cozimento é que elimina.|USDA FSIS / CDC
frango|f|Na panela de pressão a água ferve a ~120 °C em vez de 100 °C. Por isso o frango cozinha em cerca de um terço do tempo.|física da pressão de vapor
frango|f|As fibras do peito são longas e paralelas: puxando com dois garfos em sentidos opostos, elas se separam sozinhas.|anatomia do músculo peitoral
ovo|f|Cozinhar quase dobra o aproveitamento da proteína do ovo: ~91% cozido contra ~51% cru.|Evenepoel et al., J Nutr 1998
ovo|f|O anel esverdeado na gema de ovo cozido demais é sulfeto de ferro: ferro da gema + enxofre da clara. Inofensivo, só passou do ponto.|McGee, On Food and Cooking
ovo|h|Em 2015 as diretrizes alimentares dos EUA deixaram de fixar o limite de 300 mg de colesterol por dia.|Dietary Guidelines for Americans 2015–2020
ovo|d|As proteínas do ovo firmam entre ~62 e 70 °C. Fogo baixo e tirar ainda brilhante = mexido cremoso; fogo alto = borracha que solta água.|McGee, On Food and Cooking
ovo|m|Casca branca ou vermelha? Depende da raça da galinha, não do valor nutricional.|USDA
sardinha|f|Na lata, a espinha da sardinha amolece e vira fonte de cálcio. Amasse junto.|USDA FoodData Central
sardinha|f|Sardinha está na lista de peixes com menos mercúrio ("melhores escolhas").|FDA/EPA — Advice about eating fish
sardinha|f|Uma lata escorrida tem ~800 mg de ômega-3 EPA+DHA: mais de 3 dias da meta de 250 mg.|USDA
sardinha|f|É uma das poucas comidas com vitamina D de verdade, além de muita B12.|NIH ODS — Vitamin D
muss|h|Mozzarella vem do italiano "mozzare", cortar: o gesto de separar pedaços da massa.|Treccani
muss|h|A original é da Campânia, feita com leite de búfala. A de vaca virou a mais comum no mundo.|Consorzio Mozzarella di Bufala Campana
muss|f|Ela estica porque é de "massa filada": a coalhada é esticada em água quente e as caseínas se alinham em fios.|McGee, On Food and Cooking
muss|f|Uma fatia fina (~15 g) tem ~130 mg de cálcio, 13% do dia.|TACO
requeijao|h|O requeijão cremoso de copo é bem brasileiro. Em Portugal, "requeijão" é um queijo fresco mais parecido com ricota.|Embrapa Gado de Leite
requeijao|f|Para ser "light" no Brasil, o produto precisa ter pelo menos 25% menos do nutriente que a versão comum.|Anvisa RDC 54/2012
requeijao|d|No purê, o requeijão faz o papel de manteiga + leite de uma vez: gordura emulsionada e proteína dão a cremosidade.|técnica culinária
ricota|h|"Ricotta" significa "recozida": é feita reaquecendo o soro que sobra de outros queijos.|Treccani
ricota|f|Por vir do soro, a proteína da ricota é da mesma família do whey.|McGee, On Food and Cooking
ricota|d|Batida com banana e whey, a ricota vira mousse sem creme de leite.|técnica culinária
leite|f|Cerca de 65% das pessoas no mundo produzem menos lactase depois da infância.|MedlinePlus (NIH) — Lactose intolerance
leite|f|O leite de caixinha (UHT) é aquecido a ~135–150 °C por poucos segundos. Por isso dura meses fechado.|Embrapa
leite|d|Leite morno no purê mantém a temperatura e deixa mais liso; gelado esfria e empapa.|técnica culinária
leite|f|Um copo (200 ml) tem ~225 mg de cálcio.|TACO
pao|f|Desde 2002 a farinha de trigo no Brasil é obrigatoriamente enriquecida com ferro e ácido fólico. A integral é exceção.|Anvisa RDC 150/2017
pao|f|Para ser "integral" no rótulo, precisa ter ao menos 30% de ingredientes integrais, e mais integral que refinado.|Anvisa RDC 493/2021
pao|f|Fibras e sementes deixam a digestão mais lenta: o pão sustenta mais que o branco.|OMS — carboidratos e fibras
pao|d|Na airfryer, o papel manteiga segura a umidade; abrir no fim deixa a casca crocante.|técnica culinária
aveia|f|A beta-glucana da aveia, 3 g por dia, ajuda a reduzir o colesterol LDL: alegação aprovada na Europa e nos EUA.|EFSA 2010 / FDA 21 CFR 101.81
aveia|f|É o mesmo gel da beta-glucana que engrossa o molho da carne. Por isso a aveia "some".|ciência de alimentos
aveia|f|Aveia não tem glúten, mas costuma se misturar com trigo no processamento.|Celiac Disease Foundation
aveia|f|3 col. sopa (~30 g) dão ~2,7 g de fibra.|TACO
flocao|h|O cuscuz nordestino de milho descende do cuscuz do norte da África, feito de sêmola.|Câmara Cascudo, História da Alimentação no Brasil
flocao|f|Flocos de milho pré-cozidos ficam fora da fortificação obrigatória. Algumas marcas enriquecem por conta própria: confira o rótulo.|Anvisa RDC 150/2017
flocao|h|O milho foi domesticado a partir do teosinto, no México, há ~9 mil anos.|Matsuoka et al., PNAS 2002
flocao|d|Hidratar 5 min antes deixa o cuscuz soltinho: o amido absorve a água antes do vapor.|técnica culinária
banana|f|Botanicamente, a banana é uma baga.|botânica (Musa)
banana|f|As pintinhas marrons são amido virando açúcar. Banana pintadinha = sorvete mais doce.|McGee, On Food and Cooking
banana|f|A banana é levemente radioativa por causa do potássio-40. Totalmente inofensivo.|física (dose equivalente à banana)
banana|f|Verde, ela tem muito amido resistente; madura, esse amido vira açúcar.|ciência de alimentos
laranja|f|A laranja-doce é um híbrido antigo de pomelo com tangerina.|Wu et al., Nature 2018
laranja|f|O Brasil é o maior produtor de laranja e o maior exportador de suco de laranja do mundo.|USDA FAS — Citrus
laranja|f|Uma laranja média cobre ~90% da vitamina C do dia.|TACO
laranja|d|Vitamina C na mesma refeição aumenta a absorção do ferro de ovos e vegetais.|NIH ODS — Iron
maca|h|A maçã de hoje descende de uma macieira selvagem das montanhas do Cazaquistão (Malus sieversii).|Cornille et al., PLoS Genetics 2012
maca|f|Maçã boia: cerca de um quarto do volume dela é ar.|ciência de alimentos
maca|f|Escurece ao cortar porque uma enzima (polifenoloxidase) reage com o ar. Limão retarda.|McGee, On Food and Cooking
maca|d|Boa parte da fibra está na casca: lave e coma com ela.|USDA
abobora|h|Abóboras estão entre as primeiras plantas domesticadas nas Américas: ~10 mil anos atrás, no México.|Smith, Science 1997
abobora|f|O laranja é betacaroteno, que o corpo transforma em vitamina A. Com um pouco de gordura, absorve melhor.|Manual MSD — Vitamina A
abobora|f|A cabotiá (japonesa) é um híbrido de duas espécies de abóbora e virou estrela no Brasil.|Embrapa Hortaliças
abobora|d|3 min no micro-ondas amolecem a casca: o corte fica bem mais seguro.|técnica culinária
batata|h|A batata foi domesticada nos Andes, entre Peru e Bolívia, há milhares de anos.|Centro Internacional da Batata (CIP)
batata|f|Batata cozida e resfriada forma amido resistente, que age como fibra, e ele continua lá mesmo reaquecida.|Maziarz et al., J Food Sci 2017
batata|d|Começar na água fria cozinha por igual, por fora e por dentro.|técnica culinária
batata|d|No liquidificador o purê vira cola: as células rompem e soltam amido demais. Use espremedor ou garfo.|McGee, On Food and Cooking
bdoce|f|Batata-doce não é parente da batata: é da família da ipomeia (corda-de-viola).|botânica (Convolvulaceae)
bdoce|f|Cozinhando devagar ela fica mais doce: uma enzima transforma amido em açúcar entre ~60 e 75 °C.|ciência de alimentos
bdoce|m|Não é "carbo mágico": o índice glicêmico muda muito com o preparo. Cozida é moderado; assada pode passar da batata comum.|Tabelas internacionais de IG (Atkinson et al.)
bdoce|f|As de polpa laranja têm muito betacaroteno; as brancas e roxas comuns no Brasil, bem menos.|Embrapa Hortaliças
seleta|f|Legumes congelados têm vitaminas parecidas, às vezes mais, que os "frescos" guardados 5 dias na geladeira. (Estudo apoiado pela indústria de congelados.)|Li et al., J Food Compos Anal 2017
seleta|f|Antes de congelar, os legumes passam por uma fervura rápida (branqueamento) que desliga enzimas que estragam cor e sabor.|Embrapa
seleta|h|Gregor Mendel descobriu as leis da hereditariedade cruzando ervilhas.|história da genética
seleta|d|Não precisa descongelar: o gelo dos legumes vira o molho da panela.|técnica culinária
cenoura|m|Cenoura dá visão noturna? Foi propaganda britânica na 2ª Guerra para esconder o radar dos caças.|Imperial War Museum / historiadores
cenoura|f|O fundo de verdade: vitamina A corrige a cegueira noturna de quem tem deficiência. Sem deficiência, não melhora a visão.|NIH ODS — Vitamin A
cenoura|h|Cenouras roxas e amarelas eram comuns; a laranja se popularizou com produtores holandeses a partir do século XVII.|World Carrot Museum / historiadores
cenoura|d|Ralada fina, ela solta menos água no lanche e não encharca o pão.|técnica culinária
espinafre|m|O "erro da vírgula" que teria inflado o ferro do espinafre nunca aconteceu: a própria história é um mito.|Sutton, 2010; Rekdal, 2014
espinafre|h|Na tirinha de 1932, Popeye dizia comer espinafre pela vitamina A, não pelo ferro.|Sutton, 2010
espinafre|f|O oxalato do espinafre prende cálcio e ferro e reduz a absorção deles.|NIH ODS — Calcium
espinafre|f|É campeão de vitamina K: 50 g já passam da meta do dia.|USDA
couve|f|Couve, repolho, brócolis e couve-flor são a mesma espécie (Brassica oleracea), selecionada em formas diferentes.|botânica
couve|f|Um punhado (30 g) de couve cobre a vitamina K do dia.|TACO/USDA
couve|d|Cozinhar couve demais libera compostos de enxofre: amarga e cheira. O calor residual de 2 min é o ponto.|McGee, On Food and Cooking
repolho|h|O capitão James Cook levava chucrute (repolho fermentado) nas viagens contra o escorbuto.|história naval
repolho|f|Cru, o repolho tem bastante vitamina C: ~37 mg em 100 g.|TACO
repolho|d|Inteiro, dura semanas na geladeira. Cortado, cubra com filme.|USDA
tomate|h|Em 1893 a Suprema Corte dos EUA decidiu que tomate é "legume" para imposto, embora seja fruto (caso Nix v. Hedden).|Nix v. Hedden, 149 U.S. 304
tomate|f|O licopeno fica mais disponível com cozimento e um pouco de gordura.|ciência de alimentos
tomate|d|Tomate para comer cru perde aroma na geladeira: o frio corta os compostos voláteis.|Zhang et al., PNAS 2016
cebola|f|O choro vem de um gás (syn-propanotial-S-óxido) liberado quando as células são cortadas.|química de alimentos
cebola|d|Faca afiada e cebola gelada = menos lágrima: menos células esmagadas e gás mais lento.|McGee, On Food and Cooking
cebola|f|Transparente = células amolecendo e soltando água. Dourada = açúcares caramelizando.|McGee, On Food and Cooking
alho|f|Amassar e esperar ~10 min antes do calor deixa a alicina se formar; calor imediato desliga a enzima. (Estudo em ratos.)|Song & Milner, J Nutr 2001
alho|f|O cheiro do alho é da alicina e dos compostos de enxofre que nascem dela.|química de alimentos
alho|d|Sacudir os dentes num pote fechado solta a casca pelo atrito.|técnica culinária
limao|f|O "limão" tahiti do Brasil é, botanicamente, uma lima ácida.|Embrapa Mandioca e Fruticultura
limao|d|Ácido demais por muito tempo deixa a superfície do frango farinhenta. 20 min a uma noite é o bastante.|técnica culinária
linhaca|f|A semente inteira passa pelo intestino quase intacta. Triturada, libera ômega-3 e fibras.|Mayo Clinic
linhaca|f|O ômega-3 da linhaça é ALA; o corpo converte pouco dele em EPA e DHA.|NIH ODS — Omega-3
linhaca|d|Triturada oxida rápido: guarde na geladeira em pote fechado.|ciência de alimentos
linhaca|f|Com líquido ela forma uma mucilagem (gel) que engrossa sorvete e creme.|ciência de alimentos
girassol|f|Semente de girassol está entre as maiores fontes de vitamina E: 1 col. sopa ≈ 2,6 mg.|USDA
girassol|f|Só o girassol jovem segue o sol. Adulto, ele para virado para o leste.|Atamian et al., Science 2016
girassol|f|Deficiência de vitamina E por dieta é muito rara em adultos saudáveis.|NIH ODS — Vitamin E
whey|h|Whey é o soro do leite, que por séculos foi descartado na fabricação de queijo.|Embrapa Gado de Leite
whey|f|É rico em leucina, o aminoácido que dá o sinal para a síntese muscular.|ISSN Position Stand — Protein, 2017
whey|d|Fervido, o whey desnatura e empelota. Sempre fora do fogo.|ciência de alimentos
doceleite|f|A cor e o sabor vêm da reação de Maillard entre a lactose e as proteínas do leite.|McGee, On Food and Cooking
doceleite|h|Argentina e Uruguai disputam a invenção, mas doces parecidos existem em vários países.|história da culinária
doceleite|f|1 col. sopa (20 g) ≈ 60 kcal de energia rápida: combina com o pré-treino.|TACO
canela|f|A canela mais comum (cássia) tem cumarina; doses altas todo dia podem afetar o fígado. Pitadas culinárias, tranquilo.|EFSA 2008 — Coumarin
canela|f|A canela-do-ceilão tem bem menos cumarina que a cássia.|BfR (Alemanha)
paprica|h|Szent-Györgyi isolou vitamina C em quantidade usando páprica húngara e ganhou o Nobel de 1937.|Nobel Prize — Medicine 1937
paprica|d|Páprica queima rápido em óleo quente e amarga. Entre com a cebola.|técnica culinária
paprica|f|A defumada vem de pimentões secos na fumaça de lenha, tradição espanhola.|DOP Pimentón de la Vera
colorau|h|O colorau é feito de urucum, semente nativa usada por povos indígenas como tinta corporal.|Embrapa
colorau|f|A cor vem da bixina, um carotenoide, parente do betacaroteno.|química de alimentos
cominho|h|O cominho já era usado no Egito antigo.|história das especiarias
oregano|h|Orégano vem do grego e costuma ser traduzido como "alegria da montanha".|etimologia
louro|h|Na Grécia antiga, coroas de louro premiavam vencedores. Na panela, solta aroma no cozimento longo.|história
sal|f|O sal é iodado no Brasil desde os anos 1950; hoje com 15–45 mg de iodo por kg.|Anvisa RDC 23/2013
cheiro_verde|d|Ervas frescas entram no fim: calor longo apaga o aroma.|técnica culinária
maionese|f|Maionese é uma emulsão: a lecitina da gema mantém óleo e água juntos.|McGee, On Food and Cooking
maionese|d|Congelar quebra a emulsão e a maionese "talha". Por isso prato com maionese só vai à geladeira.|ciência de alimentos
congelar|h|Clarence Birdseye criou o congelamento rápido nos anos 1920 depois de ver inuítes congelando peixe no Ártico.|Smithsonian
congelar|d|Esfriar até 30 min destampado e em porções: comida quente em bloco grande demora a esfriar e fica tempo demais na zona de risco (4–60 °C).|USDA FSIS
congelar|d|Descongelar na geladeira é o método seguro. Na bancada, a parte de fora esquenta antes do centro.|USDA FSIS
airfryer|f|Airfryer não frita: é um mini forno de convecção com ar quente circulando rápido.|engenharia do aparelho
airfryer|d|Filme PVC nunca vai na airfryer: derrete. Papel manteiga pode.|orientação dos fabricantes
cafe|f|A cafeína leva em média ~5 h para cair pela metade no sangue, e isso varia muito de pessoa para pessoa.|EFSA 2015 — Caffeine
creatina|f|A creatina é um dos suplementos mais estudados; 3–5 g/dia, e o horário importa pouco.|ISSN Position Stand, 2017
`;
