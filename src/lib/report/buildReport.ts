// Generazione automatica della relazione descrittiva (scheda Relazione) e utilità di esportazione.
import docCss from "./doc.css?raw";
import { fmtEur, fmtPct, fmtRatio } from "../numberFormat";
import { periodDaysSpan, type RatiosResult } from "../compute/ratios";
import type { PeriodCalc, Periodo } from "../types";

export const DOC_CSS = docCss;

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const ok = (v: unknown): v is number => typeof v === "number" && isFinite(v);
const E = (v: number) => (ok(v) ? fmtEur(Math.round(v)) + " €" : "n.d.");
const P = (v: number) => (ok(v) ? fmtPct(v, 1) : "n.d.");
const X = (v: number) => (ok(v) ? fmtRatio(v, 2) : "n.d.");
const D = (v: number) => (ok(v) ? Math.round(v) + " giorni" : "n.d.");
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso || "") : d.toLocaleDateString("it-IT");
};
const div = (a: number, b: number) => (ok(a) && ok(b) && b !== 0 ? a / b : NaN);
const dPct = (a: number, b: number) => (ok(a) && ok(b) && Math.abs(b) > 0.5 ? (a - b) / Math.abs(b) : NaN);
const negCls = (v: number) => (ok(v) && v < 0 ? ' class="n neg"' : ' class="n"');

/** Testo "sicuro" per nomi file (senza accenti né caratteri speciali). */
export const slug = (s: string) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);

/** Periodo di confronto automatico: precedente, preferibilmente dello stesso tipo e alla stessa data. */
export function autoCompare(ref: Periodo, periods: Periodo[]): Periodo | null {
  const prev = periods.filter((p) => p.id !== ref.id && new Date(p.date) < new Date(ref.date));
  if (!prev.length) return null;
  const monthDay = (p: Periodo) => String(p.date).slice(5, 10);
  return (
    prev.filter((p) => p.type === ref.type && monthDay(p) === monthDay(ref)).pop() ||
    prev.filter((p) => p.type === ref.type).pop() ||
    prev[prev.length - 1]
  );
}

export interface ReportInput {
  company: string;
  author: string;
  place: string;
  ref: Periodo;
  cmp: Periodo | null;
  calcs: Record<string, PeriodCalc>;
  ratios: Record<string, RatiosResult>;
  periods: Periodo[];
}

type Getter = (c: PeriodCalc, r: RatiosResult) => number;
type RowOpt = { strong?: boolean; noPct?: boolean; fmt?: (v: number) => string };
type RatioKey = keyof RatiosResult | ((c: PeriodCalc) => number);

export function buildReport(o: ReportInput): string {
  const { company, author, place, ref, cmp, calcs, ratios, periods } = o;
  const c = calcs[ref.id];
  const r = ratios[ref.id];
  const c0 = cmp ? calcs[cmp.id] : null;
  const r0 = cmp ? ratios[cmp.id] : null;
  const sp = c.sp;
  const ce = c.ce;
  const cm = c.cm;
  const days = periodDaysSpan(ref);
  const days0 = cmp ? periodDaysSpan(cmp) : 0;
  const annual = ref.type === "annuale";
  const kA = 365 / days;
  const sameLen = cmp ? Math.abs(days - days0) <= 20 : false;
  const cmpLbl = cmp ? "«" + esc(cmp.label) + "»" : "";
  const pos: string[] = [];
  const neg: string[] = [];
  const out: string[] = [];
  // Il nome azienda è marcato così che l'editor possa aggiornarlo anche dopo la generazione.
  const companyHtml = '<span data-field="company">' + esc(company || "[Nome azienda]") + "</span>";

  const trend = (a: number, b: number | null | undefined) => {
    if (!cmp || !sameLen || b == null) return "";
    const d = dPct(a, b);
    if (!ok(d)) return "";
    if (Math.abs(d) < 0.02) return ", sostanzialmente stabile rispetto al periodo " + cmpLbl;
    return (
      ", " + (d > 0 ? "in aumento" : "in diminuzione") + " del " + fmtPct(Math.abs(d), 1) +
      " rispetto al periodo " + cmpLbl + " (" + E(b) + ")"
    );
  };
  const stockTrend = (a: number, b: number | null | undefined) => {
    if (!cmp || b == null) return "";
    const d = dPct(a, b);
    if (!ok(d)) return "";
    if (Math.abs(d) < 0.02) return ", sostanzialmente invariato rispetto a " + cmpLbl;
    return ", " + (d > 0 ? "in aumento" : "in diminuzione") + " del " + fmtPct(Math.abs(d), 1) + " rispetto a " + cmpLbl;
  };

  function table(
    rows: [string, Getter, RowOpt?][],
    { pctBase, pctLabel }: { pctBase?: (x: PeriodCalc) => number; pctLabel?: string } = {}
  ) {
    let t = '<table><thead><tr><th>Voce</th><th class="n">' + esc(ref.label) + "</th>";
    if (pctBase) t += '<th class="n">' + pctLabel + "</th>";
    if (cmp) t += '<th class="n">' + esc(cmp.label) + '</th><th class="n">Var. %</th>';
    t += "</tr></thead><tbody>";
    for (const [label, get, opt = {}] of rows) {
      const v = get(c, r);
      const v0 = cmp ? get(c0!, r0!) : NaN;
      const fmt = opt.fmt || E;
      t += "<tr" + (opt.strong ? ' class="s"' : "") + "><td>" + label + "</td><td" + negCls(v) + ">" + fmt(v) + "</td>";
      if (pctBase) t += '<td class="n">' + (opt.noPct ? "" : P(div(v, pctBase(c)))) + "</td>";
      if (cmp) {
        const d = opt.fmt ? NaN : dPct(v, v0);
        t +=
          "<td" + negCls(v0) + ">" + fmt(v0) + "</td><td" + negCls(d) + ">" +
          (ok(d) ? (d > 0 ? "+" : "") + fmtPct(d, 1) : "—") + "</td>";
      }
      t += "</tr>";
    }
    return t + "</tbody></table>";
  }

  const ratioTable = (list: [string, RatioKey, (v: number) => string][]) => {
    let t =
      '<table><thead><tr><th>Indicatore</th><th class="n">' + esc(ref.label) + "</th>" +
      (cmp ? '<th class="n">' + esc(cmp.label) + "</th>" : "") + "</tr></thead><tbody>";
    const val = (k: RatioKey, cc: PeriodCalc, rr: RatiosResult) => (typeof k === "function" ? k(cc) : rr[k]);
    for (const [l, k, f] of list) {
      const v = val(k, c, r);
      const v0 = cmp ? val(k, c0!, r0!) : NaN;
      t += "<tr><td>" + l + "</td><td" + negCls(v) + ">" + f(v) + "</td>" + (cmp ? "<td" + negCls(v0) + ">" + f(v0) + "</td>" : "") + "</tr>";
    }
    return t + "</tbody></table>";
  };

  // ----- Intestazione e premessa -----
  out.push("<h1>Relazione sull'analisi di bilancio</h1>");
  out.push('<p class="rel-sub"><b>' + companyHtml + "</b></p>");
  out.push(
    '<p class="rel-sub">Periodo di riferimento: <b>' + esc(ref.label) + "</b> (dal " + fmtDate(ref.fyStart) +
      " al " + fmtDate(ref.date) + ")" + (cmp ? " — confronto con: <b>" + esc(cmp.label) + "</b>" : "") + "</p>"
  );
  out.push("<h2>1. Premessa</h2>");
  out.push(
    "<p>La presente relazione illustra i risultati dell'analisi di bilancio di <b>" + companyHtml +
      "</b> riferita al periodo <b>" + esc(ref.label) + "</b>, " +
      (annual ? "corrispondente a un esercizio annuale" : "di natura infrannuale (" + days + " giorni)") +
      " chiuso al " + fmtDate(ref.date) +
      (cmp ? ", posto a confronto con il periodo <b>" + esc(cmp.label) + "</b> chiuso al " + fmtDate(cmp.date) : "") +
      ". I dati derivano dalle situazioni contabili importate, rielaborate secondo il criterio finanziario per lo Stato Patrimoniale e secondo lo schema a valore aggiunto per il Conto Economico; sulla base di tali prospetti sono stati calcolati i principali indici di liquidità, solidità, redditività e di ciclo commerciale.</p>"
  );
  if (!annual)
    out.push(
      "<p>Trattandosi di un periodo infrannuale, i valori economici e gli indici di redditività sono riferiti alla sola frazione di esercizio considerata e non sono annualizzati, salvo dove diversamente indicato.</p>"
    );
  if (cmp && !sameLen)
    out.push(
      "<p>Si precisa che i due periodi posti a confronto hanno durata diversa (" + days + " giorni contro " + days0 +
        "): le variazioni delle grandezze economiche non sono pertanto direttamente comparabili e non vengono commentate.</p>"
    );
  const warns: string[] = [];
  if (c.unmatched > 0) warns.push(c.unmatched + " conti non risultano associati ad alcuna voce di riclassificazione");
  if (ok(sp.quadratura) && Math.abs(sp.quadratura) > 1)
    warns.push("lo Stato Patrimoniale riclassificato presenta una differenza di quadratura di " + E(sp.quadratura));
  if (warns.length)
    out.push(
      '<p class="rel-note">Avvertenza: ' + warns.join("; ") +
        ". Le conclusioni che seguono vanno lette tenendo conto di tale circostanza.</p>"
    );

  // ----- Evoluzione pluriennale -----
  const hist = periods.filter((p) => new Date(p.date) <= new Date(ref.date));
  let sec = 2;
  if (hist.length > 2) {
    out.push("<h2>" + sec++ + ". Evoluzione dei principali aggregati</h2>");
    out.push("<p>La tabella seguente riassume l'andamento delle grandezze più significative nei periodi analizzati.</p>");
    const items: [string, (x: PeriodCalc) => number][] = [
      ["Ricavi delle vendite", (x) => x.ce.ricaviVendite.total],
      ["EBITDA", (x) => x.ce.ebitda],
      ["EBIT", (x) => x.ce.ebit],
      ["Risultato netto", (x) => x.ce.utileNetto],
      ["Patrimonio netto", (x) => x.sp.patrimonioNetto.total],
      ["Posizione finanziaria netta", (x) => x.sp.pfn],
      ["Totale impieghi", (x) => x.sp.totaleImpieghi],
    ];
    let t = "<table><thead><tr><th>Voce</th>" + hist.map((p) => '<th class="n">' + esc(p.label) + "</th>").join("") + "</tr></thead><tbody>";
    for (const [l, g] of items)
      t += "<tr><td>" + l + "</td>" + hist.map((p) => {
        const v = g(calcs[p.id]);
        return "<td" + negCls(v) + ">" + E(v) + "</td>";
      }).join("") + "</tr>";
    out.push(t + "</tbody></table>");
  }

  // ----- Andamento economico -----
  out.push("<h2>" + sec++ + ". Andamento economico</h2>");
  const vp = ce.valoreProduzione;
  out.push(
    table(
      [
        ["Ricavi delle vendite", (x) => x.ce.ricaviVendite.total],
        ["Valore della produzione", (x) => x.ce.valoreProduzione, { strong: true }],
        ["Costi esterni", (x) => x.ce.costiEsterni],
        ["Valore aggiunto", (x) => x.ce.valoreAggiunto, { strong: true }],
        ["Costo del lavoro", (x) => x.ce.costoLavoro.total],
        ["EBITDA (margine operativo lordo)", (x) => x.ce.ebitda, { strong: true }],
        ["Ammortamenti, accantonamenti e altri costi", (x) => x.ce.ammortamenti.total + x.ce.accantonamenti.total + x.ce.altroCostiProd.total],
        ["EBIT (reddito operativo)", (x) => x.ce.ebit, { strong: true }],
        ["Gestione finanziaria", (x) => x.ce.gestioneFinanziaria.total],
        ["Risultato ante imposte", (x) => x.ce.ebt],
        ["Imposte", (x) => x.ce.imposte.total],
        ["Risultato netto", (x) => x.ce.utileNetto, { strong: true }],
      ],
      { pctBase: (x) => x.ce.valoreProduzione, pctLabel: "% su VP" }
    )
  );
  const ric = ce.ricaviVendite.total;
  out.push(
    "<p>Nel periodo i ricavi delle vendite ammontano a <b>" + E(ric) + "</b>" + trend(ric, c0 && c0.ce.ricaviVendite.total) +
      ", mentre il valore della produzione si attesta a " + E(vp) + ".</p>"
  );
  if (cmp && sameLen && c0) {
    const d = dPct(ric, c0.ce.ricaviVendite.total);
    if (ok(d) && d >= 0.05) pos.push("crescita dei ricavi delle vendite (+" + fmtPct(d, 1) + ")");
    if (ok(d) && d <= -0.05) neg.push("contrazione dei ricavi delle vendite (" + fmtPct(d, 1) + ")");
  }
  const em = div(ce.ebitda, vp);
  const em0 = c0 ? div(c0.ce.ebitda, c0.ce.valoreProduzione) : NaN;
  out.push(
    "<p>Il valore aggiunto è pari a " + E(ce.valoreAggiunto) + " (" + P(div(ce.valoreAggiunto, vp)) +
      " del valore della produzione). Dedotto il costo del lavoro (" + E(ce.costoLavoro.total) + ", pari al " +
      P(div(ce.costoLavoro.total, vp)) + " del valore della produzione), l'<b>EBITDA</b> risulta " +
      (ce.ebitda >= 0 ? "positivo" : "negativo") + " per <b>" + E(Math.abs(ce.ebitda)) +
      "</b>, con un'incidenza sul valore della produzione del " + P(em) +
      (ok(em0) ? " (contro il " + P(em0) + " del periodo di confronto)" : "") + ".</p>"
  );
  if (ce.ebitda < 0) neg.push("EBITDA negativo: la gestione caratteristica non copre i costi operativi");
  else if (ok(em) && em >= 0.15) pos.push("marginalità operativa lorda elevata (EBITDA margin " + P(em) + ")");
  else if (ok(em) && em < 0.05) neg.push("marginalità operativa lorda contenuta (EBITDA margin " + P(em) + ")");
  const amm = ce.ammortamenti.total + ce.accantonamenti.total + ce.altroCostiProd.total;
  let pEco =
    "Dopo ammortamenti, accantonamenti e altri costi per " + E(amm) + ", il reddito operativo (<b>EBIT</b>) è pari a <b>" +
    E(ce.ebit) + "</b> (" + P(div(ce.ebit, vp)) + " del valore della produzione). ";
  if (ok(ce.straordinari) && Math.abs(ce.straordinari) > 1)
    pEco += "Le componenti straordinarie incidono per " + E(ce.straordinari) + ". ";
  pEco +=
    "La gestione finanziaria presenta un saldo di " + E(ce.gestioneFinanziaria.total) +
    (ce.oneriFinanziari > 0 ? ", con oneri finanziari pari a " + E(ce.oneriFinanziari) : "") + ". ";
  pEco +=
    "Il risultato ante imposte ammonta a " + E(ce.ebt) + " e, dopo imposte per " + E(ce.imposte.total) +
    ", il periodo chiude con " +
    (ce.utileNetto >= 0 ? "un <b>utile netto</b> di <b>" : "una <b>perdita</b> di <b>") + E(Math.abs(ce.utileNetto)) +
    "</b>" + (cmp && sameLen && c0 ? " (periodo di confronto: " + E(c0.ce.utileNetto) + ")" : "") + ".";
  out.push("<p>" + pEco + "</p>");
  if (ce.utileNetto > 0) pos.push("risultato netto positivo (" + E(ce.utileNetto) + ")");
  else if (ce.utileNetto < 0) neg.push("il periodo chiude in perdita (" + E(ce.utileNetto) + ")");

  // ----- Struttura patrimoniale -----
  out.push("<h2>" + sec++ + ". Struttura patrimoniale</h2>");
  const tot = sp.totaleImpieghi;
  const totF = sp.totaleFonti;
  out.push(
    table(
      [
        ["Liquidità immediate", (x) => x.sp.liqImmediate.total],
        ["Liquidità differite", (x) => x.sp.liquiditaDifferite.total],
        ["Rimanenze", (x) => x.sp.rimanenze.total],
        ["Attivo circolante", (x) => x.sp.attivoCircolante.total, { strong: true }],
        ["Immobilizzazioni", (x) => x.sp.immobilizzazioni.total, { strong: true }],
        ["Totale impieghi", (x) => x.sp.totaleImpieghi, { strong: true }],
        ["Patrimonio netto", (x) => x.sp.patrimonioNetto.total, { strong: true }],
        ["Passività consolidate", (x) => x.sp.passivitaConsolidate.total, { strong: true }],
        ["Passività correnti", (x) => x.sp.passivitaCorrenti.total, { strong: true }],
        ["Totale fonti", (x) => x.sp.totaleFonti, { strong: true }],
      ],
      { pctBase: (x) => x.sp.totaleImpieghi, pctLabel: "% sul totale" }
    )
  );
  const rigid = div(sp.immobilizzazioni.total, tot);
  out.push(
    "<p>Il capitale investito ammonta a <b>" + E(tot) + "</b>" + stockTrend(tot, c0 && c0.sp.totaleImpieghi) +
      ". L'attivo è composto per il " + P(rigid) + " da immobilizzazioni e per il " +
      P(div(sp.attivoCircolante.total, tot)) + " da attivo circolante, configurando una struttura degli impieghi " +
      (ok(rigid) && rigid > 0.5
        ? "prevalentemente rigida, tipica di attività a elevata intensità di capitale fisso"
        : "prevalentemente elastica, con una quota significativa di risorse a breve ciclo di realizzo") +
      ". Sul lato delle fonti, il patrimonio netto rappresenta il " + P(div(sp.patrimonioNetto.total, totF)) +
      " del totale, le passività consolidate il " + P(div(sp.passivitaConsolidate.total, totF)) +
      " e le passività correnti il " + P(div(sp.passivitaCorrenti.total, totF)) + ".</p>"
  );

  // ----- Situazione finanziaria -----
  out.push("<h2>" + sec++ + ". Situazione finanziaria e liquidità</h2>");
  out.push(
    ratioTable([
      ["Capitale circolante netto", "ccn", E],
      ["Margine di tesoreria", "margineTesoreria", E],
      ["Current ratio (indice di disponibilità)", "currentRatio", X],
      ["Quick ratio (indice di liquidità)", "quickRatio", X],
      ["Posizione finanziaria netta", (x) => x.sp.pfn, E],
      ["PFN / EBITDA" + (annual ? "" : " (non annualizzato)"), "pfnEbitda", X],
    ])
  );
  const cr = r.currentRatio;
  const qr = r.quickRatio;
  const crTxt = !ok(cr)
    ? "non determinabile"
    : cr >= 1.5
      ? "un livello buono"
      : cr >= 1.2
        ? "un livello adeguato"
        : cr >= 1
          ? "un livello appena sufficiente"
          : "un livello insufficiente";
  const qrTxt = !ok(qr) ? "non determinabile" : qr >= 1 ? "buono" : qr >= 0.7 ? "accettabile" : "critico";
  out.push(
    "<p>Il capitale circolante netto è pari a <b>" + E(r.ccn) + "</b>: " +
      (r.ccn >= 0
        ? "le attività correnti risultano sufficienti a coprire le passività in scadenza nel breve termine"
        : "le passività a breve eccedono le attività correnti, segnalando una potenziale tensione di liquidità") +
      ". Il current ratio, pari a " + X(cr) + ", esprime " + crTxt +
      " di copertura delle passività correnti; il quick ratio (acid test), che esclude le rimanenze, è pari a " +
      X(qr) + " ed è da ritenersi " + qrTxt + ". Il margine di tesoreria ammonta a " + E(r.margineTesoreria) + ".</p>"
  );
  if (ok(cr) && cr >= 1.2) pos.push("buon equilibrio finanziario di breve periodo (current ratio " + X(cr) + ")");
  if (ok(cr) && cr < 1)
    neg.push("current ratio inferiore all'unità (" + X(cr) + "): attività correnti insufficienti a coprire le passività a breve");
  if (ok(qr) && qr < 0.7 && !(ok(cr) && cr < 1)) neg.push("liquidità immediata e differita limitata (quick ratio " + X(qr) + ")");
  const pfn = sp.pfn;
  const ebitdaA = annual ? ce.ebitda : ce.ebitda * kA;
  const pe = ebitdaA > 0 ? pfn / ebitdaA : NaN;
  let pfnP = "La posizione finanziaria netta è pari a <b>" + E(pfn) + "</b>" + stockTrend(pfn, c0 && c0.sp.pfn) + ": ";
  if (pfn <= 0) {
    pfnP +=
      "le disponibilità liquide e le attività finanziarie a breve superano i debiti finanziari, configurando una posizione di <b>cassa netta</b>.";
    pos.push("posizione finanziaria netta positiva (liquidità superiore ai debiti finanziari)");
  } else {
    pfnP += "l'azienda presenta un indebitamento finanziario netto";
    if (ebitdaA > 0) {
      pfnP +=
        " pari a " + X(pe) + " volte l'EBITDA" + (annual ? "" : " annualizzato") + ", livello " +
        (pe <= 2 ? "contenuto e sostenibile" : pe <= 4 ? "moderato" : "elevato rispetto alla capacità di generare margini operativi") + ".";
      if (pe <= 2) pos.push("indebitamento finanziario sostenibile (PFN/EBITDA " + X(pe) + ")");
      else if (pe > 4) neg.push("indebitamento finanziario elevato (PFN/EBITDA " + X(pe) + ")");
    } else {
      pfnP += " non sostenuto da un EBITDA positivo.";
      neg.push("indebitamento finanziario netto in presenza di EBITDA non positivo");
    }
  }
  out.push("<p>" + pfnP + "</p>");

  // ----- Solidità patrimoniale -----
  out.push("<h2>" + sec++ + ". Solidità patrimoniale</h2>");
  out.push(
    ratioTable([
      ["Indipendenza finanziaria (PN / totale fonti)", "indipendenzaFin", P],
      ["Rapporto di indebitamento (debiti / PN)", "debtEquity", X],
      ["Leverage (totale fonti / PN)", "leverage", X],
      ["Margine di struttura primario", "margineStruttPrim", E],
      ["Quoziente di struttura primario", "quozStruttPrim", X],
      ["Margine di struttura secondario", "margineStruttSec", E],
      ["Quoziente di struttura secondario", "quozStruttSec", X],
    ])
  );
  const pn = sp.patrimonioNetto.total;
  if (!(pn > 0)) {
    out.push(
      "<p>Il patrimonio netto risulta <b>" + (pn < 0 ? "negativo" : "nullo") + "</b> (" + E(pn) +
        "): l'azienda non dispone di mezzi propri a copertura degli impieghi e la situazione richiede attenta valutazione, anche alla luce degli obblighi civilistici in materia di riduzione del capitale sociale.</p>"
    );
    neg.push("patrimonio netto " + (pn < 0 ? "negativo" : "nullo"));
  } else {
    const ind = r.indipendenzaFin;
    out.push(
      "<p>Il patrimonio netto ammonta a <b>" + E(pn) + "</b>" + stockTrend(pn, c0 && c0.sp.patrimonioNetto.total) +
        ". L'indice di indipendenza finanziaria è pari al " + P(ind) +
        (ind >= 0.33
          ? ", valore che indica una buona patrimonializzazione"
          : ind >= 0.15
            ? ", valore che indica un grado di patrimonializzazione intermedio"
            : ", valore che evidenzia una situazione di sottocapitalizzazione") +
        "; il rapporto di indebitamento si attesta a " + X(r.debtEquity) + " e il leverage a " + X(r.leverage) + ".</p>"
    );
    if (ind >= 0.33) pos.push("buona patrimonializzazione (indipendenza finanziaria " + P(ind) + ")");
    else if (ind < 0.15) neg.push("sottocapitalizzazione (indipendenza finanziaria " + P(ind) + ")");
    if (ok(r.debtEquity) && r.debtEquity > 3) neg.push("elevato rapporto di indebitamento (" + X(r.debtEquity) + ")");
  }
  const ms2 = r.margineStruttSec;
  out.push(
    "<p>Il margine di struttura primario è pari a " + E(r.margineStruttPrim) +
      (r.margineStruttPrim >= 0
        ? ": il capitale proprio è da solo sufficiente a finanziare le immobilizzazioni"
        : ": il capitale proprio non copre integralmente le immobilizzazioni") +
      ". Il margine di struttura secondario ammonta a " + E(ms2) +
      (ms2 >= 0
        ? ": le immobilizzazioni risultano interamente finanziate da fonti durevoli (capitale proprio e debiti a medio-lungo termine), nel rispetto del principio di correlazione temporale tra impieghi e fonti."
        : ": una parte delle immobilizzazioni è finanziata con passività a breve termine, situazione che può generare tensioni finanziarie e che suggerisce un riequilibrio delle fonti verso il medio-lungo termine.") +
      "</p>"
  );
  if (ok(ms2) && ms2 >= 0) pos.push("immobilizzazioni coperte da fonti durevoli (margine di struttura secondario positivo)");
  else if (ok(ms2)) neg.push("squilibrio tra impieghi durevoli e fonti consolidate (margine di struttura secondario negativo)");

  // ----- Redditività -----
  out.push("<h2>" + sec++ + ". Redditività</h2>");
  out.push(
    ratioTable([
      ["ROE (risultato netto / PN)", "roe", P],
      ["ROI (EBIT / capitale investito)", "roi", P],
      ["ROS (EBIT / ricavi)", "ros", P],
      ["ROA (risultato netto / totale attivo)", "roa", P],
      ["EBITDA margin", "ebitdaMargin", P],
      ["EBIT margin", "ebitMargin", P],
      ["Rotazione del capitale investito", "turnoverCI", X],
      ["ROD (costo medio del debito finanziario)", "rod", P],
    ])
  );
  let pr =
    "Il <b>ROE</b>, che misura la redditività del capitale proprio, è pari al " + P(r.roe) +
    "; il <b>ROI</b>, indicatore della redditività della gestione caratteristica rispetto al capitale investito, si attesta al " +
    P(r.roi) + ", mentre il <b>ROS</b> (redditività delle vendite) è pari al " + P(r.ros) +
    ". La rotazione del capitale investito è di " + X(r.turnoverCI) + " volte" + (annual ? "" : " nel periodo") + ".";
  if (ok(r.rod) && ok(r.roi) && sp.debitiFinTot.total > 0) {
    pr +=
      " Il costo medio dell'indebitamento finanziario (ROD) è pari al " + P(r.rod) + ": " +
      (r.roi > r.rod
        ? "essendo il ROI superiore al costo del debito, la leva finanziaria esercita un effetto positivo sulla redditività del capitale proprio."
        : "essendo il ROI inferiore al costo del debito, la leva finanziaria esercita un effetto negativo sulla redditività del capitale proprio.");
  }
  out.push("<p>" + pr + "</p>");
  if (!annual)
    out.push('<p class="rel-note">Gli indici di redditività sono riferiti a un periodo di ' + days + " giorni e non sono annualizzati.</p>");
  const roeA = annual ? r.roe : r.roe * kA;
  const roiA = annual ? r.roi : r.roi * kA;
  if (pn > 0 && ok(roeA) && roeA >= 0.1)
    pos.push("buona redditività del capitale proprio (ROE " + (annual ? "" : "annualizzato ") + P(roeA) + ")");
  if (ok(roiA) && roiA >= 0.08)
    pos.push("buona redditività del capitale investito (ROI " + (annual ? "" : "annualizzato ") + P(roiA) + ")");
  if (ok(roiA) && roiA < 0) neg.push("redditività operativa negativa (ROI " + P(r.roi) + ")");

  // ----- Ciclo commerciale -----
  if (ok(r.dso) || ok(r.dpo)) {
    out.push("<h2>" + sec++ + ". Ciclo commerciale</h2>");
    const rows: [string, RatioKey, (v: number) => string][] = [
      ["Giorni medi di incasso clienti (DSO)", "dso", D],
      ["Giorni medi di pagamento fornitori (DPO)", "dpo", D],
    ];
    if (ok(r.dmag)) rows.push(["Giorni medi di giacenza del magazzino", "dmag", D]);
    rows.push(["Ciclo di cassa", "ciclo", D]);
    out.push(ratioTable(rows));
    out.push(
      "<p>I clienti vengono incassati mediamente in " + D(r.dso) + ", mentre i fornitori sono pagati in media in " +
        D(r.dpo) + (ok(r.dmag) ? "; la giacenza media del magazzino è di " + D(r.dmag) : "") +
        ". Il ciclo di cassa risulta pari a " + D(r.ciclo) + ": " +
        (r.ciclo > 0
          ? "l'azienda deve quindi finanziare il capitale circolante operativo per circa " + Math.round(r.ciclo) + " giorni."
          : "i debiti verso fornitori finanziano interamente il ciclo operativo, con effetti favorevoli sul fabbisogno finanziario.") +
        "</p>"
    );
    if (ok(r.dso) && r.dso > 120) neg.push("tempi medi di incasso dei crediti elevati (" + D(r.dso) + ")");
    if (ok(r.ciclo) && r.ciclo <= 0) pos.push("ciclo di cassa favorevole (" + D(r.ciclo) + ")");
  }

  // ----- Margine di contribuzione e BEP -----
  if (cm && ric > 0) {
    out.push("<h2>" + sec++ + ". Margine di contribuzione e punto di pareggio</h2>");
    const mc = cm.margineContribuzione;
    const cf = cm.totaleCF;
    const mcPct = div(mc, ric);
    if (ok(mcPct) && mcPct > 0) {
      const bep = cf / mcPct;
      const msic = div(ric - bep, ric);
      out.push(
        "<p>Il margine di contribuzione è pari a " + E(mc) + " (" + P(mcPct) + " dei ricavi), a fronte di costi fissi per " +
          E(cf) + ". Il punto di pareggio (break-even) si colloca a un fatturato di <b>" + E(bep) + "</b>; " +
          (msic >= 0
            ? "i ricavi del periodo superano tale soglia, con un margine di sicurezza del " + P(msic) + "."
            : "i ricavi del periodo risultano inferiori alla soglia di pareggio del " + P(-msic) + ".") +
          "</p>"
      );
      if (msic >= 0.2) pos.push("ampio margine di sicurezza rispetto al punto di pareggio (" + P(msic) + ")");
      else if (msic < 0) neg.push("ricavi inferiori al punto di pareggio");
    } else {
      out.push(
        "<p>Il margine di contribuzione risulta non positivo (" + E(mc) +
          "): i ricavi non coprono i costi variabili e non è pertanto possibile determinare un punto di pareggio.</p>"
      );
      neg.push("margine di contribuzione non positivo");
    }
  }

  // ----- Sintesi e conclusioni -----
  out.push("<h2>" + sec++ + ". Punti di forza e aree di attenzione</h2>");
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const list = (items: string[]) =>
    "<ul>" + items.map((s, i) => "<li>" + cap(s) + (i === items.length - 1 ? "." : ";") + "</li>").join("") + "</ul>";
  out.push(
    "<h3>Punti di forza</h3>" +
      (pos.length ? list(pos) : "<p>Non emergono elementi di particolare forza dagli indicatori analizzati.</p>")
  );
  out.push(
    "<h3>Aree di attenzione</h3>" +
      (neg.length ? list(neg) : "<p>Non emergono criticità significative dagli indicatori analizzati.</p>")
  );
  out.push("<h2>" + sec++ + ". Conclusioni</h2>");
  const score = pos.length - neg.length;
  const giudizio = !(pn > 0)
    ? "critica"
    : score >= 3
      ? "solida ed equilibrata"
      : score >= 1
        ? "complessivamente equilibrata"
        : score >= -1
          ? "nel complesso discreta, ma con alcuni aspetti meritevoli di attenzione"
          : "caratterizzata da diverse criticità";
  let concl =
    "Sulla base delle analisi svolte, la situazione economica, patrimoniale e finanziaria di " + companyHtml + " al " +
    fmtDate(ref.date) + " appare <b>" + giudizio + "</b>.";
  if (pos.length) concl += " Tra gli elementi positivi si segnalano in particolare: " + pos.slice(0, 3).join("; ") + ".";
  if (neg.length) concl += " Si raccomanda di monitorare con attenzione: " + neg.slice(0, 3).join("; ") + ".";
  out.push("<p>" + concl + "</p>");
  out.push('<p><span class="rel-ph">[Spazio per le considerazioni conclusive del redattore]</span></p>');
  out.push('<p class="rel-sign">' + esc(place || "[Luogo]") + ", " + new Date().toLocaleDateString("it-IT") + "</p>");
  out.push("<p>Il redattore<br>" + (author ? esc(author) : '<span class="rel-ph">[Nome e firma]</span>') + "</p>");
  out.push(
    "<p class=\"rel-note\">Relazione generata automaticamente dai dati dell'applicazione «Analisi di Bilancio» e modificabile dal redattore. Gli indici e i giudizi riportati si basano su soglie di riferimento generali e vanno interpretati in relazione al settore e alle specificità dell'azienda.</p>"
  );
  // Elisione: "al 8%" → "all'8%", "del 11%" → "dell'11%", "del 1,5%" → "dell'1,5%".
  return out
    .join("\n")
    .replace(/\b(al|del) ((?:<b>)?)(?=8|11(?![\d.])|1(?![\d.]))/g, (_m, p: string, b: string) => p + "l'" + b);
}

/** Documento HTML completo per l'esportazione (Word se `forWord`, altrimenti HTML/stampa). */
export function wrapDoc(inner: string, title: string, forWord: boolean): string {
  return (
    "<!DOCTYPE html><html" +
    (forWord
      ? ' xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"'
      : ' lang="it"') +
    '><head><meta charset="utf-8"><title>' + esc(title) +
    "</title><style>@page{size:A4;margin:2cm}body{margin:0;background:#fff}" +
    (forWord ? "" : "body{padding:32px}@media print{body{padding:0}}.rel-doc{max-width:820px;margin:0 auto}") +
    ".rel-doc .rel-ph{background:#fef9c3}h2{page-break-after:avoid}table{page-break-inside:auto}tr{page-break-inside:avoid}" +
    DOC_CSS +
    '</style></head><body><div class="rel-doc">' + inner + "</div></body></html>"
  );
}

export function downloadDoc(name: string, content: string, mime: string): void {
  const blob = new Blob(["\uFEFF", content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Stampa un documento HTML in un iframe nascosto (permette "Salva come PDF"). */
export function printHtml(html: string): void {
  const f = document.createElement("iframe");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(f);
  const d = f.contentDocument!;
  d.open();
  d.write(html);
  d.close();
  setTimeout(() => {
    f.contentWindow!.focus();
    f.contentWindow!.print();
    setTimeout(() => f.remove(), 2000);
  }, 300);
}
