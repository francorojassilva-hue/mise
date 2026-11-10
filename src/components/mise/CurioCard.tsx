import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { MiseButton } from "./MiseButton";
import { curtida, curtir, type Curio } from "@/lib/curiosidades";
import { cn } from "@/lib/utils";

const SELO = { fato: "Fato", mito: "Mito", dica: "Dica", historia: "História" } as const;

/** Balão discreto: aparece após ~1,5 s, some em ~6 s; toque abre o texto, ✕ dispensa. Flutua sem ocupar layout. */
export function CurioCard({ c, className }: { c: Curio; className?: string }) {
  const [fase, setFase] = useState<"espera" | "pilula" | "aberto" | "fora">("espera");
  const [curtido, setCurtido] = useState(false);
  useEffect(() => {
    setCurtido(curtida(c.id));
    setFase("espera");
    const a = setTimeout(() => setFase("pilula"), 1500);
    const b = setTimeout(() => setFase((f) => (f === "pilula" ? "fora" : f)), 7500);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [c.id]);
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 bottom-28 z-10 flex justify-center px-4", className)}>
      <AnimatePresence>
        {fase === "pilula" && (
          <motion.div key="p" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pointer-events-auto">
            <MiseButton aria-label={`Curiosidade: ${SELO[c.tipo]}`} onClick={() => setFase("aberto")} className="glass-strong flex max-w-full items-center gap-2 rounded-full px-4 text-sm font-semibold">
              <span aria-hidden>💡</span>
              <span>{SELO[c.tipo]}</span>
            </MiseButton>
          </motion.div>
        )}
        {fase === "aberto" && (
          <motion.div key="a" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-strong pointer-events-auto w-full max-w-md rounded-2xl p-3 text-left">
            <div className="flex items-start gap-2">
              <span aria-hidden>💡</span>
              <p className="min-w-0 flex-1 break-words text-sm leading-snug">
                <b className="text-primary">{SELO[c.tipo]}:</b> {c.t}
                <span className="mt-1 block text-[10px] text-muted-foreground">{c.fonte}</span>
              </p>
              <MiseButton aria-label="Curtir" aria-pressed={curtido} onClick={() => setCurtido(curtir(c.id))} className="grid size-11 shrink-0 place-items-center">
                <Heart className={cn("size-4", curtido && "fill-destructive text-destructive")} />
              </MiseButton>
              <MiseButton aria-label="Dispensar" onClick={() => setFase("fora")} className="grid size-11 shrink-0 place-items-center text-muted-foreground">
                ✕
              </MiseButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
