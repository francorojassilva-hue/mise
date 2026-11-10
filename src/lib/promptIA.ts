import type { Dieta, Letra } from "./dieta";
import type { PassoPlano } from "./cozinhar";
import { DURACAO_PADRAO, type Bloco } from "./acoes";

export type PassoPrompt = { n: number; tarefa: string; titulo: string; instrucao: string; trilha: string; minutos: number; paralelo: boolean };

export function passosParaPrompt(passos: PassoPlano[], blocos: Bloco[], instrucao: (p: PassoPlano) => string, est: (i: number) => number | null = () => null): PassoPrompt[] {
  return passos.map((p, i) => ({
    n: i + 1, tarefa: p.tarefa, titulo: p.titulo, instrucao: instrucao(p),
    trilha: blocos.find((b) => b.i === i)?.trilha ?? "Montagem",
    minutos: Math.max(1, Math.round((est(i) ?? p.segundos ?? DURACAO_PADRAO) / 60)), paralelo: !!p.paralelo,
  }));
}

export const EQUIP: Record<string, string> = { fogao: "fogão", forno: "forno", microondas: "micro-ondas", airfryer: "airfryer", panela_pressao: "panela de pressão", panela_pressao_eletrica: "panela de pressão elétrica", liquidificador: "liquidificador", mixer: "mixer", sanduicheira: "sanduicheira" };
const HABILIDADE = { iniciante: "Sou iniciante na cozinha: explique sem pressa e sem termo técnico.", basico: "Sei o básico de cozinha.", avancado: "Cozinho bem: pode ir direto ao ponto." } as const;

/** Nome de um equipamento da cozinha, como aparece nos chips e no prompt. */
export const nomeEquipamento = (c: Dieta["cozinha"], e: string) => (e === "fogao" ? `fogão de ${c.bocas} bocas` : EQUIP[e] ?? e.replace(/_/g, " "));

/** Uma frase sobre a cozinha da pessoa, tirada da dieta. */
export function cozinhaEmTexto(d: Dieta) {
  const c = d.cozinha;
  const itens = c.equipamentos.map((e) => nomeEquipamento(c, e));
  const tenho = itens.length ? `tenho ${itens.length > 1 ? `${itens.slice(0, -1).join(", ")} e ${itens.at(-1)}` : itens[0]}` : "tenho uma cozinha simples";
  return `Sobre mim e a cozinha: ${tenho}${c.equipamentos.includes("forno") ? "" : ", não uso forno"}. ${HABILIDADE[c.habilidade]} Divido as porções no olho, sem balança. Quero comida gostosa, não só correta.`;
}

/** Prompt em texto puro para um parceiro de cozinha por voz. */
export function montarPromptIA(d: Dieta, letter: Letra, passos: PassoPrompt[]): string {
  const roteiro = passos.map((p) =>
    `Passo ${p.n} (${p.tarefa}): ${p.titulo}. ${p.instrucao} Equipamento: ${p.trilha}. Duração estimada: ${p.minutos} min. ${p.paralelo ? "Pode rodar em paralelo com o próximo passo." : "Não roda em paralelo."}`).join("\n");
  return [
    `Você vai ser meu parceiro de cozinha hoje, conversando comigo por voz enquanto eu preparo as marmitas da semana (cardápio ${letter}: ${d.cardapios[letter].nome}). Pense num amigo que cozinha muito bem e está do meu lado no fogão: fala de um jeito natural, leve, com bom humor, frases curtas, sem ler listas e sem soar como robô. Nunca leia o roteiro palavra por palavra: entenda cada passo e me explique do seu jeito, como se estivesse me ensinando.`,
    "",
    cozinhaEmTexto(d),
    "",
    "Como conduzir:",
    "- Um passo de cada vez. Antes de começar um passo, diga o que vamos fazer e por quê, em uma ou duas frases.",
    "- Me diga o ponto certo pelos sentidos: cor, cheiro, som, textura (ex.: 'a cebola tem que ficar transparente, não marrom').",
    "- Traga dicas de sabor e de técnica na hora certa: tempero, quando provar, como corrigir sal, como não ressecar a carne, como deixar mais crocante.",
    "- Cuide do tempo por mim: quando algo for cozinhar, pressurizar ou descansar, diga quanto tempo leva, acompanhe, me avise quando faltar uns 2 minutos e quando estiver pronto. Se eu demorar, me lembre do que está no fogo.",
    "- Aproveite os tempos de espera: enquanto algo cozinha, sugira o próximo passo que dá pra adiantar em paralelo, olhando o equipamento e a indicação de paralelo do roteiro. Mas não me sobrecarregue: no máximo duas frentes ao mesmo tempo, a não ser que eu peça.",
    "- Pergunte de vez em quando como está ficando ('provou o tempero?', 'já dourou?') e ajuste as orientações conforme eu responder.",
    "- Só avance quando eu disser que terminei ('feito', 'pronto', 'próximo'). Se eu disser 'repete', explique de novo com outras palavras. 'Voltar' volta. 'Quanto falta' responde o tempo do que está no fogo e do preparo todo. 'Pausa' espera até eu chamar.",
    "- Se algo der errado (queimou, empelotou, ficou sem sal), me acalme e diga como salvar.",
    "- No final, comemore comigo, lembre de esfriar antes de fechar os potes, etiquetar e congelar.",
    "",
    "Roteiro de referência (use como base, não leia em voz alta assim):",
    roteiro,
    "",
    "Para começar, diga só: \"Bora cozinhar? Pronto para começar? Diga 'vamos'.\" e espere.",
  ].join("\n");
}

export async function copiarTexto(t: string) {
  try { await navigator.clipboard.writeText(t); return; } catch { /* tenta o jeito antigo */ }
  const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  const ok = document.execCommand("copy"); ta.remove();
  if (!ok) throw new Error("Não deu pra copiar");
}
