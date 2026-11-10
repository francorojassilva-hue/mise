import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

import { beforeEach } from "vitest";
import { setItem } from "@/lib/store";

// por padrão os testes abrem o app já configurado; os testes do onboarding trocam isso
beforeEach(async () => {
  await setItem("onboarding", { feito: true, etapa: 0, refeicoes: [] });
});
