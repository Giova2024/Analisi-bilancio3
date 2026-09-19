export const TABS = [
  { id: "import", label: "1 · Importazione" },
  { id: "sp", label: "Stato Patrimoniale" },
  { id: "ce", label: "Conto Economico" },
  { id: "bep", label: "Break Even Point" },
  { id: "idx", label: "Indici di Bilancio" },
  { id: "rf", label: "Rendiconto Finanziario" },
  { id: "kpi", label: "Dashboard KPI" },
  { id: "map", label: "Mappatura Conti" },
  { id: "rett", label: "Rettifiche Extracontabili" },
  { id: "bp", label: "Business Plan" },
] as const;

export type TabId = (typeof TABS)[number]["id"];
