import * as XLSX from "xlsx";
import { computeRatios } from "./compute/ratios";
import type { Periodo, PeriodCalc } from "./types";

type Row = (string | number)[];

export function exportExcel(periods: Periodo[], calcs: Record<string, PeriodCalc>) {
  const wb = XLSX.utils.book_new();
  const labels = periods.map((p) => p.label);

  // Sheet 1: SP - CE
  const sheet1: Row[] = [];
  sheet1.push(["STATO PATRIMONIALE", ...labels]);
  const spRows: [string, (c: PeriodCalc) => number][] = [
    ["Liquidità immediate", (c) => c.sp.liqImmediate.total],
    ["Liquidità differite", (c) => c.sp.liquiditaDifferite.total],
    ["Rimanenze", (c) => c.sp.rimanenze.total],
    ["Attivo Circolante", (c) => c.sp.attivoCircolante.total],
    ["Immob. immateriali", (c) => c.sp.immatNette.total],
    ["Immob. materiali", (c) => c.sp.matNette.total],
    ["Immob. finanziarie", (c) => c.sp.finImmob.total],
    ["Totale Immobilizzazioni", (c) => c.sp.immobilizzazioni.total],
    ["TOTALE IMPIEGHI", (c) => c.sp.totaleImpieghi],
    ["Passività Correnti", (c) => c.sp.passivitaCorrenti.total],
    ["Passività Consolidate", (c) => c.sp.passivitaConsolidate.total],
    ["Patrimonio Netto", (c) => c.sp.patrimonioNetto.total],
    ["TOTALE FONTI", (c) => c.sp.totaleFonti],
  ];
  spRows.forEach(([label, fn]) => sheet1.push([label, ...periods.map((p) => fn(calcs[p.id]))]));
  sheet1.push([]);
  sheet1.push(["CONTO ECONOMICO", ...labels]);
  const ceRows: [string, (c: PeriodCalc) => number][] = [
    ["Ricavi vendite", (c) => c.ce.ricaviVendite.total],
    ["Valore Produzione", (c) => c.ce.valoreProduzione],
    ["Costi esterni", (c) => c.ce.costiEsterni],
    ["Valore Aggiunto", (c) => c.ce.valoreAggiunto],
    ["Costo lavoro", (c) => c.ce.costoLavoro.total],
    ["EBITDA", (c) => c.ce.ebitda],
    ["Ammortamenti", (c) => c.ce.ammortamenti.total],
    ["EBIT", (c) => c.ce.ebit],
    ["Gestione finanziaria", (c) => c.ce.gestioneFinanziaria.total],
    ["EBT", (c) => c.ce.ebt],
    ["Imposte", (c) => c.ce.imposte.total],
    ["UTILE NETTO", (c) => c.ce.utileNetto],
  ];
  ceRows.forEach(([label, fn]) => sheet1.push([label, ...periods.map((p) => fn(calcs[p.id]))]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet1), "SP - CE");

  // Sheet 2: CE Margine Contribuzione
  const sheet2: Row[] = [["Voce", ...labels]];
  const cmRows: [string, (c: PeriodCalc) => number][] = [
    ["Ricavi vendite", (c) => c.ce.ricaviVendite.total],
    ["Valore Produzione Caratteristica", (c) => c.cm.valoreProduzioneCaratt],
    ["Acquisto merce", (c) => c.cm.cmAcquisto.total],
    ["Rimanenze iniziali", (c) => c.cm.cmRimIniziale.total],
    ["Rimanenze finali", (c) => c.cm.cmRimFinale.total],
    ["Costo venduto", (c) => c.cm.cvMerce],
    ["Altri costi variabili", (c) => c.cm.cvAltro.total],
    ["Totale Costi Variabili", (c) => c.cm.totaleCV],
    ["MARGINE DI CONTRIBUZIONE", (c) => c.cm.margineContribuzione],
    ["Totale Costi Fissi", (c) => c.cm.totaleCF],
    ["EBIT Operativo", (c) => c.cm.ebitOperativo],
    ["Altri ricavi", (c) => c.ce.altriRicavi.total],
    ["Costi non operativi", (c) => c.ce.altroCostiProd.total],
    ["EBIT", (c) => c.cm.ebitCM],
    ["Proventi/oneri straordinari", (c) => c.ce.straordinari],
    ["Incidenza Merce %", (c) => c.cm.incidenzaMerce],
    ["Ricarico (x)", (c) => c.cm.ricarico],
  ];
  cmRows.forEach(([label, fn]) => sheet2.push([label, ...periods.map((p) => fn(calcs[p.id]))]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet2), "CE Margine Contribuz.");

  // Sheet 3: Indici
  const sheet3: Row[] = [["Indice", ...labels]];
  const ratiosByPeriod = periods.map((p) => computeRatios(p, calcs[p.id]));
  const idxRows: [string, (i: number) => number][] = [
    ["Current Ratio", (i) => ratiosByPeriod[i].currentRatio],
    ["Quick Ratio", (i) => ratiosByPeriod[i].quickRatio],
    ["CCN", (i) => ratiosByPeriod[i].ccn],
    ["Indice indipendenza fin.", (i) => ratiosByPeriod[i].indipendenzaFin],
    ["Leverage", (i) => ratiosByPeriod[i].leverage],
    ["ROE", (i) => ratiosByPeriod[i].roe],
    ["ROI", (i) => ratiosByPeriod[i].roi],
    ["ROS", (i) => ratiosByPeriod[i].ros],
    ["ROA", (i) => ratiosByPeriod[i].roa],
    ["EBITDA Margin", (i) => ratiosByPeriod[i].ebitdaMargin],
    ["DSO (gg)", (i) => ratiosByPeriod[i].dso],
    ["DPO (gg)", (i) => ratiosByPeriod[i].dpo],
    ["Giacenza magazzino (gg)", (i) => ratiosByPeriod[i].dmag],
  ];
  idxRows.forEach(([label, fn]) =>
    sheet3.push([label, ...periods.map((_, i) => fn(i))])
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet3), "Indici");

  // Sheet 4: Dettaglio Conti
  const sheet4: Row[] = [
    ["Conto", "Descrizione", "Periodo", "Saldo", "Sezione", "L1", "L2", "N", "Variabile/Fisso"],
  ];
  periods.forEach((p) => {
    calcs[p.id].accounts.forEach((a) => {
      sheet4.push([
        a.conto,
        a.desc,
        p.label,
        a.saldo,
        a.cls.s,
        a.cls.l1,
        a.cls.l2,
        a.cls.n,
        a.cls.s === "CE" && a.cls.l1 === "B" ? a.varFix : "",
      ]);
    });
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet4), "Dettaglio Conti");

  XLSX.writeFile(wb, "analisi_bilancio.xlsx");
}
