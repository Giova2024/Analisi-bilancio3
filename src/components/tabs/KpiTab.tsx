"use client";

import "@/lib/chartSetup";
import { Bar, Line } from "react-chartjs-2";
import clsx from "clsx";
import { useDerived } from "@/lib/useDerived";
import { dotFor } from "@/lib/compute/ratios";
import { fmtDays, fmtEur, fmtPct, fmtRatio } from "@/lib/numberFormat";

type Status = "green" | "amber" | "red" | "grey";

function KpiCard({
  label,
  value,
  status,
  trend,
}: {
  label: string;
  value: string;
  status: Status;
  trend?: { text: string; good: boolean } | null;
}) {
  const bg =
    status === "green"
      ? "border-[#bbf7d0] bg-green-bg"
      : status === "amber"
        ? "border-[#fde68a] bg-amber-bg"
        : status === "red"
          ? "border-[#fecaca] bg-red-bg"
          : "border-border bg-panel-2";
  return (
    <div className={clsx("border rounded-xl p-4", bg)}>
      <div className="text-[11.5px] text-text-3 font-bold uppercase tracking-wide">{label}</div>
      <div className="text-[26px] font-extrabold mt-1 font-mono">{value}</div>
      {trend && (
        <div className={clsx("text-xs mt-1 font-semibold", trend.good ? "text-green" : "text-red")}>
          {trend.text}
        </div>
      )}
      {trend === null && (
        <div className="text-xs mt-1 font-semibold text-text-3">
          periodi di durata diversa: confronto non significativo
        </div>
      )}
    </div>
  );
}

function trendStr(cur: number, prev: number, higherBetter = true, fmt: (v: number) => string = fmtEur) {
  if (!isFinite(cur) || !isFinite(prev)) return { text: "—", good: true };
  const diff = cur - prev;
  const good = higherBetter ? diff >= 0 : diff <= 0;
  const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "—";
  return { text: `${arrow} ${fmt(Math.abs(diff))}`, good };
}

export default function KpiTab() {
  const { periods, calcs, ratios } = useDerived();

  if (periods.length === 0) {
    return (
      <section>
        <div className="panel">
          <div className="panel-title">Dashboard KPI</div>
          <div className="empty-state">
            <div className="text-4xl mb-2.5">📊</div>
            Nessun periodo importato. Vai alla scheda &quot;Importazione&quot; per iniziare.
          </div>
        </div>
      </section>
    );
  }

  const last = periods[periods.length - 1];
  const prev = periods.length > 1 ? periods[periods.length - 2] : null;
  const cLast = calcs[last.id];
  const rLast = ratios[last.id];
  const cPrev = prev ? calcs[prev.id] : null;
  const rPrev = prev ? ratios[prev.id] : null;
  const flowsComparable = !!prev && prev.type === last.type;

  const pfnStatus: Status = cLast.sp.pfn < 0 ? "green" : cLast.sp.pfn < cLast.ce.ebitda * 3 ? "amber" : "red";

  const mixedDurations = periods.some((p) => p.type !== periods[0].type);

  const chartLabels = periods.map((p) => p.label);

  return (
    <section>
      <div className="panel">
        <div className="panel-title">Dashboard KPI</div>
        <div className="panel-desc">
          Vista sintetica sull&apos;ultimo periodo disponibile, con andamento storico se sono presenti più
          periodi.
        </div>

        <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <KpiCard
            label="Ricavi delle vendite"
            value={fmtEur(cLast.ce.ricaviVendite.total)}
            status="grey"
            trend={
              cPrev
                ? flowsComparable
                  ? trendStr(cLast.ce.ricaviVendite.total, cPrev.ce.ricaviVendite.total)
                  : null
                : undefined
            }
          />
          <KpiCard
            label="EBITDA"
            value={fmtEur(cLast.ce.ebitda)}
            status={cLast.ce.ebitda > 0 ? "green" : "red"}
            trend={cPrev ? (flowsComparable ? trendStr(cLast.ce.ebitda, cPrev.ce.ebitda) : null) : undefined}
          />
          <KpiCard
            label="EBITDA Margin"
            value={fmtPct(rLast.ebitdaMargin)}
            status={dotFor(rLast.ebitdaMargin, [0.08, 0.15], true)}
            trend={rPrev ? trendStr(rLast.ebitdaMargin, rPrev.ebitdaMargin, true, fmtPct) : undefined}
          />
          <KpiCard
            label="Utile Netto"
            value={fmtEur(cLast.ce.utileNetto)}
            status={cLast.ce.utileNetto > 0 ? "green" : "red"}
            trend={cPrev ? (flowsComparable ? trendStr(cLast.ce.utileNetto, cPrev.ce.utileNetto) : null) : undefined}
          />
          <KpiCard label="Patrimonio Netto" value={fmtEur(cLast.sp.patrimonioNetto.total)} status="grey" />
          <KpiCard label="Posizione Finanziaria Netta" value={fmtEur(cLast.sp.pfn)} status={pfnStatus} />
          <KpiCard
            label="Current Ratio"
            value={fmtRatio(rLast.currentRatio)}
            status={dotFor(rLast.currentRatio, [1, 1.5], true)}
          />
          <KpiCard label="ROE" value={fmtPct(rLast.roe)} status={dotFor(rLast.roe, [0.05, 0.1], true)} />
          <KpiCard label="ROI" value={fmtPct(rLast.roi)} status={dotFor(rLast.roi, [0.04, 0.08], true)} />
          <KpiCard
            label="Indice indipendenza finanziaria"
            value={fmtPct(rLast.indipendenzaFin)}
            status={dotFor(rLast.indipendenzaFin, [0.2, 0.33], true)}
          />
          <KpiCard
            label="Giorni incasso clienti (DSO)"
            value={fmtDays(rLast.dso)}
            status={dotFor(rLast.dso, [90, 60], false)}
          />
          <KpiCard label="Giorni giacenza magazzino" value={fmtDays(rLast.dmag)} status="grey" />
        </div>

        {periods.length > 0 && (
          <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))" }}>
            <div className="border border-border rounded-[10px] p-3.5">
              <div className="text-[12.5px] font-bold text-text-2 mb-1">Ricavi, EBITDA, Utile Netto</div>
              {mixedDurations && (
                <div className="text-[11px] text-amber mb-1">
                  Attenzione: i periodi confrontati hanno durate diverse.
                </div>
              )}
              <div className="relative h-[260px]">
                <Bar
                  data={{
                    labels: chartLabels,
                    datasets: [
                      { label: "Ricavi", data: periods.map((p) => calcs[p.id].ce.ricaviVendite.total), backgroundColor: "#2563eb" },
                      { label: "EBITDA", data: periods.map((p) => calcs[p.id].ce.ebitda), backgroundColor: "#7c3aed" },
                      { label: "Utile Netto", data: periods.map((p) => calcs[p.id].ce.utileNetto), backgroundColor: "#16a34a" },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { grid: { color: "rgba(148,163,184,.2)" } },
                      y: { grid: { color: "rgba(148,163,184,.2)" } },
                    },
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              </div>
            </div>

            <div className="border border-border rounded-[10px] p-3.5">
              <div className="text-[12.5px] font-bold text-text-2 mb-1">Margini (%)</div>
              <div className="relative h-[260px]">
                <Line
                  data={{
                    labels: chartLabels,
                    datasets: [
                      { label: "EBITDA Margin", data: periods.map((p) => ratios[p.id].ebitdaMargin * 100), borderColor: "#2563eb", backgroundColor: "#2563eb" },
                      { label: "EBIT Margin", data: periods.map((p) => ratios[p.id].ebitMargin * 100), borderColor: "#7c3aed", backgroundColor: "#7c3aed" },
                      { label: "ROE", data: periods.map((p) => ratios[p.id].roe * 100), borderColor: "#16a34a", backgroundColor: "#16a34a" },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { grid: { color: "rgba(148,163,184,.2)" } },
                      y: { grid: { color: "rgba(148,163,184,.2)" }, ticks: { callback: (v) => v + "%" } },
                    },
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              </div>
            </div>

            <div className="border border-border rounded-[10px] p-3.5">
              <div className="text-[12.5px] font-bold text-text-2 mb-1">Composizione Fonti</div>
              <div className="relative h-[260px]">
                <Bar
                  data={{
                    labels: chartLabels,
                    datasets: [
                      { label: "Patrimonio Netto", data: periods.map((p) => calcs[p.id].sp.patrimonioNetto.total), backgroundColor: "#16a34a" },
                      { label: "Passività Consolidate", data: periods.map((p) => calcs[p.id].sp.passivitaConsolidate.total), backgroundColor: "#d97706" },
                      { label: "Passività Correnti", data: periods.map((p) => calcs[p.id].sp.passivitaCorrenti.total), backgroundColor: "#dc2626" },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { stacked: true, grid: { color: "rgba(148,163,184,.2)" } },
                      y: { stacked: true, grid: { color: "rgba(148,163,184,.2)" } },
                    },
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              </div>
            </div>

            <div className="border border-border rounded-[10px] p-3.5">
              <div className="text-[12.5px] font-bold text-text-2 mb-1">Current Ratio / Leverage</div>
              <div className="relative h-[260px]">
                <Line
                  data={{
                    labels: chartLabels,
                    datasets: [
                      { label: "Current Ratio", data: periods.map((p) => ratios[p.id].currentRatio), borderColor: "#2563eb", backgroundColor: "#2563eb" },
                      { label: "Leverage", data: periods.map((p) => ratios[p.id].leverage), borderColor: "#dc2626", backgroundColor: "#dc2626" },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { grid: { color: "rgba(148,163,184,.2)" } },
                      y: { grid: { color: "rgba(148,163,184,.2)" } },
                    },
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
