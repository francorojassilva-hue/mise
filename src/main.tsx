import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { registerSW } from "virtual:pwa-register";
import "./styles.css";
import { App } from "./App";
import { ThemeProvider } from "./lib/theme";

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Toaster position="top-center" />
    </ThemeProvider>
  </StrictMode>,
);
