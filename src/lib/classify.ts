import pianoRaw from "@/data/piano-standard.json";
import type { Cls, Override, Piano, RawAccount, VarFix } from "./types";

export const PIANO = pianoRaw as unknown as Piano;
export const PIANO_COUNT = Object.keys(PIANO).length;

export function isBreve(desc: string): boolean {
  if (/oltre\s*(i\s*)?12\s*mesi/i.test(desc)) return false;
  if (/entro\s*(i\s*)?12\s*mesi/i.test(desc)) return true;
  return true;
}

export function isStraord(desc: string): boolean {
  return /straordinari|plusvalen|minusvalen/i.test(desc);
}

export function heuristicClassify(
  conto: string,
  rawDesc: string
): { s: Cls["s"]; l1: string; l2: number; n: number } {
  const desc = (rawDesc || "").toLowerCase();
  const first = conto.charAt(0);
  let s: Cls["s"] = "CE";
  let l1 = "";
  let l2 = 0;
  let n = 0;

  if (first === "1" || first === "2") {
    s = "AA";
    if (
      /fondo ammortamento|fondo svalutazione|immobilizzazion|impiant|attrezzatur|brevett|marchi|licenz|avviamento|software/.test(
        desc
      )
    ) {
      l1 = "B";
      l2 = /immaterial|brevett|marchi|licenz|avviamento|software|costi di impianto|costi di svilupp/.test(
        desc
      )
        ? 1
        : 2;
    } else if (/banca|cassa|c\/c|postale/.test(desc)) {
      l1 = "C";
      l2 = 4;
    } else if (/rimanenz|magazzino|merci|materie prime|prodotti finiti/.test(desc)) {
      l1 = "C";
      l2 = 1;
    } else if (/rateo|risconto/.test(desc)) {
      l1 = "D";
    } else {
      l1 = "C";
      l2 = 2;
    }
  } else if (first === "3" || first === "4") {
    s = "AP";
    if (
      /capitale sociale|riserva|riserve|utili portati|utile.*esercizio|perdita.*esercizio/.test(
        desc
      )
    ) {
      l1 = "A";
    } else if (/fondo rischi|fondo oneri/.test(desc)) {
      l1 = "B";
    } else if (/tfr|trattamento di fine rapporto/.test(desc)) {
      l1 = "C";
    } else if (/rateo|risconto/.test(desc)) {
      l1 = "E";
    } else {
      l1 = "D";
      n = /banc|mutuo|finanziament/.test(desc)
        ? 4
        : /fornitor/.test(desc)
          ? 7
          : /erario|iva|irpef|tribut/.test(desc)
            ? 12
            : /inps|inail|previden/.test(desc)
              ? 13
              : 14;
    }
  } else if (first === "5") {
    s = "CE";
    l1 = "A";
    n = 1;
    if (/rimanenz/.test(desc)) n = 2;
    if (/altri ricavi|sopravvenienz|contribut/.test(desc)) n = 5;
  } else if (first === "6") {
    s = "CE";
    l1 = "B";
    n = /ammortamento|svalutazion/.test(desc)
      ? 10
      : /stipend|salari|personale|oneri social|inail|tfr/.test(desc)
        ? 9
        : /rimanenz/.test(desc)
          ? 11
          : /locazion|canone|godiment|leasing/.test(desc)
            ? 8
            : /material|merc(i|e)|consumo|acquist/.test(desc)
              ? 6
              : /accanton/.test(desc)
                ? 12
                : /impost|tass|sanzion|arrotond/.test(desc)
                  ? 14
                  : 7;
  } else if (first === "7") {
    s = "CE";
    if (/interess|onere finanz|proventi finanz|sconto|commission.*fideiuss/.test(desc)) {
      l1 = "C";
      n = 17;
    } else if (
      /ires|irap|imposta sostitut|imposte anticipate|imposte differite|imposte correnti/.test(
        desc
      )
    ) {
      l1 = "D";
      n = 20;
    } else {
      l1 = "C";
      n = 17;
    }
  }

  return { s, l1, l2, n };
}

export function classifyAccount(
  acc: Pick<RawAccount, "conto" | "ref" | "desc">,
  overrides: Record<string, Override>
): Cls {
  const ov = overrides[acc.conto] || overrides[acc.ref];
  if (ov) {
    return { s: ov[0], l1: ov[1], l2: ov[2], n: ov[3], matched: true, manual: true };
  }
  const entry = PIANO[acc.ref] || PIANO[acc.conto];
  if (entry) {
    return { s: entry[0], l1: entry[1], l2: entry[2], n: entry[3], matched: true, manual: false };
  }
  const h = heuristicClassify(acc.conto, acc.desc);
  return { ...h, matched: false, manual: false };
}

export function defaultVarFix(cls: Cls, desc: string): VarFix {
  if (cls.s !== "CE" || cls.l1 !== "B") return "F";
  if (cls.n === 6 || cls.n === 11) return "V";
  if (
    /provvig|commission.*(vendit|incass)|trasport.*vendit|corrier|spedizion.*vendit/i.test(desc)
  )
    return "V";
  return "F";
}

export function classifyVarFix(
  conto: string,
  cls: Cls,
  desc: string,
  varFixOverrides: Record<string, VarFix>
): VarFix {
  return varFixOverrides[conto] || defaultVarFix(cls, desc);
}
