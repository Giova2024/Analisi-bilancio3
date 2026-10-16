import { clamp, round1 } from "../numberFormat";
import type { Assumptions, PeriodCalc, Periodo, ScenarioKey } from "../types";
import type { RatiosResult } from "./ratios";

export interface BPBaseline {
  ricavi0: number;
  costoPersonale0: number;
  altriCostiFissi0: number;
  ammortamenti0: number;
  oneriFin0: number;
  pn0: number;
  pfn0: number;
  incidenzaCVStorica: number;
  aliquotaStorica: number;
  dsoStorico: number;
  dpoStorico: number;
  giacenzaStorica: number;
  periodLabel: string;
  periodDate: string;
  // Stato Patrimoniale baseline (valori reali del periodo di partenza, per la colonna "Anno 0")
  liq0: number;
  creditiComm0: number;
  rimanenzeSp0: number;
  immobilizzazioni0: number;
  debitiForn0: number;
  /** Attività/passività non modellizzate (ratei, altri crediti/debiti…), mantenute costanti. */
  altreAttivita0: number;
  altrePassivita0: number;
  // Anno 0 riclassificato con lo stesso schema delle proiezioni
  cv0: number;
  mdc0: number;
  ebitda0: number;
  ebit0: number;
  ebt0: number;
  imposte0: number;
  utile0: number;
  /** Utile netto effettivo di bilancio (può differire da utile0 per voci non modellizzate). */
  utileBilancio0: number;
  ebitdaMargin0: number;
  roe0: number;
  /** Etichetta del periodo dell'esercizio precedente usato per il flusso di cassa dell'Anno 0. */
  prevLabel0: string | null;
  flusso0: number;
}

/** Crediti commerciali + rimanenze − debiti verso fornitori. */
function ccnOperativo(calc: PeriodCalc): number {
  const { ce, sp } = calc;
  const crediti = ce.creditiCommercialiKeyword > 0 ? ce.creditiCommercialiKeyword : sp.creditiBreve.total;
  const debiti = ce.debitiCommercialiKeyword > 0 ? ce.debitiCommercialiKeyword : sp.debitiFornitori.total;
  return crediti + sp.rimanenze.total - debiti;
}

export function computeBPBaseline(
  period: Periodo,
  calc: PeriodCalc,
  ratios: RatiosResult,
  prev: { label: string; calc: PeriodCalc } | null = null
): BPBaseline {
  const { ce, cm, sp } = calc;
  const incidenzaCV = ce.ricaviVendite.total ? (cm.totaleCV / ce.ricaviVendite.total) * 100 : 20;
  const aliquotaStorica = ce.ebt > 0 ? (ce.imposte.total / ce.ebt) * 100 : 28;

  const ricavi0 = ce.ricaviVendite.total;
  const costoPersonale0 = cm.cfPersonale.total;
  // Gli ammortamenti sono proiettati separatamente: vanno esclusi dagli altri costi fissi.
  const altriCostiFissi0 = Math.max(0, cm.totaleCF - cm.cfPersonale.total - cm.cfAmmortamenti.total);
  const ammortamenti0 = ce.ammortamenti.total;
  const oneriFin0 = ce.oneriFinanziari || 0;
  const liq0 = sp.liqImmediate.total;
  const creditiComm0 = ce.creditiCommercialiKeyword > 0 ? ce.creditiCommercialiKeyword : sp.creditiBreve.total;
  const rimanenzeSp0 = sp.rimanenze.total;
  const immobilizzazioni0 = sp.immobilizzazioni.total;
  const debitiForn0 = ce.debitiCommercialiKeyword > 0 ? ce.debitiCommercialiKeyword : sp.debitiFornitori.total;
  const pn0 = sp.patrimonioNetto.total;
  const pfn0 = sp.pfn;

  const cv0 = cm.totaleCV;
  const mdc0 = ricavi0 - cv0;
  const ebitda0 = mdc0 - costoPersonale0 - altriCostiFissi0;
  const ebit0 = ebitda0 - ammortamenti0;
  const ebt0 = ebit0 - oneriFin0;
  const imposte0 = ce.imposte.total;
  const utile0 = ebt0 - imposte0;

  let flusso0 = NaN;
  if (prev) {
    const capexNetti = immobilizzazioni0 - prev.calc.sp.immobilizzazioni.total + ammortamenti0;
    const deltaCcn = creditiComm0 + rimanenzeSp0 - debitiForn0 - ccnOperativo(prev.calc);
    flusso0 = utile0 + ammortamenti0 - deltaCcn - capexNetti;
  }

  return {
    ricavi0,
    costoPersonale0,
    altriCostiFissi0,
    ammortamenti0,
    oneriFin0,
    pn0,
    pfn0,
    incidenzaCVStorica: round1(incidenzaCV),
    aliquotaStorica: round1(clamp(aliquotaStorica, 0, 60) || 28),
    dsoStorico: isFinite(ratios.dso) ? Math.round(ratios.dso) : 30,
    dpoStorico: isFinite(ratios.dpo) ? Math.round(ratios.dpo) : 30,
    giacenzaStorica: isFinite(ratios.dmag) ? Math.round(ratios.dmag) : 30,
    periodLabel: period.label,
    periodDate: period.date,
    liq0,
    creditiComm0,
    rimanenzeSp0,
    immobilizzazioni0,
    debitiForn0,
    altreAttivita0: (sp.totaleImpieghi || 0) - (liq0 + creditiComm0 + rimanenzeSp0 + immobilizzazioni0),
    altrePassivita0: (sp.totaleFonti || 0) - (debitiForn0 + (pfn0 + liq0) + pn0),
    cv0,
    mdc0,
    ebitda0,
    ebit0,
    ebt0,
    imposte0,
    utile0,
    utileBilancio0: ce.utileNetto,
    ebitdaMargin0: ricavi0 ? ebitda0 / ricavi0 : NaN,
    roe0: pn0 ? utile0 / pn0 : NaN,
    prevLabel0: prev ? prev.label : null,
    flusso0,
  };
}

interface ScenarioDelta {
  crescitaRicavi: number;
  incidenzaCV: number;
  varPersonale: number;
  varAltriFissi: number;
  varAmmortamenti: number;
  varOneriFin: number;
  aliquotaDelta: number;
  capex: number;
  dso: number;
  dpo: number;
  giacenza: number;
}

export const BP_SCENARIO_DELTA: Record<ScenarioKey, ScenarioDelta> = {
  prudenziale: { crescitaRicavi: -3, incidenzaCV: 2, varPersonale: 3, varAltriFissi: 3, varAmmortamenti: 0, varOneriFin: 5, aliquotaDelta: 0, capex: 0, dso: 10, dpo: -5, giacenza: 10 },
  base: { crescitaRicavi: 3, incidenzaCV: 0, varPersonale: 2, varAltriFissi: 2, varAmmortamenti: 0, varOneriFin: 0, aliquotaDelta: 0, capex: 0, dso: 0, dpo: 0, giacenza: 0 },
  ottimistico: { crescitaRicavi: 8, incidenzaCV: -2, varPersonale: 1, varAltriFissi: 1, varAmmortamenti: 0, varOneriFin: -5, aliquotaDelta: 0, capex: 0, dso: -10, dpo: 5, giacenza: -10 },
};

export function defaultScenarioAssumptions(baseline: BPBaseline, scenario: ScenarioKey): Assumptions {
  const delta = BP_SCENARIO_DELTA[scenario];
  return {
    crescitaRicavi: delta.crescitaRicavi,
    incidenzaCV: Math.max(0, round1(baseline.incidenzaCVStorica + delta.incidenzaCV)),
    varPersonale: delta.varPersonale,
    varAltriFissi: delta.varAltriFissi,
    varAmmortamenti: delta.varAmmortamenti,
    varOneriFin: delta.varOneriFin,
    aliquota: baseline.aliquotaStorica,
    capex: delta.capex,
    dso: Math.max(0, baseline.dsoStorico + delta.dso),
    dpo: Math.max(0, baseline.dpoStorico + delta.dpo),
    giacenza: Math.max(0, baseline.giacenzaStorica + delta.giacenza),
  };
}

export interface BPYearRow {
  year: number;
  ricavi: number;
  cv: number;
  margineContrib: number;
  costoPersonale: number;
  altriFissi: number;
  costiFissi: number;
  ebitda: number;
  ammortamenti: number;
  ebit: number;
  oneriFin: number;
  ebt: number;
  imposte: number;
  utileNetto: number;
  deltaCCN: number;
  flussoOperativo: number;
  capex: number;
  flussoDisponibile: number;
  pfn: number;
  pn: number;
  ebitdaMargin: number;
  ebitMargin: number;
  roe: number;
  pfnEbitda: number;
  // Stato Patrimoniale prospettico
  crediti: number;
  rimanenze: number;
  debitiFornitori: number;
  immobilizzazioniNette: number;
  altreAttivita: number;
  altrePassivita: number;
  liquidita: number;
  debitiFinanziari: number;
  totaleImpieghi: number;
  totaleFonti: number;
  quadratura: number;
}

export function projectScenario(baseline: BPBaseline, assum: Assumptions, years: number): BPYearRow[] {
  let ricavi = baseline.ricavi0;
  let costoPersonale = baseline.costoPersonale0;
  let altriFissi = baseline.altriCostiFissi0;
  let ammortamenti = baseline.ammortamenti0;
  let oneriFin = baseline.oneriFin0;
  let pn = baseline.pn0;
  let pfn = baseline.pfn0;
  let immobilizzazioniNette = baseline.immobilizzazioni0;
  let liquidita = baseline.liq0;

  // Punto di partenza del CCN: i valori reali di bilancio del periodo di partenza (Anno 0),
  // non una stima ricostruita dai giorni medi dello scenario — altrimenti il primo anno
  // proiettato "salta" rispetto all'Anno 0 e lo stato patrimoniale prospettico non quadra più.
  let ccnPrev = baseline.creditiComm0 + baseline.rimanenzeSp0 - baseline.debitiForn0;

  const rows: BPYearRow[] = [];

  for (let y = 1; y <= years; y++) {
    ricavi *= 1 + assum.crescitaRicavi / 100;
    const cv = ricavi * (assum.incidenzaCV / 100);
    const margineContrib = ricavi - cv;
    costoPersonale *= 1 + assum.varPersonale / 100;
    altriFissi *= 1 + assum.varAltriFissi / 100;
    const costiFissi = costoPersonale + altriFissi;
    const ebitda = margineContrib - costiFissi;
    ammortamenti *= 1 + assum.varAmmortamenti / 100;
    const capex = assum.capex || 0;
    // Non si può ammortizzare più del valore residuo delle immobilizzazioni (+ nuovi investimenti).
    const ammEffettivi = Math.max(0, Math.min(ammortamenti, immobilizzazioniNette + capex));
    const ebit = ebitda - ammEffettivi;
    oneriFin = Math.max(0, oneriFin * (1 + assum.varOneriFin / 100));
    const ebt = ebit - oneriFin;
    const imposte = Math.max(0, ebt) * (assum.aliquota / 100);
    const utileNetto = ebt - imposte;

    const crediti = (ricavi / 365) * assum.dso;
    const rimanenze = (cv / 365) * assum.giacenza;
    const debiti = (cv / 365) * assum.dpo;
    const ccn = crediti + rimanenze - debiti;
    const deltaCCN = ccn - ccnPrev;
    ccnPrev = ccn;

    const flussoOperativo = utileNetto + ammEffettivi - deltaCCN;
    const flussoDisponibile = flussoOperativo - capex;
    // Il flusso di cassa disponibile di ciascun anno si accumula (o si riduce, se negativo)
    // nella liquidità: prima era mantenuta costante per errore, dando l'impressione che la
    // liquidità "non si muovesse mai". La PFN riflette comunque la variazione di liquidità,
    // a debiti finanziari lordi invariati rispetto al periodo di partenza.
    liquidita = liquidita + flussoDisponibile;
    pfn = pfn - flussoDisponibile;
    pn = pn + utileNetto;
    immobilizzazioniNette = immobilizzazioniNette + capex - ammEffettivi;

    const altreAttivita = baseline.altreAttivita0 || 0;
    const altrePassivita = baseline.altrePassivita0 || 0;
    const debitiFinanziari = pfn + liquidita;
    const totaleImpieghi = liquidita + crediti + rimanenze + immobilizzazioniNette + altreAttivita;
    const totaleFonti = debiti + debitiFinanziari + pn + altrePassivita;
    const quadratura = totaleImpieghi - totaleFonti;

    rows.push({
      year: y,
      ricavi,
      cv,
      margineContrib,
      costoPersonale,
      altriFissi,
      costiFissi,
      ebitda,
      ammortamenti: ammEffettivi,
      ebit,
      oneriFin,
      ebt,
      imposte,
      utileNetto,
      deltaCCN,
      flussoOperativo,
      capex,
      flussoDisponibile,
      pfn,
      pn,
      ebitdaMargin: ricavi ? ebitda / ricavi : NaN,
      ebitMargin: ricavi ? ebit / ricavi : NaN,
      roe: pn ? utileNetto / pn : NaN,
      pfnEbitda: ebitda ? pfn / ebitda : NaN,
      crediti,
      rimanenze,
      debitiFornitori: debiti,
      immobilizzazioniNette,
      altreAttivita,
      altrePassivita,
      liquidita,
      debitiFinanziari,
      totaleImpieghi,
      totaleFonti,
      quadratura,
    });
  }

  return rows;
}
