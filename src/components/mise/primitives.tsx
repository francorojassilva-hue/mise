import { MiseButton } from "./MiseButton";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type HTMLMotionProps } from "framer-motion";
import { useEffect, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const spring = { type: "spring", stiffness: 380, damping: 30 } as const;

export const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
export const itemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 24 } },
} as const;

/** Card de vidro com brilho que segue o dedo. */
export function GlassCard({ className, children, glow = true, ...rest }: HTMLMotionProps<"div"> & { glow?: boolean; children?: ReactNode }) {
  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);
  const bg = useTransform(
    [mx, my],
    ([x, y]) => `radial-gradient(220px circle at ${x}px ${y}px, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%)`,
  );
  return (
    <motion.div
      variants={itemVariants}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      onPointerLeave={() => {
        mx.set(-200);
        my.set(-200);
      }}
      className={cn("glass overflow-hidden", className)}
      role={rest.onClick ? "button" : undefined}
      tabIndex={rest.onClick ? 0 : undefined}
      onKeyDown={
        rest.onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.currentTarget.click();
              }
            }
          : undefined
      }
      {...rest}
    >
      {glow && <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: bg }} />}
      <div className="relative">{children}</div>
    </motion.div>
  );
}

/** Botão com efeito squash ao tocar. */
export function Squash({ className, children, ...rest }: HTMLMotionProps<"button">) {
  return (
    <MiseButton
      type="button"
      whileTap={{ scaleX: 1.06, scaleY: 0.9 }}
      whileHover={{ y: -1 }}
      transition={spring}
      className={cn("min-h-11 min-w-11 select-none outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...rest}
    >
      {children}
    </MiseButton>
  );
}

export function CountUp({ to, duration = 1.2, className }: { to: number; duration?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) {
      setV(to);
      return;
    }
    const c = animate(0, to, { duration, ease: "easeOut", onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [to, duration, reduce]);
  return <span className={cn("tnum", className)}>{v.toLocaleString("pt-BR")}</span>;
}

export function Ring({ value, max, size = 120, stroke = 12, color, children }: { value: number; max: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const gid = `ring-${useId().replace(/:/g, "")}`;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-muted" strokeWidth={stroke} opacity={0.6} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color ?? `url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/** Avisos de capacidade (freezer, bocas...) em faixas amarelas. */
export function Avisos({ itens }: { itens: string[] }) {
  if (!itens.length) return null;
  return (
    <div className="space-y-1.5">
      {itens.map((t) => (
        <p key={t} className="rounded-2xl bg-warning/20 px-3 py-2 text-sm font-semibold">
          ⚠️ {t}
        </p>
      ))}
    </div>
  );
}
