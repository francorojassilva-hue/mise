import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Lê um arquivo escolhido pela pessoa como texto (com alternativa para navegadores sem `Blob.text`). */
export function lerTexto(arquivo: Blob): Promise<string> {
  if (typeof arquivo.text === "function") return arquivo.text();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error);
    r.readAsText(arquivo);
  });
}
