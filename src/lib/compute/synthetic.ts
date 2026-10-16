import { classifyVarFix } from "../classify";
import { getManualTarget } from "../manualTargets";
import type { ClassifiedAccount, ManualEntry, VarFix } from "../types";

export function buildSyntheticAccounts(
  entries: ManualEntry[],
  varFixOverrides: Record<string, VarFix>
): ClassifiedAccount[] {
  const out: ClassifiedAccount[] = [];
  for (const entry of entries) {
    const target = getManualTarget(entry.target);
    if (!target) continue;
    const saldo = entry.importo * target.sign;
    let desc = entry.desc || target.label;
    if (target.breve === "entro") desc += " (entro 12 mesi)";
    if (target.breve === "oltre") desc += " (oltre 12 mesi)";
    const cls = {
      s: target.cls[0],
      l1: target.cls[1],
      l2: target.cls[2],
      n: target.cls[3],
      matched: true,
      manual: true,
    };
    const acc: ClassifiedAccount = {
      conto: entry.id,
      ref: entry.id,
      desc,
      saldo,
      cls,
      varFix: classifyVarFix(entry.id, cls, desc, varFixOverrides),
      manual: true,
    };
    out.push(acc);
  }
  return out;
}
