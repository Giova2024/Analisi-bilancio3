import { useStore } from "@/lib/store";

/** Campo "Azienda" nell'intestazione (nascosto in stampa). */
export function CompanyInput() {
  const name = useStore((s) => s.companyName) || "";
  const setName = useStore((s) => s.setCompanyName);
  return (
    <label className="no-print flex items-center gap-1.5 ml-3 text-[12.5px] font-semibold text-text-2">
      Azienda:
      <input
        type="text"
        value={name}
        placeholder="Nome dell'azienda"
        maxLength={120}
        onChange={(e) => setName(e.target.value)}
        style={{
          width: 200,
          fontWeight: 600,
          fontSize: 13,
          padding: "4px 8px",
          border: "1px solid var(--border-2)",
          borderRadius: 8,
          background: "var(--panel)",
          color: "var(--text)",
        }}
      />
    </label>
  );
}

/** Nome azienda mostrato solo nell'intestazione di stampa. */
export function CompanyPrintName() {
  const name = (useStore((s) => s.companyName) || "").trim();
  return name ? <div className="text-base font-bold">{name}</div> : null;
}
