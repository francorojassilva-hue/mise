import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { MiseButton } from "./MiseButton";
import { intervalosFoco, trilhasUsadas, type Bloco } from "@/lib/acoes";
import { cn } from "@/lib/utils";

const PX_MIN = 14;
const x = (s: number) => (s / 60) * PX_MIN;

/**
 * Cronograma (Gantt): eixo em minutos, uma linha por equipamento, barra proporcional à duração,
 * faixa "foco" onde 3 ou mais equipamentos rodam juntos. Com `onPick`, tocar numa barra pula para o passo.
 * `compacto` deixa as linhas mais baixas (modo cozinhar).
 */
export function Trilhas({ blocos, atual, agoraS, onPick, compacto = false }: { blocos: Bloco[]; atual?: number; agoraS?: number; onPick?: (i: number) => void; compacto?: boolean }) {
  const fimS = Math.max(60, ...blocos.map((b) => b.ini + b.dur));
  const largura = x(fimS) + 32;
  const usadas = trilhasUsadas(blocos);
  const foco = useMemo(() => intervalosFoco(blocos), [blocos]);
  const passo = fimS / 60 > 90 ? 15 : 10;
  const marcas = Array.from({ length: Math.floor(fimS / 60 / passo) + 1 }, (_, k) => k * passo);
  const rolagem = useRef<HTMLDivElement | null>(null);
  const linha = compacto ? "h-7" : "h-9";
  const barra = compacto ? "h-5 top-1" : "h-7 top-1";

  // rola o próprio container (nunca scrollIntoView) até o passo atual
  useEffect(() => {
    const el = rolagem.current;
    const bloco = blocos.find((b) => b.i === atual);
    if (!el || !bloco || typeof el.scrollTo !== "function") return;
    el.scrollTo({ left: Math.max(0, x(bloco.ini) - el.clientWidth * 0.3), behavior: "smooth" });
  }, [atual, blocos]);
  // sem passo atual (tela inicial), acompanha a linha do "agora"
  useEffect(() => {
    const el = rolagem.current;
    if (!el || atual != null || agoraS == null || typeof el.scrollTo !== "function") return;
    el.scrollTo({ left: Math.max(0, x(Math.min(agoraS, fimS)) - el.clientWidth * 0.3), behavior: "smooth" });
  }, [atual, agoraS, fimS]);

  return (
    <div className="glass w-full max-w-full min-w-0 shrink-0 overflow-hidden" aria-label="Cronograma do preparo">
      <div ref={rolagem} className={cn("flex w-full max-w-full min-w-0 touch-pan-x overflow-x-auto overscroll-x-contain p-2", compacto ? "max-h-[20dvh] overflow-y-auto" : "max-h-[40dvh]")}>
        <div className="sticky left-0 z-30 shrink-0 bg-background pr-2">
          <div className="h-6" />
          {usadas.map((t) => (
            <div key={t} className={cn("flex w-20 items-center text-[10px] font-bold leading-tight text-muted-foreground", linha)}>
              {t}
            </div>
          ))}
        </div>
        <div className="relative shrink-0" style={{ width: largura }}>
          {foco.map((f) => (
            <div key={f.ini} className="absolute inset-y-0 rounded bg-primary/10" style={{ left: x(f.ini), width: Math.max(4, x(f.fim - f.ini)) }}>
              <span className="absolute left-1 top-0 rounded-full bg-primary px-1.5 text-[9px] font-black leading-4 text-primary-foreground">foco</span>
            </div>
          ))}
          <div className="relative h-6">
            {marcas.map((m) => (
              <span key={m} className="tnum absolute top-1 text-[10px] font-bold text-muted-foreground" style={{ left: x(m * 60) }}>
                {m}′
              </span>
            ))}
          </div>
          {usadas.map((t) => (
            <div key={t} className={cn("relative border-t border-border/60", linha)}>
              {blocos
                .filter((b) => b.trilha === t)
                .map((b) => {
                  const atualB = b.i === atual;
                  const cls = cn(
                    "absolute grid place-items-center rounded-md text-xs font-black",
                    barra,
                    atualB ? "z-10 bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 ring-offset-background" : "bg-muted text-foreground",
                  );
                  const style = { left: x(b.ini), width: Math.max(28, x(b.dur) - 2) };
                  return onPick ? (
                    <MiseButton key={b.i} aria-label={`Passo ${b.i + 1}`} aria-current={atualB ? "step" : undefined} onClick={() => onPick(b.i)} className={cn(cls, "!min-h-5 !min-w-7")} style={style}>
                      {b.i + 1}
                    </MiseButton>
                  ) : (
                    <span key={b.i} className={cls} style={style}>
                      {b.i + 1}
                    </span>
                  );
                })}
            </div>
          ))}
          {agoraS != null && <motion.div className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-foreground" animate={{ left: x(Math.min(agoraS, fimS)) }} />}
        </div>
      </div>
    </div>
  );
}
