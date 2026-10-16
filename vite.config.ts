import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

/**
 * L'app deve funzionare anche aprendo dist/index.html con un doppio clic (protocollo file://).
 * I browser bloccano gli script `type="module"` caricati da file://, quindi il bundle viene
 * generato in formato IIFE e incluso come script classico.
 */
function classicScriptForFileProtocol(): Plugin {
  return {
    name: "classic-script-for-file-protocol",
    apply: "build",
    enforce: "post",
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, '<script defer src="$1"></script>')
        .replace(/<link rel="stylesheet" crossorigin href=/g, '<link rel="stylesheet" href=');
    },
  };
}

export default defineConfig({
  // Percorsi relativi: la cartella dist/ può essere spostata o copiata dove si vuole.
  base: "./",
  plugins: [react(), tailwindcss(), classicScriptForFileProtocol()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    modulePreload: false,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        format: "iife",
        entryFileNames: "assets/app.js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
