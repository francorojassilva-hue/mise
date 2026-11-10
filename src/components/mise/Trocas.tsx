import { useState } from "react";
import { MiseButton } from "./MiseButton";
import { alimentoDe, type Letra } from "@/lib/dieta";
import { useDieta } from "@/lib/dietaAtual";
import { salvarTroca, useSemana } from "@/lib/semana";
import { equivalentes, grupoDe, refeicoesComTrocas } from "@/lib/trocas";
import { cn } from "@/lib/utils";

const chip = (v: number, u: string) => (
  <span className={cn("tnum rounded-full px-2 py-0.5 text-xs font-bold", v >= 0 ? "bg-letter-c/20 text-foreground" : "bg-destructive/20 text-foreground")}>
    {v > 0 ? "+" : ""}
    {v} {u}
  </span>
);

/** Escolhe o item da refeição (se não vier) e mostra os equivalentes do mesmo grupo. */
export function TrocaPicker({ letra, refeicao, item, onDone }: { letra: Letra; refeicao: string; item?: string; onDone: () => void }) {
  const { dieta: d } = useDieta();
  const { swaps } = useSemana();
  const r = refeicoesComTrocas(d, letra, swaps).find((x) => x.id === refeicao);
  const [sel, setSel] = useState<string | undefined>(item);
  const [pick, setPick] = useState<string | null>(null);
  if (!r) return null;
  const it = r.itens.find((i) => i.alimento === sel);
  const original = (id: string) => swaps.find((s) => s.refeicao === refeicao && s.para === id)?.de ?? id;

  if (!it) {
    const trocaveis = r.itens.filter((i) => grupoDe(d, i.alimento));
    return (
      <div className="space-y-2">
        {trocaveis.length === 0 && <p className="text-sm text-muted-foreground">Nada para trocar nesta refeição</p>}
        {trocaveis.map((i) => (
          <MiseButton key={i.alimento} onClick={() => setSel(i.alimento)} className="glass-strong flex min-h-11 w-full items-center gap-2 rounded-2xl px-4 text-left text-sm">
            <span className="font-bold">{i.medida || `${i.g} g`}</span>
            <span className="min-w-0 flex-1 break-words leading-snug">{alimentoDe(d, i.alimento)?.nome}</span>
          </MiseButton>
        ))}
      </div>
    );
  }

  const de = original(it.alimento);
  const baseG = de === it.alimento ? it.g : (refeicoesComTrocas(d, letra, []).find((x) => x.id === refeicao)?.itens.find((i) => i.alimento === de)?.g ?? it.g);
  const eq = equivalentes(d, de, baseG);
  const p = eq.find((e) => e.id === pick);
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase text-muted-foreground">Trocar {alimentoDe(d, de)?.nome}</p>
      {eq.length === 0 && <p className="text-sm text-muted-foreground">Sem troca para esse</p>}
      {eq.map((e) => (
        <MiseButton
          layout
          key={e.id}
          onClick={() => setPick(e.id)}
          className={cn("glass-strong flex min-h-11 w-full flex-wrap items-center gap-2 rounded-2xl px-4 py-2 text-left text-sm", pick === e.id && "ring-2 ring-primary")}
        >
          <span className="font-bold">{e.medida}</span>
          <span className="min-w-0 flex-1 break-words leading-snug">{alimentoDe(d, e.id)?.nome}</span>
          <span className="tnum text-[10px] text-muted-foreground">{e.gramas} g</span>
          {chip(e.dKcal, "kcal")}
          {chip(e.dP, "P")}
        </MiseButton>
      ))}
      {p && (
        <MiseButton
          onClick={() => {
            salvarTroca({ refeicao, de, para: p.id, gramas: p.gramas });
            onDone();
          }}
          className="min-h-11 w-full rounded-2xl bg-primary font-bold text-primary-foreground"
        >
          Confirmar (semana toda)
        </MiseButton>
      )}
    </div>
  );
}
