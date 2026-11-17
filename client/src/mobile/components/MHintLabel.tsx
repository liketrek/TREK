import { Info } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface MHintLabelProps {
  label: ReactNode;
  /** The explanation. It waits behind the mark until tapped; a screen reader reads it after the label all the same. */
  hint?: ReactNode;
  labelClassName?: string;
}

/**
 * A setting's label with its explanation behind a small mark, the phone's form
 * of the desktop HintMark: the row stays one line, a tap on the mark opens the
 * sentence under the label and a second tap folds it again.
 */
export default function MHintLabel({
  label,
  hint,
  labelClassName = 'text-[length:calc(13px*var(--fs-scale-body,1))] font-bold text-m-ink',
}: MHintLabelProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-w-0">
      {/* The mark rides at the end of the label's last line, also when a long label wraps. */}
      <div className={labelClassName}>
        {label}
        {hint && (
          // Touch only: the sentence below is in the page for a screen reader already.
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            data-testid="m-hint-mark"
            onClick={() => setOpen((value) => !value)}
            className={`-my-[6px] ms-[2px] inline-flex h-[24px] w-[24px] items-center justify-center rounded-full align-middle ${
              open ? 'text-m-ink' : 'text-m-faint'
            }`}
          >
            <Info size={13} strokeWidth={2.1} />
          </button>
        )}
      </div>
      {hint && (
        <div
          className={
            open
              ? 'mt-[3px] font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] leading-relaxed text-m-muted'
              : 'sr-only'
          }
        >
          {hint}
        </div>
      )}
    </div>
  );
}
