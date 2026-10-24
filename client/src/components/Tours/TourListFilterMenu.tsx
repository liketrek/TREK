import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import { fs } from '../shared/DialogShell';
import { InfoDot } from './tourParts';
import { ORIGIN_LABEL_KEY, statusLabel } from './tourPresentation';
import type { TourListFilters } from './useTourListFilters';

function MenuRow({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-center gap-2 rounded-[9px] px-2 py-1.5 text-start transition-colors ${active ? 'bg-surface-tertiary' : 'hover:bg-surface-hover'}`}
      style={fs(12.5, 'body')}
    >
      <span className="min-w-0 flex-1 truncate text-content">{label}</span>
      <span className="font-geist tabular-nums text-content-faint" style={fs(11)}>
        {count}
      </span>
      <span className="grid w-3.5 flex-none place-items-center">
        {active && <Check size={13} strokeWidth={2.4} className="text-content-muted" />}
      </span>
    </button>
  );
}

function MenuSection({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-col gap-px border-t border-edge-faint pt-1.5 first:border-t-0 first:pt-0"
    >
      <div className="flex items-center gap-1 px-2 pb-0.5">
        <span className="font-semibold uppercase tracking-[.06em] text-content-faint" style={fs(9.5)}>
          {label}
        </span>
        {hint && <InfoDot label={label} description={hint} />}
      </div>
      {children}
    </div>
  );
}

/**
 * The filter of a tour list (PR1-13): one button that says what is set, and a
 * menu with the day status and, where the list varies in them, the source,
 * the stored routing limit and the tour type, each with how many tours it
 * keeps. Choosing a set value again clears it.
 */
export default function TourListFilterMenu({ filters }: { filters: TourListFilters }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { facets, selection, statusCounts } = filters;

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t('places.filterShow')}
        className="flex h-8 w-full min-w-0 items-center gap-1.5 rounded-[10px] bg-surface-card px-2.5 font-semibold text-content-secondary shadow-sm transition-colors hover:text-content"
        style={fs(12, 'body')}
      >
        <span className="min-w-0 truncate text-start">{statusLabel(filters.status, t)}</span>
        <span className="font-geist tabular-nums text-content-faint" style={fs(10.5)}>
          {filters.filtered.length}
        </span>
        {filters.activeFacets > 0 && (
          <span
            className="rounded-full bg-accent px-1.5 font-geist font-semibold leading-[16px] text-accent-text"
            style={fs(10)}
          >
            +{filters.activeFacets}
          </span>
        )}
        <ChevronDown
          size={13}
          strokeWidth={2.2}
          className={`ms-auto flex-none text-content-faint transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          role="group"
          aria-label={t('places.filterShow')}
          className="trek-popover-enter absolute start-0 top-full z-50 mt-1.5 flex max-h-[min(420px,60vh)] w-full min-w-[200px] flex-col gap-1.5 overflow-y-auto rounded-[12px] border border-edge-secondary bg-surface-card p-1.5 shadow-popover"
        >
          <MenuSection label={t('tours.filter.status')}>
            {(['all', 'unplanned', 'planned'] as const).map((status) => (
              <MenuRow
                key={status}
                active={filters.status === status}
                label={statusLabel(status, t)}
                count={statusCounts[status]}
                onClick={() => filters.setStatus(status)}
              />
            ))}
          </MenuSection>
          {facets.origin.length > 0 && (
            <MenuSection label={t('tours.filter.source')}>
              {facets.origin.map((option) => (
                <MenuRow
                  key={option.value}
                  active={selection.origin === option.value}
                  label={t(ORIGIN_LABEL_KEY[option.value])}
                  count={option.count}
                  onClick={() => filters.select('origin', option.value)}
                />
              ))}
            </MenuSection>
          )}
          {facets.grade.length > 0 && (
            <MenuSection label={t('tours.filter.grade')} hint={t('tours.filter.gradeHint')}>
              {facets.grade.map((option) => (
                <MenuRow
                  key={option.value}
                  active={selection.grade === option.value}
                  label={`T${option.value}`}
                  count={option.count}
                  onClick={() => filters.select('grade', option.value)}
                />
              ))}
            </MenuSection>
          )}
          {facets.type.length > 0 && (
            <MenuSection label={t('tours.filter.type')}>
              {facets.type.map((option) => (
                <MenuRow
                  key={option.value}
                  active={selection.type === option.value}
                  label={t(`tourTypes.${option.value}`)}
                  count={option.count}
                  onClick={() => filters.select('type', option.value)}
                />
              ))}
            </MenuSection>
          )}
        </div>
      )}
    </div>
  );
}

/** What a list says when its filters leave nothing: so, and a way to clear them. */
export function TourFilterEmpty({ filters }: { filters: TourListFilters }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="mx-1.5 mt-2 flex flex-col items-center gap-2 rounded-[12px] bg-surface-card px-4 py-5 text-center shadow-sm ring-1 ring-inset ring-edge-faint"
    >
      <p className="m-0 text-content-muted" style={fs(12.5, 'body')}>
        {t('tours.filter.empty')}
      </p>
      <button
        type="button"
        onClick={filters.reset}
        className="rounded-full bg-surface-secondary px-3 py-1 font-semibold text-content-secondary transition-colors hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        style={fs(11.5, 'body')}
      >
        {t('tours.filter.reset')}
      </button>
    </div>
  );
}
