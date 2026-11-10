import { useRef, useState } from "react";
import { ClipboardPaste, FileJson, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { MiseButton } from "./MiseButton";
import type { Dieta } from "@/lib/dieta";
import { salvarDieta } from "@/lib/dietaAtual";
import { COLAGEM_VAZIA, concluirColagem, receberParte, resumoDieta, type Colagem, type Resultado } from "@/lib/importar";
import { zerarSemana } from "@/lib/semana";
import { cn, lerTexto } from "@/lib/utils";

type Situacao = { tom: "ok" | "espera" | "erro"; texto: string };

/** Caixa "Colar minha dieta": aceita o bloco inteiro da IA, em uma ou mais partes. */
export function ColarDieta({ rotuloFinal, onConcluir }: { rotuloFinal: string; onConcluir: (d: Dieta) => void }) {
  const [texto, setTexto] = useState("");
  const [colagem, setColagem] = useState<Colagem>(COLAGEM_VAZIA);
  const [situacao, setSituacao] = useState<Situacao | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  const conferir = (t: string) => {
    if (!t.trim()) return setSituacao({ tom: "erro", texto: "A caixa está vazia. Cole o bloco que a IA gerou." });
    const r = receberParte(colagem, t);
    setColagem(r.colagem);
    if (r.estado === "erro") return setSituacao({ tom: "erro", texto: r.mensagem });
    setTexto("");
    if (r.estado === "aguardando") return setSituacao({ tom: "espera", texto: r.mensagem });
    setResultado(r.resultado);
    setSituacao({ tom: r.resultado.ok ? "ok" : "erro", texto: r.mensagem });
  };

  const colar = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (!t.trim()) return toast("A área de transferência está vazia");
      setTexto(t);
      conferir(t);
    } catch {
      toast("O navegador não deixou colar. Toque na caixa, segure e escolha Colar.");
    }
  };

  const recomecar = () => {
    setColagem(COLAGEM_VAZIA);
    setResultado(null);
    setSituacao(null);
    setTexto("");
  };

  const usar = async (d: Dieta) => {
    await salvarDieta(d);
    await zerarSemana();
    toast.success("Dieta salva neste aparelho");
    onConcluir(d);
  };

  const forcar = () => {
    const r = concluirColagem(colagem);
    setResultado(r);
    setSituacao({ tom: r.ok ? "ok" : "erro", texto: r.ok ? "Dieta conferida com o que já chegou." : "Ainda há pontos para corrigir." });
  };

  const copiarErros = async (erros: string[]) => {
    const t = `A dieta que você gerou deu estes problemas no app Mise. Corrija só isso e envie o arquivo inteiro de novo, no mesmo formato:\n\n${erros.map((e) => `- ${e}`).join("\n")}`;
    try {
      await navigator.clipboard.writeText(t);
      toast.success("Erros copiados: cole na conversa com a IA");
    } catch {
      toast("Não deu para copiar");
    }
  };

  const resumo = resultado?.ok ? resumoDieta(resultado.dieta) : null;

  return (
    <div className="space-y-3">
      {!resultado?.ok && (
        <>
          <textarea
            aria-label="Colar minha dieta"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Cole aqui o bloco que a IA gerou"
            rows={5}
            className="w-full resize-none rounded-2xl bg-muted p-3 font-mono text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <MiseButton onClick={colar} className="glass flex items-center justify-center gap-2 font-bold">
              <ClipboardPaste className="size-4" /> Colar
            </MiseButton>
            <MiseButton onClick={() => conferir(texto)} className="btn-vivid font-bold">
              Conferir
            </MiseButton>
          </div>
          <MiseButton onClick={() => arquivo.current?.click()} className="mx-auto flex items-center gap-1 text-xs font-semibold text-muted-foreground underline">
            <FileJson className="size-3.5" /> Tenho um arquivo .json
          </MiseButton>
          <input
            ref={arquivo}
            type="file"
            accept="application/json,.json,text/plain"
            className="hidden"
            data-testid="arquivo-dieta"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) conferir(await lerTexto(f));
            }}
          />
        </>
      )}

      {situacao && (
        <p role="status" className={cn("rounded-2xl p-3 text-sm font-semibold", situacao.tom === "ok" && "bg-primary/15", situacao.tom === "espera" && "bg-muted", situacao.tom === "erro" && "bg-destructive/15 text-destructive")}>
          {situacao.texto}
        </p>
      )}

      {colagem.partes.length > 0 && !resultado && (
        <MiseButton onClick={forcar} className="mx-auto block text-xs font-semibold text-muted-foreground underline">
          A IA já mandou tudo? Usar o que colei
        </MiseButton>
      )}

      {resultado && !resultado.ok && (
        <div className="space-y-2">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {resultado.erros.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <MiseButton onClick={() => void copiarErros(resultado.erros)} className="btn-vivid w-full font-bold">
            Copiar os erros para a IA
          </MiseButton>
        </div>
      )}

      {resumo && resultado?.ok && (
        <div className="space-y-3">
          <div className="glass space-y-2 p-3 text-sm">
            <p className="font-extrabold">Dieta de {resumo.nome}</p>
            <p className="text-muted-foreground">
              Meta: {resumo.metas.kcal} kcal · {resumo.metas.P} g de proteína por dia
            </p>
            {resumo.letras.map((l) => (
              <p key={l.letra}>
                <b>Letra {l.letra}</b> · {l.tema || "sem tema"} · {Math.round(l.kcal)} kcal
              </p>
            ))}
          </div>
          {resultado.avisos.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {resultado.avisos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          <MiseButton onClick={() => usar(resultado.dieta)} className="btn-vivid w-full font-bold">
            {rotuloFinal}
          </MiseButton>
        </div>
      )}

      {(colagem.partes.length > 0 || resultado) && (
        <MiseButton onClick={recomecar} className="mx-auto flex items-center gap-1 text-xs font-semibold text-muted-foreground underline">
          <RotateCcw className="size-3.5" /> Recomeçar
        </MiseButton>
      )}
    </div>
  );
}
