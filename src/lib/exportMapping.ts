import { PIANO } from "./classify";
import { CLS_OPTIONS, matchKey } from "./clsOptions";
import type { Override } from "./types";

function csvEscape(v: string | number): string {
  const s = String(v);
  if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Esporta il piano dei conti standard (mappatura di default) come CSV. */
export function buildDefaultMappingCsv(): string {
  const rows = [["Conto", "Descrizione", "Sezione", "Livello1", "Livello2", "Natura"]];
  const codes = Object.keys(PIANO).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  for (const code of codes) {
    const [s, l1, l2, n, desc] = PIANO[code];
    rows.push([code, desc, s, l1, String(l2), String(n)]);
  }
  return rows.map((r) => r.map(csvEscape).join(";")).join("\r\n");
}

/** Esporta le riclassificazioni manuali correnti (overrides) come CSV, con l'etichetta leggibile. */
export function buildOverridesCsv(overrides: Record<string, Override>): string {
  const rows = [["Conto", "Sezione", "Livello1", "Livello2", "Natura", "Classificazione"]];
  const codes = Object.keys(overrides).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  for (const code of codes) {
    const [s, l1, l2, n] = overrides[code];
    const opt = CLS_OPTIONS.find((o) => matchKey(o, { s, l1, l2, n }));
    rows.push([code, s, l1, String(l2), String(n), opt?.label ?? ""]);
  }
  return rows.map((r) => r.map(csvEscape).join(";")).join("\r\n");
}

/**
 * File di esempio con la struttura attesa per l'importazione di una situazione contabile.
 * I saldi rispettano la convenzione a segno richiesta dall'app (Dare positivo / Avere negativo)
 * e il file è volutamente quadrato (Totale Impieghi = Totale Fonti) come una vera situazione
 * contabile di verifica.
 */
export function buildExampleAccountsCsv(): string {
  const rows: [string, string, string, string, string][] = [
    ["274101", "Banche C/C", "D", "25000", ""],
    ["278101", "Cassa", "D", "1500", ""],
    ["214101", "Clienti Italia (entro 12 mesi)", "D", "42000", ""],
    ["203101", "Rimanenze materie prime", "D", "15000", ""],
    ["122101", "Impianti generici e specifici", "D", "60000", ""],
    ["303201", "Capitale sociale (quote sociali)", "A", "-40000", ""],
    ["330101", "Utili portati a nuovo", "A", "-13500", ""],
    ["452101", "Fornitori Italia (entro 12 mesi)", "A", "-38500", ""],
    ["502101", "Vendite prodotti finiti e merci Italia", "A", "-180000", ""],
    ["602101", "Materie prime", "D", "70000", ""],
    ["610101", "Stipendi impiegati apprendisti e contratti di formazione", "D", "45000", ""],
    ["622201", "Ammortamento impianti generici e specifici", "D", "12000", ""],
    ["690833", "Commissioni bancarie diverse (oneri finanziari)", "D", "1500", ""],
  ];
  const header = ["Conto", "Descrizione", "Natura", "Saldo", "ContoDiRiferimento"];
  return [header, ...rows].map((r) => r.map(csvEscape).join(";")).join("\r\n");
}
