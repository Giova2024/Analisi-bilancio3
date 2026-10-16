import type { ClassifiedAccount, PeriodCalc, RatioValue } from "../types";

export interface VarianceRow {
  id: string;
  label: string;
  kind?: "sub" | "tot" | "grp";
  getValue: (calc: PeriodCalc) => number;
  /** true = un aumento è favorevole, false = un aumento è sfavorevole, undefined = nessun giudizio (voce tecnica/neutra). */
  higherBetter?: boolean;
  /** Conti sottostanti confluiti in questa voce, se disponibili (per il dettaglio a comparsa). */
  getItems?: (calc: PeriodCalc) => ClassifiedAccount[];
}

export type Esito = "favorevole" | "sfavorevole" | "invariato";

/**
 * `epsilon` è la soglia (nella stessa unità di `delta`) sotto la quale lo scostamento è
 * considerato sostanzialmente nullo: per importi in euro si passa tipicamente 1 (scarti sotto
 * l'euro sono rumore di arrotondamento); per indici/percentuali/giorni si lascia il default,
 * praticamente zero, perché scarti anche piccoli (es. 0,02 = 2 punti di ROE) sono significativi.
 */
export function esitoFor(delta: number, higherBetter?: boolean, epsilon = 1e-9): Esito | null {
  if (higherBetter === undefined || !isFinite(delta)) return null;
  if (Math.abs(delta) < epsilon) return "invariato";
  const peggiorativo = higherBetter ? delta < 0 : delta > 0;
  return peggiorativo ? "sfavorevole" : "favorevole";
}

/**
 * Soglia di "invariato" per uno scostamento di indice, coerente con l'arrotondamento con cui
 * il valore viene mostrato (altrimenti due valori che sullo schermo appaiono identici, es.
 * "73,2% → 73,2%", potrebbero comunque risultare "Favorevole"/"Sfavorevole" per un residuo
 * di calcolo invisibile all'utente).
 */
export function epsilonForFormat(format: RatioValue["format"]): number {
  switch (format) {
    case "pct":
      return 0.0005; // metà del decimo di punto percentuale mostrato da fmtPct
    case "days":
      return 0.5; // fmtDays arrotonda al giorno intero
    case "eur":
      return 0.5; // fmtEur arrotonda all'euro intero
    default:
      return 0.005; // fmtRatio/fmtX mostrano 2 decimali
  }
}

export const CE_VARIANCE_ROWS: VarianceRow[] = [
  { id: "ricaviVendite", label: "Ricavi delle vendite e prestazioni", getValue: (c) => c.ce.ricaviVendite.total, higherBetter: true, getItems: (c) => c.ce.ricaviVendite.items },
  { id: "varRimProdotti", label: "Variazione rimanenze prodotti", kind: "sub", getValue: (c) => c.ce.varRimProdotti.total, getItems: (c) => c.ce.varRimProdotti.items },
  { id: "incrementiInterni", label: "Incrementi per lavori interni", kind: "sub", getValue: (c) => c.ce.incrementiInterni.total, higherBetter: true, getItems: (c) => c.ce.incrementiInterni.items },
  { id: "altriRicavi", label: "Altri ricavi e proventi", kind: "sub", getValue: (c) => c.ce.altriRicavi.total, higherBetter: true, getItems: (c) => c.ce.altriRicavi.items },
  { id: "valoreProduzione", label: "A) VALORE DELLA PRODUZIONE", kind: "tot", getValue: (c) => c.ce.valoreProduzione, higherBetter: true },

  { id: "materiePrime", label: "Materie prime", kind: "sub", getValue: (c) => c.ce.materiePrime.total, higherBetter: false, getItems: (c) => c.ce.materiePrime.items },
  { id: "varRimMaterie", label: "Variazione rimanenze materie", kind: "sub", getValue: (c) => c.ce.varRimMaterie.total, getItems: (c) => c.ce.varRimMaterie.items },
  { id: "servizi", label: "Servizi", kind: "sub", getValue: (c) => c.ce.servizi.total, higherBetter: false, getItems: (c) => c.ce.servizi.items },
  { id: "godimentoTerzi", label: "Godimento beni di terzi", kind: "sub", getValue: (c) => c.ce.godimentoTerzi.total, higherBetter: false, getItems: (c) => c.ce.godimentoTerzi.items },
  { id: "oneriDiversi", label: "Oneri diversi", kind: "sub", getValue: (c) => c.ce.oneriDiversi.total, higherBetter: false, getItems: (c) => c.ce.oneriDiversi.items },
  { id: "costiEsterni", label: "Costi esterni operativi", kind: "tot", getValue: (c) => c.ce.costiEsterni, higherBetter: false },
  { id: "valoreAggiunto", label: "VALORE AGGIUNTO", kind: "tot", getValue: (c) => c.ce.valoreAggiunto, higherBetter: true },

  { id: "costoLavoro", label: "Costo del lavoro", kind: "sub", getValue: (c) => c.ce.costoLavoro.total, higherBetter: false, getItems: (c) => c.ce.costoLavoro.items },
  { id: "ebitda", label: "EBITDA (Margine Operativo Lordo)", kind: "tot", getValue: (c) => c.ce.ebitda, higherBetter: true },

  { id: "ammortamenti", label: "Ammortamenti", kind: "sub", getValue: (c) => c.ce.ammortamenti.total, higherBetter: false, getItems: (c) => c.ce.ammortamenti.items },
  { id: "accantonamenti", label: "Accantonamenti", kind: "sub", getValue: (c) => c.ce.accantonamenti.total, higherBetter: false, getItems: (c) => c.ce.accantonamenti.items },
  { id: "ebit", label: "EBIT (Risultato Operativo)", kind: "tot", getValue: (c) => c.ce.ebit, higherBetter: true },

  { id: "straordinari", label: "Proventi e oneri straordinari", kind: "sub", getValue: (c) => c.ce.straordinari, higherBetter: true },
  { id: "gestioneFinanziaria", label: "Gestione finanziaria", kind: "sub", getValue: (c) => c.ce.gestioneFinanziaria.total, higherBetter: true, getItems: (c) => c.ce.gestioneFinanziaria.items },
  { id: "rettificheAttFin", label: "Rettifiche attività finanziarie", kind: "sub", getValue: (c) => c.ce.rettificheAttFin.total, higherBetter: true, getItems: (c) => c.ce.rettificheAttFin.items },
  { id: "ebt", label: "EBT (Risultato ante imposte)", kind: "tot", getValue: (c) => c.ce.ebt, higherBetter: true },

  { id: "imposte", label: "Imposte", kind: "sub", getValue: (c) => c.ce.imposte.total, higherBetter: false, getItems: (c) => c.ce.imposte.items },
  { id: "utileNetto", label: "UTILE (PERDITA) NETTO", kind: "tot", getValue: (c) => c.ce.utileNetto, higherBetter: true },
];

export const SP_VARIANCE_ROWS: VarianceRow[] = [
  { id: "attivoCircolante", label: "Totale Attivo Circolante", kind: "grp", getValue: (c) => c.sp.attivoCircolante.total, getItems: (c) => c.sp.attivoCircolante.items },
  { id: "immobilizzazioni", label: "Totale Immobilizzazioni", kind: "grp", getValue: (c) => c.sp.immobilizzazioni.total, getItems: (c) => c.sp.immobilizzazioni.items },
  { id: "totaleImpieghi", label: "TOTALE IMPIEGHI", kind: "tot", getValue: (c) => c.sp.totaleImpieghi },
  { id: "passivitaCorrenti", label: "Totale Passività Correnti", kind: "grp", getValue: (c) => c.sp.passivitaCorrenti.total, higherBetter: false, getItems: (c) => c.sp.passivitaCorrenti.items },
  { id: "passivitaConsolidate", label: "Totale Passività Consolidate", kind: "grp", getValue: (c) => c.sp.passivitaConsolidate.total, getItems: (c) => c.sp.passivitaConsolidate.items },
  { id: "patrimonioNetto", label: "Totale Patrimonio Netto", kind: "grp", getValue: (c) => c.sp.patrimonioNetto.total, higherBetter: true, getItems: (c) => c.sp.patrimonioNetto.items },
  { id: "pfn", label: "Posizione Finanziaria Netta", kind: "tot", getValue: (c) => c.sp.pfn, higherBetter: false },
];

/** Chiavi di RatiosResult da confrontare nel blocco "Principali indici". */
export const RATIO_VARIANCE_KEYS = [
  "roe",
  "roi",
  "ros",
  "ebitdaMargin",
  "currentRatio",
  "indipendenzaFin",
  "pfnEbitda",
  "dso",
] as const;
