import { useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, Copy, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { ColarDieta } from "./ColarDieta";
import { MiseButton } from "./MiseButton";
import { restaurarBackup } from "@/lib/backup";
import { concluirOnboarding, definirRefeicoes, irParaEtapa, useOnboarding, type Etapa } from "@/lib/onboarding";
import { comQuantidade, horaValida, MAX_REFEICOES, MIN_REFEICOES, montarPromptEntrevista, numerarRefeicoes, refeicoesValidas, type RefeicaoEscolhida } from "@/lib/promptEntrevista";
import { copiarTexto } from "@/lib/promptIA";
import { cn, lerTexto } from "@/lib/utils";

const IAS = [
  ["Gemini", "https://gemini.google.com"],
  ["ChatGPT", "https://chatgpt.com"],
  ["Claude", "https://claude.ai"],
] as const;

function Passo({ etapa, titulo, children, voltar }: { etapa: Etapa; titulo: string; children: ReactNode; voltar?: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {voltar && (
          <MiseButton aria-label="Voltar" onClick={voltar} className="grid size-11 place-items-center rounded-full">
            <ArrowLeft className="size-5" />
          </MiseButton>
        )}
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground">Passo {etapa + 1} de 4</p>
          <h2 className="text-2xl font-extrabold">{titulo}</h2>
        </div>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full", i <= etapa ? "bg-primary" : "bg-muted")} />
        ))}
      </div>
      {children}
    </div>
  );
}

function BoasVindas() {
  const arquivo = useRef<HTMLInputElement>(null);
  return (
    <Passo etapa={0} titulo="Bem-vindo ao Mise">
      <p className="text-base">Sua comida da semana, do mercado ao prato, num lugar só. Nada de login: tudo fica guardado neste aparelho.</p>
      <p className="text-sm text-muted-foreground">Para montar a sua dieta, uma IA (Gemini, ChatGPT ou Claude) faz uma entrevista rápida com você e entrega um arquivo que você cola aqui.</p>
      <div className="space-y-3">
        <MiseButton onClick={() => irParaEtapa(1)} className="btn-vivid w-full font-bold">
          Criar minha dieta com IA
        </MiseButton>
        <MiseButton onClick={concluirOnboarding} className="glass w-full font-bold">
          Usar a dieta de exemplo
        </MiseButton>
        <MiseButton onClick={() => arquivo.current?.click()} className="mx-auto block text-xs font-semibold text-muted-foreground underline">
          Já tenho um backup do Mise
        </MiseButton>
        <input
          ref={arquivo}
          type="file"
          accept="application/json,.json,text/plain"
          className="hidden"
          data-testid="backup-inicial"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            const r = await restaurarBackup(await lerTexto(f));
            if (!r.ok) return void toast.error(r.erro);
            toast.success("Backup restaurado");
            concluirOnboarding();
          }}
        />
      </div>
    </Passo>
  );
}

function Refeicoes() {
  const { refeicoes } = useOnboarding();
  const [lista, setLista] = useState<RefeicaoEscolhida[]>(refeicoes);
  const mudar = (i: number, campo: Partial<RefeicaoEscolhida>) => setLista((l) => l.map((r, k) => (k === i ? { ...r, ...campo } : r)));
  const valida = refeicoesValidas(lista);
  return (
    <Passo etapa={1} titulo="Suas refeições" voltar={() => irParaEtapa(0)}>
      <p className="text-sm text-muted-foreground">Quantas refeições você faz por dia? Ajuste os nomes e os horários do seu jeito.</p>
      <div className="glass flex items-center justify-between p-3">
        <span className="font-semibold">Refeições por dia</span>
        <div className="flex items-center gap-3">
          <MiseButton aria-label="Menos uma refeição" disabled={lista.length <= MIN_REFEICOES} onClick={() => setLista((l) => comQuantidade(l, l.length - 1))} className="glass grid size-11 place-items-center rounded-full">
            <Minus className="size-4" />
          </MiseButton>
          <span className="w-6 text-center text-xl font-extrabold tabular-nums" aria-live="polite">
            {lista.length}
          </span>
          <MiseButton aria-label="Mais uma refeição" disabled={lista.length >= MAX_REFEICOES} onClick={() => setLista((l) => comQuantidade(l, l.length + 1))} className="glass grid size-11 place-items-center rounded-full">
            <Plus className="size-4" />
          </MiseButton>
        </div>
      </div>
      <div className="space-y-2">
        {lista.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_7.5rem] gap-2">
            <input aria-label={`Nome da refeição ${i + 1}`} value={r.nome} onChange={(e) => mudar(i, { nome: e.target.value })} className="min-h-11 rounded-xl bg-muted px-3 font-bold" />
            <input aria-label={`Horário da refeição ${i + 1}`} type="time" value={r.hora} onChange={(e) => mudar(i, { hora: e.target.value })} className={cn("min-h-11 rounded-xl bg-muted px-3 font-bold", !horaValida(r.hora) && "ring-2 ring-destructive")} />
          </div>
        ))}
      </div>
      <MiseButton
        disabled={!valida}
        onClick={() => {
          definirRefeicoes(numerarRefeicoes(lista));
          irParaEtapa(2);
        }}
        className="btn-vivid w-full font-bold"
      >
        Continuar
      </MiseButton>
    </Passo>
  );
}

function CopiarPrompt() {
  const { refeicoes } = useOnboarding();
  const [copiado, setCopiado] = useState(false);
  return (
    <Passo etapa={2} titulo="Entrevista com a IA" voltar={() => irParaEtapa(1)}>
      <p className="text-base">Copie o prompt, cole numa IA e responda as perguntas (12 a 15 minutos). No fim, ela gera a sua dieta.</p>
      <p className="text-sm text-muted-foreground">Funciona no Gemini, no ChatGPT e no Claude. O prompt já leva as suas {refeicoes.length} refeições.</p>
      <MiseButton
        onClick={async () => {
          try {
            await copiarTexto(montarPromptEntrevista(refeicoes));
            setCopiado(true);
            toast.success("Prompt copiado");
          } catch {
            toast.error("Não consegui copiar. Tente de novo.");
          }
        }}
        className="btn-vivid flex w-full items-center justify-center gap-2 font-bold"
      >
        {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copiado ? "Prompt copiado" : "Copiar prompt da entrevista"}
      </MiseButton>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Abrir:</span>
        {IAS.map(([nome, url]) => (
          <a key={nome} href={url} target="_blank" rel="noreferrer" className="glass inline-flex min-h-11 items-center rounded-xl px-3 font-bold">
            {nome}
          </a>
        ))}
      </div>
      <MiseButton onClick={() => irParaEtapa(3)} className="glass w-full font-bold">
        Já tenho a minha dieta
      </MiseButton>
    </Passo>
  );
}

function ColarPasso() {
  return (
    <Passo etapa={3} titulo="Colar minha dieta" voltar={() => irParaEtapa(2)}>
      <p className="text-sm text-muted-foreground">Quando a IA terminar, toque em copiar no canto do bloco de código, volte aqui e cole.</p>
      <ColarDieta rotuloFinal="Começar" onConcluir={concluirOnboarding} />
      <MiseButton onClick={concluirOnboarding} className="mx-auto block text-xs font-semibold text-muted-foreground underline">
        Prefiro usar a dieta de exemplo por enquanto
      </MiseButton>
    </Passo>
  );
}

/** Configuração inicial em 4 passos, por cima do app. */
export function Onboarding() {
  const { etapa } = useOnboarding();
  return (
    <div role="dialog" aria-modal="true" aria-label="Configuração inicial" className="fixed inset-0 z-50 overflow-y-auto bg-background/95 backdrop-blur-xl">
      <div className="mx-auto min-h-dvh max-w-md px-5 py-8">
        {etapa === 0 && <BoasVindas />}
        {etapa === 1 && <Refeicoes />}
        {etapa === 2 && <CopiarPrompt />}
        {etapa === 3 && <ColarPasso />}
      </div>
    </div>
  );
}
