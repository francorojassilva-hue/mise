import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, RotateCcw, Share2 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { MiseButton } from "./MiseButton";
import { Avisos } from "./primitives";
import { avisosCapacidade } from "@/lib/cozinhar";
import { householdNeed, porSecao } from "@/lib/cycle";
import { alimentoDe, LETRAS } from "@/lib/dieta";
import { useDieta } from "@/lib/dietaAtual";
import { listaCompras, primeiraCompra, total, type ItemCompra } from "@/lib/mercado";
import { pessoasDaSemana, porcoes } from "@/lib/porcoes";
import { usePrecos } from "@/lib/precos";
import { alternarPego, limparPegos, useSemana } from "@/lib/semana";
import { cn } from "@/lib/utils";

const rs = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Texto da lista agrupado por mercado, pronto para mandar no WhatsApp. */
export function textoDaLista(itens: ItemCompra[], nomeDaLoja: (id: string) => string, totalEstimado: number) {
  const lojas = [...new Set(itens.map((i) => i.loja))];
  const blocos = lojas.map((loja) => `*${nomeDaLoja(loja) || "Outros"}*\n` + itens.filter((i) => i.loja === loja).map((i) => `• ${i.desc}: ${i.texto}`).join("\n"));
  return `${blocos.join("\n\n")}\n\nTotal ≈ ${rs(totalEstimado)}`;
}

export function Mercado() {
  const { dieta: d } = useDieta();
  const s = useSemana();
  const precos = usePrecos();
  const [kit, setKit] = useState(false);
  const [grafico, setGrafico] = useState(false);
  const pessoas = pessoasDaSemana(d, s.extra === undefined ? d.pessoaExtra : s.extra);
  const porc = useMemo(() => porcoes(d, s.removidas, pessoas), [d, s.removidas, pessoas]);
  const base = useMemo(() => listaCompras(d, s.letra, precos, s.swaps, porc), [d, s.letra, precos, s.swaps, porc]);
  const ativos = useMemo(() => (kit ? [...base, ...primeiraCompra(d)] : base).filter((i) => i.qtd > 0), [base, kit, d]);
  const totalEstimado = total(ativos);
  const pegos = ativos.filter((i) => s.pegos.includes(i.id)).length;
  const orcamento = d.mercado.orcamentoSemanal;
  const nomeDaLoja = (id: string) => d.mercado.lojas.find((l) => l.id === id || l.nome === id)?.nome ?? id;
  const porLetra = LETRAS.map((l) => ({ nome: l, v: Math.round(total(listaCompras(d, l, precos, s.swaps, porc))) }));

  async function compartilhar() {
    const txt = textoDaLista(ativos, nomeDaLoja, totalEstimado);
    if (navigator.share) {
      try {
        await navigator.share({ text: txt });
      } catch (erro) {
        if (!(erro instanceof DOMException && erro.name === "AbortError")) throw erro;
      }
    } else window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-bold text-muted-foreground">Estimado</span>
          <span className="tnum text-3xl font-black">
            {rs(totalEstimado)}
            {orcamento > 0 && <span className="ml-2 text-sm text-muted-foreground">/ {rs(orcamento)}</span>}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${ativos.length ? (pegos / ativos.length) * 100 : 0}%` }} />
        </div>
        <p className="tnum text-sm font-bold text-muted-foreground">
          {pegos} de {ativos.length} pegos
        </p>
      </div>

      <Avisos itens={avisosCapacidade(d, s.letra, porc)} />

      {porSecao(ativos).map((secao) => (
        <section key={secao.grupo} className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-muted-foreground">{secao.rotulo}</h3>
          {secao.itens.map((item) => {
            const ok = s.pegos.includes(item.id);
            return (
              <motion.div layout key={item.id} className="glass flex items-center gap-3 p-3">
                <MiseButton
                  onClick={() => alternarPego(item.id)}
                  aria-label={`Peguei ${item.desc}`}
                  aria-pressed={ok}
                  className={cn("grid size-11 shrink-0 place-items-center rounded-full border-2", ok ? "btn-vivid border-transparent text-primary-foreground" : "border-border")}
                >
                  {ok && <Check className="size-5" />}
                </MiseButton>
                <div className="min-w-0 flex-1">
                  <p className={cn("break-words font-bold leading-snug", ok && "line-through")}>{item.desc}</p>
                  <p className="text-sm font-bold text-muted-foreground">{householdNeed(d, item, s.letra, s.swaps, porc)}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.texto}
                    {item.loja && ` · ${nomeDaLoja(item.loja)}`}
                  </p>
                </div>
                <span className="tnum shrink-0 text-right font-black">{rs(item.preco)}</span>
              </motion.div>
            );
          })}
        </section>
      ))}
      {ativos.length === 0 && <p className="py-6 text-center font-semibold text-muted-foreground">Nada para comprar nesta semana</p>}

      {pegos > 0 && (
        <MiseButton onClick={limparPegos} className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
          <RotateCcw className="size-4" />
          Limpar marcações
        </MiseButton>
      )}

      <div className="glass p-4">
        <MiseButton aria-expanded={grafico} onClick={() => setGrafico(!grafico)} className="flex w-full items-center justify-between font-bold">
          Custos e médias
          <ChevronDown className={cn("size-5 transition-transform", grafico && "rotate-180")} />
        </MiseButton>
        {grafico && (
          <div className="space-y-3 pt-3">
            <p className="text-sm font-bold text-muted-foreground">A × B × C</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porLetra}>
                  <XAxis dataKey="nome" tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip formatter={(valor: number) => rs(valor)} />
                  <Bar dataKey="v" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {Object.keys(precos).length ? (
              <ul className="space-y-2">
                {Object.entries(precos).map(([id, valor]) => (
                  <li key={id} className="flex justify-between gap-3 text-sm">
                    <span>{alimentoDe(d, id)?.nome ?? id}</span>
                    <span className="tnum font-bold">{rs(valor)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Ainda sem preços médios guardados</p>
            )}
            {d.primeiraCompra.length > 0 && (
              <MiseButton onClick={() => setKit(!kit)} className="flex w-full items-center justify-between text-sm font-bold">
                1ª compra
                <span className="text-muted-foreground">{kit ? "incluída" : "temperos + potes"}</span>
              </MiseButton>
            )}
          </div>
        )}
      </div>

      <MiseButton onClick={compartilhar} className="flex w-full items-center justify-center gap-2 text-sm font-bold text-primary">
        <Share2 className="size-4" />
        Compartilhar
      </MiseButton>
    </div>
  );
}
