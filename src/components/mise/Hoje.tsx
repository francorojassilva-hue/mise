import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bed, Bell, Check, Droplet, Dumbbell, Moon, Pill, Refrigerator, Repeat, Sun, User, Utensils, Zap, type LucideIcon } from "lucide-react";
import { Confetti } from "./Confetti";
import { MiseButton } from "./MiseButton";
import type { AreaId } from "./areas";
import { CountUp, GlassCard, Ring, Squash, listVariants } from "./primitives";
import { TrocaPicker } from "./Trocas";
import { useDieta } from "@/lib/dietaAtual";
import type { Letra } from "@/lib/dieta";
import { PORTE_FORA, avisoFreezer, indiceAgora, marcavel, slotsDoDia, totaisDoDia, type Slot } from "@/lib/hoje";
import { DIAS } from "@/lib/porcoes";
import { addLog, diaDaSemana, inicioSemana, useSemana, ymd, type Log, type NovoLog } from "@/lib/semana";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const iconeDe: Record<string, LucideIcon> = { refeicao: Utensils, suplemento: Pill, remedio: Pill, treino: Dumbbell, lembrete: Refrigerator, sono: Bed, agua: Droplet };

export function Hoje({ open }: { open: (a: AreaId) => void }) {
  const { dieta: d } = useDieta();
  const s = useSemana();
  const [festa, setFesta] = useState(false);
  const hoje = ymd(new Date());
  const { refeicoes, rotina } = useMemo(() => slotsDoDia(d, s.letra, s.swaps, s.removidas), [d, s.letra, s.swaps, s.removidas]);
  const logsHoje = useMemo(() => s.logs.filter((l) => l.data === hoje), [s.logs, hoje]);
  const totais = totaisDoDia(s.logs, hoje);
  const freezer = avisoFreezer(d, s.letra, s.removidas);
  const comemorar = () => {
    setFesta(true);
    setTimeout(() => setFesta(false), 1800);
  };
  return (
    <motion.main variants={listVariants} initial="hidden" animate="show" className="space-y-4">
      <Cabecalho nome={d.pessoa.nome.split(" ")[0] ?? ""} letra={s.letra} open={open} />
      <SemanaEmFaixa letra={s.letra} refeicoesIds={d.refeicoes.map((r) => r.id)} logs={s.logs} removidas={s.removidas} onOpen={() => open("semana")} />
      {festa && (
        <div className="pointer-events-none fixed inset-0 z-40">
          <Confetti />
        </div>
      )}
      <Agora slots={refeicoes} logsHoje={logsHoje} letra={s.letra} onFeito={comemorar} />
      <Rotina slots={rotina} logsHoje={logsHoje} />
      <Aneis kcal={totais.kcal} P={totais.P} metaKcal={d.metas.kcal} metaP={d.metas.P} />
      {freezer.itens.length > 0 && (
        <section className="flex items-start gap-3 border-t border-border py-4">
          <Refrigerator className="mt-1 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-bold">Hoje · {freezer.hora.replace(":00", "h")} · tirar do freezer</p>
            <p className="text-sm text-muted-foreground">{freezer.itens.map((i) => i.prato || i.nome).join(" · ")}</p>
          </div>
        </section>
      )}
    </motion.main>
  );
}

function Cabecalho({ nome, letra, open }: { nome: string; letra: Letra; open: (a: AreaId) => void }) {
  const { mode, setMode } = useTheme();
  return (
    <motion.header variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0 } }} className="flex items-center gap-3">
      <MiseButton
        onClick={() => open("ajustes")}
        aria-label="Ajustes"
        className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-extrabold text-primary-foreground ring-2 ring-glass-border"
      >
        {nome ? nome.charAt(0).toUpperCase() : <User className="size-5" />}
      </MiseButton>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-extrabold">Olá{nome ? `, ${nome}` : ""}</h1>
      </div>
      <Squash onClick={() => open("semana")} aria-label={`Semana ${letra}`} className="btn-vivid grid size-12 place-items-center rounded-2xl text-2xl font-black text-primary-foreground shadow-lg">
        <AnimatePresence mode="popLayout">
          <motion.span key={letra} initial={{ rotateX: 90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} exit={{ rotateX: -90, opacity: 0 }}>
            {letra}
          </motion.span>
        </AnimatePresence>
      </Squash>
      <Squash
        onClick={() => setMode(mode === "dark" ? "light" : "dark")}
        aria-label={mode === "dark" ? "Modo claro" : "Modo escuro"}
        className="glass grid size-11 shrink-0 place-items-center !rounded-full"
      >
        {mode === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Squash>
    </motion.header>
  );
}

function SemanaEmFaixa({ letra, refeicoesIds, logs, removidas, onOpen }: { letra: Letra; refeicoesIds: string[]; logs: Log[]; removidas: Record<string, string[]>; onOpen: () => void }) {
  const hoje = diaDaSemana();
  const inicio = inicioSemana();
  return (
    <GlassCard className="p-4">
      <h2 className="mb-3 text-sm font-extrabold">Esta semana · {letra}</h2>
      <div className="grid grid-cols-7 gap-1.5">
        {DIAS.map((dia, i) => {
          const dt = new Date(inicio);
          dt.setDate(dt.getDate() + i);
          const data = ymd(dt);
          const ativas = refeicoesIds.filter((id) => !(removidas[String(i)] ?? []).includes(id));
          const feitos = new Set(logs.filter((l) => l.data === data && l.kind !== "suplemento").map((l) => l.ref));
          const ehHoje = i === hoje;
          return (
            <MiseButton key={dia} onClick={onOpen} aria-label={`Abrir semana, ${dia}`} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold uppercase", ehHoje ? "btn-vivid" : "glass-strong")}>
              <span>{dia}</span>
              <span className="flex flex-wrap justify-center gap-0.5">
                {ativas.map((id) => (
                  <span key={id} className={cn("size-1.5 rounded-full", feitos.has(id) ? (ehHoje ? "bg-primary-foreground" : "bg-primary") : ehHoje ? "bg-primary-foreground/45" : "bg-muted-foreground/40")} />
                ))}
              </span>
            </MiseButton>
          );
        })}
      </div>
    </GlassCard>
  );
}

function Agora({ slots, logsHoje, letra, onFeito }: { slots: Slot[]; logsHoje: Log[]; letra: Letra; onFeito: () => void }) {
  const { dieta: d } = useDieta();
  const [i, setI] = useState(0);
  const [coringa, setCoringa] = useState<"lista" | "fora" | "troca" | null>(null);
  const chave = slots.map((x) => x.key).join(",");
  useEffect(() => {
    setI(indiceAgora(slots));
    // só recalcula quando a lista de refeições do dia muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  const item = slots[i] ?? slots[0];
  if (!item || !item.refeicao) return <p className="py-8 text-center font-bold text-muted-foreground">Dia livre 🙌</p>;
  const r = item.refeicao;
  const feito = logsHoje.some((l) => l.ref === item.key);
  const registrar = (l: NovoLog) => {
    addLog(l);
    setCoringa(null);
    onFeito();
  };
  return (
    <GlassCard className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">Agora · {item.label}</span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={item.key + letra}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.4}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) setI((v) => Math.min(slots.length - 1, v + 1));
            if (info.offset.x > 60) setI((v) => Math.max(0, v - 1));
          }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          className="cursor-grab touch-pan-y active:cursor-grabbing"
        >
          <p className="tnum text-4xl font-black tracking-normal">{item.hora}</p>
          <h3 className="mt-1 break-words text-xl font-extrabold leading-snug">{r.prato || r.nome}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {([["kcal", r.macros.kcal], ["P", r.macros.P], ["C", r.macros.C], ["G", r.macros.G]] as const).map(([k, v]) => (
              <span key={k} className="glass-strong tnum rounded-full px-3 py-1 text-sm font-bold">
                {v}
                <span className="ml-1 text-xs text-muted-foreground">{k}</span>
              </span>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Squash
          disabled={feito}
          onClick={() => registrar({ kind: "refeicao", ref: item.key, label: item.label, kcal: r.macros.kcal, P: r.macros.P, C: r.macros.C, G: r.macros.G })}
          className="btn-vivid flex min-h-11 items-center justify-center gap-1.5 rounded-2xl font-bold text-primary-foreground"
        >
          <Check className="size-4" /> {feito ? "Feito!" : "Comi"}
        </Squash>
        <Squash onClick={() => setCoringa((j) => (j === "troca" ? null : "troca"))} className="glass-strong flex items-center justify-center gap-1.5 rounded-2xl font-bold">
          <Repeat className="size-4" /> Trocar
        </Squash>
        <Squash onClick={() => setCoringa((j) => (j ? null : "lista"))} className="glass-strong flex items-center justify-center gap-1.5 rounded-2xl font-bold">
          <Zap className="size-4" /> Coringa
        </Squash>
      </div>

      <AnimatePresence>
        {coringa && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 space-y-2">
              {coringa === "troca" && <TrocaPicker key={item.key + letra} letra={letra} refeicao={item.key} onDone={() => setCoringa(null)} />}
              {coringa === "lista" && (
                <>
                  {d.coringas.map((c) => (
                    <MiseButton
                      key={c.id}
                      onClick={() => registrar({ kind: "coringa", ref: item.key, label: c.nome, kcal: c.kcal, P: c.P })}
                      className="glass-strong flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-2 text-left"
                    >
                      <span className="flex-1 text-sm font-bold">{c.nome}</span>
                      <span className="tnum text-xs font-bold text-muted-foreground">{c.kcal ?? "?"} kcal</span>
                    </MiseButton>
                  ))}
                  <MiseButton onClick={() => setCoringa("fora")} className="glass-strong flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-2 text-left">
                    <span className="flex-1 text-sm font-bold">Comi fora</span>
                    <span className="text-xs font-bold text-muted-foreground">escolher o tamanho</span>
                  </MiseButton>
                </>
              )}
              {coringa === "fora" && (
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(PORTE_FORA) as [string, number][]).map(([porte, kcal]) => (
                    <Squash key={porte} onClick={() => registrar({ kind: "coringa", ref: item.key, label: `Comi fora · ${porte}`, kcal })} className="glass-strong flex flex-col items-center rounded-2xl py-2 font-bold capitalize">
                      {porte}
                      <span className="tnum text-xs text-muted-foreground">{kcal} kcal</span>
                    </Squash>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3 flex gap-1 overflow-x-auto">
        {slots.map((u, k) => (
          <MiseButton key={u.key} aria-label={u.label} onClick={() => setI(k)} className="grid size-11 shrink-0 place-items-center">
            <motion.span animate={{ width: k === i ? 18 : 6 }} className={cn("block h-1.5 rounded-full", k === i ? "bg-primary" : "bg-muted-foreground/40")} />
          </MiseButton>
        ))}
      </div>
    </GlassCard>
  );
}

function Rotina({ slots, logsHoje }: { slots: Slot[]; logsHoje: Log[] }) {
  if (!slots.length) return null;
  return (
    <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {slots.map((t, k) => {
        const Icone = iconeDe[t.tipo] ?? Bell;
        const feito = logsHoje.some((l) => l.ref === t.key);
        const toma = marcavel(t);
        return (
          <MiseButton
            key={t.key}
            disabled={!toma || feito}
            onClick={() => addLog({ kind: "suplemento", ref: t.key, label: t.label })}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + k * 0.05 }}
            className={cn("glass flex w-44 shrink-0 items-center gap-2 !rounded-full py-2 pl-2 pr-4 text-left", feito && "opacity-60")}
          >
            <span className={cn("grid size-8 shrink-0 place-items-center !rounded-full", feito ? "btn-vivid" : "icon-tile")}>{feito ? <Check className="size-4" /> : <Icone className="size-4" />}</span>
            <span className="min-w-0 leading-tight">
              <span className="tnum block text-xs font-bold text-muted-foreground">{t.hora}</span>
              <span className="block break-words text-sm font-bold leading-snug">{t.label}</span>
            </span>
          </MiseButton>
        );
      })}
    </motion.div>
  );
}

function Aneis({ kcal, P, metaKcal, metaP }: { kcal: number; P: number; metaKcal: number; metaP: number }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-around">
        <div className="flex flex-col items-center gap-2">
          <Ring value={kcal} max={metaKcal}>
            <div>
              <CountUp to={kcal} className="text-2xl font-black" />
              <p className="tnum text-xs font-semibold text-muted-foreground">/ {Math.round(metaKcal).toLocaleString("pt-BR")}</p>
            </div>
          </Ring>
          <span className="text-sm font-bold">kcal</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Ring value={P} max={metaP}>
            <div>
              <CountUp to={P} className="text-2xl font-black" />
              <span className="text-sm font-bold">g</span>
              <p className="tnum text-xs font-semibold text-muted-foreground">/ {Math.round(metaP)} g</p>
            </div>
          </Ring>
          <span className="text-sm font-bold">Proteína</span>
        </div>
      </div>
    </GlassCard>
  );
}
