import { Check, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { Tooltip } from '../../shared/Tooltip';

/**
 * A panel of rows of which one is chosen, the way the collection pickers lay
 * them out: grey, rounded, scrolling once it holds more than fits.
 */
export function ChoiceList({ label, tall = false, children }: { label: string; tall?: boolean; children: ReactNode }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex flex-col gap-0.5 overflow-y-auto rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5 ${tall ? 'max-h-[300px]' : 'max-h-[220px]'}`}
    >
      {children}
    </div>
  );
}

/**
 * One row of a ChoiceList: raised and ticked once chosen. A row that cannot
 * be chosen stays in the list, dimmed with a lock, and its tooltip says why.
 */
export function ChoiceRow({
  selected,
  disabled,
  disabledHint,
  onChoose,
  testId,
  children,
}: {
  selected: boolean;
  disabled: boolean;
  disabledHint: string;
  onChoose: () => void;
  testId: string;
  children: ReactNode;
}) {
  const row = (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onChoose}
      data-testid={testId}
      className={`flex min-h-[44px] w-full min-w-0 items-center gap-3 rounded-[10px] px-3 py-2 text-start transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-50 ${selected ? 'bg-surface-card shadow-sm ring-1 ring-inset ring-edge' : 'enabled:hover:bg-surface-card'}`}
    >
      {children}
      {disabled && <Lock size={13} strokeWidth={2} className="flex-none text-content-faint" />}
      {selected && (
        <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-accent text-accent-text">
          <Check size={12} strokeWidth={2.6} />
        </span>
      )}
    </button>
  );
  return disabled ? (
    <Tooltip label={disabledHint}>
      <span className="block">{row}</span>
    </Tooltip>
  ) : (
    row
  );
}
