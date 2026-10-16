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
        .replace(/<link rel="stylesheet" crossorigin href=/g, '<link rel="stylesheet" href=')
        // Nella build il messaggio "file di sviluppo" diventa un avviso mostrato solo se lo
        // script non parte (React sostituisce il contenuto di #root appena si avvia).
        .replace(
          /<!-- boot-fallback:start -->[\s\S]*?<!-- boot-fallback:end -->/,
          `<noscript><div style="max-width:640px;margin:60px auto;padding:20px 24px;font:15px/1.5 'Segoe UI',Arial,sans-serif">Per usare l'applicazione è necessario abilitare JavaScript.</div></noscript>
      <div style="max-width:640px;margin:60px auto;padding:20px 24px;font:15px/1.5 'Segoe UI',Arial,sans-serif;color:#64748b">Caricamento in corso… Se questo messaggio non scompare, verifica che la cartella <b>assets</b> sia accanto a index.html.</div>`
        );
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
