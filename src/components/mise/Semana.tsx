import { useState } from "react";
import { Check, ChevronDown, Repeat, ShoppingBasket, Undo2 } from "lucide-react";
import { MiseButton } from "./MiseButton";
import { Interruptor } from "./primitives";
import { TrocaPicker } from "./Trocas";
import { alimentoDe, type Letra } from "@/lib/dieta";
import { useDieta } from "@/lib/dietaAtual";
import { batchSummary, shoppingEstimate } from "@/lib/cycle";
import { DIAS, pessoasDaSemana, porcoes } from "@/lib/porcoes";
import { usePrecos } from "@/lib/precos";
import { alternarRefeicao, desfazerTroca, diaDaSemana, setExtra, setLetra, useSemana } from "@/lib/semana";
import { refeicoesComTrocas } from "@/lib/trocas";
import { cn } from "@/lib/utils";

const LETRAS: Letra[] = ["A", "B", "C"];
const COR = { A: "bg-letter-a", B: "bg-letter-b", C: "bg-letter-c" } as const;
const reais = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function Semana({ onMercado }: { onMercado: () => void }) {
  const { dieta: d } = useDieta();
  const s = useSemana();
  const precos = usePrecos();
  const [dia, setDia] = useState(diaDaSemana());
  const extra = s.extra === undefined ? d.pessoaExtra : s.extra;
  const pessoas = pessoasDaSemana(d, extra);
  const porc = porcoes(d, s.removidas, pessoas);
  const resumo = batchSummary(d, s.letra, porc, s.removidas, pessoas);
  const estimativa = shoppingEstimate(d, s.letra, precos, s.swaps, porc);
  const foraHoje = s.removidas[String(dia)] ?? [];
  return (
    <div className="flex h-[calc(85dvh-9rem)] min-h-80 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-1 pb-4 pt-2">
        <div className="grid grid-cols-3 gap-3" role="group" aria-label="Letra da semana">
          {LETRAS.map((l) => (
            <MiseButton key={l} aria-label={`Letra ${l}`} aria-pressed={s.letra === l} onClick={() => setLetra(l)} className={cn("grid min-h-20 place-items-center rounded-2xl text-4xl font-black text-primary-foreground", COR[l], s.letra === l && "ring-2 ring-ring ring-offset-4 ring-offset-background")}>
              {l}
            </MiseButton>
          ))}
        </div>

        <section className="space-y-3">
          <div className="grid grid-cols-7 gap-1 pb-1">
            {DIAS.map((nome, i) => (
              <MiseButton key={nome} aria-pressed={dia === i} aria-label={nome} onClick={() => setDia(i)} className={cn("relative flex min-w-0 flex-col items-center justify-center rounded-xl py-2 text-xs font-bold uppercase", dia === i ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {nome}
                <span className={cn("mt-1 size-1.5 rounded-full", (s.removidas[String(i)] ?? []).length ? "bg-current" : "bg-transparent")} />
              </MiseButton>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {d.refeicoes.map((r) => {
              const ligada = !foraHoje.includes(r.id);
              return (
                <MiseButton key={r.id} onClick={() => alternarRefeicao(dia, r.id)} aria-label={`${r.nome} ${DIAS[dia]}`} aria-pressed={ligada} className={cn("rounded-full border px-4 text-sm font-bold", ligada ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground")}>
                  {ligada && <Check className="mr-1 inline size-4" />}
                  {r.nome}
                </MiseButton>
              );
            })}
          </div>
        </section>

        <section className="space-y-3 border-y border-border py-4">
          {d.pessoaExtra && (
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold">Semana com {d.pessoaExtra.nome}</span>
              <Interruptor rotulo={`Semana com ${d.pessoaExtra.nome}`} ligado={extra !== null} onChange={() => setExtra(extra !== null ? null : undefined)} />
            </div>
          )}
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${d.refeicoes.length}, minmax(0, 1fr))` }}>
            {d.refeicoes.map((r) => (
              <div key={r.id} className="min-w-0 text-center">
                <p className="tnum text-xl font-black">{porc[r.id]}</p>
                <p className="truncate text-xs text-muted-foreground">{r.nome}</p>
              </div>
            ))}
          </div>
        </section>

        <Cardapio key={s.letra} letra={s.letra} />
      </div>

      <footer className="glass-strong z-20 shrink-0 space-y-3 rounded-2xl p-4">
        <p className="tnum text-center text-sm font-bold">
          {resumo.meals} refeições · {resumo.containers} marmitas · {reais(estimativa)}
        </p>
        <MiseButton onClick={onMercado} className="btn-vivid flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-3 text-sm font-bold text-primary-foreground">
          <ShoppingBasket className="size-4" />
          Ver lista de compras
        </MiseButton>
      </footer>
    </div>
  );
}

function Cardapio({ letra }: { letra: Letra }) {
  const { dieta: d } = useDieta();
  const { swaps } = useSemana();
  const refeicoes = refeicoesComTrocas(d, letra, swaps);
  const [aberta, setAberta] = useState<string | null>(null);
  const [alimento, setAlimento] = useState<string | null>(null);
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-muted-foreground">Cardápio {letra}</h3>
      {refeicoes.map((r) => (
        <div key={r.id} className="glass p-4">
          <MiseButton
            aria-expanded={aberta === r.id}
            onClick={() => {
              setAberta(aberta === r.id ? null : r.id);
              setAlimento(null);
            }}
            className="flex w-full items-center gap-3 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="flex justify-between gap-2 text-xs font-bold text-muted-foreground">
                <span>{r.nome}</span>
                <span>{r.hora}</span>
              </span>
              <span className="mt-1 block break-words font-bold leading-snug">{r.prato || r.nome}</span>
            </span>
            <ChevronDown className={cn("size-5 shrink-0 text-primary transition-transform", aberta === r.id && "rotate-180")} />
          </MiseButton>
          {aberta === r.id && (
            <ul className="mt-3 space-y-1 border-t border-border pt-2">
              {r.itens.map((it) => {
                const nome = alimentoDe(d, it.alimento)?.nome ?? it.alimento;
                const trocado = swaps.find((x) => x.refeicao === r.id && x.para === it.alimento);
                return (
                  <li key={it.alimento}>
                    <div className="flex items-center gap-1">
                      <MiseButton aria-label={`Trocar ${nome}`} onClick={() => setAlimento(alimento === it.alimento ? null : it.alimento)} className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-left text-sm">
                        <span className="font-bold">{it.medida || `${it.g} g`}</span>
                        <span className="min-w-0 flex-1 break-words leading-snug">{nome}</span>
                        <span className="text-xs text-muted-foreground">{it.g} g</span>
                        <Repeat className="size-4 text-primary" />
                      </MiseButton>
                      {trocado && (
                        <MiseButton aria-label={`Voltar ao original de ${nome}`} onClick={() => desfazerTroca(r.id, trocado.de)} className="grid place-items-center">
                          <Undo2 className="size-4 text-muted-foreground" />
                        </MiseButton>
                      )}
                    </div>
                    {alimento === it.alimento && <TrocaPicker key={`${letra}:${r.id}:${it.alimento}`} letra={letra} refeicao={r.id} item={it.alimento} onDone={() => setAlimento(null)} />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}
