/**
 * Agenda os lembretes de hoje enquanto o app estiver aberto. Sem servidor de push,
 * app fechado não avisa (decisão do briefing). Ao voltar ao app, reagenda o que falta do dia.
 */
import { useEffect } from "react";
import { toast } from "sonner";
import { useAjustes } from "./ajustes";
import { useDieta } from "./dietaAtual";
import { lembretesDoDia, type Lembrete } from "./lembretes";
import { notificar } from "./pwa";
import { useSemana } from "./semana";

const LIMITE_MS = 2 ** 31 - 1;

/** Lembretes de hoje que ainda não passaram. */
export const faltamHoje = (lista: Lembrete[], agora: Date) => lista.filter((l) => +l.at > +agora);

export function useAgendador() {
  const { dieta } = useDieta();
  const ajustes = useAjustes();
  const { letra, removidas } = useSemana();

  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];
    const limpar = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };
    const agendar = () => {
      limpar();
      const agora = new Date();
      const hoje = faltamHoje(lembretesDoDia(dieta, agora, ajustes, letra, removidas), agora);
      for (const l of hoje) {
        const espera = +l.at - Date.now();
        if (espera <= 0 || espera > LIMITE_MS) continue;
        timers.push(
          setTimeout(() => {
            void notificar("Mise", l.texto).then((ok) => {
              if (!ok) toast(l.texto);
            });
          }, espera),
        );
      }
    };
    agendar();
    const aoVoltar = () => document.visibilityState === "visible" && agendar();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      document.removeEventListener("visibilitychange", aoVoltar);
      limpar();
    };
  }, [dieta, ajustes, letra, removidas]);
}
