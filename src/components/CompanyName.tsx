import { useStore } from "@/lib/store";

/** Campo "Azienda" nell'intestazione (nascosto in stampa). */
export function CompanyInput() {
  const name = useStore((s) => s.companyName) || "";
  const setName = useStore((s) => s.setCompanyName);
  return (
    <label className="no-print flex items-center gap-1.5 sm:ml-3 min-w-0 flex-1 sm:flex-none text-[12.5px] font-semibold text-text-2">
      <span className="hidden sm:inline">Azienda:</span>
      <input
        type="text"
        value={name}
        placeholder="Nome dell'azienda"
        maxLength={120}
        aria-label="Azienda"
        onChange={(e) => setName(e.target.value)}
        style={{
          width: 200,
          maxWidth: "100%",
          minWidth: 0,
          flex: "1 1 auto",
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
