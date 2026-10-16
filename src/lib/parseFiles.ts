import * as XLSX from "xlsx";
import { decimalSepHint, parseAmount, type DecimalSep } from "./numberFormat";
import type { RawAccount } from "./types";

function detectDelimiter(headerLine: string): string {
  const count = (ch: string) => headerLine.split(ch).length - 1;
  const candidates = [";", "\t", ","];
  return candidates.reduce((best, ch) => (count(ch) > count(best) ? ch : best), ";");
}

/** Divide una riga CSV rispettando i campi tra virgolette ("a;b" e le virgolette raddoppiate ""). */
function parseCSVLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"' && cur.trim() === "") {
      inQuotes = true;
      cur = "";
    } else if (ch === '"' && cur.trim() === "=") {
      // formato Excel ="00123": mantiene il testo così com'è
      inQuotes = true;
      cur = "";
    } else if (ch === delim) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function parseCSVText(text: string): string[][] {
  const stripped = text.replace(/^\uFEFF/, "");
  const lines = stripped.split(/\r\n|\r|\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  const delim = detectDelimiter(lines[0]);
  return lines.map((l) => parseCSVLine(l, delim));
}

/** Cella letta dal file: testo, oppure numero quando il foglio Excel contiene un valore numerico. */
type Cell = string | number | null | undefined;

interface ColIndexes {
  conto: number;
  desc: number;
  saldo: number;
  ref: number;
}

const cellText = (c: Cell) => (c === null || c === undefined ? "" : String(c)).trim();

function resolveColumns(header: Cell[]): ColIndexes {
  const idx: Partial<ColIndexes> = {};
  header.forEach((h, i) => {
    const v = cellText(h).toLowerCase();
    if (idx.conto === undefined && /^(conto|codice)/.test(v) && !/riferimento/.test(v)) idx.conto = i;
    if (idx.desc === undefined && /^descriz/.test(v)) idx.desc = i;
    if (idx.saldo === undefined && /^(saldo|importo)/.test(v)) idx.saldo = i;
    if (idx.ref === undefined && /contodiriferimento|riferimento/.test(v)) idx.ref = i;
  });
  return {
    conto: idx.conto ?? 0,
    desc: idx.desc ?? -1,
    saldo: idx.saldo ?? 3,
    ref: idx.ref ?? -1,
  };
}

/** Riga di intestazione: la prima (entro le prime 30) con le colonne Conto/Codice e Saldo/Importo. */
function findHeaderRow(rows: Cell[][]): number {
  const limit = Math.min(rows.length, 30);
  for (let i = 0; i < limit; i++) {
    const cells = (rows[i] || []).map((c) => cellText(c).toLowerCase());
    if (cells.some((v) => /^(conto|codice)/.test(v)) && cells.some((v) => /^(saldo|importo)/.test(v))) return i;
  }
  return 0;
}

/**
 * Separatore decimale prevalente nella colonna Saldo di un file testuale: serve a interpretare
 * correttamente i valori ambigui come "1.234" (italiano: 1234; inglese: 1,234).
 */
function detectDecimalSep(values: Cell[]): DecimalSep {
  let it = 0;
  let en = 0;
  for (const v of values) {
    if (typeof v === "number") continue;
    const hint = decimalSepHint(v);
    if (hint === ",") it++;
    else if (hint === ".") en++;
  }
  return en > it ? "." : ",";
}

export function rowsToAccounts(rows: Cell[][]): RawAccount[] {
  if (rows.length === 0) return [];
  const headerRow = findHeaderRow(rows);
  const cols = resolveColumns(rows[headerRow]);
  const body = rows.slice(headerRow + 1);
  const decimalSep = detectDecimalSep(body.map((r) => r?.[cols.saldo]));
  const accounts: RawAccount[] = [];
  for (const row of body) {
    if (!row || row.every((c) => !cellText(c))) continue;
    const rawConto = cellText(row[cols.conto]);
    const conto = rawConto.replace(/^="?(.*?)"?$/, "$1").trim();
    if (!conto) continue;
    const desc = cols.desc >= 0 ? cellText(row[cols.desc]) : "";
    const saldo = parseAmount(row[cols.saldo], decimalSep);
    if (isNaN(saldo)) continue;
    const refRaw = cols.ref >= 0 ? cellText(row[cols.ref]) : "";
    const ref = refRaw || conto;
    accounts.push({ conto, desc, saldo, ref });
  }
  return accounts;
}

/**
 * Righe di un foglio Excel. Per la colonna Saldo si usa il valore numerico della cella e non il
 * testo formattato: il testo dipende dal formato della cella e dalle impostazioni locali (es.
 * "27,621.50", o importi mostrati in migliaia) e veniva frainteso, leggendo 27,62 € al posto di
 * 27.621,50 €. Le altre colonne restano testuali, così i codici con zeri iniziali non cambiano.
 */
function sheetRows(ws: XLSX.WorkSheet): Cell[][] {
  const text = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false, defval: "" });
  const values = XLSX.utils.sheet_to_json<Cell[]>(ws, { header: 1, raw: true, defval: "" });
  const saldoCol = resolveColumns(text[findHeaderRow(text)] || []).saldo;
  return text.map((row, r) => {
    const v = values[r]?.[saldoCol];
    if (typeof v !== "number") return row;
    const out: Cell[] = row.slice();
    out[saldoCol] = v;
    return out;
  });
}

export async function readFileAsAccounts(file: File): Promise<RawAccount[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    const text = await file.text();
    return rowsToAccounts(parseCSVText(text));
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return rowsToAccounts(sheetRows(ws));
}

export function guessDateFromFilename(filename: string): string | null {
  let m = filename.match(/(\d{2})[-_.](\d{2})[-_.](\d{4})/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }
  m = filename.match(/(\d{4})[-_.](\d{2})[-_.](\d{2})/);
  if (m) {
    const [, yyyy, mm, dd] = m;
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

export function suggestPeriodType(fyStart: string, date: string): "annuale" | "infrannuale" {
  const d = new Date(date);
  const fy = new Date(fyStart);
  const months = (d.getFullYear() - fy.getFullYear()) * 12 + (d.getMonth() - fy.getMonth());
  return months >= 11 ? "annuale" : "infrannuale";
}
