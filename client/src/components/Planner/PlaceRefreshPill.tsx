import type { PlaceClientOrigin } from '@trek/shared';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import ToggleSwitch from '../Settings/ToggleSwitch';
import ConfirmDialog from '../shared/ConfirmDialog';
import { fs, PILL } from '../shared/DialogShell';
import { hoursLines } from './placeHours';
import type { RefreshCandidate, RefreshField } from './placeRefresh';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const LABEL: Record<RefreshField, string> = {
  description: 'places.formDescription',
  website: 'places.formWebsite',
  phone: 'places.formPhone',
  email: 'places.formEmail',
  opening_hours: 'inspector.openingHours',
};

/** A value as the list shows it: hours as one line per day, the rest as stored. */
function shown(field: RefreshField, value: string, locale: string | undefined, t: Translate): string[] {
  if (!value) return [t('places.refresh.empty')];
  if (field === 'opening_hours') return hoursLines(value, locale, t('places.hoursClosed')) ?? [value];
  return [value];
}

/**
 * A saved place's details that TREK knows better now: a pill in the head band
 * when a fresh lookup differs from what the place holds, and a list to pick
 * from. An empty field is ticked, a filled one is the person's to decide, and
 * nothing is taken over before they confirm. The form saves as usual after.
 */
export function PlaceRefreshPill({
  candidates,
  origin,
  onApply,
  locale,
  t,
}: {
  candidates: RefreshCandidate[];
  origin: PlaceClientOrigin;
  /** Sets one field in the form, with the provider as its origin. */
  onApply: (field: RefreshField, value: string, origin: PlaceClientOrigin) => void;
  locale?: string;
  t: Translate;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<ReadonlySet<RefreshField>>(new Set());
  if (candidates.length === 0) return null;

  const show = () => {
    setPicked(new Set(candidates.filter((c) => c.preselected).map((c) => c.field)));
    setOpen(true);
  };
  const toggle = (field: RefreshField) =>
    setPicked((now) => {
      const next = new Set(now);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  const apply = () => {
    for (const c of candidates) if (picked.has(c.field)) onApply(c.field, c.next, origin);
    setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={show} className={`${PILL} hover:opacity-80`}>
        <RefreshCw size={12} strokeWidth={2.2} className="text-content-faint" aria-hidden="true" />
        {t('places.refresh.pill')}
        <span
          className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 font-semibold tabular-nums text-accent-text"
          style={fs(10.5)}
        >
          {candidates.length}
        </span>
      </button>
      <ConfirmDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={apply}
        title={t('places.refresh.title')}
        message={t('places.refresh.intro')}
        confirmLabel={t('places.refresh.apply')}
        danger={false}
      >
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {candidates.map((c) => (
            <li
              key={c.field}
              className="flex items-start gap-3 rounded-[12px] border border-edge-faint bg-surface-secondary px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="m-0 font-semibold text-content" style={fs(12.5, 'body')}>
                  {t(LABEL[c.field])}
                </p>
                <div className="mt-1 grid grid-cols-2 gap-2" style={fs(11.5)}>
                  <div className="min-w-0 text-content-faint">
                    <p className="m-0 font-semibold uppercase tracking-[.06em]" style={fs(9.5)}>
                      {t('places.refresh.now')}
                    </p>
                    {shown(c.field, c.current, locale, t).map((line) => (
                      <p key={line} className={c.field === 'description' ? 'm-0 line-clamp-3' : 'm-0 truncate'}>
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="min-w-0 text-content">
                    <p className="m-0 font-semibold uppercase tracking-[.06em] text-content-faint" style={fs(9.5)}>
                      {t('places.refresh.new')}
                    </p>
                    {shown(c.field, c.next, locale, t).map((line) => (
                      <p key={line} className={c.field === 'description' ? 'm-0 line-clamp-3' : 'm-0 truncate'}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
                {!c.preselected && (
                  <p className="m-0 mt-1 text-warning" style={fs(11)}>
                    {t('places.refresh.replaces')}
                  </p>
                )}
              </div>
              <ToggleSwitch on={picked.has(c.field)} label={t(LABEL[c.field])} onToggle={() => toggle(c.field)} />
            </li>
          ))}
        </ul>
      </ConfirmDialog>
    </>
  );
}
