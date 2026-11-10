import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

/** Tela cheia em cima do painel de baixo: o modal aninhado mantém foco e toque acima da gaveta. */
export function FullscreenPanel({ children, title, onClose }: { children: ReactNode; title: string; onClose: () => void }) {
  return (
    <Dialog.Root
      open
      onOpenChange={(aberto) => {
        if (!aberto) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-overlay" />
        <Dialog.Content aria-describedby={undefined} className="fixed inset-0 z-[101] mx-auto flex h-dvh min-w-0 max-w-md flex-col overflow-hidden bg-background p-4 text-foreground">
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
