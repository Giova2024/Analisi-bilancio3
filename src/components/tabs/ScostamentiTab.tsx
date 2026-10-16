"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useDerived } from "@/lib/useDerived";
import {
  CE_VARIANCE_ROWS,
  RATIO_VARIANCE_KEYS,
  SP_VARIANCE_ROWS,
  epsilonForFormat,
  esitoFor,
  type Esito,
  type VarianceRow,
} from "@/lib/compute/variance";
import { buildRatioGroups, type RatiosResult } from "@/lib/compute/ratios";
import { fmt0, fmtDays, fmtEur, fmtPct, fmtRatio, fmtX } from "@/lib/numberFormat";
import type { PeriodCalc, RatioValue } from "@/lib/types";

const ESITO_LABEL: Record<Esito, string> = {
  favorevole: "Favorevole",
  sfavorevole: "Sfavorevole",
  invariato: "Invariato",
};
const ESITO_CLASS: Record<Esito, string> = {
  favorevole: "bg-green-bg text-green",
  sfavorevole: "bg-red-bg text-red",
  invariato: "bg-panel-2 text-text-3",
};

function fmtDeltaEur(v: number): string {
  if (!isFinite(v)) return "—";
  return (v > 0 ? "+" : "") + fmtEur(v);
}
function fmtDeltaPct(v: number): string {
  if (!isFinite(v)) return "—";
  return (v > 0 ? "+" : "") + fmtPct(v);
}

function rowBg(kind?: VarianceRow["kind"]): string {
  if (kind === "tot") return "font-extrabold bg-accent-bg border-t-2 border-b-2 border-border-2";
  if (kind === "grp") return "font-bold bg-panel-2 border-t border-border-2";
  return "";
}
function labelPad(kind?: VarianceRow["kind"]): string {
  return kind === "sub" ? "pl-6 text-text-2 font-normal" : "";
}

function EsitoBadge({ esito }: { esito: Esito | null }) {
  if (!esito) return <span className="text-text-3">—</span>;
  return (
    <span className={clsx("text-[10.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap", ESITO_CLASS[esito])}>
      {ESITO_LABEL[esito]}
    </span>
  );
}

function VarianceTable({
  rows,
  calcA,
  calcB,
  labelA,
  labelB,
}: {
  rows: VarianceRow[];
  calcA: PeriodCalc;
  calcB: PeriodCalc;
  labelA: string;
  labelB: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const expandableRows = rows.filter((r) => r.getItems);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // In stampa/PDF, apri temporaneamente tutti i dettagli e ripristina dopo la stampa.
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;
  const expandableIdsRef = useRef(expandableRows.map((r) => r.id));
  expandableIdsRef.current = expandableRows.map((r) => r.id);
  useEffect(() => {
    let saved: Set<string> | null = null;
    function onBeforePrint() {
      saved = expandedRef.current;
      setExpanded(new Set(expandableIdsRef.current));
    }
    function onAfterPrint() {
      if (saved) setExpanded(saved);
    }
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);

  return (
    <div>
      {expandableRows.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2 no-print">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setExpanded(new Set(expandableRows.map((r) => r.id)))}
          >
            ▾ Espandi dettaglio conti
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setExpanded(new Set())}>
            ▸ Nascondi dettaglio conti
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="text-left py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border">Voce</th>
              <th className="text-right py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">Periodo A</th>
              <th className="text-right py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">Periodo B</th>
              <th className="text-right py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">Scostamento €</th>
              <th className="text-right py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">Scostamento %</th>
              <th className="text-right py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">Esito</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const a = row.getValue(calcA);
              const b = row.getValue(calcB);
              const delta = b - a;
              const deltaPct = a !== 0 ? delta / Math.abs(a) : NaN;
              const esito = esitoFor(delta, row.higherBetter, 1);
              const deltaColor = esito === "favorevole" ? "text-green" : esito === "sfavorevole" ? "text-red" : "";
              const isOpen = expanded.has(row.id);
              return (
                <Fragment key={row.id}>
                  <tr className={clsx("border-b border-border", rowBg(row.kind))}>
                    <td className={clsx("py-1.5 px-2.5 whitespace-normal", labelPad(row.kind))}>
                      {row.getItems ? (
                        <button
                          type="button"
                          className="no-print inline-flex items-center justify-center w-4 h-4 mr-1 text-[10px] text-text-3 hover:bg-panel-2 hover:text-accent rounded"
                          onClick={() => toggle(row.id)}
                        >
                          {isOpen ? "▾" : "▸"}
                        </button>
                      ) : (
                        <span className="inline-block w-[21px]" />
                      )}
                      {row.label}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono whitespace-nowrap tabular-nums">{fmtEur(a)}</td>
                    <td className="py-1.5 px-2.5 text-right font-mono whitespace-nowrap tabular-nums">{fmtEur(b)}</td>
                    <td className={clsx("py-1.5 px-2.5 text-right font-mono whitespace-nowrap tabular-nums", deltaColor)}>
                      {fmtDeltaEur(delta)}
                    </td>
                    <td className={clsx("py-1.5 px-2.5 text-right font-mono whitespace-nowrap tabular-nums", deltaColor)}>
                      {fmtDeltaPct(deltaPct)}
                    </td>
                    <td className="py-1.5 px-2.5 text-right">
                      <EsitoBadge esito={esito} />
                    </td>
                  </tr>
                  {row.getItems && isOpen && (
                    <tr>
                      <td colSpan={6} className="bg-panel-2 py-2.5 px-3.5">
                        <DetailTable row={row} calcA={calcA} calcB={calcB} labelA={labelA} labelB={labelB} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailTable({
  row,
  calcA,
  calcB,
  labelA,
  labelB,
}: {
  row: VarianceRow;
  calcA: PeriodCalc;
  calcB: PeriodCalc;
  labelA: string;
  labelB: string;
}) {
  if (!row.getItems) return null;
  const itemsA = row.getItems(calcA);
  const itemsB = row.getItems(calcB);
  const codeMap = new Map<string, { desc: string; manual: boolean }>();
  [...itemsA, ...itemsB].forEach((it) => {
    if (!codeMap.has(it.conto)) codeMap.set(it.conto, { desc: it.desc, manual: !!it.manual });
  });
  const codes = Array.from(codeMap.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (codes.length === 0) {
    return <div className="text-xs text-text-3 italic">Nessun conto sottostante per questa voce.</div>;
  }

  return (
    <table className="w-full border-collapse text-xs bg-panel">
      <thead>
        <tr>
          <th className="text-left py-1 px-2 text-[10.5px] uppercase tracking-wide text-text-3 border-b border-border-2">Codice</th>
          <th className="text-left py-1 px-2 text-[10.5px] uppercase tracking-wide text-text-3 border-b border-border-2">Descrizione</th>
          <th className="text-right py-1 px-2 text-[10.5px] uppercase tracking-wide text-text-3 border-b border-border-2 whitespace-nowrap">{labelA}</th>
          <th className="text-right py-1 px-2 text-[10.5px] uppercase tracking-wide text-text-3 border-b border-border-2 whitespace-nowrap">{labelB}</th>
        </tr>
      </thead>
      <tbody>
        {codes.map((code) => {
          const meta = codeMap.get(code)!;
          const accA = itemsA.find((a) => a.conto === code);
          const accB = itemsB.find((a) => a.conto === code);
          return (
            <tr key={code} className={clsx(meta.manual && "bg-amber-bg")}>
              <td className="py-1 px-2 font-mono text-text-3 whitespace-nowrap">{code}</td>
              <td className="py-1 px-2 text-text-2 whitespace-normal">
                {meta.desc}
                {meta.manual && (
                  <span className="inline-block text-[9.5px] font-bold uppercase tracking-wide text-[#92400e] bg-[#fde68a] px-1.5 py-0.5 rounded-full ml-1.5 align-middle">
                    extracontabile
                  </span>
                )}
              </td>
              <td className={clsx("py-1 px-2 text-right font-mono font-semibold whitespace-nowrap tabular-nums", accA && accA.saldo < 0 && "text-red")}>
                {accA ? fmt0(accA.saldo) : "—"}
              </td>
              <td className={clsx("py-1 px-2 text-right font-mono font-semibold whitespace-nowrap tabular-nums", accB && accB.saldo < 0 && "text-red")}>
                {accB ? fmt0(accB.saldo) : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function formatRatioValue(r: RatioValue): string {
  switch (r.format) {
    case "pct":
      return fmtPct(r.value);
    case "eur":
      return fmtEur(r.value);
    case "days":
      return fmtDays(r.value);
    case "x":
      return fmtX(r.value);
    default:
      return fmtRatio(r.value);
  }
}

function RatioVarianceTable({ ratiosA, ratiosB }: { ratiosA: RatiosResult; ratiosB: RatiosResult }) {
  const defsB = buildRatioGroups(ratiosB).flatMap((g) => g.ratios);
  const rows = RATIO_VARIANCE_KEYS.map((key) => defsB.find((r) => r.key === key)).filter(
    (r): r is RatioValue => !!r
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="text-left py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border">Indice</th>
            <th className="text-right py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">Periodo A</th>
            <th className="text-right py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">Periodo B</th>
            <th className="text-right py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">Scostamento</th>
            <th className="text-right py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">Esito</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((rB) => {
            const aVal = ratiosA[rB.key as keyof RatiosResult] as number;
            const rA: RatioValue = { ...rB, value: aVal };
            const delta = rB.value - aVal;
            const esito = esitoFor(delta, rB.higherBetter, epsilonForFormat(rB.format));
            const deltaColor = esito === "favorevole" ? "text-green" : esito === "sfavorevole" ? "text-red" : "";
            return (
              <tr key={rB.key} className="border-b border-border">
                <td className="py-1.5 px-2.5 whitespace-normal">{rB.label}</td>
                <td className="py-1.5 px-2.5 text-right font-mono whitespace-nowrap tabular-nums">{formatRatioValue(rA)}</td>
                <td className="py-1.5 px-2.5 text-right font-mono whitespace-nowrap tabular-nums">{formatRatioValue(rB)}</td>
                <td className={clsx("py-1.5 px-2.5 text-right font-mono whitespace-nowrap tabular-nums", deltaColor)}>
                  {isFinite(delta) ? (delta > 0 ? "+" : "") + formatRatioValue({ ...rB, value: delta }) : "—"}
                </td>
                <td className="py-1.5 px-2.5 text-right">
                  <EsitoBadge esito={esito} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ScostamentiTab() {
  const { periods, calcs, ratios } = useDerived();
  const [aId, setAId] = useState<string | null>(null);
  const [bId, setBId] = useState<string | null>(null);

  if (periods.length < 2) {
    return (
      <section>
        <div className="panel">
          <div className="panel-title">Analisi degli Scostamenti</div>
          <div className="empty-state">
            <div className="text-4xl mb-2.5">🎯</div>
            Servono almeno due periodi importati per confrontare gli scostamenti tra un periodo di
            riferimento (es. anno precedente o budget) e un periodo in analisi.
          </div>
        </div>
      </section>
    );
  }

  const periodA = periods.find((p) => p.id === aId) ?? periods[periods.length - 2];
  const periodB = periods.find((p) => p.id === bId) ?? periods[periods.length - 1];
  const same = periodA.id === periodB.id;

  return (
    <section>
      <div className="panel">
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div>
            <div className="panel-title">Analisi degli Scostamenti</div>
            <div className="panel-desc mb-0">
              Confronta due periodi (es. anno corrente vs anno precedente, o consuntivo vs budget se
              importato come periodo separato) ed evidenzia lo scostamento in valore assoluto, in
              percentuale e il relativo esito (favorevole/sfavorevole rispetto al risultato economico).
            </div>
          </div>
          <div className="flex gap-2.5 items-end flex-wrap">
            <div className="field mb-0">
              <label>Periodo di riferimento (A)</label>
              <select value={periodA.id} onChange={(e) => setAId(e.target.value)}>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field mb-0">
              <label>Periodo in analisi (B)</label>
              <select value={periodB.id} onChange={(e) => setBId(e.target.value)}>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {same ? (
          <div className="note warn mt-3">
            Seleziona due periodi diversi per calcolare gli scostamenti.
          </div>
        ) : (
          <>
            <div className="font-bold text-sm mt-4 mb-2">Scostamenti di Conto Economico</div>
            <VarianceTable
              rows={CE_VARIANCE_ROWS}
              calcA={calcs[periodA.id]}
              calcB={calcs[periodB.id]}
              labelA={periodA.label}
              labelB={periodB.label}
            />

            <div className="font-bold text-sm mt-6 mb-2">Scostamenti di Stato Patrimoniale</div>
            <VarianceTable
              rows={SP_VARIANCE_ROWS}
              calcA={calcs[periodA.id]}
              calcB={calcs[periodB.id]}
              labelA={periodA.label}
              labelB={periodB.label}
            />

            <div className="font-bold text-sm mt-6 mb-2">Scostamenti dei principali indici</div>
            <RatioVarianceTable ratiosA={ratios[periodA.id]} ratiosB={ratios[periodB.id]} />
          </>
        )}
      </div>
    </section>
  );
}
