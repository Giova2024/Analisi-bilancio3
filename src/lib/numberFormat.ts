const nf0 = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });

export function parseItNumber(raw: unknown): number {
  if (raw === null || raw === undefined) return NaN;
  let s = String(raw).trim();
  if (!s) return NaN;
  // Strip Excel ="123" wrapper
  const wrapped = s.match(/^="?(.*?)"?$/);
  if (wrapped) s = wrapped[1];
  s = s.trim();
  if (!s) return NaN;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/\s/g, "");
  // Italian format: '.' thousands, ',' decimal
  if (/,/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = parseFloat(s);
  if (isNaN(n)) return NaN;
  return negative ? -n : n;
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
