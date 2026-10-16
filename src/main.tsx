import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import AppShell from "./components/AppShell";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppShell />
  </StrictMode>,
);
