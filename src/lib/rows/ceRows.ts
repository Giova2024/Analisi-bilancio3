import type { FinRow } from "@/components/FinTable";

const baseVP = (c: import("../types").PeriodCalc) => c.ce.valoreProduzione;

export const ceVaRows: FinRow[] = [
  { id: "ricaviVendite", label: "Ricavi delle vendite e prestazioni", getValue: (c) => c.ce.ricaviVendite.total, getBase: baseVP, getItems: (c) => c.ce.ricaviVendite.items },
  { id: "varRimProdotti", label: "Variazione rimanenze prodotti", kind: "sub", getValue: (c) => c.ce.varRimProdotti.total, getBase: baseVP, getItems: (c) => c.ce.varRimProdotti.items },
  { id: "incrementiInterni", label: "Incrementi per lavori interni", kind: "sub", getValue: (c) => c.ce.incrementiInterni.total, getBase: baseVP, getItems: (c) => c.ce.incrementiInterni.items },
  { id: "altriRicavi", label: "Altri ricavi e proventi", kind: "sub", getValue: (c) => c.ce.altriRicavi.total, getBase: baseVP, getItems: (c) => c.ce.altriRicavi.items },
  { id: "valoreProduzione", label: "A) VALORE DELLA PRODUZIONE", kind: "grp", getValue: (c) => c.ce.valoreProduzione, getBase: baseVP },

  { id: "materiePrime", label: "Materie prime", kind: "sub", getValue: (c) => c.ce.materiePrime.total, getBase: baseVP, getItems: (c) => c.ce.materiePrime.items },
  { id: "varRimMaterie", label: "Variazione rimanenze materie", kind: "sub", getValue: (c) => c.ce.varRimMaterie.total, getBase: baseVP, getItems: (c) => c.ce.varRimMaterie.items },
  { id: "servizi", label: "Servizi", kind: "sub", getValue: (c) => c.ce.servizi.total, getBase: baseVP, getItems: (c) => c.ce.servizi.items },
  { id: "godimentoTerzi", label: "Godimento beni di terzi", kind: "sub", getValue: (c) => c.ce.godimentoTerzi.total, getBase: baseVP, getItems: (c) => c.ce.godimentoTerzi.items },
  { id: "oneriDiversi", label: "Oneri diversi", kind: "sub", getValue: (c) => c.ce.oneriDiversi.total, getBase: baseVP, getItems: (c) => c.ce.oneriDiversi.items },
  { id: "costiEsterni", label: "Costi esterni operativi", kind: "grp", getValue: (c) => c.ce.costiEsterni, getBase: baseVP },
  { id: "valoreAggiunto", label: "VALORE AGGIUNTO", kind: "tot", getValue: (c) => c.ce.valoreAggiunto, getBase: baseVP },

  { id: "costoLavoro", label: "Costo del lavoro", kind: "sub", getValue: (c) => c.ce.costoLavoro.total, getBase: baseVP, getItems: (c) => c.ce.costoLavoro.items },
  { id: "ebitda", label: "EBITDA (Margine Operativo Lordo)", kind: "tot", getValue: (c) => c.ce.ebitda, getBase: baseVP },

  { id: "ammortamenti", label: "Ammortamenti", kind: "sub", getValue: (c) => c.ce.ammortamenti.total, getBase: baseVP, getItems: (c) => c.ce.ammortamenti.items },
  { id: "accantonamenti", label: "Accantonamenti", kind: "sub", getValue: (c) => c.ce.accantonamenti.total, getBase: baseVP, getItems: (c) => c.ce.accantonamenti.items },
  { id: "ebit", label: "EBIT (Risultato Operativo)", kind: "tot", getValue: (c) => c.ce.ebit, getBase: baseVP },

  { id: "straordinari", label: "Proventi e oneri straordinari", kind: "sub", getValue: (c) => c.ce.straordinari, getBase: baseVP },
  { id: "gestioneFinanziaria", label: "Gestione finanziaria", kind: "sub", getValue: (c) => c.ce.gestioneFinanziaria.total, getBase: baseVP, getItems: (c) => c.ce.gestioneFinanziaria.items },
  { id: "rettificheAttFin", label: "Rettifiche attività finanziarie", kind: "sub", getValue: (c) => c.ce.rettificheAttFin.total, getBase: baseVP, getItems: (c) => c.ce.rettificheAttFin.items },
  { id: "ebt", label: "EBT (Risultato ante imposte)", kind: "tot", getValue: (c) => c.ce.ebt, getBase: baseVP },

  { id: "imposte", label: "Imposte", kind: "sub", getValue: (c) => c.ce.imposte.total, getBase: baseVP, getItems: (c) => c.ce.imposte.items },
  { id: "utileNetto", label: "UTILE (PERDITA) NETTO", kind: "tot", getValue: (c) => c.ce.utileNetto, getBase: baseVP },
];

const baseVPC = (c: import("../types").PeriodCalc) => c.cm.valoreProduzioneCaratt;

export const ceCmRows: FinRow[] = [
  { id: "ricaviVendite", label: "Ricavi delle vendite e prestazioni", getValue: (c) => c.ce.ricaviVendite.total, getBase: baseVPC, getItems: (c) => c.ce.ricaviVendite.items },
  { id: "varRimProdotti", label: "Variazione rimanenze prodotti", kind: "sub", getValue: (c) => c.ce.varRimProdotti.total, getBase: baseVPC, getItems: (c) => c.ce.varRimProdotti.items },
  { id: "incrementiInterni", label: "Incrementi per lavori interni", kind: "sub", getValue: (c) => c.ce.incrementiInterni.total, getBase: baseVPC, getItems: (c) => c.ce.incrementiInterni.items },
  { id: "valoreProduzioneCaratt", label: "A) VALORE DELLA PRODUZIONE CARATTERISTICA", kind: "grp", getValue: (c) => c.cm.valoreProduzioneCaratt, getBase: baseVPC },

  { id: "hdrCV", label: "COSTI VARIABILI", kind: "header" },
  { id: "cmAcquisto", label: "Acquisto merce", kind: "sub", getValue: (c) => c.cm.cmAcquisto.total, getBase: baseVPC, getItems: (c) => c.cm.cmAcquisto.items },
  { id: "cmRimIniziale", label: "Rimanenze iniziali", kind: "sub", getValue: (c) => c.cm.cmRimIniziale.total, getBase: baseVPC, getItems: (c) => c.cm.cmRimIniziale.items },
  { id: "cmRimFinale", label: "Rimanenze finali", kind: "sub", getValue: (c) => c.cm.cmRimFinale.total, getBase: baseVPC, getItems: (c) => c.cm.cmRimFinale.items },
  { id: "cvMerce", label: "Costo del venduto (materie prime/merci)", kind: "subtot", getValue: (c) => c.cm.cvMerce, getBase: baseVPC },
  { id: "cvAltro", label: "Altri costi variabili", kind: "sub", getValue: (c) => c.cm.cvAltro.total, getBase: baseVPC, getItems: (c) => c.cm.cvAltro.items },
  { id: "totaleCV", label: "Totale Costi Variabili", kind: "grp", getValue: (c) => c.cm.totaleCV, getBase: baseVPC },
  { id: "margineContribuzione", label: "MARGINE DI CONTRIBUZIONE", kind: "tot", getValue: (c) => c.cm.margineContribuzione, getBase: baseVPC },

  { id: "hdrCF", label: "COSTI FISSI", kind: "header" },
  { id: "cfMerce", label: "Materie prime/merci fisse", kind: "sub", getValue: (c) => c.cm.cfMerce.total, getBase: baseVPC, getItems: (c) => c.cm.cfMerce.items },
  { id: "cfServizi", label: "Servizi", kind: "sub", getValue: (c) => c.cm.cfServizi.total, getBase: baseVPC, getItems: (c) => c.cm.cfServizi.items },
  { id: "cfGodimento", label: "Godimento beni di terzi", kind: "sub", getValue: (c) => c.cm.cfGodimento.total, getBase: baseVPC, getItems: (c) => c.cm.cfGodimento.items },
  { id: "cfPersonale", label: "Costo personale", kind: "sub", getValue: (c) => c.cm.cfPersonale.total, getBase: baseVPC, getItems: (c) => c.cm.cfPersonale.items },
  { id: "cfAmmortamenti", label: "Ammortamenti", kind: "sub", getValue: (c) => c.cm.cfAmmortamenti.total, getBase: baseVPC, getItems: (c) => c.cm.cfAmmortamenti.items },
  { id: "cfAccantonamenti", label: "Accantonamenti", kind: "sub", getValue: (c) => c.cm.cfAccantonamenti.total, getBase: baseVPC, getItems: (c) => c.cm.cfAccantonamenti.items },
  { id: "cfOneriDiversi", label: "Oneri diversi", kind: "sub", getValue: (c) => c.cm.cfOneriDiversi.total, getBase: baseVPC, getItems: (c) => c.cm.cfOneriDiversi.items },
  { id: "totaleCF", label: "Totale Costi Fissi", kind: "grp", getValue: (c) => c.cm.totaleCF, getBase: baseVPC },
  { id: "ebitOperativo", label: "EBIT OPERATIVO (ante altri ricavi/costi)", kind: "grp", getValue: (c) => c.cm.ebitOperativo, getBase: baseVPC },

  { id: "altriRicaviCM", label: "Altri ricavi", kind: "sub", getValue: (c) => c.ce.altriRicavi.total, getBase: baseVPC, getItems: (c) => c.ce.altriRicavi.items },
  { id: "altroCostiProdCM", label: "Costi non operativi", kind: "sub", getValue: (c) => c.ce.altroCostiProd.total, getBase: baseVPC, getItems: (c) => c.ce.altroCostiProd.items },
  { id: "ebitCM", label: "EBIT", kind: "tot", getValue: (c) => c.cm.ebitCM, getBase: baseVPC },

  { id: "straordinariCM", label: "Proventi e oneri straordinari", kind: "sub", getValue: (c) => c.ce.straordinari, getBase: baseVPC },
  { id: "gestioneFinanziariaCM", label: "Gestione finanziaria", kind: "sub", getValue: (c) => c.ce.gestioneFinanziaria.total, getBase: baseVPC, getItems: (c) => c.ce.gestioneFinanziaria.items },
  { id: "rettificheAttFinCM", label: "Rettifiche attività finanziarie", kind: "sub", getValue: (c) => c.ce.rettificheAttFin.total, getBase: baseVPC, getItems: (c) => c.ce.rettificheAttFin.items },
  { id: "ebtCM", label: "EBT", kind: "tot", getValue: (c) => c.ce.ebt, getBase: baseVPC },

  { id: "imposteCM", label: "Imposte", kind: "sub", getValue: (c) => c.ce.imposte.total, getBase: baseVPC, getItems: (c) => c.ce.imposte.items },
  { id: "utileNettoCM", label: "UTILE (PERDITA) NETTO", kind: "tot", getValue: (c) => c.ce.utileNetto, getBase: baseVPC },
];
