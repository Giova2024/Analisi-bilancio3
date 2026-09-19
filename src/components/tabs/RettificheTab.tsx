"use client";

import { useState } from "react";
import { useDerived } from "@/lib/useDerived";
import { useStore } from "@/lib/store";
import { MANUAL_TARGETS, getManualTarget } from "@/lib/manualTargets";
import { fmtEur } from "@/lib/numberFormat";

function AddRow({ periodId }: { periodId: string }) {
  const addManualEntry = useStore((s) => s.addManualEntry);
  const [target, setTarget] = useState(MANUAL_TARGETS[0].key);
  const [desc, setDesc] = useState("");
  const [importo, setImporto] = useState("");

  const spTargets = MANUAL_TARGETS.filter((t) => t.group === "sp");
  const ceTargets = MANUAL_TARGETS.filter((t) => t.group === "ce");

  function submit() {
    const value = parseFloat(importo.replace(",", "."));
    if (!isFinite(value) || value === 0) {
      alert("Inserisci un importo valido (diverso da zero).");
      return;
    }
    addManualEntry(periodId, { target, desc, importo: value });
    setDesc("");
    setImporto("");
  }

  return (
    <div className="flex gap-2.5 flex-wrap items-end mb-1">
      <div className="flex-1 min-w-[220px]">
        <label className="text-[11.5px] font-semibold text-text-2 block mb-1">Voce</label>
        <select
          className="w-full px-2.5 py-1.5 border border-border-2 rounded-lg text-sm"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        >
          <optgroup label="Stato Patrimoniale">
            {spTargets.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Conto Economico">
            {ceTargets.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <div className="flex-1 min-w-[180px]">
        <label className="text-[11.5px] font-semibold text-text-2 block mb-1">Descrizione</label>
        <input
          type="text"
          className="w-full px-2.5 py-1.5 border border-border-2 rounded-lg text-sm"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>
      <div style={{ width: 160 }}>
        <label className="text-[11.5px] font-semibold text-text-2 block mb-1">Importo (€)</label>
        <input
          type="number"
          className="w-full px-2.5 py-1.5 border border-border-2 rounded-lg text-sm"
          value={importo}
          onChange={(e) => setImporto(e.target.value)}
        />
      </div>
      <button type="button" className="btn btn-primary h-[35px]" onClick={submit}>
        + Aggiungi
      </button>
    </div>
  );
}

export default function RettificheTab() {
  const { periods } = useDerived();
  const manualEntries = useStore((s) => s.manualEntries);
  const deleteManualEntry = useStore((s) => s.deleteManualEntry);

  return (
    <section>
      <div className="panel">
        <div className="panel-title">Rettifiche Extracontabili</div>
        <div className="panel-desc">
          Aggiungi importi manuali (non presenti nel file importato) alle voci riclassificate dello Stato
          Patrimoniale o del Conto Economico — utile per simulazioni, correzioni o dati non ancora
          contabilizzati. Un importo positivo aumenta la voce scelta, uno negativo la diminuisce. Ogni
          rettifica confluisce automaticamente in tutti i calcoli (indici, rendiconto, Break Even Point, KPI,
          ed è modificabile Variabile/Fisso se è un costo) come se fosse un conto reale, ed è sempre
          visibile — evidenziata in ambra — nel dettaglio della riga interessata.
        </div>
        <div className="note warn mb-3">
          Come in un vero bilancio, ogni rettifica ha una contropartita: se aggiungi un costo o un ricavo che
          non è ancora transitato per la cassa/banca o per un debito/credito, aggiungi anche la rettifica di
          contropartita (es. un ricavo non fatturato va di norma in contropartita a un credito). Se lo Stato
          Patrimoniale non quadra più, la scheda &quot;Importazione&quot; mostrerà un avviso di sbilancio sul
          periodo interessato.
        </div>

        {periods.length === 0 ? (
          <div className="empty-state">
            <div className="text-4xl mb-2.5">📊</div>
            Nessun periodo importato. Vai alla scheda &quot;Importazione&quot; per iniziare.
          </div>
        ) : (
          periods.map((p) => {
            const entries = manualEntries[p.id] || [];
            return (
              <div key={p.id} className="border border-border rounded-[10px] p-4 mb-4 bg-panel-2">
                <div className="font-bold text-sm mb-3">{p.label}</div>
                <AddRow periodId={p.id} />
                {entries.length > 0 && (
                  <table className="w-full border-collapse text-[13px] mt-2.5">
                    <thead>
                      <tr>
                        <th className="text-left py-1.5 px-2 text-[11px] uppercase tracking-wide text-text-3 border-b border-border-2">Voce</th>
                        <th className="text-left py-1.5 px-2 text-[11px] uppercase tracking-wide text-text-3 border-b border-border-2">Descrizione</th>
                        <th className="text-right py-1.5 px-2 text-[11px] uppercase tracking-wide text-text-3 border-b border-border-2">Importo</th>
                        <th className="border-b border-border-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => {
                        const target = getManualTarget(entry.target);
                        return (
                          <tr key={entry.id} className="border-b border-border">
                            <td className="py-1.5 px-2 whitespace-normal">
                              {target?.label}
                              <span className="block text-[10.5px] text-text-3">
                                {target?.group === "sp" ? "Stato Patrimoniale" : "Conto Economico"}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 whitespace-normal">{entry.desc}</td>
                            <td
                              className={
                                "py-1.5 px-2 text-right font-mono whitespace-nowrap" +
                                (entry.importo < 0 ? " text-red" : "")
                              }
                            >
                              {fmtEur(entry.importo)}
                            </td>
                            <td className="py-1.5 px-2 text-right">
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => deleteManualEntry(p.id, entry.id)}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
