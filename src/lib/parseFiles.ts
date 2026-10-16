import * as XLSX from "xlsx";
import { parseItNumber } from "./numberFormat";
import type { RawAccount } from "./types";

function detectDelimiter(headerLine: string): string {
  const semi = (headerLine.match(/;/g) || []).length;
  const comma = (headerLine.match(/,/g) || []).length;
  return semi > comma ? ";" : ",";
}

function parseCSVLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      cur += ch;
    } else if (ch === delim && !inQuotes) {
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
  const stripped = text.replace(/^﻿/, "");
  const lines = stripped.split(/\r\n|\r|\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  const delim = detectDelimiter(lines[0]);
  return lines.map((l) => parseCSVLine(l, delim));
}

interface ColIndexes {
  conto: number;
  desc: number;
  saldo: number;
  ref: number;
}

function resolveColumns(header: string[]): ColIndexes {
  const idx: Partial<ColIndexes> = {};
  header.forEach((h, i) => {
    const v = h.trim().toLowerCase();
    if (idx.conto === undefined && /^(conto|codice)/.test(v)) idx.conto = i;
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

export function rowsToAccounts(rows: string[][]): RawAccount[] {
  if (rows.length === 0) return [];
  const cols = resolveColumns(rows[0]);
  const accounts: RawAccount[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !c || !c.trim())) continue;
    const rawConto = (row[cols.conto] || "").trim();
    const conto = rawConto.replace(/^="?(.*?)"?$/, "$1").trim();
    if (!conto) continue;
    const desc = cols.desc >= 0 ? (row[cols.desc] || "").trim() : "";
    const saldo = parseItNumber(row[cols.saldo]);
    if (isNaN(saldo)) continue;
    const refRaw = cols.ref >= 0 ? (row[cols.ref] || "").trim() : "";
    const ref = refRaw || conto;
    accounts.push({ conto, desc, saldo, ref });
  }
  return accounts;
}

export async function readFileAsAccounts(file: File): Promise<RawAccount[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) {
    const text = await file.text();
    const rows = parseCSVText(text);
    return rowsToAccounts(rows);
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, {
    header: 1,
    raw: false,
    defval: "",
  }) as unknown as string[][];
  return rowsToAccounts(rows);
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
