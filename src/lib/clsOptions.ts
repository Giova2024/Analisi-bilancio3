import type { Sezione } from "./types";

export interface ClsOption {
  s: Sezione;
  l1: string;
  l2: number;
  n: number;
  label: string;
}

export const CLS_OPTIONS: ClsOption[] = [
  { s: "AA", l1: "A", l2: 0, n: 0, label: "Attivo · A) Crediti verso soci" },
  { s: "AA", l1: "B", l2: 1, n: 0, label: "Attivo · B) Immobilizzazioni immateriali" },
  { s: "AA", l1: "B", l2: 2, n: 0, label: "Attivo · B) Immobilizzazioni materiali" },
  { s: "AA", l1: "B", l2: 3, n: 0, label: "Attivo · B) Immobilizzazioni finanziarie" },
  { s: "AA", l1: "C", l2: 1, n: 0, label: "Attivo · C) Rimanenze" },
  { s: "AA", l1: "C", l2: 2, n: 0, label: "Attivo · C) Crediti" },
  { s: "AA", l1: "C", l2: 3, n: 0, label: "Attivo · C) Attività finanziarie non immobilizzate" },
  { s: "AA", l1: "C", l2: 4, n: 0, label: "Attivo · C) Disponibilità liquide" },
  { s: "AA", l1: "D", l2: 0, n: 0, label: "Attivo · D) Ratei e risconti attivi" },
  { s: "AP", l1: "A", l2: 0, n: 0, label: "Passivo · A) Patrimonio Netto" },
  { s: "AP", l1: "B", l2: 0, n: 0, label: "Passivo · B) Fondi rischi e oneri" },
  { s: "AP", l1: "C", l2: 0, n: 0, label: "Passivo · C) TFR" },
  { s: "AP", l1: "D", l2: 0, n: 4, label: "Passivo · D) Debiti finanziari (banche/mutui)" },
  { s: "AP", l1: "D", l2: 0, n: 7, label: "Passivo · D) Debiti verso fornitori" },
  { s: "AP", l1: "D", l2: 0, n: 12, label: "Passivo · D) Debiti tributari" },
  { s: "AP", l1: "D", l2: 0, n: 13, label: "Passivo · D) Debiti verso istituti previdenziali" },
  { s: "AP", l1: "D", l2: 0, n: 14, label: "Passivo · D) Altri debiti" },
  { s: "AP", l1: "E", l2: 0, n: 0, label: "Passivo · E) Ratei e risconti passivi" },
  { s: "CE", l1: "A", l2: 0, n: 1, label: "C.Economico · A) Ricavi delle vendite" },
  { s: "CE", l1: "A", l2: 0, n: 5, label: "C.Economico · A) Altri ricavi e proventi" },
  { s: "CE", l1: "B", l2: 0, n: 6, label: "C.Economico · B) Materie prime/merci" },
  { s: "CE", l1: "B", l2: 0, n: 7, label: "C.Economico · B) Servizi" },
  { s: "CE", l1: "B", l2: 0, n: 8, label: "C.Economico · B) Godimento beni di terzi" },
  { s: "CE", l1: "B", l2: 0, n: 9, label: "C.Economico · B) Costo del lavoro" },
  { s: "CE", l1: "B", l2: 0, n: 10, label: "C.Economico · B) Ammortamenti e svalutazioni" },
  { s: "CE", l1: "B", l2: 0, n: 14, label: "C.Economico · B) Oneri diversi di gestione" },
  { s: "CE", l1: "C", l2: 0, n: 17, label: "C.Economico · C) Gestione finanziaria" },
  { s: "CE", l1: "D", l2: 0, n: 20, label: "C.Economico · Imposte sul reddito" },
];

export function clsOptionValue(o: ClsOption): string {
  return `${o.s}|${o.l1}|${o.l2}|${o.n}`;
}

export function matchKey(opt: ClsOption, cls: { s: Sezione; l1: string; l2: number; n: number }): boolean {
  if (opt.s !== cls.s || opt.l1 !== cls.l1) return false;
  const l2ok = opt.l2 === 0 || opt.l2 === cls.l2;
  const nok = opt.n === 0 || opt.n === cls.n;
  return l2ok && nok;
}
