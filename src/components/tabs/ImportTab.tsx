"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { useDerived } from "@/lib/useDerived";
import { readFileAsAccounts } from "@/lib/parseFiles";
import { PIANO_COUNT } from "@/lib/classify";
import PeriodModal from "../PeriodModal";
import type { PeriodType, RawAccount } from "@/lib/types";

export default function ImportTab() {
  const addPeriod = useStore((s) => s.addPeriod);
  const deletePeriod = useStore((s) => s.deletePeriod);
  const { periods, calcs } = useDerived();
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<{ filename: string; accounts: RawAccount[] } | null>(null);
  const [queue, setQueue] = useState<{ filename: string; accounts: RawAccount[] }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pianoInputRef = useRef<HTMLInputElement>(null);

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
    addPeriod(input);
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
      "Il caricamento di un piano dei conti personalizzato con struttura gerarchica complessa non è ancora supportato automaticamente in questa versione. Usa invece la scheda 'Mappatura Conti' per correggere manualmente i singoli conti non riconosciuti."
    );
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
        <div
          className={clsx(
            "border-2 border-dashed rounded-xl py-9 px-5 text-center cursor-pointer transition-colors",
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

        {periods.length === 0 ? (
          <div className="empty-state">
            <div className="es-icon text-4xl mb-2.5">📄</div>
            Nessun periodo importato. Carica un file per iniziare.
          </div>
        ) : (
          <div className="grid gap-3 mt-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
            {periods.map((p) => {
              const calc = calcs[p.id];
              const sbilancio = Math.abs(calc.sp.quadratura) > 1;
              return (
                <div key={p.id} className="border border-border rounded-lg p-3.5 bg-panel-2 relative">
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-transparent border-none text-text-3 text-sm px-1.5 py-0.5 rounded hover:bg-red-bg hover:text-red"
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
        )}

        <div className="note mt-3">
          I dati vengono salvati automaticamente in questo browser. Per portarli su un altro computer,
          condividerli o avere una copia di sicurezza, usa i pulsanti <b>💾 Salva JSON</b> (esporta
          periodi, mappature, rettifiche e dati Break Even Point in un unico file) e{" "}
          <b>📂 Carica JSON</b> (li ripristina) in alto a destra.
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Piano dei conti</div>
        <div className="panel-desc">
          L&apos;app include già il piano dei conti standard ({PIANO_COUNT} conti) usato nei file di
          esempio. Se i tuoi conti non vengono riconosciuti automaticamente, puoi correggerli nella scheda{" "}
          <b>Mappatura Conti</b>, oppure caricare qui un piano dei conti aggiuntivo/personalizzato.
        </div>
        <button type="button" className="btn" onClick={handlePianoUpload}>
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
          Piano dei conti attivo: <b>{PIANO_COUNT}</b> conti mappati (schema standard incluso).
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
