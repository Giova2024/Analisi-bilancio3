"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDerived } from "@/lib/useDerived";
import { useStore } from "@/lib/store";
import {
  autoCompare,
  buildReport,
  downloadDoc,
  printHtml,
  slug,
  wrapDoc,
} from "@/lib/report/buildReport";
import "@/lib/report/doc.css";
import "./RelazioneTab.css";

/** Foglio modificabile: salva nello store (con debounce) il contenuto HTML della relazione. */
function Editor({
  html,
  version,
  edRef,
}: {
  html: string;
  version: number;
  edRef: React.RefObject<HTMLDivElement | null>;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Il contenuto viene reimpostato solo a ogni nuova generazione (version), non a ogni salvataggio,
  // altrimenti il cursore salterebbe mentre si scrive.
  useEffect(() => {
    if (edRef.current) edRef.current.innerHTML = html || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  function save() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const st = useStore.getState();
    if (!edRef.current || !st.report) return;
    const v = edRef.current.innerHTML;
    if (v !== st.report.html)
      st.setReport({ ...st.report, html: v, edited: true, editedAt: new Date().toISOString() });
  }

  useEffect(
    () => () => {
      if (timer.current) save();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div
      ref={edRef}
      className="rel-paper rel-doc"
      contentEditable
      suppressContentEditableWarning
      spellCheck
      onInput={() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(save, 500);
      }}
      onBlur={save}
    />
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field mb-0">
      <label>{label}</label>
      {children}
    </div>
  );
}

export default function RelazioneTab() {
  const { periods, calcs, ratios } = useDerived();
  const company = useStore((s) => s.companyName) || "";
  const setCompany = useStore((s) => s.setCompanyName);
  const report = useStore((s) => s.report);
  const setReport = useStore((s) => s.setReport);
  const [refId, setRefId] = useState(report?.refId || "");
  const [cmpId, setCmpId] = useState(report?.cmpId || "auto");
  const [author, setAuthor] = useState(report?.author || "");
  const [place, setPlace] = useState(report?.place || "");
  const [version, setVersion] = useState(0);
  const edRef = useRef<HTMLDivElement>(null);

  const ref = periods.find((p) => p.id === refId) || periods[periods.length - 1] || null;
  const earlier = ref
    ? periods.filter((p) => p.id !== ref.id && new Date(p.date) < new Date(ref.date))
    : [];
  const cmp = !ref
    ? null
    : cmpId === "none"
      ? null
      : cmpId === "auto"
        ? autoCompare(ref, periods)
        : earlier.find((p) => p.id === cmpId) || autoCompare(ref, periods);

  // Mantiene aggiornato il nome azienda nel testo già generato (campi data-field="company").
  useEffect(() => {
    const el = edRef.current;
    if (!el) return;
    const txt = company.trim() || "[Nome azienda]";
    let changed = false;
    el.querySelectorAll('[data-field="company"]').forEach((n) => {
      if (n.textContent !== txt) {
        n.textContent = txt;
        changed = true;
      }
    });
    if (changed) {
      const st = useStore.getState();
      if (st.report) st.setReport({ ...st.report, html: el.innerHTML });
    }
  }, [company, version, !!report]);

  if (periods.length === 0 || !ref) {
    return (
      <section>
        <div className="panel">
          <div className="panel-title">Relazione</div>
          <div className="empty-state">
            <div className="text-4xl mb-2.5">📝</div>
            Nessun periodo importato. Vai a &quot;Impostazioni › Importazione&quot; per iniziare.
          </div>
        </div>
      </section>
    );
  }

  function generate() {
    const st = useStore.getState();
    if (
      st.report &&
      st.report.edited &&
      !window.confirm("La relazione attuale contiene modifiche manuali che andranno perse. Rigenerare il testo?")
    )
      return;
    const html = buildReport({
      company: company.trim(),
      author: author.trim(),
      place: place.trim(),
      ref: ref!,
      cmp,
      calcs,
      ratios,
      periods,
    });
    setReport({
      html,
      refId: ref!.id,
      cmpId,
      author,
      place,
      generatedAt: new Date().toISOString(),
      edited: false,
    });
    setVersion((v) => v + 1);
  }

  const currentHtml = () => (edRef.current ? edRef.current.innerHTML : report?.html || "");
  const baseName = () => "Relazione_" + (slug(company) || "azienda") + "_" + (slug(ref.label) || "periodo");
  const title = () => "Relazione di bilancio" + (company.trim() ? " - " + company.trim() : "");
  const cmd = (command: string, value?: string) => (e: React.MouseEvent) => {
    // onMouseDown + preventDefault: il pulsante non sottrae la selezione all'editor.
    e.preventDefault();
    edRef.current?.focus();
    document.execCommand(command, false, value);
    edRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const tbBtn = (label: ReactNode, command: string, value: string | undefined, tip: string) => (
    <button type="button" className="btn btn-sm" title={tip} onMouseDown={cmd(command, value)}>
      {label}
    </button>
  );
  const stale = report && report.refId !== ref.id;

  return (
    <section>
      <div className="panel no-print">
        <div className="panel-title">Relazione sull&apos;analisi di bilancio</div>
        <div className="panel-desc">
          Genera automaticamente una relazione descrittiva a partire dai dati e dagli indici calcolati. Il
          testo è modificabile direttamente nel riquadro sottostante, viene salvato nel browser (e nel file
          JSON) ed è esportabile in Word, HTML o PDF.
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(200px, 100%), 1fr))" }}>
          <Field label="Nome azienda">
            <input
              type="text"
              value={company}
              placeholder="Es. Rossi S.r.l."
              onChange={(e) => setCompany(e.target.value)}
            />
          </Field>
          <Field label="Periodo di riferimento">
            <select value={ref.id} onChange={(e) => setRefId(e.target.value)}>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Periodo di confronto">
            <select value={cmpId} onChange={(e) => setCmpId(e.target.value)}>
              <option value="auto">Automatico{cmpId === "auto" && cmp ? " (" + cmp.label + ")" : ""}</option>
              <option value="none">Nessun confronto</option>
              {earlier.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Redattore">
            <input
              type="text"
              value={author}
              placeholder="Nome del redattore"
              onChange={(e) => setAuthor(e.target.value)}
            />
          </Field>
          <Field label="Luogo">
            <input type="text" value={place} placeholder="Es. Milano" onChange={(e) => setPlace(e.target.value)} />
          </Field>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap mt-3.5">
          <button
            type="button"
            className="btn"
            style={{ background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}
            onClick={generate}
          >
            {report ? "↻ Rigenera relazione" : "⚙ Genera relazione"}
          </button>
          {report && (
            <span className="text-[12px] text-text-3">
              Generata il{" "}
              {new Date(report.generatedAt).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })}
              {report.edited ? " · modificata manualmente" : ""}
              {stale ? " · riferita a un altro periodo: rigenera per aggiornarla" : ""}
            </span>
          )}
          {!company.trim() && (
            <span className="text-[12px]" style={{ color: "#92400e" }}>
              Suggerimento: inserisci il nome dell&apos;azienda.
            </span>
          )}
        </div>
      </div>

      {report && (
        <div className="panel">
          <div className="rel-tb no-print">
            {tbBtn(<b>G</b>, "bold", undefined, "Grassetto (Ctrl+B)")}
            {tbBtn(<i>C</i>, "italic", undefined, "Corsivo (Ctrl+I)")}
            {tbBtn(<u>S</u>, "underline", undefined, "Sottolineato (Ctrl+U)")}
            <span className="sep" />
            {tbBtn("Titolo", "formatBlock", "<h2>", "Titolo di sezione")}
            {tbBtn("Sottotitolo", "formatBlock", "<h3>", "Sottotitolo")}
            {tbBtn("Paragrafo", "formatBlock", "<p>", "Testo normale")}
            {tbBtn("• Elenco", "insertUnorderedList", undefined, "Elenco puntato")}
            {tbBtn("1. Elenco", "insertOrderedList", undefined, "Elenco numerato")}
            <span className="sep" />
            {tbBtn("↶", "undo", undefined, "Annulla (Ctrl+Z)")}
            {tbBtn("↷", "redo", undefined, "Ripeti (Ctrl+Y)")}
            <span style={{ flex: 1 }} />
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => downloadDoc(baseName() + ".doc", wrapDoc(currentHtml(), title(), true), "application/msword")}
            >
              ⬇ Word
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => downloadDoc(baseName() + ".html", wrapDoc(currentHtml(), title(), false), "text/html")}
            >
              ⬇ HTML
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => printHtml(wrapDoc(currentHtml(), title(), false))}
            >
              🖶 Stampa / PDF
            </button>
          </div>
          <Editor html={report.html} version={version} edRef={edRef} />
        </div>
      )}
    </section>
  );
}
