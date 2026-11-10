import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Controle comum: preserva o visual de cada botão e captura ações que falham. */
export function MiseButton({
  onClick,
  disabled,
  type = "button",
  className,
  children,
  whileTap,
  whileHover,
  ...props
}: Omit<HTMLMotionProps<"button">, "onClick"> & {
  onClick?: ((event: React.MouseEvent<HTMLButtonElement>) => unknown) | undefined;
}) {
  const [busy, setBusy] = useState(false);
  const reduce = useReducedMotion();
  return (
    <Button asChild variant="bare">
      <motion.button
        {...props}
        type={type}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        {...(!reduce && whileTap ? { whileTap } : {})}
        {...(!reduce && whileHover ? { whileHover } : {})}
        className={cn("min-h-11 min-w-11 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed", className)}
        onClick={async (event) => {
          if (!onClick || busy) return;
          try {
            const result = onClick(event);
            if (result && typeof (result as Promise<unknown>).then === "function") {
              setBusy(true);
              await result;
            }
          } catch {
            toast.error("Não deu certo. Tenta de novo.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {children}
      </motion.button>
    </Button>
  );
}
