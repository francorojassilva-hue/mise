import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { AcaoAnim } from "./AcaoAnim";
import { Confetti } from "./Confetti";
import { CurioCard } from "./CurioCard";
import { FullscreenPanel } from "./FullscreenPanel";
import { MiseButton } from "./MiseButton";
import { Avisos } from "./primitives";
import { Trilhas } from "./Trilhas";
import { acaoDoTexto, duracaoTotal, montarTrilhas } from "@/lib/acoes";
import { batchSummary } from "@/lib/cycle";
import { avisosCapacidade, expandirRoteiro, instrucao, roteiro, vespera, type PassoPlano } from "@/lib/cozinhar";
import { proxima, type Curio } from "@/lib/curiosidades";
import type { Dieta, Letra } from "@/lib/dieta";
import { useDieta } from "@/lib/dietaAtual";
import { pessoasDaSemana, porcoes, type Porcoes } from "@/lib/porcoes";
import { copiarTexto, montarPromptIA, nomeEquipamento, passosParaPrompt } from "@/lib/promptIA";
import { useSemana } from "@/lib/semana";
import { estimativaDe, registrarTempo, ultimoTempo, useTempos, type Tempos } from "@/lib/tempos";

const chaveDe = (p: PassoPlano | undefined) => (p ? `${p.rid}:${p.idx}` : undefined);

/** "1h40" ou "45 min", a partir de segundos. */
export function formatarDuracao(segundos: number) {
  const min = Math.max(1, Math.round(segundos / 60));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;
}

/** Passos, cronograma e prompt de um preparo: a mesma conta na tela inicial e no modo cozinhar. */
function usePlanoDePreparo(d: Dieta, letra: Letra, porc: Porcoes, tempos: Tempos) {
  const passos = useMemo(() => expandirRoteiro(d, letra), [d, letra]);
  const est = (i: number) => estimativaDe(tempos, chaveDe(passos[i]));
  const blocos = useMemo(() => montarTrilhas(passos, (i) => estimativaDe(tempos, chaveDe(passos[i]))), [passos, tempos]);
  const copiarPrompt = async () => {
    try {
      await copiarTexto(montarPromptIA(d, letra, passosParaPrompt(passos, blocos, (p) => instrucao(d, p, letra, porc), est)));
      toast.success("Prompt copiado");
    } catch {
      toast.error("Não deu pra copiar");
    }
  };
  return { passos, blocos, copiarPrompt };
}

export function Preparo() {
  const { dieta: d } = useDieta();
  const s = useSemana();
  const tempos = useTempos();
  const [cozinhando, setCozinhando] = useState(false);
  const pessoas = pessoasDaSemana(d, s.extra === undefined ? d.pessoaExtra : s.extra);
  const porc = porcoes(d, s.removidas, pessoas);
  const resumo = batchSummary(d, s.letra, porc, s.removidas, pessoas);
  const { passos, blocos, copiarPrompt } = usePlanoDePreparo(d, s.letra, porc, tempos);
  const r = roteiro(d, s.letra);
  const tempo = blocos.length ? formatarDuracao(duracaoTotal(blocos)) : r.tempo || "—";
  const listaVespera = vespera(d, s.letra, porc);
  return (
    <div className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden">
      <div className="glass flex min-w-0 items-center gap-3 p-4">
        <span className="btn-vivid grid size-12 place-items-center rounded-2xl text-2xl font-black text-primary-foreground">{s.letra}</span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">Preparo {s.letra}</p>
          <p className="truncate text-sm text-muted-foreground">{d.cardapios[s.letra].nome || r.tempo}</p>
        </div>
      </div>

      <section className="space-y-3 border-y border-border py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-3xl font-black">{tempo}</p>
            <p className="text-xs text-muted-foreground">Tempo estimado</p>
          </div>
          <div>
            <p className="tnum text-3xl font-black">{resumo.containers}</p>
            <p className="text-xs text-muted-foreground">Marmitas</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {d.cozinha.equipamentos.map((e) => (
            <span key={e} className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
              {nomeEquipamento(d.cozinha, e)}
            </span>
          ))}
        </div>
      </section>

      {listaVespera.length > 0 && (
        <div className="glass p-4">
          <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Véspera</p>
          <ul className="space-y-2">
            {listaVespera.map((v, i) => (
              <Vespera key={`${s.letra}-${i}`} texto={v} />
            ))}
          </ul>
        </div>
      )}

      <Avisos itens={avisosCapacidade(d, s.letra, porc)} />

      {passos.length === 0 ? (
        <p className="glass p-4 text-center text-sm font-semibold text-muted-foreground">Esta letra ainda não tem roteiro de preparo.</p>
      ) : (
        <>
          <Trilhas blocos={blocos} />
          <MiseButton onClick={copiarPrompt} className="glass flex w-full items-center justify-center gap-1.5 rounded-full px-3 text-sm font-bold">
            <Copy className="size-4" /> Prompt IA
          </MiseButton>
          <MiseButton onClick={() => setCozinhando(true)} className="btn-vivid min-h-14 w-full rounded-2xl text-lg font-black text-primary-foreground">
            Começar
          </MiseButton>
        </>
      )}
      {cozinhando && <Cozinhar letra={s.letra} onClose={() => setCozinhando(false)} />}
    </div>
  );
}

function Vespera({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false);
  return (
    <li>
      <MiseButton role="checkbox" aria-checked={ok} onClick={() => setOk(!ok)} className="flex min-h-11 w-full items-start gap-3 text-left text-sm">
        <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 border-primary ${ok ? "bg-primary text-primary-foreground" : ""}`}>{ok ? "✓" : ""}</span>
        <span className={ok ? "line-through opacity-60" : ""}>{texto}</span>
      </MiseButton>
    </li>
  );
}

/**
 * Modo cozinhar em tela única: topo (X, Prompt IA, progresso), cronograma baixo (~20%),
 * passo atual com a instrução completa sempre visível e Voltar/Próximo presos no rodapé.
 * Sem timer e sem bloqueio: avança no ritmo de quem cozinha. Só a caixa do detalhe rola, se for longa.
 */
function Cozinhar({ letra, onClose }: { letra: Letra; onClose: () => void }) {
  const { dieta: d } = useDieta();
  const s = useSemana();
  const tempos = useTempos();
  const pessoas = pessoasDaSemana(d, s.extra === undefined ? d.pessoaExtra : s.extra);
  const porc = porcoes(d, s.removidas, pessoas);
  const { passos, blocos, copiarPrompt } = usePlanoDePreparo(d, letra, porc, tempos);
  const [i, setI] = useState(0);
  const [agora, setAgora] = useState(Date.now());
  const inicio = useRef(Date.now());
  const inicioDoPasso = useRef(Date.now());
  const [curio, setCurio] = useState<Curio | null>(null);
  const fim = i >= passos.length;
  const p = passos[i];

  function ir(n: number) {
    const gastos = (Date.now() - inicioDoPasso.current) / 1000;
    const chave = chaveDe(p);
    if (chave && n > i) registrarTempo(chave, gastos);
    inicioDoPasso.current = Date.now();
    setI(Math.max(0, Math.min(passos.length, n)));
  }

  // uma curiosidade por passo, que casa com os ingredientes dele
  useEffect(() => {
    if (p) setCurio((anterior) => proxima(p.ingredientes.length ? p.ingredientes : p.ingReceita, anterior?.id));
    // só quando muda o passo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // mantém a tela acesa enquanto cozinha
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<typeof lock> } }).wakeLock
      ?.request("screen")
      .then((l) => {
        lock = l;
      })
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, []);

  const ultimo = ultimoTempo(tempos, chaveDe(p));
  return (
    <FullscreenPanel title="Preparo" onClose={onClose}>
      <div className="relative flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <MiseButton aria-label="Fechar" onClick={onClose} className="glass grid size-11 shrink-0 place-items-center rounded-full">
            <X className="size-5" />
          </MiseButton>
          <MiseButton onClick={copiarPrompt} className="glass flex shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-bold">
            <Copy className="size-4" /> Prompt IA
          </MiseButton>
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={passos.length} aria-valuenow={Math.min(i, passos.length)}>
            <motion.div className="h-full bg-primary" animate={{ width: `${(Math.min(i, passos.length) / Math.max(1, passos.length)) * 100}%` }} />
          </div>
        </div>

        {!fim && <Trilhas compacto blocos={blocos} atual={i} agoraS={(agora - inicio.current) / 1000} onPick={ir} />}

        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          {fim ? (
            <motion.div key="fim" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative space-y-3">
              <Confetti count={36} />
              <p className="text-3xl font-black">Tudo pronto!</p>
              <p className="tnum text-xl text-muted-foreground">{Math.max(1, Math.round((agora - inicio.current) / 60000))} min</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {p && (
                <motion.div key={i} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="flex min-h-0 w-full flex-1 flex-col items-center gap-2">
                  <AcaoAnim a={acaoDoTexto(`${p.titulo} ${p.detalhe}`, p.acao)} className="size-20 shrink-0" />
                  <p className="shrink-0 text-xs font-bold uppercase text-muted-foreground">{p.tarefa}</p>
                  <p className="shrink-0 text-2xl font-black leading-tight">{p.titulo}</p>
                  {ultimo && <p className="shrink-0 text-xs text-muted-foreground">da última vez: {Math.max(1, Math.round(ultimo / 60))} min</p>}
                  <p className="glass min-h-0 w-full flex-1 overflow-y-auto p-4 text-left text-base" data-testid="instrucao">
                    {instrucao(d, p, letra, porc)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {!fim && curio && <CurioCard key={`${i}:${curio.id}`} c={curio} />}

        <div className="flex min-w-0 shrink-0 gap-3">
          <MiseButton onClick={() => ir(i - 1)} disabled={i === 0} className="glass flex min-h-16 flex-1 items-center justify-center gap-1 text-lg font-bold disabled:opacity-40">
            <ChevronLeft /> Voltar
          </MiseButton>
          {fim ? (
            <MiseButton onClick={onClose} className="btn-vivid min-h-16 flex-1 rounded-2xl text-lg font-black text-primary-foreground">
              Fechar
            </MiseButton>
          ) : (
            <MiseButton onClick={() => ir(i + 1)} className="btn-vivid flex min-h-16 flex-1 items-center justify-center gap-1 rounded-2xl text-lg font-black text-primary-foreground">
              Próximo <ChevronRight />
            </MiseButton>
          )}
        </div>
      </div>
    </FullscreenPanel>
  );
}
