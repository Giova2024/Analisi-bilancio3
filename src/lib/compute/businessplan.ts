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
}

export function computeBPBaseline(period: Periodo, calc: PeriodCalc, ratios: RatiosResult): BPBaseline {
  const { ce, cm, sp } = calc;
  const incidenzaCV = ce.ricaviVendite.total ? (cm.totaleCV / ce.ricaviVendite.total) * 100 : 20;
  const aliquotaStorica = ce.ebt > 0 ? (ce.imposte.total / ce.ebt) * 100 : 28;

  return {
    ricavi0: ce.ricaviVendite.total,
    costoPersonale0: cm.cfPersonale.total,
    altriCostiFissi0: Math.max(0, cm.totaleCF - cm.cfPersonale.total),
    ammortamenti0: ce.ammortamenti.total,
    oneriFin0: ce.oneriFinanziari || 0,
    pn0: sp.patrimonioNetto.total,
    pfn0: sp.pfn,
    incidenzaCVStorica: round1(incidenzaCV),
    aliquotaStorica: round1(clamp(aliquotaStorica, 0, 60) || 28),
    dsoStorico: isFinite(ratios.dso) ? Math.round(ratios.dso) : 30,
    dpoStorico: isFinite(ratios.dpo) ? Math.round(ratios.dpo) : 30,
    giacenzaStorica: isFinite(ratios.dmag) ? Math.round(ratios.dmag) : 30,
    periodLabel: period.label,
    periodDate: period.date,
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
}

export function projectScenario(baseline: BPBaseline, assum: Assumptions, years: number): BPYearRow[] {
  let ricavi = baseline.ricavi0;
  let costoPersonale = baseline.costoPersonale0;
  let altriFissi = baseline.altriCostiFissi0;
  let ammortamenti = baseline.ammortamenti0;
  let oneriFin = baseline.oneriFin0;
  let pn = baseline.pn0;
  let pfn = baseline.pfn0;

  const cvPrev0 = baseline.ricavi0 * (assum.incidenzaCV / 100);
  let ccnPrev =
    (baseline.ricavi0 / 365) * assum.dso +
    (cvPrev0 / 365) * assum.giacenza -
    (cvPrev0 / 365) * assum.dpo;

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
    const ebit = ebitda - ammortamenti;
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

    const flussoOperativo = utileNetto + ammortamenti - deltaCCN;
    const capex = assum.capex || 0;
    const flussoDisponibile = flussoOperativo - capex;
    pfn = pfn - flussoDisponibile;
    pn = pn + utileNetto;

    rows.push({
      year: y,
      ricavi,
      cv,
      margineContrib,
      costoPersonale,
      altriFissi,
      costiFissi,
      ebitda,
      ammortamenti,
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
    });
  }

  return rows;
}
