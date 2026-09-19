import type { AppState, Periodo } from "./types";

export function exportJson(state: AppState) {
  const payload = {
    app: "analisi-bilancio",
    version: 1,
    exportedAt: new Date().toISOString(),
    periods: state.periods.map((p: Periodo) => ({
      id: p.id,
      label: p.label,
      date: p.date,
      fyStart: p.fyStart,
      type: p.type,
      filename: p.filename,
      accounts: p.accounts,
    })),
    overrides: state.overrides,
    varFixOverrides: state.varFixOverrides,
    bepInputs: state.bepInputs,
    manualEntries: state.manualEntries,
    businessPlan: state.businessPlan,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `analisi-bilancio-dati_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ImportedJson {
  periods: Periodo[];
  overrides: AppState["overrides"];
  varFixOverrides: AppState["varFixOverrides"];
  bepInputs: AppState["bepInputs"];
  manualEntries: AppState["manualEntries"];
  businessPlan: AppState["businessPlan"];
  exportedAt?: string;
}

export function parseImportedJson(raw: unknown): ImportedJson {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("File JSON non valido.");
  }
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.periods)) {
    throw new Error("Il file non contiene un elenco di periodi valido.");
  }
  const periods: Periodo[] = (data.periods as Record<string, unknown>[]).map((p, i) => ({
    id: typeof p.id === "string" ? p.id : `p_import_${Date.now()}_${i}`,
    label: typeof p.label === "string" ? p.label : "Periodo",
    date: typeof p.date === "string" ? p.date : new Date().toISOString().slice(0, 10),
    fyStart: typeof p.fyStart === "string" ? p.fyStart : new Date().toISOString().slice(0, 10),
    type: p.type === "annuale" ? "annuale" : "infrannuale",
    filename: typeof p.filename === "string" ? p.filename : "",
    accounts: Array.isArray(p.accounts) ? (p.accounts as Periodo["accounts"]) : [],
  }));

  return {
    periods,
    overrides: (data.overrides as AppState["overrides"]) || {},
    varFixOverrides: (data.varFixOverrides as AppState["varFixOverrides"]) || {},
    bepInputs: (data.bepInputs as AppState["bepInputs"]) || {},
    manualEntries: (data.manualEntries as AppState["manualEntries"]) || {},
    businessPlan: (data.businessPlan as AppState["businessPlan"]) || null,
    exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : undefined,
  };
}
