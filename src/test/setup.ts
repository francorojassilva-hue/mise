import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

import { beforeEach, expect } from "vitest";

// por padrão os testes abrem o app já configurado; os testes do onboarding trocam isso
beforeEach(async () => {
  if (expect.getState().testPath?.includes("store.test")) return; // esse teste controla o próprio armazenamento
  const { setItem } = await import("@/lib/store");
  await setItem("onboarding", { feito: true, etapa: 0, refeicoes: [] });
});
