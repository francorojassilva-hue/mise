import { motion } from "framer-motion";
import { CalendarDays, ChefHat, Settings, ShoppingBasket, type LucideIcon } from "lucide-react";
import { MiseButton } from "./MiseButton";
import { setLetra, useSemana } from "@/lib/semana";
import type { Letra } from "@/lib/appearance";
import { cn } from "@/lib/utils";

export type AreaId = "cozinhar" | "mercado" | "semana" | "ajustes";
export const CYCLE_TABS = ["hoje", "semana", "mercado", "cozinhar"] as const;

export const AREAS: Record<AreaId, { label: string; Icon: LucideIcon; hint: string }> = {
  cozinhar: { label: "Preparo", Icon: ChefHat, hint: "Leva da semana" },
  mercado: { label: "Mercado", Icon: ShoppingBasket, hint: "Lista da semana" },
  semana: { label: "Semana", Icon: CalendarDays, hint: "Seg a dom" },
  ajustes: { label: "Ajustes", Icon: Settings, hint: "App e alertas" },
};

export function AreaIcon({ id, className = "size-12" }: { id: AreaId; className?: string }) {
  const { Icon } = AREAS[id];
  return (
    <motion.span layoutId={`icon-${id}`} className={cn("icon-tile grid shrink-0 place-items-center", className)}>
      <Icon className="size-[45%]" strokeWidth={1.8} />
    </motion.span>
  );
}

const LETRAS: Letra[] = ["A", "B", "C"];

/** Corpo provisório: Semana, Mercado e Preparo chegam nos próximos commits da F3; Ajustes na F4. */
function Corpo({ id }: { id: AreaId }) {
  const { letra } = useSemana();
  if (id === "semana") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold">Letra da semana</p>
        <div className="grid grid-cols-3 gap-2">
          {LETRAS.map((l) => (
            <MiseButton key={l} onClick={() => setLetra(l)} aria-pressed={l === letra} className={cn("min-h-14 rounded-2xl text-xl font-black", l === letra ? "btn-vivid" : "glass-strong")}>
              {l}
            </MiseButton>
          ))}
        </div>
      </div>
    );
  }
  return <div className="glass grid h-40 place-items-center p-5 text-center font-semibold text-muted-foreground">Em construção</div>;
}

export function AreaPanel({ id }: { id: AreaId; open?: (a: AreaId | null) => void }) {
  const area = AREAS[id];
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 pr-10">
        <AreaIcon id={id} className="size-14" />
        <div>
          <h2 className="text-2xl font-extrabold">{area.label}</h2>
          <p className="text-sm text-muted-foreground">{area.hint}</p>
        </div>
      </div>
      <Corpo id={id} />
    </div>
  );
}
