import type { Periodo, PeriodCalc, SP } from "../types";

export interface CashFlowResult {
  sameFY: boolean;
  utileFlusso: number;
  /** Ammortamenti del periodo (solo la quota maturata tra p0 e p1 se stesso esercizio). */
  amm: number;
  dRim: number;
  dCredOp: number;
  dRateiAtt: number;
  dDebOp: number;
  dRateiPass: number;
  /** Δ fondi rischi e oneri + TFR. */
  dFondi: number;
  /** Δ debiti non finanziari oltre 12 mesi. */
  dDebOpOltre: number;
  dAltroPass: number;
  flussoOperativo: number;
  dImmob: number;
  dAttFin: number;
  flussoInvestimenti: number;
  dDebFin: number;
  dPN: number;
  /** Risultato dell'esercizio precedente stornato dalla gestione finanziaria (esercizi diversi). */
  utilePrec: number;
  flussoFinanziamento: number;
  totale: number;
  deltaCassaReale: number;
  residuo: number;
  quad0: number;
  quad1: number;
}

type BucketKey = {
  [K in keyof SP]: SP[K] extends { total: number } ? K : never;
}[keyof SP];

/**
 * Rendiconto finanziario indiretto per differenza tra due Stati Patrimoniali. Tutte le voci
 * patrimoniali vengono considerate, quindi il totale coincide con la variazione di cassa a meno
 * degli sbilanci (quadratura) delle situazioni importate.
 */
export function computeCashFlow(
  p0: Periodo,
  calc0: PeriodCalc,
  p1: Periodo,
  calc1: PeriodCalc
): CashFlowResult {
  const sp0 = calc0.sp;
  const sp1 = calc1.sp;
  const sameFY = p0.fyStart === p1.fyStart;
  const d = (k: BucketKey) => sp1[k].total - sp0[k].total;

  const utileFlusso = sameFY
    ? sp1.risultatoPeriodo.total - sp0.risultatoPeriodo.total
    : sp1.risultatoPeriodo.total;
  const amm = sameFY
    ? calc1.ce.ammortamenti.total - calc0.ce.ammortamenti.total
    : calc1.ce.ammortamenti.total;

  const dRim = d("rimanenze");
  const dCredOp = d("creditiBreve");
  const dRateiAtt = d("rateiRiscAttivi");
  const dDebOp = d("debitiBreve") - d("debitiFinBreve");
  const dRateiPass = d("rateiRiscPassivi");
  const dFondi = d("fondiRischi") + d("tfr");
  const dDebOpOltre = d("debitiOltre") - d("debitiFinOltre");
  const dAltroPass = d("altroPassivo");

  const flussoOperativo =
    utileFlusso + amm - dRim - dCredOp - dRateiAtt + dDebOp + dRateiPass + dFondi + dDebOpOltre + dAltroPass;

  const dImmob = d("immobilizzazioni");
  const dAttFin = d("attFinNonImmob");
  const flussoInvestimenti = -(dImmob + amm) - dAttFin;

  const dDebFin = d("debitiFinTot");
  const dPN = d("patrimonioNettoBase");
  // Tra esercizi diversi il risultato precedente confluisce nel PN (riserve) o viene distribuito:
  // lo si storna così che la Δ PN rifletta solo i movimenti monetari (apporti, dividendi).
  const utilePrec = sameFY ? 0 : sp0.risultatoPeriodo.total;
  const flussoFinanziamento = dDebFin + dPN - utilePrec;

  const totale = flussoOperativo + flussoInvestimenti + flussoFinanziamento;
  const deltaCassaReale = d("liqImmediate");
  const residuo = deltaCassaReale - totale;

  return {
    sameFY,
    utileFlusso,
    amm,
    dRim,
    dCredOp,
    dRateiAtt,
    dDebOp,
    dRateiPass,
    dFondi,
    dDebOpOltre,
    dAltroPass,
    flussoOperativo,
    dImmob,
    dAttFin,
    flussoInvestimenti,
    dDebFin,
    dPN,
    utilePrec,
    flussoFinanziamento,
    totale,
    deltaCassaReale,
    residuo,
    quad0: sp0.quadratura,
    quad1: sp1.quadratura,
  };
}
