export type Letra = "A" | "B" | "C";
export type Mode = "light" | "dark";
export const validLetter = (value: unknown): Letra => (value === "B" || value === "C" ? value : "A");
/** O app abre sempre no claro, a menos que a pessoa tenha escolhido o escuro. */
export const restoredMode = (value: unknown): Mode => (value === "dark" ? "dark" : "light");
