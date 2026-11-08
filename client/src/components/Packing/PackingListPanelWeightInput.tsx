import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { NumericInput } from '../shared/NumericInput';

interface Props {
  value: number | null | undefined;
  onSave: (grams: number | null) => void | Promise<void>;
  readOnly?: boolean;
  width: number;
}

/**
 * The weight of a packing item, in grams. It keeps what is typed in a draft of
 * its own and saves once, on blur or Enter, the way the quantity does: saving
 * every keystroke let a slow reply put the stored value back under the cursor,
 * so the next digit went onto the old number and a fragment was saved.
 */
export function WeightInput({ value, onSave, readOnly, width }: Props) {
  const stored = value == null ? '' : String(value);
  const [draft, setDraft] = useState(stored);
  const editing = useRef(false);
  // A change from elsewhere (another member, the server's answer) shows only
  // while the field is not being typed in.
  useEffect(() => {
    if (!editing.current) setDraft(stored);
  }, [stored]);

  const commit = () => {
    editing.current = false;
    if (readOnly) return;
    const grams = draft.trim() === '' ? null : Math.max(0, Number.parseInt(draft, 10) || 0);
    const next = grams == null ? '' : String(grams);
    setDraft(next);
    if (next !== stored) void onSave(grams);
  };

  const style: CSSProperties = {
    width,
    border: 'none',
    fontSize: 'calc(12px * var(--fs-scale-body, 1))',
    textAlign: 'end',
    fontFamily: 'inherit',
    outline: 'none',
    color: 'var(--text-secondary)',
    background: 'transparent',
    padding: 0,
  };

  return (
    <NumericInput
      value={draft}
      readOnly={readOnly}
      onFocus={() => {
        editing.current = true;
      }}
      onValueChange={setDraft}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      placeholder="—"
      style={style}
    />
  );
}
