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
  manualEntries: AppState["manualEntries"],
  excludedAccounts: AppState["excludedAccounts"] = {}
): PeriodCalc {
  const classified: ClassifiedAccount[] = period.accounts.map((raw) => {
    const cls = classifyAccount(raw, overrides);
    const excluded = !!(excludedAccounts[raw.conto] || excludedAccounts[raw.ref]);
    return {
      ...raw,
      cls,
      varFix: classifyVarFix(raw.conto, cls, raw.desc, varFixOverrides),
      excluded,
    };
  });

  const synthetic = buildSyntheticAccounts(manualEntries[period.id] || [], varFixOverrides);
  const accounts = classified.concat(synthetic);
  // I conti esclusi manualmente (scheda Mappatura Conti) restano visibili nell'elenco ma
  // vengono tolti dal calcolo di Stato Patrimoniale, Conto Economico e indici.
  const accountsForCalc = accounts.filter((a) => !a.excluded);

  const sp = computeSP(accountsForCalc);
  const ce = computeCE(accountsForCalc);
  const cm = computeCM(accountsForCalc, ce);

  const unmatched = accounts.filter((a) => !a.cls.matched && !a.excluded).length;

  return { accounts, sp, ce, cm, unmatched };
}

export function sortPeriods(periods: Periodo[]): Periodo[] {
  return [...periods].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
