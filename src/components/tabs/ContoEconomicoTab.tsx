"use client";

import { useState } from "react";
import clsx from "clsx";
import { useDerived } from "@/lib/useDerived";
import { useStore } from "@/lib/store";
import FinTable from "../FinTable";
import { ceVaRows, ceCmRows } from "@/lib/rows/ceRows";
import { fmtPct, fmtX } from "@/lib/numberFormat";

export default function ContoEconomicoTab() {
  const { periods, calcs } = useDerived();
  const [view, setView] = useState<"va" | "cm">("va");
  const varFixOverrides = useStore((s) => s.varFixOverrides);
  const varFixCount = Object.keys(varFixOverrides).length;

  return (
    <section>
      <div className="panel">
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div>
            <div className="panel-title">
              Conto Economico Riclassificato {view === "va" ? "— A Valore Aggiunto" : "— A Margine di Contribuzione"}
            </div>
            <div className="panel-desc mb-0">
              Le percentuali sono calcolate sul Valore della Produzione. Periodi di durata diversa non sono
              confrontabili in valore assoluto.
            </div>
          </div>
          {periods.length > 0 && (
            <div className="flex gap-1 bg-panel-2 border border-border rounded-[9px] p-[3px]">
              <button
                type="button"
                className={clsx(
                  "px-3 py-1.5 rounded-md text-[12.5px] font-semibold whitespace-nowrap border border-transparent",
                  view === "va" ? "bg-panel text-accent-2 border-border shadow-sm" : "text-text-2"
                )}
                onClick={() => setView("va")}
              >
                A Valore Aggiunto
              </button>
              <button
                type="button"
                className={clsx(
                  "px-3 py-1.5 rounded-md text-[12.5px] font-semibold whitespace-nowrap border border-transparent",
                  view === "cm" ? "bg-panel text-accent-2 border-border shadow-sm" : "text-text-2"
                )}
                onClick={() => setView("cm")}
              >
                A Margine di Contribuzione
              </button>
            </div>
          )}
        </div>

        {periods.length === 0 ? (
          <div className="empty-state">
            <div className="text-4xl mb-2.5">📊</div>
            Nessun periodo importato. Vai a &quot;Impostazioni › Importazione&quot; per iniziare.
          </div>
        ) : (
          <>
            {view === "cm" && (
              <div className="grid gap-2.5 my-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))" }}>
                {periods.map((p) => {
                  const cm = calcs[p.id].cm;
                  return (
                    <div key={p.id} className="border border-border rounded-lg p-3 bg-panel-2">
                      <div className="text-[11.5px] font-bold text-text-3 uppercase tracking-wide mb-1">
                        {p.label}
                      </div>
                      <div className="text-xs text-text-2">
                        Incidenza Merce: <b className="font-mono">{fmtPct(cm.incidenzaMerce)}</b>
                      </div>
                      <div className="text-xs text-text-2">
                        Ricarico: <b className="font-mono">{fmtX(cm.ricarico)}</b>{" "}
                        {isFinite(cm.ricarico) && (
                          <span className="text-text-3">
                            (markup {fmtPct(cm.ricarico - 1)})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {view === "cm" && (
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3 px-3 py-2 rounded-lg border border-border bg-panel-2 text-xs text-text-2 no-print">
                <span>
                  Per spostare un costo tra <b>variabili</b> e <b>fissi</b>, espandi la voce (▸) e usa il
                  selettore <b>V / F</b> accanto al conto. La modifica vale per il conto in tutti i periodi e
                  si riflette anche su Break-even e indici collegati.
                  {varFixCount > 0 && (
                    <span className="text-[#92400e]">
                      {" "}
                      Conti riclassificati manualmente: <b>{varFixCount}</b>.
                    </span>
                  )}
                </span>
                {varFixCount > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      if (
                        confirm(
                          "Ripristinare la classificazione variabile/fisso predefinita per tutti i conti?"
                        )
                      )
                        useStore.setState({ varFixOverrides: {} });
                    }}
                  >
                    ↺ Ripristina classificazione V/F
                  </button>
                )}
              </div>
            )}
            <FinTable
              periods={periods}
              calcs={calcs}
              rows={view === "va" ? ceVaRows : ceCmRows}
              varFix={view === "cm"}
            />

          </>
        )}
      </div>
    </section>
  );
}
