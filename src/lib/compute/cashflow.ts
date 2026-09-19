import type { Periodo, PeriodCalc } from "../types";

export interface CashFlowResult {
  sameFY: boolean;
  utileFlusso: number;
  dRim: number;
  dCredOp: number;
  dRateiAtt: number;
  dDebOp: number;
  dRateiPass: number;
  flussoOperativo: number;
  dImmob: number;
  flussoInvestimenti: number;
  dDebFin: number;
  dPN: number;
  flussoFinanziamento: number;
  totale: number;
  deltaCassaReale: number;
  residuo: number;
}

export function computeCashFlow(
  p0: Periodo,
  calc0: PeriodCalc,
  p1: Periodo,
  calc1: PeriodCalc
): CashFlowResult {
  const sp0 = calc0.sp;
  const sp1 = calc1.sp;
  const ce1 = calc1.ce;

  const sameFY = p0.fyStart === p1.fyStart;
  const utileFlusso = sameFY ? ce1.utileNetto - calc0.ce.utileNetto : ce1.utileNetto;

  const dCredOp = sp1.creditiBreve.total - sp0.creditiBreve.total;
  const dRim = sp1.rimanenze.total - sp0.rimanenze.total;
  const dRateiAtt = sp1.rateiRiscAttivi.total - sp0.rateiRiscAttivi.total;
  const debOp0 = sp0.debitiBreve.total - sp0.debitiFinBreve.total;
  const debOp1 = sp1.debitiBreve.total - sp1.debitiFinBreve.total;
  const dDebOp = debOp1 - debOp0;
  const dRateiPass = sp1.rateiRiscPassivi.total - sp0.rateiRiscPassivi.total;

  const flussoOperativo =
    utileFlusso + ce1.ammortamenti.total - dRim - dCredOp - dRateiAtt + dDebOp + dRateiPass;

  const dImmob = sp1.immobilizzazioni.total - sp0.immobilizzazioni.total;
  const flussoInvestimenti = -(dImmob + ce1.ammortamenti.total);

  const dDebFin = sp1.debitiFinTot.total - sp0.debitiFinTot.total;
  const dPN = sp1.patrimonioNettoBase.total - sp0.patrimonioNettoBase.total;
  const flussoFinanziamento = dDebFin + dPN;

  const totale = flussoOperativo + flussoInvestimenti + flussoFinanziamento;
  const deltaCassaReale = sp1.liqImmediate.total - sp0.liqImmediate.total;
  const residuo = deltaCassaReale - totale;

  return {
    sameFY,
    utileFlusso,
    dRim,
    dCredOp,
    dRateiAtt,
    dDebOp,
    dRateiPass,
    flussoOperativo,
    dImmob,
    flussoInvestimenti,
    dDebFin,
    dPN,
    flussoFinanziamento,
    totale,
    deltaCassaReale,
    residuo,
  };
}
