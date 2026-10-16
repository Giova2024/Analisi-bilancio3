const nf0 = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });

export type DecimalSep = "," | ".";

/** Ripulisce un importo testuale: wrapper Excel ="…", valuta, spazi, segno tra parentesi o in coda. */
function cleanAmount(raw: unknown): { s: string; negative: boolean } | null {
  if (raw === null || raw === undefined) return null;
  let s = String(raw).trim();
  // Strip Excel ="123" wrapper
  const wrapped = s.match(/^="?(.*?)"?$/);
  if (wrapped) s = wrapped[1];
  s = s.replace(/[\s\u00a0\u202f€$£']/g, "").replace(/^EUR|EUR$/i, "");
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (/^[^-+]*-$/.test(s)) {
    // segno meno in coda (es. "1.234,56-"), tipico di alcuni gestionali
    negative = !negative;
    s = s.slice(0, -1);
  }
  if (/^[-+]/.test(s)) {
    if (s[0] === "-") negative = !negative;
    s = s.slice(1);
  }
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null;
  return { s, negative };
}

/**
 * Indica quale separatore decimale suggerisce un singolo importo testuale, o null se è ambiguo
 * (es. "1.234" può essere 1234 all'italiana oppure 1,234 all'inglese).
 */
export function decimalSepHint(raw: unknown): DecimalSep | null {
  const c = cleanAmount(raw);
  if (!c) return null;
  const s = c.s;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) return lastDot > lastComma ? "." : ",";
  const sep = lastDot >= 0 ? "." : lastComma >= 0 ? "," : null;
  if (!sep) return null;
  const count = s.split(sep).length - 1;
  if (count > 1) return sep === "." ? "," : "."; // più occorrenze = separatore delle migliaia
  const decimals = s.length - s.lastIndexOf(sep) - 1;
  return decimals === 3 ? null : sep;
}

/**
 * Converte un importo testuale in numero, accettando sia il formato italiano (1.234,56) sia quello
 * anglosassone (1,234.56). `decimalSep` risolve i casi ambigui con un solo separatore seguito da
 * tre cifre (default ",", cioè "1.234" = milleduecentotrentaquattro).
 */
export function parseAmount(raw: unknown, decimalSep: DecimalSep = ","): number {
  if (typeof raw === "number") return raw;
  const c = cleanAmount(raw);
  if (!c) return NaN;
  let s = c.s;
  const hint = decimalSepHint(s) ?? decimalSep;
  const thousands = hint === "," ? "." : ",";
  s = s.split(thousands).join("");
  if (hint === ",") s = s.replace(",", ".");
  if ((s.match(/\./g) || []).length > 1) return NaN;
  const n = parseFloat(s);
  if (isNaN(n)) return NaN;
  return c.negative ? -n : n;
}

export function fmt0(v: number): string {
  if (!isFinite(v)) return "—";
  return nf0.format(v);
}

export function fmtEur(v: number): string {
  if (!isFinite(v)) return "—";
  return nf0.format(v);
}

export function fmtPct(v: number, decimals = 1): string {
  if (!isFinite(v)) return "—";
  return (v * 100).toFixed(decimals).replace(".", ",") + "%";
}

export function fmtRatio(v: number, decimals = 2): string {
  if (!isFinite(v)) return "—";
  return v.toFixed(decimals).replace(".", ",");
}

export function fmtX(v: number, decimals = 2): string {
  if (!isFinite(v)) return "—";
  return v.toFixed(decimals).replace(".", ",") + "x";
}

export function fmtDays(v: number): string {
  if (!isFinite(v)) return "—";
  return Math.round(v) + " gg";
}

export function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
