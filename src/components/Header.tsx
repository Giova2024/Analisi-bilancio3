"use client";

import { useRef } from "react";
import { useStore } from "@/lib/store";
import { useDerived } from "@/lib/useDerived";
import { exportJson, parseImportedJson } from "@/lib/exportJson";
import { exportExcel } from "@/lib/exportExcel";
import { TABS, type TabId } from "@/lib/tabs";
import NavBar from "./NavBar";
import { CompanyInput, CompanyPrintName } from "./CompanyName";

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
    <header
      className="md:sticky top-0 z-50 bg-panel/95 backdrop-blur border-b border-border px-3 sm:px-6 py-3 shadow-sm"
      style={{ paddingTop: 6, paddingBottom: 4 }}
    >
      <div
        className="flex items-center justify-between flex-wrap"
        style={{ marginBottom: 4, gap: "6px 16px" }}
      >
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2.5 font-bold text-base min-w-0 w-full sm:w-auto">
          <div
            className="w-[32px] h-[32px] rounded-xl bg-gradient-to-br from-accent via-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white text-[15px] flex-shrink-0"
            style={{ boxShadow: "0 2px 6px rgba(37,99,235,0.35)" }}
          >
            B
          </div>
          <div>
            Analisi di Bilancio
            <div className="font-normal text-xs text-text-3 hidden sm:block">Riclassificazione, indici e KPI</div>
          </div>
          <CompanyInput />
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-wrap no-print">
          <button className="btn btn-sm" onClick={handlePrint} title="Stampa / PDF" aria-label="Stampa / PDF">
            <span aria-hidden="true">🖶</span>
            <span className="sm:hidden"> Stampa</span>
            <span className="hidden sm:inline"> Stampa / PDF</span>
          </button>
          <button className="btn btn-sm" onClick={handleExportExcel} title="Esporta Excel" aria-label="Esporta Excel">
            <span aria-hidden="true">⬇</span>
            <span className="sm:hidden"> Excel</span>
            <span className="hidden sm:inline"> Esporta Excel</span>
          </button>
          <button className="btn btn-sm" onClick={handleSaveJson} title="Salva JSON" aria-label="Salva JSON">
            <span aria-hidden="true">💾</span>
            <span className="sm:hidden"> Salva</span>
            <span className="hidden sm:inline"> Salva JSON</span>
          </button>
          <button className="btn btn-sm" onClick={handleLoadJsonClick} title="Carica JSON" aria-label="Carica JSON">
            <span aria-hidden="true">📂</span>
            <span className="sm:hidden"> Carica</span>
            <span className="hidden sm:inline"> Carica JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleLoadJsonFile}
          />
          <button className="btn btn-sm btn-danger" onClick={handleReset} title="Azzera tutto" aria-label="Azzera tutto">
            <span aria-hidden="true">🗑</span>
            <span className="sm:hidden"> Azzera</span>
            <span className="hidden sm:inline"> Azzera tutto</span>
          </button>
        </div>
      </div>
      <NavBar activeTab={activeTab} onTabChange={onTabChange} />
      <div className="print-only pt-1">
        <div className="text-lg font-bold">Analisi di Bilancio — {activeLabel}</div>
        <CompanyPrintName />
        <div className="text-xs text-text-3">
          Stampato il {new Date().toLocaleDateString("it-IT")} alle{" "}
          {new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </header>
  );
}
