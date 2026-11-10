import { useEffect, useState } from "react";
import { LayoutGroup } from "framer-motion";
import { X } from "lucide-react";
import { MeshBackground } from "@/components/mise/MeshBackground";
import { MiseButton } from "@/components/mise/MiseButton";
import { AREAS, AreaPanel, type AreaId } from "@/components/mise/areas";
import { Dock } from "@/components/mise/Dock";
import { Hoje } from "@/components/mise/Hoje";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { carregarCuriosidades } from "@/lib/curiosidades";
import { carregarDieta } from "@/lib/dietaAtual";
import { carregarPrecos } from "@/lib/precos";
import { carregarTempos } from "@/lib/tempos";
import { carregarSemana, useSemana, verificarVirada } from "@/lib/semana";
import { useTheme } from "@/lib/theme";

export function App() {
  const [area, setArea] = useState<AreaId | null>(null);
  const { letra } = useSemana();
  const { setLetter } = useTheme();

  // a letra da semana manda no tema (cores do app)
  useEffect(() => setLetter(letra), [letra, setLetter]);

  // ao abrir: lê dieta, semana e curiosidades guardadas; ao voltar ao app, confere se virou a semana
  useEffect(() => {
    void carregarDieta();
    void carregarSemana();
    void carregarCuriosidades();
    void carregarPrecos();
    void carregarTempos();
    const aoVoltar = () => document.visibilityState === "visible" && verificarVirada();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, []);

  return (
    <LayoutGroup>
      <MeshBackground />
      <div className="mx-auto min-h-dvh max-w-md px-4 pb-32 pt-4">
        <Hoje open={setArea} />
      </div>

      <Drawer open={!!area} onOpenChange={(o) => !o && setArea(null)}>
        <DrawerContent className="glass-strong mx-auto max-h-[96dvh] max-w-md rounded-t-[28px] border-x-0 border-b-0 px-5 pb-24">
          <DrawerTitle className="sr-only">{area ? AREAS[area].label : ""}</DrawerTitle>
          <DrawerDescription className="sr-only">Painel da aba aberta</DrawerDescription>
          <MiseButton aria-label="Fechar" onClick={() => setArea(null)} className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full">
            <X className="size-5" />
          </MiseButton>
          <div className="min-h-0 overflow-y-auto pt-4">{area && <AreaPanel id={area} open={setArea} />}</div>
          <Dock active={area} open={setArea} />
        </DrawerContent>
      </Drawer>

      {!area && <Dock active={null} open={setArea} />}
    </LayoutGroup>
  );
}
