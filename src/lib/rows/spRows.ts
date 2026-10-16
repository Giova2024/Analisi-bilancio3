import type { FinRow } from "@/components/FinTable";

export const spRows: FinRow[] = [
  { id: "liqImmediate", label: "Liquidità immediate", getValue: (c) => c.sp.liqImmediate.total, getBase: (c) => c.sp.totaleImpieghi, getItems: (c) => c.sp.liqImmediate.items },
  { id: "liquiditaDifferite", label: "Liquidità differite", getValue: (c) => c.sp.liquiditaDifferite.total, getBase: (c) => c.sp.totaleImpieghi, getItems: (c) => c.sp.liquiditaDifferite.items },
  { id: "rimanenze", label: "Rimanenze", getValue: (c) => c.sp.rimanenze.total, getBase: (c) => c.sp.totaleImpieghi, getItems: (c) => c.sp.rimanenze.items },
  { id: "attivoCircolante", label: "Totale Attivo Circolante", kind: "grp", getValue: (c) => c.sp.attivoCircolante.total, getBase: (c) => c.sp.totaleImpieghi },
  { id: "immatNette", label: "Immobilizzazioni immateriali", kind: "sub", getValue: (c) => c.sp.immatNette.total, getBase: (c) => c.sp.totaleImpieghi, getItems: (c) => c.sp.immatNette.items },
  { id: "matNette", label: "Immobilizzazioni materiali", kind: "sub", getValue: (c) => c.sp.matNette.total, getBase: (c) => c.sp.totaleImpieghi, getItems: (c) => c.sp.matNette.items },
  { id: "finImmob", label: "Immobilizzazioni finanziarie", kind: "sub", getValue: (c) => c.sp.finImmob.total, getBase: (c) => c.sp.totaleImpieghi, getItems: (c) => c.sp.finImmob.items },
  { id: "creditiOltre", label: "Crediti oltre 12 mesi", kind: "sub", getValue: (c) => c.sp.creditiOltre.total, getBase: (c) => c.sp.totaleImpieghi, getItems: (c) => c.sp.creditiOltre.items },
  { id: "immobilizzazioni", label: "Totale Immobilizzazioni", kind: "grp", getValue: (c) => c.sp.immobilizzazioni.total, getBase: (c) => c.sp.totaleImpieghi },
  { id: "totaleImpieghi", label: "TOTALE IMPIEGHI", kind: "tot", getValue: (c) => c.sp.totaleImpieghi, getBase: (c) => c.sp.totaleImpieghi },

  { id: "debitiBreve", label: "Debiti a breve", kind: "sub", getValue: (c) => c.sp.debitiBreve.total, getBase: (c) => c.sp.totaleFonti, getItems: (c) => c.sp.debitiBreve.items },
  { id: "rateiRiscPassivi", label: "Ratei e risconti passivi", kind: "sub", getValue: (c) => c.sp.rateiRiscPassivi.total, getBase: (c) => c.sp.totaleFonti, getItems: (c) => c.sp.rateiRiscPassivi.items },
  { id: "passivitaCorrenti", label: "Totale Passività Correnti", kind: "grp", getValue: (c) => c.sp.passivitaCorrenti.total, getBase: (c) => c.sp.totaleFonti },
  { id: "debitiOltre", label: "Debiti a lungo", kind: "sub", getValue: (c) => c.sp.debitiOltre.total, getBase: (c) => c.sp.totaleFonti, getItems: (c) => c.sp.debitiOltre.items },
  { id: "fondiRischi", label: "Fondi rischi", kind: "sub", getValue: (c) => c.sp.fondiRischi.total, getBase: (c) => c.sp.totaleFonti, getItems: (c) => c.sp.fondiRischi.items },
  { id: "tfr", label: "TFR", kind: "sub", getValue: (c) => c.sp.tfr.total, getBase: (c) => c.sp.totaleFonti, getItems: (c) => c.sp.tfr.items },
  { id: "passivitaConsolidate", label: "Totale Passività Consolidate", kind: "grp", getValue: (c) => c.sp.passivitaConsolidate.total, getBase: (c) => c.sp.totaleFonti },
  { id: "patrimonioNettoBase", label: "Capitale e riserve", kind: "sub", getValue: (c) => c.sp.patrimonioNettoBase.total, getBase: (c) => c.sp.totaleFonti, getItems: (c) => c.sp.patrimonioNettoBase.items },
  { id: "risultatoPeriodo", label: "Risultato del periodo", kind: "sub", getValue: (c) => c.sp.risultatoPeriodo.total, getBase: (c) => c.sp.totaleFonti, getItems: (c) => c.sp.risultatoPeriodo.items },
  { id: "patrimonioNetto", label: "Totale Patrimonio Netto", kind: "grp", getValue: (c) => c.sp.patrimonioNetto.total, getBase: (c) => c.sp.totaleFonti },
  { id: "totaleFonti", label: "TOTALE FONTI", kind: "tot", getValue: (c) => c.sp.totaleFonti, getBase: (c) => c.sp.totaleFonti },
];
