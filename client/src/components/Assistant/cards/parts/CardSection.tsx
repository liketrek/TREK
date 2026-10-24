import type { ReactNode } from 'react';

import { Eyebrow, Field } from '../../../Planner/bookings/bookingParts';

/**
 * The body of an answer card in the trip dialogs' look: sections under an
 * eyebrow of their own, figures as framed fields with their label over them
 * (the field every booking card is made of), and a foot bar for the card's
 * ways onward, set off by a line across the card.
 */

/** One part of a card under its eyebrow, with room for something on the right of the label. */
export function CardSection({ label, aside, children }: { label: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-3 first:mt-0">
      <div className="mb-1.5 flex min-h-4 items-center gap-2">
        <Eyebrow>{label}</Eyebrow>
        {aside && <span className="ms-auto flex items-center gap-1">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

/** A card's figures, side by side in framed fields: as many columns as figures, at most four. */
export function CardFields({ fields }: { fields: readonly { key: string; label: string; value: ReactNode }[] }) {
  if (fields.length === 0) return null;
  const columns = ['grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4'][Math.min(fields.length, 4) - 1];
  return (
    <div className={`grid gap-1.5 ${columns}`}>
      {fields.map((field) => (
        <div key={field.key} className="min-w-0" data-field={field.key}>
          <Field label={field.label} tabular>
            {field.value}
          </Field>
        </div>
      ))}
    </div>
  );
}

/** The foot of a card: its actions at the end, under a line that runs to the card's edges. */
export function CardFoot({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-3.5 -mb-3 mt-3 flex flex-wrap items-center justify-end gap-1.5 border-t border-edge-faint bg-surface-secondary px-3.5 py-2.5">
      {children}
    </div>
  );
}
