"use client";

import { useDerived } from "@/lib/useDerived";
import { buildRatioGroups, dotFor } from "@/lib/compute/ratios";
import { fmtDays, fmtEur, fmtPct, fmtRatio, fmtX } from "@/lib/numberFormat";
import type { RatioValue } from "@/lib/types";

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

export default function IndiciTab() {
  const { periods, ratios } = useDerived();

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

  const groupsByPeriod = periods.map((p) => buildRatioGroups(ratios[p.id]));
  const groupCount = groupsByPeriod[0].length;

  return (
    <section>
      <div className="panel">
        <div className="panel-title">Indici di Bilancio</div>
        <div className="panel-desc">
          Soglie colorate indicative (verde/giallo/rosso) basate su prassi generale di analisi di bilancio:
          vanno sempre contestualizzate al settore di appartenenza dell&apos;azienda.
        </div>
        <div className="mb-3 text-[12.5px] text-text-3">
          Periodi confrontati: {periods.map((p) => p.label).join(" · ")}
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
          {Array.from({ length: groupCount }).map((_, gi) => {
            const group = groupsByPeriod[0][gi];
            return (
              <div key={group.title} className="border border-border rounded-[10px] overflow-hidden">
                <div className="bg-panel-2 px-3.5 py-2.5 font-bold text-[13px] border-b border-border">
                  {group.title}
                </div>
                {group.ratios.map((_, ri) => {
                  const label = group.ratios[ri].label;
                  return (
                    <div
                      key={label}
                      className="flex items-center justify-between px-3.5 py-2 border-b border-border last:border-none gap-2"
                    >
                      <div className="text-[12.5px] text-text-2">{label}</div>
                      <div className="flex gap-3.5 items-center flex-wrap justify-end">
                        {periods.map((p, pi) => {
                          const r = groupsByPeriod[pi][gi].ratios[ri];
                          const dot = r.dot ? dotFor(r.value, r.dot, r.higherBetter ?? true) : null;
                          return (
                            <span
                              key={p.id}
                              className="font-mono font-bold text-[13px] min-w-[64px] text-right inline-flex items-center justify-end"
                            >
                              {dot && <span className={`dot dot-${dot}`} />}
                              {formatRatioValue(r)}
                            </span>
                          );
                        })}
                      </div>
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
