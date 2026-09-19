"use client";

import { useDerived } from "@/lib/useDerived";
import FinTable from "../FinTable";
import { spRows } from "@/lib/rows/spRows";

export default function StatoPatrimonialeTab() {
  const { periods, calcs } = useDerived();

  return (
    <section>
      <div className="panel">
        <div className="panel-title">
          Stato Patrimoniale Riclassificato — Criterio Finanziario (liquidità/esigibilità)
        </div>
        <div className="panel-desc">
          Impieghi ordinati per grado di liquidità decrescente, fonti per grado di esigibilità
          crescente. I valori in % sono calcolati sul totale impieghi/fonti di ciascun periodo.
        </div>
        {periods.length === 0 ? (
          <div className="empty-state">
            <div className="text-4xl mb-2.5">📊</div>
            Nessun periodo importato. Vai alla scheda &quot;Importazione&quot; per iniziare.
          </div>
        ) : (
          <FinTable periods={periods} calcs={calcs} rows={spRows} />
        )}
      </div>
    </section>
  );
}
