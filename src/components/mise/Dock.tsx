import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { MiseButton } from "./MiseButton";
import { AREAS, CYCLE_TABS, type AreaId } from "./areas";
import { cn } from "@/lib/utils";

/** Dock flutuante de vidro com 4 abas. A aba ativa vira pílula em gradiente com o nome. */
export function Dock({ active, open }: { active: AreaId | null; open: (a: AreaId | null) => void }) {
  const items = CYCLE_TABS.map((tab) =>
    tab === "hoje" ? { id: null, label: "Hoje", Icon: Home } : { id: tab, label: AREAS[tab].label, Icon: AREAS[tab].Icon },
  );
  return (
    <motion.nav
      aria-label="Ciclo da semana"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.4 }}
      className="glass-strong fixed inset-x-0 bottom-4 z-[60] mx-auto flex w-[min(92vw,380px)] justify-between rounded-full p-1.5 shadow-2xl"
    >
      {items.map(({ id, label, Icon }) => {
        const on = active === id;
        return (
          <MiseButton
            key={label}
            whileTap={{ scaleX: 1.1, scaleY: 0.88 }}
            onClick={() => open(id)}
            aria-label={label}
            className="relative flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-bold"
          >
            {on && (
              <motion.span
                layoutId="dock-pill"
                className="btn-vivid pointer-events-none absolute inset-0 rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className={cn("relative flex items-center gap-1.5", on && "text-primary-foreground")}>
              <Icon className="size-5" />
              {on && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} className="overflow-hidden whitespace-nowrap">
                  {label}
                </motion.span>
              )}
            </span>
          </MiseButton>
        );
      })}
    </motion.nav>
  );
}
