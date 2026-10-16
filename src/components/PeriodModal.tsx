"use client";

import { useState } from "react";
import { guessDateFromFilename, suggestPeriodType } from "@/lib/parseFiles";
import type { PeriodType, RawAccount } from "@/lib/types";

interface Props {
  filename: string;
  accounts: RawAccount[];
  onConfirm: (input: {
    label: string;
    date: string;
    fyStart: string;
    type: PeriodType;
    filename: string;
    accounts: RawAccount[];
  }) => void;
  onCancel: () => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PeriodModal({ filename, accounts, onConfirm, onCancel }: Props) {
  const guessedDate = guessDateFromFilename(filename) || todayStr();
  const guessedYear = guessedDate.slice(0, 4);
  const [date, setDate] = useState(guessedDate);
  const [fyStart, setFyStart] = useState(`${guessedYear}-01-01`);
  const [type, setType] = useState<PeriodType>(suggestPeriodType(`${guessedYear}-01-01`, guessedDate));
  const [label, setLabel] = useState(
    `Situazione al ${guessedDate.slice(8, 10)}/${guessedDate.slice(5, 7)}/${guessedDate.slice(0, 4)}`
  );
  const [autoType, setAutoType] = useState(true);

  function updateDates(newDate: string, newFyStart: string) {
    setDate(newDate);
    setFyStart(newFyStart);
    if (autoType) setType(suggestPeriodType(newFyStart, newDate));
  }

  return (
    <div className="fixed inset-0 bg-[rgba(15,23,42,.5)] flex items-center justify-center z-[100] p-5">
      <div className="bg-panel rounded-2xl p-6 max-w-[520px] w-full max-h-[88vh] overflow-auto shadow-2xl">
        <h3 className="text-base font-bold mb-3.5">Configura periodo</h3>
        <p className="text-xs text-text-3 mb-3">
          {filename} — {accounts.length} conti importati
        </p>
        <div className="field mb-3">
          <label>Etichetta periodo</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="field">
            <label>Data di riferimento</label>
            <input type="date" value={date} onChange={(e) => updateDates(e.target.value, fyStart)} />
          </div>
          <div className="field">
            <label>Inizio esercizio</label>
            <input
              type="date"
              value={fyStart}
              onChange={(e) => updateDates(date, e.target.value)}
            />
          </div>
        </div>
        <div className="field mb-1">
          <label>Tipo periodo</label>
          <select
            value={type}
            onChange={(e) => {
              setAutoType(false);
              setType(e.target.value as PeriodType);
            }}
          >
            <option value="annuale">Annuale</option>
            <option value="infrannuale">Infrannuale</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className="btn" onClick={onCancel}>
            Annulla
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onConfirm({ label, date, fyStart, type, filename, accounts })}
          >
            Aggiungi periodo
          </button>
        </div>
      </div>
    </div>
  );
}
