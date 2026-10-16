import { useEffect, useRef, useState } from "react";
import { TABS, type TabId } from "@/lib/tabs";

interface Props {
  activeTab: TabId;
  onTabChange: (t: TabId) => void;
}

/** Schede raccolte nel menu "Impostazioni" anziché mostrate nella barra. */
const SETTINGS: { id: TabId; label: string; icon: string }[] = [
  { id: "import", label: "Importazione", icon: "📥" },
  { id: "map", label: "Mappatura Conti", icon: "🗂️" },
];
const SET_IDS: TabId[] = SETTINGS.map((s) => s.id);

/** Etichette brevi per la barra di navigazione. */
const SHORT: Partial<Record<TabId, string>> = {
  sp: "Patrimoniale",
  ce: "Economico",
  bep: "Break Even",
  idx: "Indici",
  rf: "Rendiconto",
  scost: "Scostamenti",
  kpi: "KPI",
  rett: "Rettifiche",
  bp: "Business Plan",
  rel: "Relazione",
};

const BTN =
  "flex items-center gap-1 bg-transparent border border-transparent rounded-lg font-semibold cursor-pointer transition-colors whitespace-nowrap ";
const BTN_STYLE = { padding: "4px 7px", fontSize: 12.5 };
const ON = "bg-accent-bg text-accent-2 border-[#bfdbfe]";
const OFF = "text-text-2 hover:bg-panel-2 hover:text-text";

function SettingsMenu({ activeTab, onTabChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = SETTINGS.find((s) => s.id === activeTab);

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <button
        type="button"
        className={BTN + (active ? ON : OFF)}
        style={BTN_STYLE}
        title="Impostazioni: importazione e mappatura conti"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">⚙️</span>
        Impostazioni
        {active && <span className="font-normal">· {active.label}</span>}
        <span
          aria-hidden="true"
          style={{
            fontSize: 10,
            marginLeft: 2,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .15s",
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 60,
            minWidth: 210,
            padding: 4,
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 10px 28px rgba(15,23,42,.14)",
          }}
        >
          {SETTINGS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="menuitem"
              className={"w-full text-left " + BTN + (activeTab === s.id ? ON : OFF)}
              style={{ padding: "7px 10px", fontSize: 13 }}
              onClick={() => {
                onTabChange(s.id);
                setOpen(false);
              }}
            >
              <span aria-hidden="true">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NavBar({ activeTab, onTabChange }: Props) {
  const items: React.ReactNode[] = [];
  let menuPlaced = false;
  for (const tab of TABS) {
    if (SET_IDS.includes(tab.id)) {
      if (!menuPlaced) {
        items.push(
          <SettingsMenu key="__settings" activeTab={activeTab} onTabChange={onTabChange} />
        );
        menuPlaced = true;
      }
      continue;
    }
    items.push(
      <button
        key={tab.id}
        type="button"
        onClick={() => onTabChange(tab.id)}
        className={BTN + (activeTab === tab.id ? ON : OFF)}
        style={BTN_STYLE}
        title={tab.label}
      >
        <span aria-hidden="true">{tab.icon}</span>
        {SHORT[tab.id] || tab.label}
      </button>
    );
  }
  return (
    <nav className="flex flex-wrap no-print" style={{ gap: 1 }}>
      {items}
    </nav>
  );
}
