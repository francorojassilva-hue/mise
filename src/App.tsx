import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Moon, Sun, User, X } from "lucide-react";
import { MeshBackground } from "@/components/mise/MeshBackground";
import { MiseButton } from "@/components/mise/MiseButton";
import { AREAS, AreaPanel, type AreaId } from "@/components/mise/areas";
import { Dock } from "@/components/mise/Dock";
import { Squash, listVariants } from "@/components/mise/primitives";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useTheme } from "@/lib/theme";

function Cabecalho({ open }: { open: (a: AreaId) => void }) {
  const { letter, mode, setMode } = useTheme();
  return (
    <motion.header variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0 } }} className="flex items-center gap-3">
      <MiseButton
        onClick={() => open("ajustes")}
        aria-label="Ajustes"
        className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground ring-2 ring-glass-border"
      >
        <User className="size-5" />
      </MiseButton>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-extrabold">Olá</h1>
      </div>
      <Squash onClick={() => open("semana")} aria-label={`Semana ${letter}`} className="btn-vivid grid size-12 place-items-center rounded-2xl text-2xl font-black text-primary-foreground shadow-lg">
        <AnimatePresence mode="popLayout">
          <motion.span key={letter} initial={{ rotateX: 90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} exit={{ rotateX: -90, opacity: 0 }}>
            {letter}
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

export function App() {
  const [area, setArea] = useState<AreaId | null>(null);
  return (
    <LayoutGroup>
      <MeshBackground />
      <div className="mx-auto min-h-dvh max-w-md px-4 pb-32 pt-4">
        <motion.main variants={listVariants} initial="hidden" animate="show" className="space-y-4">
          <Cabecalho open={setArea} />
          <div className="glass grid h-48 place-items-center p-5 text-center font-semibold text-muted-foreground">Hoje — em construção</div>
        </motion.main>
      </div>

      <Drawer open={!!area} onOpenChange={(o) => !o && setArea(null)}>
        <DrawerContent className="glass-strong mx-auto max-h-[96dvh] max-w-md rounded-t-[28px] border-x-0 border-b-0 px-5 pb-24">
          <DrawerTitle className="sr-only">{area ? AREAS[area].label : ""}</DrawerTitle>
          <DrawerDescription className="sr-only">Painel da aba aberta</DrawerDescription>
          <MiseButton aria-label="Fechar" onClick={() => setArea(null)} className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full">
            <X className="size-5" />
          </MiseButton>
          <div className="min-h-0 overflow-y-auto pt-4">{area && <AreaPanel id={area} />}</div>
          <Dock active={area} open={setArea} />
        </DrawerContent>
      </Drawer>

      {!area && <Dock active={null} open={setArea} />}
    </LayoutGroup>
  );
}
