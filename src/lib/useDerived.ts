"use client";

import { useMemo } from "react";
import { useStore } from "./store";
import { computePeriod, sortPeriods } from "./compute/period";
import { computeRatios, type RatiosResult } from "./compute/ratios";
import type { PeriodCalc, Periodo } from "./types";

export interface Derived {
  /** Periodi inclusi nelle analisi (ordinati per data). */
  periods: Periodo[];
  /** Tutti i periodi, compresi quelli esclusi dall'utente. */
  allPeriods: Periodo[];
  calcs: Record<string, PeriodCalc>;
  ratios: Record<string, RatiosResult>;
}

export function useDerived(): Derived {
  const periods = useStore((s) => s.periods);
  const overrides = useStore((s) => s.overrides);
  const varFixOverrides = useStore((s) => s.varFixOverrides);
  const manualEntries = useStore((s) => s.manualEntries);
  const excludedAccounts = useStore((s) => s.excludedAccounts);

  return useMemo(() => {
    const sorted = sortPeriods(periods);
    const calcs: Record<string, PeriodCalc> = {};
    const ratios: Record<string, RatiosResult> = {};
    for (const p of sorted) {
      const calc = computePeriod(p, overrides, varFixOverrides, manualEntries, excludedAccounts);
      calcs[p.id] = calc;
      ratios[p.id] = computeRatios(p, calc);
    }
    return { periods: sorted.filter((p) => !p.excluded), allPeriods: sorted, calcs, ratios };
  }, [periods, overrides, varFixOverrides, manualEntries, excludedAccounts]);
}
