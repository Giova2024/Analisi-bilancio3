"use client";

import { Fragment, useMemo, useState } from "react";
import clsx from "clsx";
import { useDerived } from "@/lib/useDerived";
import { useStore } from "@/lib/store";
import { computePeriod } from "@/lib/compute/period";
import { MANUAL_TARGETS } from "@/lib/manualTargets";
import { fmtEur as fmtEurRaw } from "@/lib/numberFormat";
import type { ManualEntry, ManualTarget, PeriodCalc, Periodo } from "@/lib/types";

interface Draft {
  desc: string;
  importo: string;
}

// Evita la visualizzazione di "-0" per saldi nulli o arrotondati a zero.
const fmtEur = (v: number) => fmtEurRaw(Math.round(v) || 0);

const SP_TARGETS = MANUAL_TARGETS.filter((t) => t.group === "sp");
const CE_TARGETS = MANUAL_TARGETS.filter((t) => t.group === "ce");

function parseImporto(raw: string): number {
  const v = parseFloat(raw.replace(",", "."));
  return isFinite(v) ? v : 0;
}

function targetTotal(calc: PeriodCalc, t: ManualTarget): number {
  const src = (t.group === "sp" ? calc.sp : calc.ce) as unknown as Record<string, { total: number }>;
  return src[t.key]?.total ?? 0;
}

// Saldi di sintesi mostrati nel pannello laterale.
const SUMMARY: { title: string; rows: { label: string; get: (c: PeriodCalc) => number; strong?: boolean; check?: boolean }[] }[] = [
  {
    title: "Stato Patrimoniale",
    rows: [
      { label: "Attivo circolante", get: (c) => c.sp.attivoCircolante.total },
      { label: "Immobilizzazioni", get: (c) => c.sp.immobilizzazioni.total },
      { label: "Totale impieghi", get: (c) => c.sp.totaleImpieghi, strong: true },
      { label: "Patrimonio netto", get: (c) => c.sp.patrimonioNetto.total },
      { label: "Passività consolidate", get: (c) => c.sp.passivitaConsolidate.total },
      { label: "Passività correnti", get: (c) => c.sp.passivitaCorrenti.total },
      { label: "Totale fonti", get: (c) => c.sp.totaleFonti, strong: true },
      { label: "Quadratura (impieghi − fonti)", get: (c) => c.sp.quadratura, check: true },
      { label: "Posizione finanziaria netta", get: (c) => c.sp.pfn },
    ],
  },
  {
    title: "Conto Economico",
    rows: [
      { label: "Valore della produzione", get: (c) => c.ce.valoreProduzione },
      { label: "Valore aggiunto", get: (c) => c.ce.valoreAggiunto },
      { label: "EBITDA", get: (c) => c.ce.ebitda, strong: true },
      { label: "EBIT", get: (c) => c.ce.ebit, strong: true },
      { label: "Risultato ante imposte", get: (c) => c.ce.ebt },
      { label: "Utile netto", get: (c) => c.ce.utileNetto, strong: true },
    ],
  },
];

function Delta({ v }: { v: number }) {
  if (Math.round(v) === 0) return <span className="text-text-3">—</span>;
  return (
    <span className={v < 0 ? "text-red" : "text-green"}>
      {v > 0 ? "+" : ""}
      {fmtEur(v)}
    </span>
  );
}

const TH = "py-1.5 px-2 text-[11px] uppercase tracking-wide text-text-3 border-b border-border-2 font-semibold";
const INPUT =
  "w-full px-2 py-1 border border-border-2 rounded-md text-[13px] focus:outline-none focus:border-accent";

function TargetRows({
  targets,
  title,
  base,
  current,
  preview,
  entries,
  drafts,
  onDraft,
  onAdd,
  onDelete,
}: {
  targets: ManualTarget[];
  title: string;
  base: PeriodCalc;
  current: PeriodCalc;
  preview: PeriodCalc;
  entries: ManualEntry[];
  drafts: Record<string, Draft>;
  onDraft: (key: string, d: Draft) => void;
  onAdd: (key: string) => void;
  onDelete: (entryId: string) => void;
}) {
  return (
    <>
      <tr>
        <td colSpan={7} className="pt-3 pb-1 px-2 text-[11.5px] font-bold text-accent-2 uppercase tracking-wide">
          {title}
        </td>
      </tr>
      {targets.map((t) => {
        const d = drafts[t.key] || { desc: "", importo: "" };
        const own = entries.filter((e) => e.target === t.key);
        const orig = targetTotal(base, t);
        const cur = targetTotal(current, t);
        const prev = targetTotal(preview, t);
        const hasDraft = parseImporto(d.importo) !== 0;
        const changed = Math.round(prev - orig) !== 0;
        return (
          <Fragment key={t.key}>
            <tr className={clsx("border-b border-border", changed && "bg-amber-bg/50")}>
              <td className="py-1 px-2 text-[13px] whitespace-normal">{t.label}</td>
              <td className="py-1 px-1 no-print">
                <input
                  type="text"
                  className={clsx(INPUT, "bg-white")}
                  placeholder="Descrizione"
                  value={d.desc}
                  onChange={(e) => onDraft(t.key, { ...d, desc: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && onAdd(t.key)}
                />
              </td>
              <td className="py-1 px-1 no-print" style={{ width: 120 }}>
                <input
                  type="number"
                  className={clsx(INPUT, "text-right font-mono", hasDraft ? "border-amber bg-amber-bg" : "bg-white")}
                  placeholder="0"
                  value={d.importo}
                  onChange={(e) => onDraft(t.key, { ...d, importo: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && onAdd(t.key)}
                />
              </td>
              <td className="py-1 px-1 no-print">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={!hasDraft}
                  title="Conferma la rettifica (Invio)"
                  onClick={() => onAdd(t.key)}
                >
                  +
                </button>
              </td>
              <td className="py-1 px-2 text-right font-mono text-[12.5px] text-text-2 whitespace-nowrap">
                {fmtEur(orig)}
              </td>
              <td className="py-1 px-2 text-right font-mono text-[12.5px] whitespace-nowrap">
                <Delta v={prev - orig} />
              </td>
              <td
                className={clsx(
                  "py-1 px-2 text-right font-mono text-[12.5px] font-semibold whitespace-nowrap",
                  hasDraft && prev !== cur && "italic text-amber"
                )}
                title={hasDraft ? "Anteprima: include l'importo non ancora confermato" : undefined}
              >
                {fmtEur(prev)}
              </td>
            </tr>
            {own.map((e) => (
              <tr key={e.id} className="border-b border-border bg-amber-bg/30">
                <td className="py-0.5 px-2 pl-6 text-[12px] text-text-2 whitespace-normal" colSpan={2}>
                  ↳ {e.desc || <span className="text-text-3">(senza descrizione)</span>}
                </td>
                <td
                  className={clsx(
                    "py-0.5 px-2 text-right font-mono text-[12px] whitespace-nowrap",
                    e.importo < 0 && "text-red"
                  )}
                >
                  {fmtEur(e.importo)}
                </td>
                <td className="py-0.5 px-1 no-print">
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    title="Elimina rettifica"
                    onClick={() => onDelete(e.id)}
                  >
                    ✕
                  </button>
                </td>
                <td colSpan={3} />
              </tr>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}

function PeriodCard({
  period,
  current,
  open,
  onToggle,
}: {
  period: Periodo;
  current: PeriodCalc;
  open: boolean;
  onToggle: () => void;
}) {
  const overrides = useStore((s) => s.overrides);
  const varFixOverrides = useStore((s) => s.varFixOverrides);
  const excludedAccounts = useStore((s) => s.excludedAccounts);
  const manualEntries = useStore((s) => s.manualEntries);
  const addManualEntry = useStore((s) => s.addManualEntry);
  const deleteManualEntry = useStore((s) => s.deleteManualEntry);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const entries = manualEntries[period.id] || [];

  // Saldi contabili senza alcuna rettifica.
  const base = useMemo(
    () => computePeriod(period, overrides, varFixOverrides, {}, excludedAccounts),
    [period, overrides, varFixOverrides, excludedAccounts]
  );

  // Anteprima: rettifiche confermate + importi in digitazione non ancora confermati.
  const draftEntries = useMemo(
    () =>
      Object.entries(drafts)
        .filter(([, d]) => parseImporto(d.importo) !== 0)
        .map(([target, d]) => ({ id: `draft_${target}`, target, desc: d.desc, importo: parseImporto(d.importo) })),
    [drafts]
  );
  const preview = useMemo(
    () =>
      draftEntries.length === 0
        ? current
        : computePeriod(
            period,
            overrides,
            varFixOverrides,
            { [period.id]: [...entries, ...draftEntries] },
            excludedAccounts
          ),
    [draftEntries, current, period, overrides, varFixOverrides, entries, excludedAccounts]
  );

  function setDraft(key: string, d: Draft) {
    setDrafts((prev) => ({ ...prev, [key]: d }));
  }

  function add(key: string) {
    const d = drafts[key];
    const value = d ? parseImporto(d.importo) : 0;
    if (value === 0) return;
    addManualEntry(period.id, { target: key, desc: d.desc.trim(), importo: value });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function addAll() {
    for (const e of draftEntries) addManualEntry(period.id, { target: e.target, desc: e.desc.trim(), importo: e.importo });
    setDrafts({});
  }

  const netTotal = entries.reduce((t, e) => t + e.importo, 0);
  const quadOk = Math.abs(preview.sp.quadratura) < 1;

  const rowProps = {
    base,
    current,
    preview,
    entries,
    drafts,
    onDraft: setDraft,
    onAdd: add,
    onDelete: (id: string) => deleteManualEntry(period.id, id),
  };

  return (
    <div className="border border-border rounded-[10px] mb-4 bg-panel-2">
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="text-text-3 text-xs w-3">{open ? "▾" : "▸"}</span>
        <span className="font-bold text-sm">{period.label}</span>
        <span className="text-[11.5px] text-text-3">
          {entries.length === 0
            ? "nessuna rettifica"
            : `${entries.length} rettific${entries.length === 1 ? "a" : "he"} · netto ${fmtEur(netTotal)} €`}
        </span>
        {draftEntries.length > 0 && (
          <span className="text-[11px] font-semibold text-amber bg-amber-bg px-2 py-0.5 rounded-full">
            {draftEntries.length} da confermare
          </span>
        )}
        <span
          className={clsx(
            "ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full",
            quadOk ? "text-green bg-green-bg" : "text-red bg-red-bg"
          )}
        >
          {quadOk ? "SP in quadratura" : `Sbilancio ${fmtEur(preview.sp.quadratura)} €`}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col lg:flex-row gap-4 items-start">
          <div className="flex-1 min-w-0 w-full overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={clsx(TH, "text-left")}>Voce</th>
                  <th className={clsx(TH, "text-left no-print")}>Descrizione</th>
                  <th className={clsx(TH, "text-right no-print")}>Rettifica €</th>
                  <th className={clsx(TH, "no-print")} />
                  <th className={clsx(TH, "text-right")}>Contabile</th>
                  <th className={clsx(TH, "text-right")}>Rettifiche</th>
                  <th className={clsx(TH, "text-right")}>Rettificato</th>
                </tr>
              </thead>
              <tbody>
                <TargetRows targets={SP_TARGETS} title="Stato Patrimoniale" {...rowProps} />
                <TargetRows targets={CE_TARGETS} title="Conto Economico" {...rowProps} />
              </tbody>
            </table>
            {draftEntries.length > 0 && (
              <div className="flex gap-2 justify-end mt-3 no-print">
                <button type="button" className="btn btn-sm" onClick={() => setDrafts({})}>
                  Annulla importi non confermati
                </button>
                <button type="button" className="btn btn-sm btn-primary" onClick={addAll}>
                  Conferma tutte ({draftEntries.length})
                </button>
              </div>
            )}
          </div>

          <aside className="w-full lg:w-[330px] shrink-0 lg:sticky lg:top-[140px] bg-panel border border-border rounded-[10px] p-3">
            <div className="font-bold text-[13px] mb-0.5">Saldi del periodo</div>
            <div className="text-[11px] text-text-3 mb-2">
              Aggiornati in tempo reale mentre digiti{draftEntries.length > 0 && " (anteprima in corsivo)"}.
            </div>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  <th className={clsx(TH, "text-left")} />
                  <th className={clsx(TH, "text-right")}>Contabile</th>
                  <th className={clsx(TH, "text-right")}>Rettificato</th>
                </tr>
              </thead>
              <tbody>
                {SUMMARY.map((g) => (
                  <Fragment key={g.title}>
                    <tr>
                      <td colSpan={3} className="pt-2.5 pb-0.5 px-1 text-[10.5px] font-bold text-accent-2 uppercase tracking-wide">
                        {g.title}
                      </td>
                    </tr>
                    {g.rows.map((r) => {
                      const o = r.get(base);
                      const p = r.get(preview);
                      const diff = Math.round(p - o) !== 0;
                      const bad = r.check && Math.abs(p) >= 1;
                      return (
                        <tr key={r.label} className="border-b border-border">
                          <td className={clsx("py-1 px-1", r.strong && "font-semibold")}>{r.label}</td>
                          <td className="py-1 px-1 text-right font-mono text-text-2 whitespace-nowrap">{fmtEur(o)}</td>
                          <td
                            className={clsx(
                              "py-1 px-1 text-right font-mono whitespace-nowrap",
                              r.strong && "font-semibold",
                              diff && "bg-amber-bg",
                              draftEntries.length > 0 && p !== r.get(current) && "italic",
                              bad && "text-red"
                            )}
                            title={diff ? `Variazione: ${p - o > 0 ? "+" : ""}${fmtEur(p - o)}` : undefined}
                          >
                            {fmtEur(p)}
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </aside>
        </div>
      )}
    </div>
  );
}

export default function RettificheTab() {
  const { periods, calcs } = useDerived();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function setAll(value: boolean) {
    setCollapsed(Object.fromEntries(periods.map((p) => [p.id, value])));
  }

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
          visibile — evidenziata in ambra — nel dettaglio della riga interessata. Mentre digiti un importo,
          i saldi a destra mostrano in anteprima l&apos;effetto; premi Invio o &quot;+&quot; per confermarlo.
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
          <>
            {periods.length > 1 && (
              <div className="flex gap-2 justify-end mb-2 no-print">
                <button type="button" className="btn btn-sm" onClick={() => setAll(false)}>
                  Espandi tutti
                </button>
                <button type="button" className="btn btn-sm" onClick={() => setAll(true)}>
                  Comprimi tutti
                </button>
              </div>
            )}
            {periods.map((p) => (
              <PeriodCard
                key={p.id}
                period={p}
                current={calcs[p.id]}
                open={!collapsed[p.id]}
                onToggle={() => setCollapsed((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
              />
            ))}
          </>
        )}
      </div>
    </section>
  );
}
