"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { fmt0, fmtPct } from "@/lib/numberFormat";
import type { ClassifiedAccount, PeriodCalc, Periodo } from "@/lib/types";

export interface FinRow {
  id: string;
  label: string;
  kind?: "grp" | "tot" | "sub" | "hl" | "subtot" | "indent2" | "header";
  getValue?: (calc: PeriodCalc) => number;
  getBase?: (calc: PeriodCalc) => number;
  getItems?: (calc: PeriodCalc) => ClassifiedAccount[];
}

interface Props {
  periods: Periodo[];
  calcs: Record<string, PeriodCalc>;
  rows: FinRow[];
  showPct?: boolean;
}

function rowClasses(kind?: FinRow["kind"]): string {
  switch (kind) {
    case "grp":
      return "font-bold bg-panel-2 border-t border-border-2";
    case "tot":
      return "font-extrabold bg-accent-bg border-t-2 border-b-2 border-border-2";
    case "sub":
      return "text-text-2 font-normal";
    case "hl":
      return "bg-amber-bg font-bold text-[#92400e]";
    case "subtot":
      return "font-bold";
    case "indent2":
      return "text-text-3 text-[12.3px]";
    default:
      return "";
  }
}

function labelPadding(kind?: FinRow["kind"]): string {
  if (kind === "sub" || kind === "hl") return "pl-6";
  if (kind === "indent2") return "pl-9";
  return "";
}

export default function FinTable({ periods, calcs, rows, showPct = true }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const expandableRows = rows.filter((r) => r.getItems);

  // In stampa/PDF, apri temporaneamente tutti i dettagli (altrimenti le righe collassate
  // sullo schermo sparirebbero del tutto dal foglio stampato) e ripristina dopo la stampa.
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
      <div className="flex gap-2 flex-wrap mb-2 no-print">
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => setExpanded(new Set(expandableRows.map((r) => r.id)))}
        >
          ▾ Espandi tutti i dettagli
        </button>
        <button type="button" className="btn btn-sm" onClick={() => setExpanded(new Set())}>
          ▸ Nascondi tutti i dettagli
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="text-left py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">
                Voce
              </th>
              {periods.map((p) => (
                <th
                  key={p.id}
                  colSpan={showPct ? 2 : 1}
                  className="text-right py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap"
                >
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              if (row.kind === "header") {
                return (
                  <tr key={row.id}>
                    <td
                      colSpan={1 + periods.length * (showPct ? 2 : 1)}
                      className="py-2 px-2.5 font-bold text-text-2 text-[12px] uppercase tracking-wide bg-panel-2"
                    >
                      {row.label}
                    </td>
                  </tr>
                );
              }
              const isOpen = expanded.has(row.id);
              return (
                <Fragment key={row.id}>
                  <tr className={clsx("border-b border-border", rowClasses(row.kind))}>
                    <td className={clsx("py-1.5 px-2.5 whitespace-normal", labelPadding(row.kind))}>
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
                    {periods.map((p) => {
                      const calc = calcs[p.id];
                      const v = row.getValue ? row.getValue(calc) : NaN;
                      const base = row.getBase ? row.getBase(calc) : undefined;
                      const pct = base ? v / base : NaN;
                      return (
                        <Fragment key={p.id}>
                          <td
                            className={clsx(
                              "py-1.5 px-2.5 text-right whitespace-nowrap tabular-nums",
                              v < 0 && "text-red"
                            )}
                          >
                            {fmt0(v)}
                          </td>
                          {showPct && (
                            <td className="py-1.5 px-2.5 text-right whitespace-nowrap text-text-3 text-[11.5px]">
                              {isFinite(pct) ? fmtPct(pct) : "—"}
                            </td>
                          )}
                        </Fragment>
                      );
                    })}
                  </tr>
                  {row.getItems && isOpen && (
                    <tr>
                      <td colSpan={1 + periods.length * (showPct ? 2 : 1)} className="bg-panel-2 py-2.5 px-3.5">
                        <DetailTable periods={periods} calcs={calcs} row={row} />
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
  periods,
  calcs,
  row,
}: {
  periods: Periodo[];
  calcs: Record<string, PeriodCalc>;
  row: FinRow;
}) {
  if (!row.getItems) return null;
  const perPeriodItems = periods.map((p) => row.getItems!(calcs[p.id]));
  const codeMap = new Map<string, { desc: string; manual: boolean }>();
  perPeriodItems.forEach((items) => {
    items.forEach((it) => {
      if (!codeMap.has(it.conto)) codeMap.set(it.conto, { desc: it.desc, manual: !!it.manual });
    });
  });
  const codes = Array.from(codeMap.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  if (codes.length === 0) {
    return <div className="text-xs text-text-3 italic">Nessun conto sottostante per questa voce.</div>;
  }

  return (
    <table className="w-full border-collapse text-xs bg-panel">
      <thead>
        <tr>
          <th className="text-left py-1 px-2 text-[10.5px] uppercase tracking-wide text-text-3 border-b border-border-2">
            Codice
          </th>
          <th className="text-left py-1 px-2 text-[10.5px] uppercase tracking-wide text-text-3 border-b border-border-2">
            Descrizione
          </th>
          {periods.map((p) => (
            <th
              key={p.id}
              className="text-right py-1 px-2 text-[10.5px] uppercase tracking-wide text-text-3 border-b border-border-2 whitespace-nowrap"
            >
              {p.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {codes.map((code) => {
          const meta = codeMap.get(code)!;
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
              {perPeriodItems.map((items, idx) => {
                const acc = items.find((a) => a.conto === code);
                return (
                  <td
                    key={periods[idx].id}
                    className={clsx(
                      "py-1 px-2 text-right font-mono font-semibold whitespace-nowrap tabular-nums",
                      acc && acc.saldo < 0 && "text-red"
                    )}
                  >
                    {acc ? fmt0(acc.saldo) : "—"}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
