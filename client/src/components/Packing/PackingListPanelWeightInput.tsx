import { useState, type CSSProperties } from 'react';
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
  // What is being typed, while the field has it; null shows the stored weight,
  // so a change from elsewhere (another member) shows whenever nobody types.
  const [draft, setDraft] = useState<string | null>(null);
  // A saved weight until the store has it, so the field does not fall back to
  // the old number for the length of the request.
  const [pending, setPending] = useState<string | null>(null);
  const shown = draft ?? pending ?? stored;

  const commit = () => {
    if (draft === null) return;
    const typed = draft;
    setDraft(null);
    if (readOnly) return;
    const grams = typed.trim() === '' ? null : Math.max(0, Number.parseInt(typed, 10) || 0);
    const next = grams == null ? '' : String(grams);
    if (next === stored) return;
    setPending(next);
    void Promise.resolve(onSave(grams)).finally(() => setPending(null));
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
      value={shown}
      readOnly={readOnly}
      onFocus={() => setDraft(shown)}
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
