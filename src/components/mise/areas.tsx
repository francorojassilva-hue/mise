import { motion } from "framer-motion";
import { CalendarDays, ChefHat, Settings, ShoppingBasket, type LucideIcon } from "lucide-react";
import { AjustesBody } from "./Ajustes";
import { Mercado } from "./Mercado";
import { Preparo } from "./Preparo";
import { Semana } from "./Semana";
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

/** Corpo de cada aba. */
function Corpo({ id, open }: { id: AreaId; open?: ((a: AreaId | null) => void) | undefined }) {
  if (id === "semana") return <Semana onMercado={() => open?.("mercado")} />;
  if (id === "mercado") return <Mercado />;
  if (id === "cozinhar") return <Preparo />;
  return <AjustesBody aoCriarDieta={() => open?.(null)} />;
}

export function AreaPanel({ id, open }: { id: AreaId; open?: (a: AreaId | null) => void }) {
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
      <Corpo id={id} open={open} />
    </div>
  );
}
