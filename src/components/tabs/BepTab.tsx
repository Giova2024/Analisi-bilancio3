"use client";

import "@/lib/chartSetup";
import { Line } from "react-chartjs-2";
import { useDerived } from "@/lib/useDerived";
import { useStore } from "@/lib/store";
import { computeBEP } from "@/lib/compute/bep";
import { fmt0, fmtEur, fmtPct, fmtRatio } from "@/lib/numberFormat";

export default function BepTab() {
  const { periods, calcs } = useDerived();
  const bepInputs = useStore((s) => s.bepInputs);
  const setBepInput = useStore((s) => s.setBepInput);

  return (
    <section>
      <div className="panel">
        <div className="panel-title">Break Even Point (Punto di Pareggio)</div>
        <div className="panel-desc">
          Il BEP &quot;a valore&quot; si calcola in automatico dai dati di bilancio (Costi Fissi / Margine di
          Contribuzione %, dalla riclassificazione a margine di contribuzione). Inserendo anche il ricavo e il
          costo variabile per unità di prodotto/servizio ottieni il punto di pareggio in quantità.
        </div>

        {periods.length === 0 ? (
          <div className="empty-state">
            <div className="text-4xl mb-2.5">📊</div>
            Nessun periodo importato. Vai alla scheda &quot;Importazione&quot; per iniziare.
          </div>
        ) : (
          <div
            className="grid gap-4 mt-3.5"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
          >
            {periods.map((p) => {
              const input = bepInputs[p.id] || { prezzo: null, costoVar: null };
              const bep = computeBEP(calcs[p.id], input);
              const xMax = Math.max(
                bep.ricavi * 1.4,
                isFinite(bep.bepAggregatoEur) ? bep.bepAggregatoEur * 1.3 : 0,
                1000
              );
              const chartData = {
                datasets: [
                  {
                    label: "Ricavi",
                    data: [
                      { x: 0, y: 0 },
                      { x: xMax, y: xMax },
                    ],
                    borderColor: "#2563eb",
                    backgroundColor: "#2563eb",
                    borderWidth: 2,
                    pointRadius: 0,
                  },
                  {
                    label: "Costi totali",
                    data: [
                      { x: 0, y: bep.cf },
                      { x: xMax, y: bep.cf + bep.cvRatio * xMax },
                    ],
                    borderColor: "#dc2626",
                    backgroundColor: "#dc2626",
                    borderWidth: 2,
                    pointRadius: 0,
                  },
                  {
                    label: "Costi fissi",
                    data: [
                      { x: 0, y: bep.cf },
                      { x: xMax, y: bep.cf },
                    ],
                    borderColor: "#94a3b8",
                    backgroundColor: "#94a3b8",
                    borderWidth: 1.5,
                    borderDash: [5, 4],
                    pointRadius: 0,
                  },
                  ...(isFinite(bep.bepAggregatoEur)
                    ? [
                        {
                          label: "Punto di pareggio",
                          data: [{ x: bep.bepAggregatoEur, y: bep.bepAggregatoEur }],
                          borderColor: "#16a34a",
                          backgroundColor: "#16a34a",
                          pointRadius: 6,
                          showLine: false,
                        },
                      ]
                    : []),
                  ...(bep.ricavi > 0
                    ? [
                        {
                          label: "Situazione attuale",
                          data: [{ x: bep.ricavi, y: bep.ricavi }],
                          borderColor: "#7c3aed",
                          backgroundColor: "#7c3aed",
                          pointRadius: 6,
                          showLine: false,
                        },
                      ]
                    : []),
                ],
              };

              return (
                <div key={p.id} className="border border-border rounded-[10px] p-3.5 bg-panel-2">
                  <div className="font-bold text-[13px] mb-2.5">{p.label}</div>
                  <div className="mb-2.5">
                    <label className="text-[11.5px] font-semibold text-text-2 block mb-0.5">
                      Ricavo unitario (€)
                    </label>
                    <input
                      type="number"
                      className="w-full px-2 py-1.5 border border-border-2 rounded-md text-[13px]"
                      value={input.prezzo ?? ""}
                      onChange={(e) =>
                        setBepInput(p.id, {
                          ...input,
                          prezzo: e.target.value === "" ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="mb-2.5">
                    <label className="text-[11.5px] font-semibold text-text-2 block mb-0.5">
                      Costo variabile unitario (€)
                    </label>
                    <input
                      type="number"
                      className="w-full px-2 py-1.5 border border-border-2 rounded-md text-[13px]"
                      value={input.costoVar ?? ""}
                      onChange={(e) =>
                        setBepInput(p.id, {
                          ...input,
                          costoVar: e.target.value === "" ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  <Stat label="MC unitario" value={isFinite(bep.mcUnit) ? fmtEur(bep.mcUnit) : "—"} />
                  <Stat label="MC %" value={fmtPct(bep.mcPct)} />
                  <Stat label="Costi fissi totali" value={fmtEur(bep.cf)} />
                  <Stat label="BEP a valore" value={fmtEur(bep.bepAggregatoEur)} highlight />
                  <Stat label="BEP a quantità" value={isFinite(bep.bepQty) ? fmtRatio(bep.bepQty, 0) : "—"} highlight />
                  <Stat label="BEP a valore (da quantità)" value={fmtEur(bep.bepEurDaQty)} />
                  <Stat label="Margine di sicurezza (€)" value={fmtEur(bep.margineSicurezzaEur)} />
                  <Stat label="Margine di sicurezza (%)" value={fmtPct(bep.margineSicurezzaPct)} />

                  <div className="relative h-[230px] mt-2">
                    <Line
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: { type: "linear", grid: { color: "rgba(148,163,184,.2)" }, ticks: { callback: (v) => fmt0(Number(v)) } },
                          y: { grid: { color: "rgba(148,163,184,.2)" }, ticks: { callback: (v) => fmt0(Number(v)) } },
                        },
                        plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } },
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={
        "flex items-center justify-between gap-2 py-1.5 text-[12.5px] border-b border-dashed border-border last:border-none" +
        (highlight ? " bg-accent-bg -mx-2 px-2 rounded-md !border-none text-accent-2 font-bold" : "")
      }
    >
      <span className={highlight ? "text-accent-2" : "text-text-2"}>{label}</span>
      <b className="font-mono whitespace-nowrap">{value}</b>
    </div>
  );
}
