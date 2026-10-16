"use client";

import { useDerived } from "@/lib/useDerived";
import { computeCashFlow } from "@/lib/compute/cashflow";
import { fmtEur } from "@/lib/numberFormat";
import clsx from "clsx";

function Row({
  label,
  value,
  kind,
}: {
  label: string;
  value: number;
  kind?: "sub" | "tot" | "grp";
}) {
  return (
    <tr
      className={clsx(
        "border-b border-border",
        kind === "tot" && "font-extrabold bg-accent-bg border-t-2 border-b-2 border-border-2",
        kind === "grp" && "font-bold bg-panel-2 border-t border-border-2"
      )}
    >
      <td className={clsx("py-1.5 px-2.5", kind === "sub" && "pl-6 text-text-2 font-normal")}>{label}</td>
      <td className={clsx("py-1.5 px-2.5 text-right font-mono tabular-nums whitespace-nowrap", value < 0 && "text-red")}>
        {fmtEur(value)}
      </td>
    </tr>
  );
}

export default function RendicontoTab() {
  const { periods, calcs } = useDerived();

  return (
    <section>
      <div className="panel">
        <div className="panel-title">Rendiconto Finanziario (metodo indiretto, semplificato)</div>
        <div className="panel-desc">
          Ricostruito per differenza tra Stati Patrimoniali comparati e dati del Conto Economico. Richiede
          almeno due periodi. Una situazione contabile non contiene il dettaglio di mastro completo (es.
          movimenti lordi di investimenti/disinvestimenti, distribuzioni di riserve), quindi è normale un
          residuo di quadratura riportato in modo esplicito.
        </div>

        {periods.length < 2 ? (
          <div className="empty-state">
            <div className="text-4xl mb-2.5">📊</div>
            Servono almeno due periodi per calcolare il rendiconto finanziario.
          </div>
        ) : (
          periods.slice(1).map((p1, i) => {
            const p0 = periods[i];
            const rf = computeCashFlow(p0, calcs[p0.id], p1, calcs[p1.id]);
            return (
              <div key={p1.id} className="mb-5">
                <div className="font-bold text-sm mb-2">
                  {p0.label} → {p1.label}
                </div>
                {!rf.sameFY && (
                  <div className="note warn mb-2.5">
                    I periodi appartengono a esercizi fiscali diversi: viene utilizzato solo l&apos;utile del
                    periodo {p1.label}. Movimenti di patrimonio netto legati alla destinazione dell&apos;utile
                    dell&apos;esercizio precedente (distribuzione dividendi, accantonamento a riserva) transitano
                    per la gestione finanziaria e possono ampliare il residuo di quadratura.
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <tbody>
                      <Row label="Utile/perdita del periodo" value={rf.utileFlusso} />
                      <Row label="+ Ammortamenti" value={calcs[p1.id].ce.ammortamenti.total} kind="sub" />
                      <Row label="− Δ rimanenze" value={-rf.dRim} kind="sub" />
                      <Row label="− Δ crediti a breve" value={-rf.dCredOp} kind="sub" />
                      <Row label="− Δ ratei/risconti attivi" value={-rf.dRateiAtt} kind="sub" />
                      <Row label="+ Δ debiti operativi a breve" value={rf.dDebOp} kind="sub" />
                      <Row label="+ Δ ratei/risconti passivi" value={rf.dRateiPass} kind="sub" />
                      <Row label="Flusso gestione operativa (A)" value={rf.flussoOperativo} kind="tot" />

                      <Row label="Investimenti netti (stima)" value={rf.flussoInvestimenti} kind="sub" />
                      <Row label="Flusso gestione investimenti (B)" value={rf.flussoInvestimenti} kind="tot" />

                      <Row label="Δ debiti finanziari" value={rf.dDebFin} kind="sub" />
                      <Row label="Δ patrimonio netto" value={rf.dPN} kind="sub" />
                      <Row label="Flusso gestione finanziaria (C)" value={rf.flussoFinanziamento} kind="tot" />

                      <Row label="VARIAZIONE DISPONIBILITÀ LIQUIDE (A+B+C)" value={rf.totale} kind="tot" />
                      <Row label="Variazione disponibilità liquide effettiva di bilancio" value={rf.deltaCassaReale} kind="grp" />
                      <Row label="Residuo di quadratura" value={rf.residuo} kind="grp" />
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
