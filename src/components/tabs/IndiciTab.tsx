"use client";

import { useState } from "react";
import clsx from "clsx";
import { useDerived } from "@/lib/useDerived";
import { buildRatioGroups, dotFor, JUDGEMENT_LABEL, judgementFor } from "@/lib/compute/ratios";
import { fmtDays, fmtEur, fmtPct, fmtRatio, fmtX } from "@/lib/numberFormat";
import type { Judgement, RatioValue } from "@/lib/types";

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

const JUDGEMENT_CLASS: Record<Judgement, string> = {
  ottimo: "bg-green-bg text-green",
  buono: "bg-green-bg text-green",
  discreto: "bg-amber-bg text-amber",
  sufficiente: "bg-amber-bg text-amber",
  insufficiente: "bg-red-bg text-red",
};

export default function IndiciTab() {
  const { periods, calcs, ratios } = useDerived();
  const [showFormulas, setShowFormulas] = useState(false);
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set());

  function toggleGroup(title: string) {
    setHiddenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  if (periods.length === 0) {
    return (
      <section>
        <div className="panel">
          <div className="panel-title">Indici di Bilancio</div>
          <div className="empty-state">
            <div className="text-4xl mb-2.5">📊</div>
            Nessun periodo importato. Vai alla scheda &quot;Importazione&quot; per iniziare.
          </div>
        </div>
      </section>
    );
  }

  const groupsByPeriod = periods.map((p) => buildRatioGroups(ratios[p.id], calcs[p.id], p));
  const groupCount = groupsByPeriod[0].length;

  return (
    <section>
      <div className="panel">
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div>
            <div className="panel-title">Indici di Bilancio</div>
            <div className="panel-desc mb-0">
              Soglie colorate indicative (verde/giallo/rosso) e giudizio sintetico basati su prassi generale di
              analisi di bilancio: vanno sempre contestualizzati al settore di appartenenza dell&apos;azienda.
            </div>
          </div>
          <button type="button" className="btn btn-sm no-print" onClick={() => setShowFormulas((v) => !v)}>
            {showFormulas ? "Nascondi formule e dati" : "Mostra formule e dati"}
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap items-center mt-2.5 no-print">
          <span className="text-[11px] font-semibold text-text-3 uppercase tracking-wide mr-1">
            Categorie visibili:
          </span>
          {groupsByPeriod[0].map((group) => {
            const hidden = hiddenGroups.has(group.title);
            return (
              <button
                key={group.title}
                type="button"
                onClick={() => toggleGroup(group.title)}
                className={clsx(
                  "px-2.5 py-1 rounded-full text-[12px] font-semibold border transition-colors",
                  hidden
                    ? "border-border-2 text-text-3 bg-panel-2 line-through"
                    : "border-[#bfdbfe] bg-accent-bg text-accent-2"
                )}
              >
                {group.title}
              </button>
            );
          })}
        </div>
        {groupsByPeriod[0].every((g) => hiddenGroups.has(g.title)) && (
          <div className="empty-state mt-2.5">Tutte le categorie sono nascoste. Riattivane almeno una qui sopra.</div>
        )}
        <div className="grid gap-4 mt-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
          {Array.from({ length: groupCount }).map((_, gi) => {
            const group = groupsByPeriod[0][gi];
            if (hiddenGroups.has(group.title)) return null;
            return (
              <div key={group.title} className="border border-border rounded-[10px] overflow-hidden">
                <div className="bg-panel-2 px-3.5 py-2.5 font-bold text-[13px] border-b border-border">
                  {group.title}
                </div>
                <div className="flex items-center justify-between gap-2 px-3.5 py-1.5 border-b border-border bg-panel-2/60">
                  <div className="text-[10px] uppercase tracking-wide text-text-3 font-semibold">Indice</div>
                  <div className="flex gap-3.5 items-start flex-wrap justify-end">
                    {periods.map((p) => (
                      <span key={p.id} className="min-w-[64px] max-w-[90px] text-right">
                        <span className="block text-[12.5px] font-extrabold text-text leading-tight">
                          {p.date.slice(0, 4)}
                        </span>
                        <span className="block text-[9px] text-text-3 leading-tight truncate" title={p.label}>
                          {p.label}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
                {group.ratios.map((_, ri) => {
                  const label = group.ratios[ri].label;
                  const formula = group.ratios[ri].formula;
                  return (
                    <div
                      key={label}
                      className="px-3.5 py-2 border-b border-border last:border-none"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[12.5px] text-text-2">{label}</div>
                        <div className="flex gap-3.5 items-center flex-wrap justify-end">
                          {periods.map((p, pi) => {
                            const r = groupsByPeriod[pi][gi].ratios[ri];
                            const dot = r.dot ? dotFor(r.value, r.dot, r.higherBetter ?? true) : null;
                            const judgement = r.dot ? judgementFor(r.value, r.dot, r.higherBetter ?? true) : null;
                            return (
                              <span key={p.id} className="inline-flex flex-col items-end gap-0.5">
                                <span className="font-mono font-bold text-[13px] min-w-[64px] text-right inline-flex items-center justify-end">
                                  {dot && <span className={`dot dot-${dot}`} />}
                                  {formatRatioValue(r)}
                                </span>
                                {judgement && (
                                  <span
                                    className={clsx(
                                      "text-[9.5px] font-bold px-1.5 py-0.5 rounded-full leading-none",
                                      JUDGEMENT_CLASS[judgement]
                                    )}
                                  >
                                    {JUDGEMENT_LABEL[judgement]}
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {showFormulas && formula && (
                        <div className="mt-1.5 text-[11px] text-text-3 leading-relaxed">
                          <div>
                            <b>Formula:</b> {formula}
                          </div>
                          {periods.map((p, pi) => {
                            const r = groupsByPeriod[pi][gi].ratios[ri];
                            if (!r.detail) return null;
                            return (
                              <div key={p.id}>
                                <b>{p.label}:</b> {r.detail} = {formatRatioValue(r)}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
