import { useState, type ReactNode } from 'react';
import './checklist.css';

/** One row of a checklist: what it is called, whether it is ticked, and what else to show beside it. */
export interface ChecklistRow {
  id: number;
  name: string;
  checked: boolean;
  aside?: ReactNode;
}

/**
 * Ticks a row off at once and keeps the tick when TREK agrees; puts it back
 * and raises the error otherwise. The ticks made here are kept by row id, over
 * the state the tool result carried.
 */
export function useChecklist(onToggle: (id: number, checked: boolean) => Promise<boolean>) {
  const [overrides, setOverrides] = useState<ReadonlyMap<number, boolean>>(new Map());
  const [failed, setFailed] = useState(false);
  const isChecked = (id: number, fromResult: boolean) => overrides.get(id) ?? fromResult;
  const toggle = async (id: number, fromResult: boolean) => {
    const next = !isChecked(id, fromResult);
    setFailed(false);
    setOverrides((previous) => new Map(previous).set(id, next));
    if (await onToggle(id, next)) return;
    setOverrides((previous) => new Map(previous).set(id, !next));
    setFailed(true);
  };
  return { isChecked, toggle, failed };
}

/** The rows as tickable buttons (role checkbox, 44px high), with the refusal above them. */
export function Checklist({
  rows,
  failed,
  errorText,
  onToggle,
}: {
  rows: ChecklistRow[];
  failed: boolean;
  errorText: string;
  onToggle: (row: ChecklistRow) => void;
}) {
  return (
    <>
      {failed ? (
        <p role="alert" className="checklist__error">
          {errorText}
        </p>
      ) : null}
      <ul className="trek-list">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={row.checked}
              className="checklist__row trek-hit"
              onClick={() => onToggle(row)}
            >
              <span className="checklist__box" aria-hidden="true" />
              <span className="checklist__name">{row.name}</span>
              {row.aside}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
