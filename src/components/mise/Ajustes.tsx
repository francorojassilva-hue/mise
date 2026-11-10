import { useEffect, useState, type ReactNode } from "react";
import { BellRing, Copy, Moon, RotateCcw, Share2, Sun, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { MiseButton } from "./MiseButton";
import { Interruptor } from "./primitives";
import { SecaoBackup } from "./Backup";
import { ColarDieta } from "./ColarDieta";
import type { Dieta } from "@/lib/dieta";
import { atualizarDieta, useDieta, voltarAoExemplo } from "@/lib/dietaAtual";
import { alternarTipo, useAjustes } from "@/lib/ajustes";
import { exportarDieta } from "@/lib/importar";
import { TIPOS, type Tipo } from "@/lib/lembretes";
import { ATIVIDADE, DIAS, kcalMeta, perfilDe } from "@/lib/porcoes";
import { copiarTexto } from "@/lib/promptIA";
import { notificar, pedirPermissao } from "@/lib/pwa";
import { setExtra } from "@/lib/semana";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const OBJETIVOS = { perder_gordura: "Perder gordura", recomposicao: "Recomposição", ganhar_massa: "Ganhar massa", manter: "Manter" } as const;
const DIAS_PREPARO = { sabado: "Sáb", domingo: "Dom", segunda: "Seg" } as const;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-bold uppercase text-muted-foreground">{titulo}</p>
      {children}
    </section>
  );
}

function Chips<T extends string | number>({ opcoes, valor, onChange, rotulo }: { opcoes: readonly (readonly [T, string])[]; valor: T; onChange: (v: T) => void; rotulo: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={rotulo}>
      {opcoes.map(([v, nome]) => (
        <MiseButton key={String(v)} aria-pressed={valor === v} onClick={() => onChange(v)} className={cn("rounded-xl px-3 text-sm font-bold", valor === v ? "btn-vivid" : "glass")}>
          {nome}
        </MiseButton>
      ))}
    </div>
  );
}

/** Campo de texto ou número que só grava ao sair dele; valor inválido volta ao anterior. */
function Campo({ rotulo, valor, onSalvar, tipo = "text", validar }: { rotulo: string; valor: string; onSalvar: (v: string) => void; tipo?: "text" | "number" | "time"; validar?: (v: string) => boolean }) {
  const [v, setV] = useState(valor);
  useEffect(() => setV(valor), [valor]);
  const fechar = () => {
    const t = v.trim();
    if (t === valor) return;
    if (!t || (validar && !validar(t))) return setV(valor);
    onSalvar(t);
  };
  return (
    <label className="block text-xs font-bold text-muted-foreground">
      {rotulo}
      <input
        type={tipo}
        inputMode={tipo === "number" ? "decimal" : undefined}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={fechar}
        className="mt-1 min-h-11 w-full rounded-xl bg-muted px-3 text-base font-bold text-foreground"
      />
    </label>
  );
}

const numero = (v: string) => Number.isFinite(Number(v.replace(",", "."))) && Number(v.replace(",", ".")) > 0;
const lerNumero = (v: string) => Number(v.replace(",", "."));

function Aparencia() {
  const { mode, setMode } = useTheme();
  return (
    <div className="glass flex !rounded-full p-1" role="group" aria-label="Tema">
      {([["light", "Claro", Sun], ["dark", "Escuro", Moon]] as const).map(([id, nome, Icone]) => (
        <MiseButton key={id} aria-pressed={mode === id} onClick={() => setMode(id)} className={cn("flex flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold", mode === id && "btn-vivid")}>
          <Icone className="size-4" />
          {nome}
        </MiseButton>
      ))}
    </div>
  );
}

function Perfil({ d }: { d: Dieta }) {
  const p = perfilDe(d);
  const mudar = (campo: Partial<Dieta["pessoa"]>) => atualizarDieta((x) => ({ ...x, pessoa: { ...x.pessoa, ...campo } }));
  return (
    <Secao titulo="Perfil">
      <div className="glass space-y-3 p-4">
        <Campo rotulo="Nome" valor={d.pessoa.nome} onSalvar={(v) => mudar({ nome: v })} />
        <div className="grid grid-cols-3 gap-2">
          <Campo rotulo="Idade" tipo="number" valor={String(p.idade)} validar={numero} onSalvar={(v) => mudar({ idade: Math.round(lerNumero(v)) })} />
          <Campo rotulo="Altura (cm)" tipo="number" valor={String(p.altura)} validar={numero} onSalvar={(v) => mudar({ alturaCm: lerNumero(v) })} />
          <Campo rotulo="Peso (kg)" tipo="number" valor={String(p.peso)} validar={numero} onSalvar={(v) => mudar({ pesoKg: lerNumero(v) })} />
        </div>
        <Chips rotulo="Sexo" opcoes={[["f", "Feminino"], ["m", "Masculino"]] as const} valor={p.sexo} onChange={(v) => mudar({ sexo: v })} />
        <Chips rotulo="Atividade" opcoes={ATIVIDADE} valor={p.atividade} onChange={(v) => mudar({ atividade: v })} />
        <Chips rotulo="Objetivo" opcoes={Object.entries(OBJETIVOS) as [Dieta["pessoa"]["objetivo"], string][]} valor={d.pessoa.objetivo} onChange={(v) => mudar({ objetivo: v })} />
        <p className="text-xs text-muted-foreground">
          Gasto estimado: <b>{kcalMeta(p).toLocaleString("pt-BR")} kcal</b> por dia · meta da dieta: <b>{d.metas.kcal.toLocaleString("pt-BR")} kcal</b>. Mudar o perfil não refaz o cardápio: para isso, gere uma dieta nova.
        </p>
      </div>
    </Secao>
  );
}

function Refeicoes({ d }: { d: Dieta }) {
  const mudar = (id: string, campo: Partial<Dieta["refeicoes"][number]>) => atualizarDieta((x) => ({ ...x, refeicoes: x.refeicoes.map((r) => (r.id === id ? { ...r, ...campo } : r)) }));
  return (
    <Secao titulo="Refeições">
      <div className="glass space-y-3 p-4">
        {d.refeicoes.map((r) => (
          <div key={r.id} className="grid grid-cols-[1fr_7.5rem] gap-2">
            <Campo rotulo={`Nome (${r.id})`} valor={r.nome} onSalvar={(v) => mudar(r.id, { nome: v })} />
            <Campo rotulo={`Horário de ${r.nome}`} tipo="time" valor={r.hora} validar={(v) => HORA.test(v)} onSalvar={(v) => mudar(r.id, { hora: v })} />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">Dá para mudar nome e horário. Para ter mais ou menos refeições, gere uma dieta nova.</p>
      </div>
    </Secao>
  );
}

function PessoaExtra({ d }: { d: Dieta }) {
  const e = d.pessoaExtra;
  const mudar = (campo: Partial<NonNullable<Dieta["pessoaExtra"]>> | null) => {
    void atualizarDieta((x) => ({ ...x, pessoaExtra: campo === null ? null : { ...(x.pessoaExtra as NonNullable<Dieta["pessoaExtra"]>), ...campo } }));
    setExtra(undefined);
  };
  if (!e)
    return (
      <Secao titulo="Pessoa extra">
        <MiseButton
          onClick={() => {
            void atualizarDieta((x) => ({ ...x, pessoaExtra: { nome: "Pessoa extra", fator: 1, refeicoes: x.refeicoes.map((r) => r.id), dias: [0, 1, 2, 3, 4, 5, 6] } }));
            setExtra(undefined);
          }}
          className="glass flex w-full items-center justify-center gap-2 font-bold"
        >
          <UserPlus className="size-4" /> Cozinhar para mais uma pessoa
        </MiseButton>
      </Secao>
    );
  const alterna = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);
  return (
    <Secao titulo="Pessoa extra">
      <div className="glass space-y-3 p-4">
        <Campo rotulo="Nome" valor={e.nome} onSalvar={(v) => mudar({ nome: v })} />
        <Chips rotulo="Porção" opcoes={[[0.8, "Menor (0,8)"], [1, "Igual"], [1.2, "Maior (1,2)"]] as const} valor={e.fator} onChange={(v) => mudar({ fator: v })} />
        <div className="space-y-1">
          <p className="text-xs font-bold text-muted-foreground">Refeições</p>
          <div className="flex flex-wrap gap-2">
            {d.refeicoes.map((r) => (
              <MiseButton key={r.id} aria-pressed={e.refeicoes.includes(r.id)} onClick={() => mudar({ refeicoes: alterna(e.refeicoes, r.id) })} className={cn("rounded-xl px-3 text-sm font-bold", e.refeicoes.includes(r.id) ? "btn-vivid" : "glass")}>
                {r.nome}
              </MiseButton>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-muted-foreground">Dias</p>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((nome, i) => (
              <MiseButton key={nome} aria-pressed={e.dias.includes(i)} onClick={() => mudar({ dias: alterna(e.dias, i) })} className={cn("rounded-xl px-3 text-sm font-bold capitalize", e.dias.includes(i) ? "btn-vivid" : "glass")}>
                {nome}
              </MiseButton>
            ))}
          </div>
        </div>
        <MiseButton onClick={() => mudar(null)} className="glass flex w-full items-center justify-center gap-2 font-bold text-destructive">
          <Trash2 className="size-4" /> Tirar a pessoa extra
        </MiseButton>
      </div>
    </Secao>
  );
}

function Preparo({ d }: { d: Dieta }) {
  const dia = d.cozinha.diaPreparo;
  const opcoes = (Object.entries(DIAS_PREPARO) as [Dieta["cozinha"]["diaPreparo"], string][]).concat(dia in DIAS_PREPARO ? [] : [[dia, dia]]);
  return (
    <Secao titulo="Dia do preparo">
      <Chips rotulo="Dia do preparo" opcoes={opcoes} valor={dia} onChange={(v) => atualizarDieta((x) => ({ ...x, cozinha: { ...x.cozinha, diaPreparo: v } }))} />
    </Secao>
  );
}

function Lembretes() {
  const a = useAjustes();
  const alternar = async (t: Tipo) => {
    if (!a.tipos[t] && !(await pedirPermissao())) toast("Sem permissão de notificação: os avisos aparecem só dentro do app.");
    await alternarTipo(t);
  };
  return (
    <Secao titulo="Lembretes">
      <div className="space-y-2">
        {(Object.keys(TIPOS) as Tipo[]).map((t) => (
          <div key={t} className="glass flex min-h-11 items-center gap-3 p-3">
            <span className="flex-1 font-semibold">{TIPOS[t]}</span>
            <Interruptor ligado={!!a.tipos[t]} onChange={() => void alternar(t)} rotulo={TIPOS[t]} />
          </div>
        ))}
        <MiseButton
          onClick={async () => {
            if (!(await pedirPermissao()) || !(await notificar("Mise", "Assim chegam os seus lembretes 🔔"))) toast("Assim chegam os seus lembretes 🔔");
          }}
          className="glass flex w-full items-center justify-center gap-2 font-bold"
        >
          <BellRing className="size-4" /> Testar um aviso
        </MiseButton>
        <p className="text-xs text-muted-foreground">Os avisos só tocam com o app aberto ou em segundo plano. Servem para lembrar horários; dose é com seu médico.</p>
      </div>
    </Secao>
  );
}

function SuaDieta({ exemplo, d }: { exemplo: boolean; d: Dieta }) {
  const [subir, setSubir] = useState(false);
  const [confirma, setConfirma] = useState(false);
  const texto = () => exportarDieta(d);
  const compartilhar = async () => {
    if (navigator.share) await navigator.share({ title: `Dieta de ${d.pessoa.nome} no Mise`, text: texto() }).catch(() => undefined);
    else {
      await copiarTexto(texto());
      toast.success("Dieta copiada");
    }
  };
  return (
    <Secao titulo="Sua dieta">
      <div className="glass space-y-3 p-4">
        <p className="text-sm">{exemplo ? <>Você está usando a <b>dieta de exemplo</b>.</> : <>Dieta de <b>{d.pessoa.nome}</b>.</>}</p>
        <div className="grid grid-cols-2 gap-2">
          <MiseButton
            onClick={async () => {
              await copiarTexto(texto());
              toast.success("Dieta copiada");
            }}
            className="glass flex items-center justify-center gap-2 font-bold"
          >
            <Copy className="size-4" /> Copiar minha dieta
          </MiseButton>
          <MiseButton onClick={compartilhar} className="glass flex items-center justify-center gap-2 font-bold">
            <Share2 className="size-4" /> Compartilhar
          </MiseButton>
        </div>
        <MiseButton onClick={() => setSubir((v) => !v)} aria-expanded={subir} className="btn-vivid w-full font-bold">
          {subir ? "Fechar" : "Subir nova dieta"}
        </MiseButton>
        {subir && <ColarDieta rotuloFinal="Usar esta dieta" onConcluir={() => setSubir(false)} />}
        {!exemplo &&
          (confirma ? (
            <div className="flex gap-2">
              <MiseButton
                onClick={async () => {
                  await voltarAoExemplo();
                  setConfirma(false);
                  toast.success("Voltou para a dieta de exemplo");
                }}
                className="glass flex-1 font-bold text-destructive"
              >
                Sim, voltar ao exemplo
              </MiseButton>
              <MiseButton onClick={() => setConfirma(false)} className="glass flex-1 font-bold">
                Cancelar
              </MiseButton>
            </div>
          ) : (
            <MiseButton onClick={() => setConfirma(true)} className="glass flex w-full items-center justify-center gap-2 font-bold">
              <RotateCcw className="size-4" /> Voltar à dieta de exemplo
            </MiseButton>
          ))}
      </div>
    </Secao>
  );
}

export function AjustesBody() {
  const { dieta: d, exemplo } = useDieta();
  return (
    <div className="space-y-5 pb-6">
      <Aparencia />
      <Perfil d={d} />
      <Refeicoes d={d} />
      <PessoaExtra d={d} />
      <Preparo d={d} />
      <Lembretes />
      <SuaDieta exemplo={exemplo} d={d} />
      <SecaoBackup />
    </div>
  );
}
