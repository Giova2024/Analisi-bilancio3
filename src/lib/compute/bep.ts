import type { BepInput, PeriodCalc } from "../types";

export interface BepResult {
  cf: number;
  cv: number;
  mc: number;
  ricavi: number;
  mcPct: number;
  cvRatio: number;
  bepAggregatoEur: number;
  margineSicurezzaEur: number;
  margineSicurezzaPct: number;
  mcUnit: number;
  bepQty: number;
  bepEurDaQty: number;
}

export function computeBEP(calc: PeriodCalc, input: BepInput | undefined): BepResult {
  const { cm, ce } = calc;
  const cf = cm.totaleCF;
  const cv = cm.totaleCV;
  const mc = cm.margineContribuzione;
  const ricavi = ce.ricaviVendite.total;

  const mcPct = ricavi ? mc / ricavi : NaN;
  const cvRatio = ricavi ? cv / ricavi : 0;
  const bepAggregatoEur = isFinite(mcPct) && mcPct > 0 ? cf / mcPct : NaN;
  const margineSicurezzaEur = isFinite(bepAggregatoEur) ? ricavi - bepAggregatoEur : NaN;
  const margineSicurezzaPct = ricavi ? margineSicurezzaEur / ricavi : NaN;

  let mcUnit = NaN;
  let bepQty = NaN;
  let bepEurDaQty = NaN;
  if (input && input.prezzo != null && input.costoVar != null) {
    mcUnit = input.prezzo - input.costoVar;
    bepQty = mcUnit > 0 ? cf / mcUnit : NaN;
    bepEurDaQty = isFinite(bepQty) ? bepQty * input.prezzo : NaN;
  }

  return {
    cf,
    cv,
    mc,
    ricavi,
    mcPct,
    cvRatio,
    bepAggregatoEur,
    margineSicurezzaEur,
    margineSicurezzaPct,
    mcUnit,
    bepQty,
    bepEurDaQty,
  };
}
