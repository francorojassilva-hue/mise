import { motion } from "framer-motion";
import type { Anim } from "@/lib/acoes";
import { cn } from "@/lib/utils";

const loop = (d = 1.2) => ({ duration: d, repeat: Infinity, ease: "easeInOut" as const });
const Panela = () => (
  <g>
    <rect x="25" y="60" width="70" height="38" rx="8" className="fill-primary" />
    <rect x="18" y="56" width="84" height="8" rx="4" className="fill-foreground/70" />
  </g>
);

/** Animações por ação em SVG (com movimento reduzido, o MotionConfig global vira fade). */
export function AcaoAnim({ a, className }: { a: Anim; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={cn("mx-auto size-32 text-primary", className)} aria-hidden>
      {a === "ferver" && (
        <>
          <Panela />
          {[40, 60, 80].map((x, k) => (
            <motion.circle key={x} cx={x} cy={52} r={5} className="fill-accent" animate={{ cy: [55, 25], opacity: [1, 0] }} transition={{ ...loop(1.4), delay: k * 0.4 }} />
          ))}
        </>
      )}
      {a === "refogar" && (
        <>
          <Panela />
          <motion.g animate={{ rotate: [-18, 18, -18] }} style={{ originX: "60px", originY: "60px" }} transition={loop()}>
            <rect x="57" y="15" width="6" height="50" rx="3" className="fill-foreground" />
            <ellipse cx="60" cy="66" rx="9" ry="6" className="fill-foreground" />
          </motion.g>
        </>
      )}
      {a === "pressao" && (
        <>
          <Panela />
          <rect x="55" y="44" width="10" height="12" rx="2" className="fill-foreground" />
          {[0, 1, 2].map((k) => (
            <motion.circle key={k} cx={60} cy={38} r={6} className="fill-muted-foreground/60" animate={{ cy: [40, 8], r: [4, 12], opacity: [0.9, 0] }} transition={{ ...loop(1.5), delay: k * 0.5 }} />
          ))}
        </>
      )}
      {a === "airfryer" && (
        <>
          <rect x="25" y="20" width="70" height="85" rx="16" className="fill-primary" />
          <rect x="35" y="65" width="50" height="30" rx="6" className="fill-foreground/70" />
          <motion.g animate={{ rotate: 360 }} style={{ originX: "60px", originY: "42px" }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            {[0, 90, 180, 270].map((r) => (
              <rect key={r} x="58" y="30" width="4" height="12" rx="2" className="fill-primary-foreground" transform={`rotate(${r} 60 42)`} />
            ))}
          </motion.g>
        </>
      )}
      {a === "microondas" && (
        <>
          <rect x="12" y="25" width="96" height="70" rx="10" className="fill-primary" />
          <rect x="20" y="33" width="62" height="54" rx="6" className="fill-background/70" />
          <motion.ellipse cx="51" cy="75" rx="22" ry="5" className="fill-accent" animate={{ scaleX: [1, 0.6, 1] }} transition={loop(2)} />
          <circle cx="96" cy="45" r="4" className="fill-primary-foreground" />
        </>
      )}
      {a === "forno" && (
        <>
          <rect x="14" y="20" width="92" height="84" rx="12" className="fill-primary" />
          <circle cx="34" cy="31" r="3.5" className="fill-primary-foreground" />
          <circle cx="48" cy="31" r="3.5" className="fill-primary-foreground" />
          <rect x="24" y="42" width="72" height="52" rx="6" className="fill-background/70" />
          <motion.path d="M32 49 H88 M32 87 H88" className="stroke-accent" strokeWidth="3" strokeLinecap="round" animate={{ opacity: [0.3, 1, 0.3] }} transition={loop(1.6)} />
          <rect x="32" y="72" width="56" height="6" rx="3" className="fill-foreground/70" />
          <motion.ellipse cx="60" cy="68" rx="16" ry="5" className="fill-accent" animate={{ y: [0, -2, 0], scaleY: [1, 1.15, 1] }} transition={loop(2)} />
        </>
      )}
      {a === "cortar" && (
        <>
          <rect x="15" y="85" width="90" height="12" rx="4" className="fill-muted-foreground/50" />
          <motion.g animate={{ y: [0, 22, 0] }} transition={loop(0.6)}>
            <rect x="40" y="30" width="50" height="14" rx="3" className="fill-foreground/80" />
            <rect x="88" y="33" width="20" height="8" rx="3" className="fill-primary" />
          </motion.g>
        </>
      )}
      {a === "temperar" && (
        <>
          <Panela />
          {[45, 60, 75].map((x, k) => (
            <motion.circle key={x} cx={x} cy={10} r={3} className="fill-accent" animate={{ cy: [10, 58], opacity: [1, 0.2] }} transition={{ ...loop(1), delay: k * 0.3 }} />
          ))}
        </>
      )}
      {a === "desfiar" && (
        <>
          <ellipse cx="60" cy="85" rx="40" ry="12" className="fill-primary" />
          {[-1, 1].map((s) => (
            <motion.rect key={s} x={60 + s * 10 - 3} y={25} width={6} height={55} rx={3} className="fill-foreground/80" animate={{ x: [60 + s * 8 - 3, 60 + s * 22 - 3, 60 + s * 8 - 3] }} transition={loop(0.8)} />
          ))}
        </>
      )}
      {a === "montar" && (
        <>
          <rect x="25" y="40" width="70" height="60" rx="10" className="fill-muted-foreground/30" />
          <motion.rect x="25" width="70" rx="10" className="fill-primary" animate={{ y: [100, 45], height: [0, 55] }} transition={loop(2)} />
        </>
      )}
      {a === "congelar" && (
        <>
          <rect x="25" y="60" width="70" height="40" rx="10" className="fill-primary" />
          <motion.g animate={{ rotate: 360, y: [0, 6, 0] }} style={{ originX: "60px", originY: "30px" }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
            {[0, 60, 120].map((r) => (
              <rect key={r} x="58" y="12" width="4" height="36" rx="2" className="fill-accent" transform={`rotate(${r} 60 30)`} />
            ))}
          </motion.g>
        </>
      )}
      {a === "padrao" && (
        <>
          <Panela />
          <motion.path d="M45 45 q5 -10 0 -20 M60 45 q5 -10 0 -20 M75 45 q5 -10 0 -20" className="stroke-muted-foreground" strokeWidth="3" fill="none" strokeLinecap="round" animate={{ opacity: [0.2, 1, 0.2] }} transition={loop(1.6)} />
        </>
      )}
    </svg>
  );
}
