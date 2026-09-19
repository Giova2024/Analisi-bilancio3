"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { useDerived } from "@/lib/useDerived";
import { useStore } from "@/lib/store";
import { CLS_OPTIONS, clsOptionValue, matchKey } from "@/lib/clsOptions";
import type { ClassifiedAccount, Override } from "@/lib/types";

export default function MappaturaTab() {
  const { periods, calcs } = useDerived();
  const setOverride = useStore((s) => s.setOverride);
  const [search, setSearch] = useState("");
  const [onlyUnmatched, setOnlyUnmatched] = useState(false);

  const rows = useMemo(() => {
    const map = new Map<string, ClassifiedAccount>();
    for (const p of periods) {
      for (const a of calcs[p.id].accounts) {
        if (a.manual) continue;
        if (!map.has(a.conto)) map.set(a.conto, a);
      }
    }
    let list = Array.from(map.values());
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) => a.conto.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
    }
    if (onlyUnmatched) list = list.filter((a) => !a.cls.matched);
    list.sort((a, b) => {
      if (a.cls.matched !== b.cls.matched) return a.cls.matched ? 1 : -1;
      return a.conto.localeCompare(b.conto, undefined, { numeric: true });
    });
    return list;
  }, [periods, calcs, search, onlyUnmatched]);

  return (
    <section>
      <div className="panel">
        <div className="panel-title">Mappatura Conti</div>
        <div className="panel-desc">
          Elenco di tutti i conti importati con la relativa classificazione di bilancio. I conti non
          riconosciuti automaticamente sono evidenziati: assegna manualmente una categoria, la scelta verrà
          ricordata per le prossime importazioni.
        </div>
        <div className="flex gap-2.5 flex-wrap items-center mb-2.5">
          <input
            type="text"
            placeholder="Cerca per codice o descrizione…"
            className="max-w-[260px] px-2.5 py-1.5 border border-border-2 rounded-lg text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="flex items-center gap-1.5 font-normal text-[12.5px]">
            <input
              type="checkbox"
              className="w-auto"
              checked={onlyUnmatched}
              onChange={(e) => setOnlyUnmatched(e.target.checked)}
            />
            Mostra solo non riconosciuti
          </label>
        </div>

        {periods.length === 0 ? (
          <div className="empty-state">
            <div className="text-4xl mb-2.5">📊</div>
            Nessun periodo importato. Vai alla scheda &quot;Importazione&quot; per iniziare.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">Codice</th>
                  <th className="text-left py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border">Descrizione</th>
                  <th className="text-left py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">Stato</th>
                  <th className="text-left py-2 px-2.5 text-[11.5px] uppercase tracking-wide text-text-3 border-b-2 border-border whitespace-nowrap">Classificazione</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const statusText = !a.cls.matched
                    ? "⚠ non riconosciuto"
                    : a.cls.manual
                      ? "✏️ manuale"
                      : "✓ automatica";
                  const selected = CLS_OPTIONS.find((o) => matchKey(o, a.cls));
                  return (
                    <tr key={a.conto} className={clsx("border-b border-border", !a.cls.matched && "bg-red-bg")}>
                      <td className="py-1.5 px-2.5 font-mono whitespace-nowrap">{a.conto}</td>
                      <td className="py-1.5 px-2.5 whitespace-normal">{a.desc}</td>
                      <td className="py-1.5 px-2.5 whitespace-nowrap">{statusText}</td>
                      <td className="py-1.5 px-2.5 whitespace-nowrap">
                        <select
                          className="text-xs px-1.5 py-1 rounded-md border border-border-2"
                          value={selected ? clsOptionValue(selected) : ""}
                          onChange={(e) => {
                            const [s, l1, l2, n] = e.target.value.split("|");
                            const value: Override = [s as Override[0], l1, Number(l2), Number(n)];
                            setOverride(a.conto, value);
                          }}
                        >
                          <option value="" disabled>
                            Seleziona…
                          </option>
                          {CLS_OPTIONS.map((o) => (
                            <option key={clsOptionValue(o)} value={clsOptionValue(o)}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
