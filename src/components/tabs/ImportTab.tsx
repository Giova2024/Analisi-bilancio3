"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { useDerived } from "@/lib/useDerived";
import { readFileAsAccounts } from "@/lib/parseFiles";
import { PIANO_COUNT } from "@/lib/classify";
import { buildDefaultMappingCsv, buildExampleAccountsCsv, buildOverridesCsv } from "@/lib/exportMapping";
import { downloadTextFile } from "@/lib/downloadFile";
import PeriodModal from "../PeriodModal";
import type { PeriodType, RawAccount } from "@/lib/types";

const EXAMPLE_ROWS: [string, string, string, string, string][] = [
  ["274101", "Banche C/C", "D", "25.000", ""],
  ["214101", "Clienti Italia (entro 12 mesi)", "D", "42.000", ""],
  ["452101", "Fornitori Italia (entro 12 mesi)", "A", "-38.500", ""],
  ["502101", "Vendite prodotti finiti e merci Italia", "A", "-180.000", ""],
];

type PendingJob = { filename: string; accounts: RawAccount[]; empty?: boolean };

const HELP_OPEN_KEY = "bilancio_import_help_open";

export default function ImportTab() {

  const addPeriod = useStore((s) => s.addPeriod);
  const deletePeriod = useStore((s) => s.deletePeriod);
  const overrides = useStore((s) => s.overrides);
  const resetOverrides = useStore((s) => s.resetOverrides);
  const { allPeriods: periods, calcs } = useDerived();
  const includedCount = periods.filter((p) => !p.excluded).length;
  const overridesCount = Object.keys(overrides).length;
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<PendingJob | null>(null);
  const [queue, setQueue] = useState<PendingJob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pianoInputRef = useRef<HTMLInputElement>(null);
  const [helpOpen, setHelpOpen] = useState(() => {
    try {
      return localStorage.getItem(HELP_OPEN_KEY) === "1";
    } catch {
      return false;
    }
  });

  /** Include/esclude un periodo dalle analisi (id null = tutti i periodi). */
  function setIncluded(id: string | null, included: boolean) {
    useStore.setState((s) => ({
      periods: s.periods.map((p) =>
        id === null || p.id === id ? { ...p, excluded: !included } : p
      ),
    }));
  }

  /** Prepara un periodo senza conti, datato un anno dopo l'ultimo presente. */
  function addEmptyPeriod() {
    const dates = periods.map((p) => p.date).sort();
    const last = dates.length ? dates[dates.length - 1] : null;
    let d = last
      ? String(+last.slice(0, 4) + 1) + last.slice(4)
      : new Date().getFullYear() + "-12-31";
    if (d.slice(5) === "02-29") d = d.slice(0, 5) + "02-28";
    setPending({
      filename: `Periodo vuoto ${d.slice(8, 10)}-${d.slice(5, 7)}-${d.slice(0, 4)}`,
      accounts: [],
      empty: true,
    });
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const jobs: { filename: string; accounts: RawAccount[] }[] = [];
    for (const file of files) {
      try {
        const accounts = await readFileAsAccounts(file);
        if (accounts.length === 0) {
          alert(
            `Nessun conto riconosciuto nel file "${file.name}". Verifica che l'intestazione contenga le colonne Conto;Descrizione;Natura;Saldo;ContoDiRiferimento.`
          );
          continue;
        }
        jobs.push({ filename: file.name, accounts });
      } catch {
        alert(`Errore durante la lettura del file "${file.name}".`);
      }
    }
    if (jobs.length === 0) return;
    setPending(jobs[0]);
    setQueue(jobs.slice(1));
  }

  function handleModalConfirm(input: {
    label: string;
    date: string;
    fyStart: string;
    type: PeriodType;
    filename: string;
    accounts: RawAccount[];
  }) {
    addPeriod(pending?.empty ? { ...input, filename: "(periodo vuoto)" } : input);
    if (queue.length > 0) {
      setPending(queue[0]);
      setQueue(queue.slice(1));
    } else {
      setPending(null);
    }
  }

  function handleModalCancel() {
    if (queue.length > 0) {
      setPending(queue[0]);
      setQueue(queue.slice(1));
    } else {
      setPending(null);
    }
  }

  function handlePianoUpload() {
    pianoInputRef.current?.click();
  }

  function handlePianoFile(e: React.ChangeEvent<HTMLInputElement>) {
    e.target.value = "";
    alert(
      "Il caricamento di un piano dei conti personalizzato con struttura gerarchica complessa non è ancora supportato automaticamente in questa versione. Usa invece la scheda 'Impostazioni › Mappatura Conti' per correggere manualmente i singoli conti non riconosciuti."
    );
  }

  function handleDownloadExampleAccounts() {
    downloadTextFile("esempio-situazione-contabile.csv", buildExampleAccountsCsv(), "text/csv");
  }

  function handleDownloadDefaultMapping() {
    downloadTextFile("mappatura-di-default.csv", buildDefaultMappingCsv(), "text/csv");
  }

  function handleDownloadCurrentOverrides() {
    downloadTextFile("mie-riclassificazioni-manuali.csv", buildOverridesCsv(overrides), "text/csv");
  }

  function handleResetMapping() {
    const ok = window.confirm(
      `Ripristinare la mappatura di default? Le ${overridesCount} riclassificazioni manuali salvate nella scheda "Impostazioni › Mappatura Conti" verranno eliminate e tutti i conti torneranno alla classificazione automatica del piano dei conti standard (o dell'euristica, se non presenti nel piano).`
    );
    if (!ok) return;
    resetOverrides();
  }

  return (
    <section>
      <div className="panel">
        <div className="panel-title">Importa una situazione contabile</div>
        <div className="panel-desc">
          Carica uno o più file CSV o Excel (formato: Conto;Descrizione;Natura;Saldo;ContoDiRiferimento).
          Ogni file rappresenta un periodo di analisi (es. bilancio annuale o infrannuale). I dati restano nel
          tuo browser: nessun file viene caricato altrove.
        </div>

        <details
          className="imp-help border border-border rounded-[10px] p-3.5 bg-panel-2 mb-3.5"
          open={helpOpen}
          onToggle={(e) => {
            const open = e.currentTarget.open;
            setHelpOpen(open);
            try {
              localStorage.setItem(HELP_OPEN_KEY, open ? "1" : "0");
            } catch {
              /* localStorage non disponibile */
            }
          }}
        >
          <summary className="font-bold text-[13px] cursor-pointer select-none">
            📋 Come deve essere strutturato il file da importare
            <span className="font-normal text-[11.5px] text-text-3 ml-2 no-print">
              {helpOpen ? "(clicca per nascondere)" : "(clicca per visualizzare)"}
            </span>
          </summary>
          <div className="text-[12.5px] text-text-2 leading-relaxed mb-2.5">
            Ogni riga rappresenta il saldo di un conto della situazione contabile (bilancio di verifica) alla
            data del periodo. La prima riga deve contenere le intestazioni delle colonne; l&apos;ordine delle
            colonne non è vincolante, purché i nomi siano riconoscibili:
          </div>
          <ul className="text-[12.5px] text-text-2 leading-relaxed mb-2.5 list-disc pl-5">
            <li><b>Conto</b> (o Codice) — il codice del conto nel piano dei conti, obbligatorio.</li>
            <li><b>Descrizione</b> — la descrizione testuale del conto, usata per il riconoscimento automatico quando il codice non è nel piano standard.</li>
            <li><b>Natura</b> — Dare (D) / Avere (A) del conto. Colonna facoltativa, puramente informativa (non viene letta dal programma): il segno che conta ai fini del calcolo è quello della colonna Saldo.</li>
            <li>
              <b>Saldo</b> (o Importo) — il saldo del conto in Euro (formato numerico italiano, es.
              12.345,67, oppure anglosassone, es. 12,345.67; nei file Excel viene letto il valore numerico
              della cella),{" "}
              <b>con il segno secondo la natura del conto</b>: positivo per i conti di natura Dare (attività
              come banca, cassa, crediti, magazzino, immobilizzazioni; e costi), <b>negativo</b> per i conti di
              natura Avere (passività, patrimonio netto e ricavi). È il formato tipico dell&apos;esportazione
              &quot;bilancio di verifica&quot; a colonna unica firmata prodotta dalla maggior parte dei
              gestionali. Se importi ricavi, debiti o patrimonio netto con segno positivo, lo Stato
              Patrimoniale e il Conto Economico risulteranno sbilanciati (vedi l&apos;avviso &quot;Sbilancio
              … €&quot; sulla card del periodo). Obbligatorio.
            </li>
            <li><b>ContoDiRiferimento</b> — codice di un piano dei conti di riferimento/standard, se il tuo gestionale usa una codifica propria diversa da quella del conto. Facoltativo: se assente, viene usato il codice Conto stesso.</li>
          </ul>
          <div className="overflow-x-auto mb-2.5">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {["Conto", "Descrizione", "Natura", "Saldo", "ContoDiRiferimento"].map((h) => (
                    <th key={h} className="text-left py-1.5 px-2 text-[10.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EXAMPLE_ROWS.map((row) => (
                  <tr key={row[0]} className="border-b border-border">
                    {row.map((cell, ci) => (
                      <td key={ci} className={clsx("py-1 px-2 whitespace-nowrap", ci === 0 && "font-mono")}>
                        {cell || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn-sm no-print" onClick={handleDownloadExampleAccounts}>
            ⬇ Scarica file di esempio (CSV)
          </button>
        </details>
        <div
          className={clsx(
            "no-print border-2 border-dashed rounded-xl py-9 px-5 text-center cursor-pointer transition-colors",
            dragOver ? "border-accent bg-accent-bg" : "border-border-2 bg-panel-2"
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
          }}
        >
          <div className="text-3xl mb-2">📂</div>
          <div className="font-semibold text-sm">Trascina qui i file, oppure clicca per selezionarli</div>
          <div className="text-[12.5px] text-text-3 mt-1">
            .csv · .xlsx · .xls — è possibile selezionare più file insieme
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
        <div className="no-print flex items-center gap-2.5 flex-wrap mt-2.5">
          <button type="button" className="btn btn-sm" onClick={addEmptyPeriod}>
            ➕ Aggiungi periodo vuoto
          </button>
          <span className="text-[12px] text-text-3">
            Crea un periodo senza importare alcun file (es. un preventivo o un esercizio non ancora
            chiuso) e inseriscine i saldi dalla scheda Rettifiche Extracontabili.
          </span>
        </div>

        {periods.length === 0 ? (
          <div className="empty-state">
            <div className="es-icon text-4xl mb-2.5">📄</div>
            Nessun periodo importato. Carica un file oppure aggiungi un periodo vuoto per iniziare.
          </div>
        ) : (
          <>
          <div className="flex items-center justify-between flex-wrap gap-2 mt-3.5 text-xs text-text-2">
            <span>
              Situazioni incluse nei calcoli: <b>{includedCount}</b> di <b>{periods.length}</b>.
              Deseleziona una situazione per escluderla da tutte le analisi (non viene eliminata).
              {includedCount === 0 && (
                <span className="text-red font-semibold">
                  {" "}
                  Nessuna situazione selezionata: le analisi risulteranno vuote.
                </span>
              )}
            </span>
            {periods.length > 1 && (
              <span className="flex gap-2 no-print">
                <button type="button" className="btn btn-sm" onClick={() => setIncluded(null, true)}>
                  ☑ Seleziona tutte
                </button>
                <button type="button" className="btn btn-sm" onClick={() => setIncluded(null, false)}>
                  ☐ Deseleziona tutte
                </button>
              </span>
            )}
          </div>
          <div className="grid gap-3 mt-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(230px, 100%), 1fr))" }}>
            {periods.map((p) => {
              const calc = calcs[p.id];
              const sbilancio = Math.abs(calc.sp.quadratura) > 1;
              return (
                <div
                  key={p.id}
                  className={clsx(
                    "border rounded-lg p-3.5 relative transition-opacity",
                    p.excluded
                      ? "border-dashed border-border bg-panel opacity-60"
                      : "border-border bg-panel-2"
                  )}
                >
                  <label
                    className={
                      "no-print flex items-center gap-1.5 text-[11.5px] font-semibold mb-1.5 cursor-pointer select-none " +
                      (p.excluded ? "text-text-3" : "text-accent-2")
                    }
                  >
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={!p.excluded}
                      onChange={(e) => setIncluded(p.id, e.target.checked)}
                    />
                    {p.excluded ? "Esclusa dai calcoli" : "Inclusa nei calcoli"}
                  </label>
                  <button
                    type="button"
                    className="no-print absolute top-2 right-2 bg-transparent border-none text-text-3 text-sm px-1.5 py-0.5 rounded hover:bg-red-bg hover:text-red"
                    onClick={() => {
                      if (window.confirm(`Eliminare il periodo "${p.label}"?`)) deletePeriod(p.id);
                    }}
                  >
                    ✕
                  </button>
                  <div className="font-bold text-[13.5px] mb-0.5 pr-5">{p.label}</div>
                  <div className="text-[11.5px] text-text-3 leading-relaxed">
                    Al {p.date.slice(8, 10)}/{p.date.slice(5, 7)}/{p.date.slice(0, 4)}
                    <br />
                    {p.accounts.length} conti · {p.filename}
                  </div>
                  <span
                    className={clsx(
                      "inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1.5",
                      p.type === "annuale" ? "bg-green-bg text-green" : "bg-amber-bg text-amber"
                    )}
                  >
                    {p.type === "annuale" ? "Annuale" : "Infrannuale"}
                  </span>
                  {calc.unmatched > 0 && (
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 ml-1.5 bg-red-bg text-red">
                      {calc.unmatched} da verificare
                    </span>
                  )}
                  {sbilancio && (
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 ml-1.5 bg-red-bg text-red">
                      Sbilancio {Math.round(calc.sp.quadratura)} €
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          </>
        )}

        <div className="note mt-3">
          I dati vengono salvati automaticamente in questo browser. Per portarli su un altro computer,
          condividerli o avere una copia di sicurezza, usa i pulsanti <b>💾 Salva JSON</b> (esporta
          periodi, mappature, rettifiche e dati Break Even Point in un unico file) e{" "}
          <b>📂 Carica JSON</b> (li ripristina) in alto a destra.
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Piano dei conti e mappatura</div>
        <div className="panel-desc">
          Ogni conto importato viene classificato automaticamente in una voce di Stato Patrimoniale o Conto
          Economico (Sezione/Livello1/Livello2/Natura) confrontandolo con il <b>piano dei conti standard</b>{" "}
          incluso nell&apos;app ({PIANO_COUNT} conti). Questa corrispondenza &quot;Conto → Classificazione&quot;
          è la <b>mappatura</b>. Se un conto non viene riconosciuto (perché non presente nel piano standard o
          perché il tuo gestionale usa una codifica diversa), puoi assegnargli una classificazione manualmente
          nella scheda <b>Mappatura Conti</b>: la scelta viene salvata come eccezione (&quot;override&quot;)
          rispetto alla mappatura di default e riutilizzata automaticamente per le prossime importazioni con
          lo stesso codice conto.
        </div>

        <div className="flex gap-2 flex-wrap mb-2.5 no-print">
          <button type="button" className="btn btn-sm" onClick={handleDownloadDefaultMapping}>
            ⬇ Scarica mappatura di default (CSV)
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleDownloadCurrentOverrides}
            disabled={overridesCount === 0}
          >
            ⬇ Scarica le mie riclassificazioni manuali ({overridesCount})
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleResetMapping}
            disabled={overridesCount === 0}
          >
            ↺ Ripristina mappatura di default
          </button>
        </div>
        <div className="note mb-3">
          {overridesCount === 0
            ? "Nessuna riclassificazione manuale presente: tutti i conti seguono la mappatura di default."
            : `${overridesCount} conti hanno una riclassificazione manuale che sovrascrive la mappatura di default. "Ripristina mappatura di default" le elimina tutte e riporta ogni conto alla classificazione automatica.`}
        </div>

        <button type="button" className="btn no-print" onClick={handlePianoUpload}>
          ⬆ Carica piano dei conti personalizzato (opzionale)
        </button>
        <input
          ref={pianoInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handlePianoFile}
        />
        <div className="note mt-2.5">
          Piano dei conti attivo: <b>{PIANO_COUNT}</b> conti mappati (schema standard incluso). Il file
          scaricabile con &quot;Scarica mappatura di default&quot; ha le colonne Conto;Descrizione;Sezione
          (AA=Attivo, AP=Passivo, CE=Conto Economico);Livello1;Livello2;Natura — utile come riferimento per
          capire come vengono classificati i conti o per confrontarlo con il tuo piano dei conti.
        </div>
      </div>

      {pending && (
        <PeriodModal
          filename={pending.filename}
          accounts={pending.accounts}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      )}
    </section>
  );
}
