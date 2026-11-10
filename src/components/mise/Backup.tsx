import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { MiseButton } from "./MiseButton";
import { backupEmTexto, montarBackup, nomeDoBackup, nomeDoItem, restaurarBackup } from "@/lib/backup";

/** Entrega o arquivo pelo Compartilhar do sistema; sem ele, baixa. */
async function entregar(nome: string, conteudo: string) {
  const arquivo = new File([conteudo], nome, { type: "application/json" });
  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: "Backup do Mise" });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

export function SecaoBackup() {
  const entrada = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  return (
    <section className="space-y-2">
      <p className="text-xs font-bold uppercase text-muted-foreground">Backup</p>
      <div className="glass space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          <MiseButton
            onClick={async () => {
              await entregar(nomeDoBackup(), backupEmTexto(await montarBackup()));
              toast.success("Backup pronto");
            }}
            className="glass flex items-center justify-center gap-2 font-bold"
          >
            <Download className="size-4" /> Fazer backup
          </MiseButton>
          <MiseButton onClick={() => entrada.current?.click()} className="glass flex items-center justify-center gap-2 font-bold">
            <Upload className="size-4" /> Restaurar backup
          </MiseButton>
        </div>
        <input
          ref={entrada}
          type="file"
          accept="application/json,.json,text/plain"
          className="hidden"
          data-testid="arquivo-backup"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            const r = await restaurarBackup(await f.text());
            if (r.ok) {
              setAviso(`Restaurado: ${r.itens.map(nomeDoItem).join(", ")}.`);
              toast.success("Backup restaurado");
            } else {
              setAviso(r.erro);
              toast.error(r.erro);
            }
          }}
        />
        {aviso && (
          <p role="status" className="text-sm font-semibold">
            {aviso}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Leva a dieta, a semana, os preços e os tempos. Guarde o arquivo fora do app (no Drive ou no WhatsApp) para não perder se limpar os dados do navegador.</p>
      </div>
    </section>
  );
}
