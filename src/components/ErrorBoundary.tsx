import { Component, type ErrorInfo, type ReactNode } from "react";
import { LS_KEY } from "@/lib/store";

interface State {
  error: Error | null;
}

/**
 * Evita la pagina bianca in caso di errore: mostra il messaggio e permette di salvare
 * i dati del browser prima di azzerarli.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Errore dell'applicazione:", error, info.componentStack);
  }

  private downloadBackup = () => {
    let data = "";
    try {
      data = localStorage.getItem(LS_KEY) || "";
    } catch {
      /* localStorage non disponibile */
    }
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `analisi-bilancio-backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  private reset = () => {
    if (!window.confirm("Azzerare i dati salvati nel browser? Scarica prima il backup se ti servono.")) return;
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* localStorage non disponibile */
    }
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="max-w-[720px] mx-auto my-12 px-6">
        <div className="panel">
          <div className="panel-title">Si è verificato un errore</div>
          <div className="panel-desc">
            L&apos;applicazione non è riuscita a mostrare la pagina. Prova a ricaricarla; se l&apos;errore si
            ripete, può dipendere dai dati salvati nel browser.
          </div>
          <pre className="text-xs bg-panel-2 border border-border rounded-lg p-3 overflow-auto whitespace-pre-wrap mb-3">
            {error.message}
          </pre>
          <div className="flex gap-2 flex-wrap">
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              ↻ Ricarica
            </button>
            <button type="button" className="btn" onClick={this.downloadBackup}>
              ⬇ Scarica backup dei dati
            </button>
            <button type="button" className="btn btn-danger" onClick={this.reset}>
              🗑 Azzera i dati salvati
            </button>
          </div>
        </div>
      </div>
    );
  }
}
