"use client";

import { useRef } from "react";
import { useStore } from "@/lib/store";
import { useDerived } from "@/lib/useDerived";
import { exportJson, parseImportedJson } from "@/lib/exportJson";
import { exportExcel } from "@/lib/exportExcel";
import { TABS, type TabId } from "@/lib/tabs";

interface Props {
  activeTab: TabId;
  onTabChange: (t: TabId) => void;
}

export default function Header({ activeTab, onTabChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const state = useStore();
  const { periods, calcs } = useDerived();

  function handlePrint() {
    window.print();
  }

  function handleExportExcel() {
    if (periods.length === 0) {
      alert("Importa almeno un periodo prima di esportare.");
      return;
    }
    exportExcel(periods, calcs);
  }

  function handleSaveJson() {
    if (periods.length === 0) {
      alert("Importa almeno un periodo prima di salvare.");
      return;
    }
    exportJson(state);
  }

  function handleLoadJsonClick() {
    fileInputRef.current?.click();
  }

  async function handleLoadJsonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const data = parseImportedJson(JSON.parse(text));
      const exportedAt = data.exportedAt ? new Date(data.exportedAt).toLocaleString("it-IT") : "sconosciuta";
      const ok = window.confirm(
        `Il file contiene ${data.periods.length} periodo/i (esportato il ${exportedAt}).\n` +
          `Questa operazione sostituirà tutti i dati attualmente presenti. Continuare?`
      );
      if (!ok) return;
      state.importState(data);
      alert("Dati importati correttamente.");
    } catch (err) {
      alert(
        "Impossibile leggere il file JSON: " + (err instanceof Error ? err.message : String(err))
      );
    }
  }

  function handleReset() {
    const ok = window.confirm(
      "Sei sicuro di voler azzerare tutti i dati? L'operazione non è reversibile."
    );
    if (!ok) return;
    state.resetAll();
  }

  const activeLabel = TABS.find((t) => t.id === activeTab)?.label ?? "";

  return (
    <header className="sticky top-0 z-50 bg-panel/95 backdrop-blur border-b border-border px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-2.5">
        <div className="flex items-center gap-2.5 font-bold text-base">
          <div
            className="w-[32px] h-[32px] rounded-xl bg-gradient-to-br from-accent via-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white text-[15px] flex-shrink-0"
            style={{ boxShadow: "0 2px 6px rgba(37,99,235,0.35)" }}
          >
            B
          </div>
          <div>
            Analisi di Bilancio
            <div className="font-normal text-xs text-text-3">
              Riclassificazione, indici, rendiconto finanziario e KPI da file CSV/Excel
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap no-print">
          <button className="btn" onClick={handlePrint}>
            🖶 Stampa / PDF
          </button>
          <button className="btn" onClick={handleExportExcel}>
            ⬇ Esporta Excel
          </button>
          <button className="btn" onClick={handleSaveJson}>
            💾 Salva JSON
          </button>
          <button className="btn" onClick={handleLoadJsonClick}>
            📂 Carica JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleLoadJsonFile}
          />
          <button className="btn btn-danger" onClick={handleReset}>
            🗑 Azzera tutto
          </button>
        </div>
      </div>
      <nav className="flex gap-1 flex-wrap no-print">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={
              "flex items-center gap-1.5 bg-transparent border border-transparent px-3.5 py-2 rounded-lg text-[13.5px] font-semibold cursor-pointer transition-colors " +
              (activeTab === t.id
                ? "bg-accent-bg text-accent-2 border-[#bfdbfe]"
                : "text-text-2 hover:bg-panel-2 hover:text-text")
            }
          >
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
      <div className="print-only pt-1">
        <div className="text-lg font-bold">Analisi di Bilancio — {activeLabel}</div>
        <div className="text-xs text-text-3">
          Stampato il {new Date().toLocaleDateString("it-IT")} alle{" "}
          {new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </header>
  );
}
