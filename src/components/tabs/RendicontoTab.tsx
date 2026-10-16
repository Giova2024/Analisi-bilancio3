"use client";

import { Fragment, useState } from "react";
import clsx from "clsx";
import { useDerived } from "@/lib/useDerived";
import { computeCashFlow } from "@/lib/compute/cashflow";
import { fmtEur } from "@/lib/numberFormat";
import type { ClassifiedAccount, PeriodCalc } from "@/lib/types";

/**
 * Gruppo di conti che confluisce in una riga del rendiconto.
 * - `bs`: segno del saldo di bilancio (1 attivo/costo, -1 passivo/ricavo)
 * - `fs`: segno dell'effetto sul flusso di cassa di una variazione positiva
 * - `only1`: considera solo il periodo finale (es. ammortamenti di un nuovo esercizio)
 * - `only0`: considera solo il periodo iniziale
 */
interface DetGroup {
  tag: string;
  get: (c: PeriodCalc) => ClassifiedAccount[];
  bs: 1 | -1;
  fs: 1 | -1;
  only1?: boolean;
  only0?: boolean;
}

interface DetRow {
  conto: string;
  desc: string;
  manual: boolean;
  tag: string;
  only1: boolean;
  fs: number;
  v0: number;
  v1: number;
  in0: boolean;
  in1: boolean;
  eff: number;
}

function detailRows(c0: PeriodCalc, c1: PeriodCalc, groups: DetGroup[]): DetRow[] {
  const rows = new Map<string, Omit<DetRow, "eff">>();
  groups.forEach((g) => {
    const a0 = g.only1 ? [] : g.get(c0);
    const a1 = g.only0 ? [] : g.get(c1);
    const tagged: [0 | 1, ClassifiedAccount][] = [
      ...a0.map((x) => [0, x] as [0, ClassifiedAccount]),
      ...a1.map((x) => [1, x] as [1, ClassifiedAccount]),
    ];
    tagged.forEach(([which, x]) => {
      const k = g.tag + "|" + x.conto;
      let r = rows.get(k);
      if (!r) {
        r = {
          conto: x.conto,
          desc: x.desc,
          manual: !!x.manual,
          tag: g.tag,
          only1: !!g.only1,
          fs: g.fs,
          v0: 0,
          v1: 0,
          in0: false,
          in1: false,
        };
        rows.set(k, r);
      }
      if (which) {
        r.v1 += g.bs * x.saldo;
        r.in1 = true;
      } else {
        r.v0 += g.bs * x.saldo;
        r.in0 = true;
      }
    });
  });
  return Array.from(rows.values())
    .map((r) => ({ ...r, eff: r.fs * (r.v1 - (r.only1 ? 0 : r.v0)) }))
    .filter((r) => Math.abs(r.eff) > 0.005 || Math.abs(r.v0) > 0.005 || Math.abs(r.v1) > 0.005)
    .sort((a, b) =>
      a.tag === b.tag
        ? a.conto.localeCompare(b.conto, undefined, { numeric: true })
        : a.tag < b.tag
          ? -1
          : 1
    );
}

const DTH =
  "py-1 px-2 text-[10.5px] uppercase tracking-wide text-text-3 border-b border-border-2 whitespace-nowrap";
const DTD = "py-1 px-2 text-right font-mono whitespace-nowrap tabular-nums";

function DetailTable({
  c0,
  c1,
  groups,
  l0,
  l1,
}: {
  c0: PeriodCalc;
  c1: PeriodCalc;
  groups: DetGroup[];
  l0: string;
  l1: string;
}) {
  const rows = detailRows(c0, c1, groups);
  const tot = rows.reduce((t, r) => t + r.eff, 0);
  const multiTag = new Set(rows.map((r) => r.tag)).size > 1;
  if (rows.length === 0) {
    return <div className="text-xs text-text-3 italic">Nessun conto sottostante per questa voce.</div>;
  }
  return (
    <table className="w-full border-collapse text-xs bg-panel">
      <thead>
        <tr>
          <th className={clsx(DTH, "text-left")}>Codice</th>
          <th className={clsx(DTH, "text-left")}>Descrizione</th>
          <th className={clsx(DTH, "text-right")}>{l0}</th>
          <th className={clsx(DTH, "text-right")}>{l1}</th>
          <th className={clsx(DTH, "text-right")} title="Contributo del conto al flusso di cassa">
            Effetto sul flusso
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.tag + r.conto} className={clsx("border-b border-border", r.manual && "bg-amber-bg")}>
            <td className="py-1 px-2 font-mono text-text-3 whitespace-nowrap">{r.conto}</td>
            <td className="py-1 px-2 text-text-2 whitespace-normal">
              {r.desc}
              {multiTag && (
                <span className="inline-block text-[9.5px] font-bold uppercase tracking-wide text-text-3 bg-panel-2 border border-border px-1.5 py-0.5 rounded-full ml-1.5 align-middle">
                  {r.tag.slice(2)}
                </span>
              )}
            </td>
            <td className={clsx(DTD, r.v0 < 0 && "text-red")}>
              {r.only1 || !r.in0 ? "—" : fmtEur(r.v0)}
            </td>
            <td className={clsx(DTD, r.v1 < 0 && "text-red")}>{r.in1 ? fmtEur(r.v1) : "—"}</td>
            <td className={clsx(DTD, "font-semibold", r.eff < 0 && "text-red")}>{fmtEur(r.eff)}</td>
          </tr>
        ))}
        <tr className="font-bold">
          <td colSpan={4} className="py-1 px-2 text-right text-text-2">
            Totale
          </td>
          <td className={clsx(DTD, tot < 0 && "text-red")}>{fmtEur(tot)}</td>
        </tr>
      </tbody>
    </table>
  );
}

interface RowDetail {
  groups: DetGroup[];
  open: boolean;
  onToggle: () => void;
  c0: PeriodCalc;
  c1: PeriodCalc;
  l0: string;
  l1: string;
}

function Row({
  label,
  value,
  kind,
  detail,
}: {
  label: string;
  value: number;
  kind?: "sub" | "tot" | "grp";
  detail?: RowDetail;
}) {
  return (
    <Fragment>
      <tr
        className={clsx(
          "border-b border-border",
          kind === "tot" && "font-extrabold bg-accent-bg border-t-2 border-b-2 border-border-2",
          kind === "grp" && "font-bold bg-panel-2 border-t border-border-2"
        )}
      >
        <td className={clsx("py-1.5 px-2.5", kind === "sub" && "pl-6 text-text-2 font-normal")}>
          {detail ? (
            <button
              type="button"
              title={detail.open ? "Nascondi i conti" : "Mostra i conti confluiti"}
              className="no-print inline-flex items-center justify-center w-4 h-4 mr-1 text-[10px] text-text-3 hover:bg-panel-2 hover:text-accent rounded"
              onClick={detail.onToggle}
            >
              {detail.open ? "▾" : "▸"}
            </button>
          ) : (
            <span className="inline-block w-[21px]" />
          )}
          {label}
        </td>
        <td className={clsx("py-1.5 px-2.5 text-right font-mono tabular-nums whitespace-nowrap", value < 0 && "text-red")}>
          {fmtEur(value)}
        </td>
      </tr>
      {detail && detail.open && (
        <tr>
          <td colSpan={2} className="bg-panel-2 py-2.5 px-3.5">
            <DetailTable c0={detail.c0} c1={detail.c1} groups={detail.groups} l0={detail.l0} l1={detail.l1} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

/** Conti di debito non finanziari (debiti totali meno quelli finanziari). */
function nonFinancial(all: ClassifiedAccount[], fin: ClassifiedAccount[]): ClassifiedAccount[] {
  const f = new Set(fin.map((x) => x.conto));
  return all.filter((x) => !f.has(x.conto));
}

const AMM: DetGroup = { tag: "1 Ammortamenti", get: (c) => c.ce.ammortamenti.items, bs: 1, fs: 1, only1: true };

const DETAILS = {
  rim: [{ tag: "x", get: (c) => c.sp.rimanenze.items, bs: 1, fs: -1 }],
  cred: [{ tag: "x", get: (c) => c.sp.creditiBreve.items, bs: 1, fs: -1 }],
  ratA: [{ tag: "x", get: (c) => c.sp.rateiRiscAttivi.items, bs: 1, fs: -1 }],
  debOp: [
    { tag: "x", get: (c) => nonFinancial(c.sp.debitiBreve.items, c.sp.debitiFinBreve.items), bs: -1, fs: 1 },
  ],
  ratP: [{ tag: "x", get: (c) => c.sp.rateiRiscPassivi.items, bs: -1, fs: 1 }],
  inv: [{ tag: "0 Immobilizzazioni", get: (c) => c.sp.immobilizzazioni.items, bs: 1, fs: -1 }],
  debFin: [{ tag: "x", get: (c) => c.sp.debitiFinTot.items, bs: -1, fs: 1 }],
  fondi: [
    { tag: "0 Fondi rischi e oneri", get: (c) => c.sp.fondiRischi.items, bs: -1, fs: 1 },
    { tag: "1 TFR", get: (c) => c.sp.tfr.items, bs: -1, fs: 1 },
  ],
  debOl: [
    { tag: "x", get: (c) => nonFinancial(c.sp.debitiOltre.items, c.sp.debitiFinOltre.items), bs: -1, fs: 1 },
  ],
  altP: [{ tag: "x", get: (c) => c.sp.altroPassivo.items, bs: -1, fs: 1 }],
  attF: [{ tag: "x", get: (c) => c.sp.attFinNonImmob.items, bs: 1, fs: -1 }],
  uPrec: [{ tag: "x", get: (c) => c.sp.risultatoPeriodo.items, bs: -1, fs: 1, only0: true }],
  pn: [{ tag: "x", get: (c) => c.sp.patrimonioNettoBase.items, bs: -1, fs: 1 }],
  liq: [{ tag: "x", get: (c) => c.sp.liqImmediate.items, bs: 1, fs: 1 }],
} satisfies Record<string, DetGroup[]>;

/** Chiavi delle righe espandibili (usate da "Mostra tutti i conti confluiti"). */
const DETAIL_KEYS = ["utile", "amm", ...Object.keys(DETAILS)];

export default function RendicontoTab() {
  const { periods, calcs } = useDerived();
  const [idA, setIdA] = useState<string | null>(null);
  const [idB, setIdB] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const foundA = periods.findIndex((p) => p.id === idA);
  const foundB = periods.findIndex((p) => p.id === idB);
  const ia = foundA >= 0 ? foundA : periods.length - 2;
  const ib = foundB >= 0 ? foundB : periods.length - 1;
  const valid = periods.length >= 2 && ia >= 0 && ia < ib;
  const pairs = valid ? [[periods[ia], periods[ib]] as const] : [];

  function toggle(k: string) {
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  }
  function setAllOpen(v: boolean) {
    setOpen(v ? new Set(pairs.flatMap(([, p]) => DETAIL_KEYS.map((k) => p.id + ":" + k))) : new Set());
  }

  return (
    <section>
      <div className="panel">
        <div className="panel-title">Rendiconto Finanziario (metodo indiretto, semplificato)</div>
        <div className="panel-desc">
          Ricostruito per differenza tra Stati Patrimoniali comparati e dati del Conto Economico. Richiede
          almeno due periodi. Tutte le voci patrimoniali sono considerate, quindi il rendiconto quadra con
          la variazione di cassa; un eventuale residuo deriva solo da sbilanci tra attivo e passivo nelle
          situazioni importate. Gli investimenti sono esposti al netto dei disinvestimenti (una situazione
          contabile non contiene i movimenti lordi).
        </div>

        {periods.length < 2 ? (
          <div className="empty-state">
            <div className="text-4xl mb-2.5">📊</div>
            Servono almeno due periodi per calcolare il rendiconto finanziario.
          </div>
        ) : (
          <>
            <div className="flex gap-2.5 items-end flex-wrap mb-3.5 no-print">
              <div className="field mb-0">
                <label>Esercizio iniziale</label>
                <select value={periods[ia]?.id ?? ""} onChange={(e) => setIdA(e.target.value)}>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pb-2 text-text-3 font-bold">→</div>
              <div className="field mb-0">
                <label>Esercizio finale</label>
                <select value={periods[ib]?.id ?? ""} onChange={(e) => setIdB(e.target.value)}>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!valid && (
              <div className="note warn mb-2.5">
                {ia === ib
                  ? "Seleziona due esercizi diversi per calcolare il rendiconto finanziario."
                  : "L'esercizio iniziale deve essere precedente a quello finale: inverti la selezione."}
              </div>
            )}
            {pairs.map(([p0, p1], idx) => {
              const c0 = calcs[p0.id];
              const c1 = calcs[p1.id];
              const rf = computeCashFlow(p0, c0, p1, c1);
              const det = (key: string, groups: DetGroup[]): RowDetail => ({
                groups,
                open: open.has(p1.id + ":" + key),
                onToggle: () => toggle(p1.id + ":" + key),
                c0,
                c1,
                l0: p0.label,
                l1: p1.label,
              });
              return (
                <div key={p1.id} className="mb-5">
                  {idx === 0 && (
                    <div className="flex gap-2 flex-wrap mb-3 no-print">
                      <button type="button" className="btn btn-sm" onClick={() => setAllOpen(true)}>
                        ▾ Mostra tutti i conti confluiti
                      </button>
                      <button type="button" className="btn btn-sm" onClick={() => setAllOpen(false)}>
                        ▸ Nascondi tutti i dettagli
                      </button>
                    </div>
                  )}
                  <div className="font-bold text-sm mb-2">
                    {p0.label} → {p1.label}
                  </div>
                  {!rf.sameFY && (
                    <div className="note warn mb-2.5">
                      I periodi appartengono a esercizi fiscali diversi: viene utilizzato solo l&apos;utile del
                      periodo {p1.label}. Il risultato dell&apos;esercizio precedente, destinato a riserva o
                      distribuito, è stornato nella gestione finanziaria: in questo modo la variazione di
                      patrimonio netto riflette solo i movimenti monetari (apporti di capitale, dividendi).
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[13px]">
                      <tbody>
                        <Row
                          label="Utile/perdita del periodo"
                          value={rf.utileFlusso}
                          detail={det("utile", [
                            { tag: "x", get: (c) => c.sp.risultatoPeriodo.items, bs: -1, fs: 1, only1: !rf.sameFY },
                          ])}
                        />
                        <Row
                          label="+ Ammortamenti"
                          value={rf.amm}
                          kind="sub"
                          detail={det("amm", [{ ...AMM, only1: !rf.sameFY }])}
                        />
                        <Row label="− Δ rimanenze" value={-rf.dRim} kind="sub" detail={det("rim", DETAILS.rim)} />
                        <Row label="− Δ crediti a breve" value={-rf.dCredOp} kind="sub" detail={det("cred", DETAILS.cred)} />
                        <Row
                          label="− Δ ratei/risconti attivi"
                          value={-rf.dRateiAtt}
                          kind="sub"
                          detail={det("ratA", DETAILS.ratA)}
                        />
                        <Row
                          label="+ Δ debiti operativi a breve"
                          value={rf.dDebOp}
                          kind="sub"
                          detail={det("debOp", DETAILS.debOp)}
                        />
                        <Row
                          label="+ Δ ratei/risconti passivi"
                          value={rf.dRateiPass}
                          kind="sub"
                          detail={det("ratP", DETAILS.ratP)}
                        />
                        <Row
                          label="+ Δ fondi rischi e TFR"
                          value={rf.dFondi}
                          kind="sub"
                          detail={det("fondi", DETAILS.fondi)}
                        />
                        {Math.abs(rf.dDebOpOltre) > 0.005 && (
                          <Row
                            label="+ Δ debiti operativi oltre 12 mesi"
                            value={rf.dDebOpOltre}
                            kind="sub"
                            detail={det("debOl", DETAILS.debOl)}
                          />
                        )}
                        {Math.abs(rf.dAltroPass) > 0.005 && (
                          <Row
                            label="+ Δ altre passività"
                            value={rf.dAltroPass}
                            kind="sub"
                            detail={det("altP", DETAILS.altP)}
                          />
                        )}
                        <Row label="Flusso gestione operativa (A)" value={rf.flussoOperativo} kind="tot" />

                        <Row
                          label="Investimenti netti in immobilizzazioni (stima)"
                          value={-(rf.dImmob + rf.amm)}
                          kind="sub"
                          detail={det("inv", [...DETAILS.inv, { ...AMM, fs: -1, only1: !rf.sameFY }])}
                        />
                        {Math.abs(rf.dAttFin) > 0.005 && (
                          <Row
                            label="− Δ attività finanziarie non immobilizzate"
                            value={-rf.dAttFin}
                            kind="sub"
                            detail={det("attF", DETAILS.attF)}
                          />
                        )}
                        <Row label="Flusso gestione investimenti (B)" value={rf.flussoInvestimenti} kind="tot" />

                        <Row label="Δ debiti finanziari" value={rf.dDebFin} kind="sub" detail={det("debFin", DETAILS.debFin)} />
                        <Row label="Δ patrimonio netto" value={rf.dPN} kind="sub" detail={det("pn", DETAILS.pn)} />
                        {!rf.sameFY && Math.abs(rf.utilePrec) > 0.005 && (
                          <Row
                            label="− Utile/perdita dell'esercizio precedente (destinato a PN o distribuito)"
                            value={-rf.utilePrec}
                            kind="sub"
                            detail={det("uPrec", DETAILS.uPrec)}
                          />
                        )}
                        <Row label="Flusso gestione finanziaria (C)" value={rf.flussoFinanziamento} kind="tot" />

                        <Row label="VARIAZIONE DISPONIBILITÀ LIQUIDE (A+B+C)" value={rf.totale} kind="tot" />
                        <Row
                          label="Variazione disponibilità liquide effettiva di bilancio"
                          value={rf.deltaCassaReale}
                          kind="grp"
                          detail={det("liq", DETAILS.liq)}
                        />
                        <Row label="Residuo di quadratura" value={rf.residuo} kind="grp" />
                      </tbody>
                    </table>
                  </div>
                  {Math.abs(rf.residuo) > 0.5 ? (
                    <div className="note warn mt-2.5">
                      Il residuo deriva da uno sbilancio tra attivo e passivo nelle situazioni importate:{" "}
                      <b>
                        {p0.label}: {fmtEur(rf.quad0)}
                      </b>{" "}
                      ·{" "}
                      <b>
                        {p1.label}: {fmtEur(rf.quad1)}
                      </b>
                      . Controlla in Impostazioni › Importazione il badge &quot;Sbilancio&quot; e, nella
                      Mappatura Conti, i conti esclusi o non classificati in Stato Patrimoniale / Conto
                      Economico.
                    </div>
                  ) : (
                    <div className="note mt-2.5">
                      ✓ Il rendiconto quadra con la variazione effettiva delle disponibilità liquide.
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}
