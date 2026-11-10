import { motion, useReducedMotion } from "framer-motion";

const blobs = [
  { c: "var(--blob-1)", s: "var(--blob-shape-1)", size: "70vmax", x: ["-20%", "10%", "-10%", "-20%"], y: ["-20%", "0%", "15%", "-20%"], d: 26, pos: "left-0 top-0" },
  { c: "var(--blob-2)", s: "var(--blob-shape-2)", size: "60vmax", x: ["10%", "-15%", "5%", "10%"], y: ["10%", "-10%", "-20%", "10%"], d: 22, pos: "right-0 top-1/4" },
  { c: "var(--blob-3)", s: "var(--blob-shape-3)", size: "55vmax", x: ["0%", "20%", "-10%", "0%"], y: ["10%", "-5%", "-15%", "10%"], d: 30, pos: "left-1/4 bottom-0" },
  { c: "var(--blob-4)", s: "var(--blob-shape-1)", size: "40vmax", x: ["-10%", "10%", "20%", "-10%"], y: ["0%", "15%", "-10%", "0%"], d: 24, pos: "right-1/4 bottom-1/4" },
];

export function MeshBackground() {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute ${b.pos} opacity-90 blur-3xl dark:opacity-75`}
          style={{ width: b.size, height: b.size, background: b.c, borderRadius: b.s, transition: "background 0.8s, border-radius 0.8s" }}
          animate={reduce ? {} : { x: b.x, y: b.y, rotate: [0, 40, -20, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div className="grain absolute inset-0" />
    </div>
  );
}
