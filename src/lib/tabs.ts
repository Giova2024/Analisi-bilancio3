export const TABS = [
  { id: "import", label: "1 · Importazione", icon: "📥" },
  { id: "sp", label: "Stato Patrimoniale", icon: "🏛" },
  { id: "ce", label: "Conto Economico", icon: "📈" },
  { id: "bep", label: "Break Even Point", icon: "⚖️" },
  { id: "idx", label: "Indici di Bilancio", icon: "📊" },
  { id: "rf", label: "Rendiconto Finanziario", icon: "💧" },
  { id: "scost", label: "Analisi Scostamenti", icon: "🎯" },
  { id: "kpi", label: "Dashboard KPI", icon: "🧭" },
  { id: "map", label: "Mappatura Conti", icon: "🗂️" },
  { id: "rett", label: "Rettifiche Extracontabili", icon: "✏️" },
  { id: "bp", label: "Business Plan", icon: "🚀" },
] as const;

export type TabId = (typeof TABS)[number]["id"];
