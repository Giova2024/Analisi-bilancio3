"use client";

import "@/lib/chartSetup";
import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import clsx from "clsx";
import { useDerived } from "@/lib/useDerived";
import { useStore } from "@/lib/store";
import {
  computeBPBaseline,
  defaultScenarioAssumptions,
  projectScenario,
  type BPBaseline,
} from "@/lib/compute/businessplan";
import { BP_ASSUMPTION_FIELDS, type Assumptions, type ScenarioKey } from "@/lib/types";
import { fmtEur, fmtPct, fmtRatio } from "@/lib/numberFormat";

const SCENARIOS: { key: ScenarioKey; label: string; border: string; text: string; color: string }[] = [
  { key: "prudenziale", label: "Prudenziale", border: "border-[#fca5a5]", text: "text-[#b91c1c]", color: "#dc2626" },
  { key: "base", label: "Base", border: "border-[#93c5fd]", text: "text-accent-2", color: "#2563eb" },
  { key: "ottimistico", label: "Ottimistico", border: "border-[#86efac]", text: "text-[#15803d]", color: "#16a34a" },
];

const FIELD_LABELS: Record<(typeof BP_ASSUMPTION_FIELDS)[number], { label: string; unit: string }> = {
  crescitaRicavi: { label: "Crescita ricavi", unit: "%/anno" },
  incidenzaCV: { label: "Incidenza costi variabili", unit: "%" },
  varPersonale: { label: "Variazione costo personale", unit: "%/anno" },
  varAltriFissi: { label: "Variazione altri costi fissi", unit: "%/anno" },
  varAmmortamenti: { label: "Variazione ammortamenti", unit: "%/anno" },
  varOneriFin: { label: "Variazione oneri finanziari", unit: "%/anno" },
  aliquota: { label: "Aliquota fiscale effettiva", unit: "%" },
  capex: { label: "Capex annuo", unit: "€" },
  dso: { label: "Giorni incasso clienti (DSO)", unit: "gg" },
  dpo: { label: "Giorni pagamento fornitori (DPO)", unit: "gg" },
  giacenza: { label: "Giorni giacenza magazzino", unit: "gg" },
};

export default function BusinessPlanTab() {
  const { periods, calcs, ratios } = useDerived();
  const businessPlan = useStore((s) => s.businessPlan);
  const setBusinessPlan = useStore((s) => s.setBusinessPlan);
  const updateScenarioAssumption = useStore((s) => s.updateScenarioAssumption);
  const [collapsedAssumptions, setCollapsedAssumptions] = useState(false);
  const [collapsedCharts, setCollapsedCharts] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>("base");

  const baselinePeriod = useMemo(() => {
    if (periods.length === 0) return null;
    if (businessPlan?.baselinePeriodId) {
      const found = periods.find((p) => p.id === businessPlan.baselinePeriodId);
      if (found) return found;
    }
    return periods[periods.length - 1];
  }, [periods, businessPlan]);

  const baseline: BPBaseline | null = useMemo(() => {
    if (!baselinePeriod) return null;
    return computeBPBaseline(baselinePeriod, calcs[baselinePeriod.id], ratios[baselinePeriod.id]);
  }, [baselinePeriod, calcs, ratios]);

  useEffect(() => {
    if (!baseline || !baselinePeriod) return;
    if (businessPlan) return;
    setBusinessPlan({
      years: 3,
      baselinePeriodId: baselinePeriod.id,
      scenarios: {
        prudenziale: defaultScenarioAssumptions(baseline, "prudenziale"),
        base: defaultScenarioAssumptions(baseline, "base"),
        ottimistico: defaultScenarioAssumptions(baseline, "ottimistico"),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseline, baselinePeriod, businessPlan]);

  function resetAssumptions() {
    if (!baseline || !baselinePeriod || !businessPlan) return;
    const ok = window.confirm(
      "Reimpostare le ipotesi di tutti e 3 gli scenari a partire dal periodo di partenza selezionato? Le modifiche manuali andranno perse."
    );
    if (!ok) return;
    setBusinessPlan({
      ...businessPlan,
      scenarios: {
        prudenziale: defaultScenarioAssumptions(baseline, "prudenziale"),
        base: defaultScenarioAssumptions(baseline, "base"),
        ottimistico: defaultScenarioAssumptions(baseline, "ottimistico"),
      },
    });
  }

  if (periods.length === 0) {
    return (
      <section>
        <div className="panel">
          <div className="panel-title">Business Plan</div>
          <div className="empty-state">
            <div className="text-4xl mb-2.5">📊</div>
            Nessun periodo importato. Vai alla scheda &quot;Importazione&quot; per iniziare.
          </div>
        </div>
      </section>
    );
  }

  if (!businessPlan || !baseline || !baselinePeriod) return null;

  const years = businessPlan.years;
  const projections: Record<ScenarioKey, ReturnType<typeof projectScenario>> = {
    prudenziale: projectScenario(baseline, businessPlan.scenarios.prudenziale, years),
    base: projectScenario(baseline, businessPlan.scenarios.base, years),
    ottimistico: projectScenario(baseline, businessPlan.scenarios.ottimistico, years),
  };

  const chartLabels = ["Anno 0 (storico)", ...Array.from({ length: years }, (_, i) => `Anno ${i + 1}`)];

  function lineChart(getVal: (row: ReturnType<typeof projectScenario>[number]) => number, base0: number) {
    return {
      labels: chartLabels,
      datasets: SCENARIOS.map((s) => ({
        label: s.label,
        data: [base0, ...projections[s.key].map(getVal)],
        borderColor: s.color,
        backgroundColor: s.color,
      })),
    };
  }

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: "rgba(148,163,184,.2)" } },
      y: {
        grid: { color: "rgba(148,163,184,.2)" },
        ticks: { callback: (v: string | number) => fmtEur(Number(v)) },
      },
    },
    plugins: { legend: { position: "bottom" as const } },
  };

  const selectedRows = projections[selectedScenario];

  return (
    <section>
      <div className="panel">
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div>
            <div className="panel-title">Business Plan</div>
            <div className="panel-desc mb-0">
              Proiezione pluriennale del Conto Economico a partire dal periodo di partenza scelto qui sotto, in
              tre scenari con ipotesi modificabili. È una simulazione: la qualità dei risultati dipende
              dalla ragionevolezza delle ipotesi inserite.
            </div>
          </div>
          <div className="flex gap-2.5 items-end flex-wrap">
            <div className="field mb-0">
              <label>Periodo di partenza (anno 0)</label>
              <select
                value={baselinePeriod.id}
                onChange={(e) => setBusinessPlan({ ...businessPlan, baselinePeriodId: e.target.value })}
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field mb-0">
              <label>Anni di proiezione</label>
              <select
                value={years}
                onChange={(e) => setBusinessPlan({ ...businessPlan, years: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>
                    {y} anno{y > 1 ? "i" : ""}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn btn-sm" onClick={resetAssumptions}>
              ↺ Reimposta ipotesi dal periodo di partenza
            </button>
          </div>
        </div>

        <div className="mt-3 mb-3 p-3.5 bg-panel-2 border border-border rounded-[10px] text-[12.5px] text-text-2">
          Baseline: <b className="text-text">{baseline.periodLabel}</b> — Ricavi <b className="text-text">{fmtEur(baseline.ricavi0)}</b>,
          Incidenza CV storica <b className="text-text">{fmtRatio(baseline.incidenzaCVStorica)}%</b>, Aliquota
          storica <b className="text-text">{fmtRatio(baseline.aliquotaStorica)}%</b>, DSO{" "}
          <b className="text-text">{baseline.dsoStorico} gg</b>, DPO <b className="text-text">{baseline.dpoStorico} gg</b>,
          Giacenza <b className="text-text">{baseline.giacenzaStorica} gg</b>
        </div>

        <div className="flex items-center justify-between mb-1">
          <div className="font-bold text-sm">Ipotesi per scenario</div>
          <button type="button" className="btn btn-sm no-print" onClick={() => setCollapsedAssumptions((v) => !v)}>
            {collapsedAssumptions ? "Mostra" : "Nascondi"}
          </button>
        </div>
        {!collapsedAssumptions && (
          <div className="grid gap-4 mt-2.5 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {SCENARIOS.map((s) => {
              const assum = businessPlan.scenarios[s.key];
              const last = projections[s.key][projections[s.key].length - 1];
              return (
                <div key={s.key} className={clsx("border-2 rounded-xl p-3.5 bg-panel-2", s.border)}>
                  <div className={clsx("font-extrabold text-[13.5px] mb-2.5", s.text)}>{s.label}</div>
                  {BP_ASSUMPTION_FIELDS.map((field) => (
                    <div className="mb-2" key={field}>
                      <label className="text-[11px] font-semibold text-text-2 block mb-0.5">
                        {FIELD_LABELS[field].label}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          className="w-full px-2 py-1 border border-border-2 rounded-md text-[12.5px]"
                          value={assum[field as keyof Assumptions]}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value.replace(",", "."));
                            updateScenarioAssumption(s.key, field, isFinite(v) ? v : 0);
                          }}
                        />
                        <span className="text-[11px] text-text-3 flex-shrink-0 w-[42px]">
                          {FIELD_LABELS[field].unit}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t border-border text-xs text-text-2">
                    <div>
                      Ricavi anno {years}: <b>{fmtEur(last.ricavi)}</b>
                    </div>
                    <div>
                      EBITDA anno {years}: <b>{fmtEur(last.ebitda)}</b>
                    </div>
                    <div>
                      Utile Netto anno {years}: <b>{fmtEur(last.utileNetto)}</b>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between mb-1">
          <div className="font-bold text-sm">Confronto scenari</div>
          <button type="button" className="btn btn-sm no-print" onClick={() => setCollapsedCharts((v) => !v)}>
            {collapsedCharts ? "Mostra" : "Nascondi"}
          </button>
        </div>
        {!collapsedCharts && (
          <div className="grid gap-4 mt-2.5 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))" }}>
            <ChartBox title="Ricavi">
              <Line data={lineChart((r) => r.ricavi, baseline.ricavi0)} options={chartOpts} />
            </ChartBox>
            <ChartBox title="EBITDA">
              <Line data={lineChart((r) => r.ebitda, calcs[baselinePeriod.id].ce.ebitda)} options={chartOpts} />
            </ChartBox>
            <ChartBox title="Utile Netto">
              <Line
                data={lineChart((r) => r.utileNetto, calcs[baselinePeriod.id].ce.utileNetto)}
                options={chartOpts}
              />
            </ChartBox>
            <ChartBox title="Posizione Finanziaria Netta">
              <Line data={lineChart((r) => r.pfn, baseline.pfn0)} options={chartOpts} />
            </ChartBox>
          </div>
        )}

        <div className="flex gap-1 flex-wrap mb-2.5">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={clsx(
                "px-3.5 py-1.5 rounded-lg text-[13px] font-semibold border",
                selectedScenario === s.key ? "bg-accent-bg border-[#bfdbfe] text-accent-2" : "border-transparent text-text-2 hover:bg-panel-2"
              )}
              onClick={() => setSelectedScenario(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="font-bold text-sm mb-2">Conto Economico Prospettico</div>
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="text-left py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border">
                  Voce
                </th>
                <th className="text-right py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">
                  Anno 0
                </th>
                {selectedRows.map((r) => (
                  <th
                    key={r.year}
                    className="text-right py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap"
                  >
                    Anno {r.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <BpRow label="Ricavi" values={[baseline.ricavi0, ...selectedRows.map((r) => r.ricavi)]} fmt={fmtEur} />
              <BpRow label="Costi variabili" values={[NaN, ...selectedRows.map((r) => r.cv)]} fmt={fmtEur} kind="sub" />
              <BpRow label="Margine di Contribuzione" values={[NaN, ...selectedRows.map((r) => r.margineContrib)]} fmt={fmtEur} kind="tot" />
              <BpRow label="Costo personale" values={[baseline.costoPersonale0, ...selectedRows.map((r) => r.costoPersonale)]} fmt={fmtEur} kind="sub" />
              <BpRow label="Altri costi fissi" values={[baseline.altriCostiFissi0, ...selectedRows.map((r) => r.altriFissi)]} fmt={fmtEur} kind="sub" />
              <BpRow label="EBITDA" values={[NaN, ...selectedRows.map((r) => r.ebitda)]} fmt={fmtEur} kind="tot" />
              <BpRow label="Ammortamenti" values={[baseline.ammortamenti0, ...selectedRows.map((r) => r.ammortamenti)]} fmt={fmtEur} kind="sub" />
              <BpRow label="EBIT" values={[NaN, ...selectedRows.map((r) => r.ebit)]} fmt={fmtEur} kind="tot" />
              <BpRow label="Oneri finanziari" values={[baseline.oneriFin0, ...selectedRows.map((r) => r.oneriFin)]} fmt={fmtEur} kind="sub" />
              <BpRow label="EBT" values={[NaN, ...selectedRows.map((r) => r.ebt)]} fmt={fmtEur} kind="tot" />
              <BpRow label="Imposte" values={[NaN, ...selectedRows.map((r) => r.imposte)]} fmt={fmtEur} kind="sub" />
              <BpRow label="UTILE NETTO" values={[NaN, ...selectedRows.map((r) => r.utileNetto)]} fmt={fmtEur} kind="tot" />
              <BpRow label="EBITDA Margin %" values={[NaN, ...selectedRows.map((r) => r.ebitdaMargin)]} fmt={fmtPct} kind="sub" />
              <BpRow label="ROE %" values={[NaN, ...selectedRows.map((r) => r.roe)]} fmt={fmtPct} kind="sub" />
              <BpRow label="Flusso di cassa disponibile" values={[NaN, ...selectedRows.map((r) => r.flussoDisponibile)]} fmt={fmtEur} kind="sub" />
            </tbody>
          </table>
        </div>

        <div className="font-bold text-sm mb-2">Stato Patrimoniale Prospettico</div>
        <div className="note mb-2">
          Proiezione semplificata: la liquidità è mantenuta costante al valore del periodo di partenza e
          si assume che il flusso di cassa disponibile di ciascun anno riduca (o aumenti, se negativo) i debiti
          finanziari. Crediti, rimanenze e debiti verso fornitori sono stimati dai giorni medi (DSO/DPO/giacenza)
          impostati nello scenario. Non essendo un modello a tre prospetti pienamente articolato, può residuare
          un piccolo scostamento tra Totale Impieghi e Totale Fonti, riportato in modo esplicito come nel
          Rendiconto Finanziario storico.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="text-left py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border">
                  Voce
                </th>
                <th className="text-right py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">
                  Anno 0
                </th>
                {selectedRows.map((r) => (
                  <th
                    key={r.year}
                    className="text-right py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap"
                  >
                    Anno {r.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <BpRow label="Liquidità" values={[baseline.liq0, ...selectedRows.map((r) => r.liquidita)]} fmt={fmtEur} />
              <BpRow label="Crediti commerciali" values={[baseline.creditiComm0, ...selectedRows.map((r) => r.crediti)]} fmt={fmtEur} kind="sub" />
              <BpRow label="Rimanenze" values={[baseline.rimanenzeSp0, ...selectedRows.map((r) => r.rimanenze)]} fmt={fmtEur} kind="sub" />
              <BpRow label="Immobilizzazioni nette" values={[baseline.immobilizzazioni0, ...selectedRows.map((r) => r.immobilizzazioniNette)]} fmt={fmtEur} kind="sub" />
              <BpRow
                label="TOTALE IMPIEGHI"
                values={[
                  baseline.liq0 + baseline.creditiComm0 + baseline.rimanenzeSp0 + baseline.immobilizzazioni0,
                  ...selectedRows.map((r) => r.totaleImpieghi),
                ]}
                fmt={fmtEur}
                kind="tot"
              />
              <BpRow label="Debiti verso fornitori" values={[baseline.debitiForn0, ...selectedRows.map((r) => r.debitiFornitori)]} fmt={fmtEur} kind="sub" />
              <BpRow
                label="Debiti finanziari"
                values={[baseline.pfn0 + baseline.liq0, ...selectedRows.map((r) => r.debitiFinanziari)]}
                fmt={fmtEur}
                kind="sub"
              />
              <BpRow label="Patrimonio Netto" values={[baseline.pn0, ...selectedRows.map((r) => r.pn)]} fmt={fmtEur} kind="sub" />
              <BpRow
                label="TOTALE FONTI"
                values={[
                  baseline.debitiForn0 + (baseline.pfn0 + baseline.liq0) + baseline.pn0,
                  ...selectedRows.map((r) => r.totaleFonti),
                ]}
                fmt={fmtEur}
                kind="tot"
              />
              <BpRow label="Posizione Finanziaria Netta" values={[baseline.pfn0, ...selectedRows.map((r) => r.pfn)]} fmt={fmtEur} kind="sub" />
              <BpRow label="Residuo di quadratura" values={[0, ...selectedRows.map((r) => r.quadratura)]} fmt={fmtEur} kind="sub" />
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ChartBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-[10px] p-3.5">
      <div className="text-[12.5px] font-bold text-text-2 mb-1">{title}</div>
      <div className="relative h-[230px]">{children}</div>
    </div>
  );
}

function BpRow({
  label,
  values,
  fmt,
  kind,
}: {
  label: string;
  values: number[];
  fmt: (v: number) => string;
  kind?: "sub" | "tot";
}) {
  return (
    <tr
      className={clsx(
        "border-b border-border",
        kind === "tot" && "font-extrabold bg-accent-bg border-t-2 border-b-2 border-border-2"
      )}
    >
      <td className={clsx("py-1.5 px-2.5", kind === "sub" && "pl-6 text-text-2 font-normal")}>{label}</td>
      {values.map((v, i) => (
        <td
          key={i}
          className={clsx("py-1.5 px-2.5 text-right font-mono whitespace-nowrap tabular-nums", v < 0 && "text-red")}
        >
          {isFinite(v) ? fmt(v) : "—"}
        </td>
      ))}
    </tr>
  );
}
