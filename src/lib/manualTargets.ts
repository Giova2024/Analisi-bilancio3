import type { ManualTarget } from "./types";

export const MANUAL_TARGETS: ManualTarget[] = [
  // Stato Patrimoniale
  { key: "liqImmediate", group: "sp", label: "Liquidità immediate (cassa, banche)", cls: ["AA", "C", 4, 0], sign: 1 },
  { key: "attFinNonImmob", group: "sp", label: "Attività finanziarie non immobilizzate", cls: ["AA", "C", 3, 0], sign: 1 },
  { key: "creditiBreve", group: "sp", label: "Crediti a breve (entro 12 mesi)", cls: ["AA", "C", 2, 0], sign: 1, breve: "entro" },
  { key: "creditiOltre", group: "sp", label: "Crediti oltre 12 mesi", cls: ["AA", "C", 2, 0], sign: 1, breve: "oltre" },
  { key: "rimanenze", group: "sp", label: "Rimanenze", cls: ["AA", "C", 1, 0], sign: 1 },
  { key: "rateiRiscAttivi", group: "sp", label: "Ratei e risconti attivi", cls: ["AA", "D", 0, 0], sign: 1 },
  { key: "immatNette", group: "sp", label: "Immobilizzazioni immateriali", cls: ["AA", "B", 1, 0], sign: 1 },
  { key: "matNette", group: "sp", label: "Immobilizzazioni materiali", cls: ["AA", "B", 2, 0], sign: 1 },
  { key: "finImmob", group: "sp", label: "Immobilizzazioni finanziarie", cls: ["AA", "B", 3, 0], sign: 1 },
  { key: "creditiSoci", group: "sp", label: "Crediti v/soci per versamenti dovuti", cls: ["AA", "A", 0, 0], sign: 1 },
  { key: "patrimonioNettoBase", group: "sp", label: "Capitale e riserve", cls: ["AP", "A", 0, 0], sign: -1 },
  { key: "fondiRischi", group: "sp", label: "Fondi rischi e oneri", cls: ["AP", "B", 0, 0], sign: -1 },
  { key: "tfr", group: "sp", label: "TFR", cls: ["AP", "C", 0, 0], sign: -1 },
  { key: "debitiBreve", group: "sp", label: "Debiti a breve (entro 12 mesi)", cls: ["AP", "D", 0, 0], sign: -1, breve: "entro" },
  { key: "debitiOltre", group: "sp", label: "Debiti a lungo (oltre 12 mesi)", cls: ["AP", "D", 0, 0], sign: -1, breve: "oltre" },
  { key: "rateiRiscPassivi", group: "sp", label: "Ratei e risconti passivi", cls: ["AP", "E", 0, 0], sign: -1 },

  // Conto Economico
  { key: "ricaviVendite", group: "ce", label: "Ricavi delle vendite e prestazioni", cls: ["CE", "A", 0, 1], sign: -1 },
  { key: "varRimProdotti", group: "ce", label: "Variazione rimanenze prodotti", cls: ["CE", "A", 0, 2], sign: -1 },
  { key: "incrementiInterni", group: "ce", label: "Incrementi per lavori interni", cls: ["CE", "A", 0, 4], sign: -1 },
  { key: "altriRicavi", group: "ce", label: "Altri ricavi e proventi", cls: ["CE", "A", 0, 5], sign: -1 },
  { key: "materiePrime", group: "ce", label: "Materie prime, sussidiarie, merci", cls: ["CE", "B", 0, 6], sign: 1 },
  { key: "varRimMaterie", group: "ce", label: "Variazione rimanenze materie/merci", cls: ["CE", "B", 0, 11], sign: 1 },
  { key: "servizi", group: "ce", label: "Servizi", cls: ["CE", "B", 0, 7], sign: 1 },
  { key: "godimentoTerzi", group: "ce", label: "Godimento beni di terzi", cls: ["CE", "B", 0, 8], sign: 1 },
  { key: "oneriDiversi", group: "ce", label: "Oneri diversi di gestione", cls: ["CE", "B", 0, 14], sign: 1 },
  { key: "costoLavoro", group: "ce", label: "Costo del lavoro", cls: ["CE", "B", 0, 9], sign: 1 },
  { key: "ammortamenti", group: "ce", label: "Ammortamenti e svalutazioni", cls: ["CE", "B", 0, 10], sign: 1 },
  { key: "accantonamenti", group: "ce", label: "Accantonamenti per rischi/oneri", cls: ["CE", "B", 0, 12], sign: 1 },
  { key: "gestioneFinanziaria", group: "ce", label: "Gestione finanziaria (proventi-oneri)", cls: ["CE", "C", 0, 16], sign: -1 },
  { key: "rettificheAttFin", group: "ce", label: "Rettifiche attività finanziarie", cls: ["CE", "D", 0, 18], sign: -1 },
  { key: "imposte", group: "ce", label: "Imposte sul reddito", cls: ["CE", "D", 0, 20], sign: 1 },
];

export function getManualTarget(key: string): ManualTarget | undefined {
  return MANUAL_TARGETS.find((t) => t.key === key);
}
