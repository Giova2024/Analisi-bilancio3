import type { PeriodCalc, Periodo, RatioGroup } from "../types";

export function periodDaysSpan(p: Periodo): number {
  const days = Math.round(
    (new Date(p.date).getTime() - new Date(p.fyStart).getTime()) / 86400000
  ) + 1;
  return Math.max(1, days);
}

export interface RatiosResult {
  currentRatio: number;
  quickRatio: number;
  ccn: number;
  margineTesoreria: number;
  margineStruttPrim: number;
  quozStruttPrim: number;
  margineStruttSec: number;
  quozStruttSec: number;
  indipendenzaFin: number;
  leverage: number;
  debtEquity: number;
  pfnPn: number;
  pfnEbitda: number;
  roe: number;
  roi: number;
  ros: number;
  roa: number;
  ebitdaMargin: number;
  ebitMargin: number;
  turnoverCI: number;
  rod: number;
  incidenzaOneriFin: number;
  dso: number;
  dpo: number;
  dmag: number;
  ciclo: number;
}

export function computeRatios(period: Periodo, calc: PeriodCalc): RatiosResult {
  const { sp, ce } = calc;
  const days = periodDaysSpan(period);

  const creditiCommerciali =
    ce.creditiCommercialiKeyword > 0 ? ce.creditiCommercialiKeyword : sp.creditiBreve.total;
  const debitiCommerciali =
    ce.debitiCommercialiKeyword > 0 ? ce.debitiCommercialiKeyword : sp.debitiFornitori.total;
  const acquisti = ce.materiePrime.total + ce.servizi.total;

  const currentRatio = sp.passivitaCorrenti.total ? sp.attivoCircolante.total / sp.passivitaCorrenti.total : NaN;
  const quickRatio = sp.passivitaCorrenti.total
    ? (sp.attivoCircolante.total - sp.rimanenze.total) / sp.passivitaCorrenti.total
    : NaN;
  const ccn = sp.attivoCircolante.total - sp.passivitaCorrenti.total;
  const margineTesoreria = sp.attivoCircolante.total - sp.rimanenze.total - sp.passivitaCorrenti.total;

  const margineStruttPrim = sp.patrimonioNetto.total - sp.immobilizzazioni.total;
  const quozStruttPrim = sp.immobilizzazioni.total ? sp.patrimonioNetto.total / sp.immobilizzazioni.total : NaN;
  const margineStruttSec =
    sp.patrimonioNetto.total + sp.passivitaConsolidate.total - sp.immobilizzazioni.total;
  const quozStruttSec = sp.immobilizzazioni.total
    ? (sp.patrimonioNetto.total + sp.passivitaConsolidate.total) / sp.immobilizzazioni.total
    : NaN;
  const indipendenzaFin = sp.totaleFonti ? sp.patrimonioNetto.total / sp.totaleFonti : NaN;
  const leverage = sp.patrimonioNetto.total ? sp.totaleFonti / sp.patrimonioNetto.total : NaN;
  const debtEquity = sp.patrimonioNetto.total
    ? (sp.passivitaCorrenti.total + sp.passivitaConsolidate.total) / sp.patrimonioNetto.total
    : NaN;
  const pfnPn = sp.patrimonioNetto.total ? sp.pfn / sp.patrimonioNetto.total : NaN;
  const pfnEbitda = ce.ebitda ? sp.pfn / ce.ebitda : NaN;

  const roe = sp.patrimonioNetto.total ? ce.utileNetto / sp.patrimonioNetto.total : NaN;
  const roi = sp.totaleImpieghi ? ce.ebit / sp.totaleImpieghi : NaN;
  const ros = ce.ricaviVendite.total ? ce.ebit / ce.ricaviVendite.total : NaN;
  const roa = sp.totaleImpieghi ? ce.utileNetto / sp.totaleImpieghi : NaN;
  const ebitdaMargin = ce.valoreProduzione ? ce.ebitda / ce.valoreProduzione : NaN;
  const ebitMargin = ce.valoreProduzione ? ce.ebit / ce.valoreProduzione : NaN;
  const turnoverCI = sp.totaleImpieghi ? ce.ricaviVendite.total / sp.totaleImpieghi : NaN;
  const rod = sp.debitiFinTot.total ? ce.oneriFinanziari / sp.debitiFinTot.total : NaN;
  const incidenzaOneriFin = ce.ricaviVendite.total ? ce.oneriFinanziari / ce.ricaviVendite.total : NaN;

  const dso = ce.ricaviVendite.total ? (creditiCommerciali / ce.ricaviVendite.total) * days : NaN;
  const dpo = acquisti ? (debitiCommerciali / acquisti) * days : NaN;
  const materieBase = Math.abs(ce.materiePrime.total + ce.varRimMaterie.total);
  const dmag = materieBase > 0.01 ? (sp.rimanenze.total / materieBase) * days : NaN;
  const ciclo = (isFinite(dso) ? dso : 0) + (isFinite(dmag) ? dmag : 0) - (isFinite(dpo) ? dpo : 0);

  return {
    currentRatio,
    quickRatio,
    ccn,
    margineTesoreria,
    margineStruttPrim,
    quozStruttPrim,
    margineStruttSec,
    quozStruttSec,
    indipendenzaFin,
    leverage,
    debtEquity,
    pfnPn,
    pfnEbitda,
    roe,
    roi,
    ros,
    roa,
    ebitdaMargin,
    ebitMargin,
    turnoverCI,
    rod,
    incidenzaOneriFin,
    dso,
    dpo,
    dmag,
    ciclo,
  };
}

export function dotFor(value: number, thresholds?: [number, number], higherBetter = true): "green" | "amber" | "red" | "grey" {
  if (!thresholds || !isFinite(value)) return "grey";
  const [red, green] = thresholds;
  if (higherBetter) {
    if (value >= green) return "green";
    if (value >= red) return "amber";
    return "red";
  }
  if (value <= green) return "green";
  if (value <= red) return "amber";
  return "red";
}

export function buildRatioGroups(r: RatiosResult): RatioGroup[] {
  return [
    {
      title: "💧 Liquidità (solvibilità a breve)",
      ratios: [
        { key: "currentRatio", label: "Indice di liquidità corrente (Current Ratio)", value: r.currentRatio, dot: [1, 1.5], higherBetter: true, format: "ratio" },
        { key: "quickRatio", label: "Indice di liquidità secca (Quick Ratio)", value: r.quickRatio, dot: [0.7, 1], higherBetter: true, format: "ratio" },
        { key: "ccn", label: "Capitale Circolante Netto", value: r.ccn, format: "eur" },
        { key: "margineTesoreria", label: "Margine di Tesoreria", value: r.margineTesoreria, format: "eur" },
      ],
    },
    {
      title: "🏛 Solidità patrimoniale",
      ratios: [
        { key: "margineStruttPrim", label: "Margine di struttura primario", value: r.margineStruttPrim, format: "eur" },
        { key: "quozStruttPrim", label: "Quoziente di struttura primario", value: r.quozStruttPrim, dot: [0.5, 1], higherBetter: true, format: "ratio" },
        { key: "margineStruttSec", label: "Margine di struttura secondario", value: r.margineStruttSec, format: "eur" },
        { key: "quozStruttSec", label: "Quoziente di struttura secondario", value: r.quozStruttSec, dot: [1, 1.2], higherBetter: true, format: "ratio" },
        { key: "indipendenzaFin", label: "Indice di indipendenza finanziaria", value: r.indipendenzaFin, dot: [0.2, 0.33], higherBetter: true, format: "pct" },
        { key: "leverage", label: "Leverage (indebitamento complessivo)", value: r.leverage, dot: [3.5, 2], higherBetter: false, format: "ratio" },
        { key: "debtEquity", label: "Debt / Equity", value: r.debtEquity, dot: [2, 1], higherBetter: false, format: "ratio" },
        { key: "pfnPn", label: "PFN / Patrimonio Netto", value: r.pfnPn, format: "ratio" },
        { key: "pfnEbitda", label: "PFN / EBITDA", value: r.pfnEbitda, dot: [4, 3], higherBetter: false, format: "ratio" },
      ],
    },
    {
      title: "📈 Redditività",
      ratios: [
        { key: "roe", label: "ROE", value: r.roe, dot: [0.05, 0.1], higherBetter: true, format: "pct" },
        { key: "roi", label: "ROI", value: r.roi, dot: [0.04, 0.08], higherBetter: true, format: "pct" },
        { key: "ros", label: "ROS", value: r.ros, dot: [0.03, 0.08], higherBetter: true, format: "pct" },
        { key: "roa", label: "ROA", value: r.roa, dot: [0.02, 0.05], higherBetter: true, format: "pct" },
        { key: "ebitdaMargin", label: "EBITDA Margin", value: r.ebitdaMargin, dot: [0.08, 0.15], higherBetter: true, format: "pct" },
        { key: "ebitMargin", label: "EBIT Margin", value: r.ebitMargin, dot: [0.03, 0.08], higherBetter: true, format: "pct" },
        { key: "turnoverCI", label: "Turnover del capitale investito", value: r.turnoverCI, format: "x" },
        { key: "rod", label: "ROD — costo medio del debito", value: r.rod, higherBetter: false, format: "pct" },
        { key: "incidenzaOneriFin", label: "Incidenza oneri finanziari su ricavi", value: r.incidenzaOneriFin, dot: [0.03, 0.015], higherBetter: false, format: "pct" },
      ],
    },
    {
      title: "🔄 Efficienza e rotazione (giorni)",
      ratios: [
        { key: "dso", label: "Giorni medi di incasso clienti (DSO)", value: r.dso, dot: [90, 60], higherBetter: false, format: "days" },
        { key: "dpo", label: "Giorni medi di pagamento fornitori (DPO)", value: r.dpo, format: "days" },
        { key: "dmag", label: "Giorni medi di giacenza magazzino", value: r.dmag, dot: [90, 60], higherBetter: false, format: "days" },
        { key: "ciclo", label: "Ciclo commerciale netto", value: r.ciclo, format: "days" },
      ],
    },
  ];
}
