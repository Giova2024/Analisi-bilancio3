import { classifyAccount, classifyVarFix } from "../classify";
import type { AppState, ClassifiedAccount, Periodo, PeriodCalc } from "../types";
import { buildSyntheticAccounts } from "./synthetic";
import { computeSP } from "./sp";
import { computeCE } from "./ce";
import { computeCM } from "./cm";

export function computePeriod(
  period: Periodo,
  overrides: AppState["overrides"],
  varFixOverrides: AppState["varFixOverrides"],
  manualEntries: AppState["manualEntries"]
): PeriodCalc {
  const classified: ClassifiedAccount[] = period.accounts.map((raw) => {
    const cls = classifyAccount(raw, overrides);
    return {
      ...raw,
      cls,
      varFix: classifyVarFix(raw.conto, cls, raw.desc, varFixOverrides),
    };
  });

  const synthetic = buildSyntheticAccounts(manualEntries[period.id] || [], varFixOverrides);
  const accounts = classified.concat(synthetic);

  const sp = computeSP(accounts);
  const ce = computeCE(accounts);
  const cm = computeCM(accounts, ce);

  const unmatched = accounts.filter((a) => !a.cls.matched).length;

  return { accounts, sp, ce, cm, unmatched };
}

export function sortPeriods(periods: Periodo[]): Periodo[] {
  return [...periods].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
