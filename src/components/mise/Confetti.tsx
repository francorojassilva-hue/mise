import { motion, useReducedMotion } from "framer-motion";

/** Confete que sai do centro do elemento posicionado. */
export function Confetti({ count = 24 }: { count?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const colors = ["var(--primary)", "var(--accent)", "var(--blob-2)", "var(--warn)", "var(--letter-c)"];
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
      {Array.from({ length: count }).map((_, i) => {
        const ang = (i / count) * Math.PI * 2;
        const dist = 40 + (i % 5) * 12;
        return (
          <motion.span
            key={i}
            className="absolute h-2 w-1.5 rounded-sm"
            style={{ background: colors[i % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(ang) * dist, y: Math.sin(ang) * dist + 30, opacity: 0, rotate: 360 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
