import {
  PLACE_CONTRIB_FIELDS,
  type PlaceContribField,
  type PlaceContribLogResponse,
  type PlaceContribLogResult,
} from '@trek/shared';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n';
import { placeContribRepo } from '../../repo/placeContribRepo';
import { PillSelect } from '../shared/dialogParts';
import { fs } from '../shared/DialogShell';
import { fieldLabel } from './placeContribModel';

const PER_PAGE = 20;
/** Rows shown before the list is opened; a busy log should not push the page down. */
const FOLDED = 5;
const RESULTS: PlaceContribLogResult[] = ['accepted', 'duplicate', 'rejected', 'withheld', 'retracted'];
const RESULT_LOOK: Record<PlaceContribLogResult, string> = {
  accepted: 'bg-success-soft text-success',
  duplicate: 'bg-surface-tertiary text-content-muted',
  rejected: 'bg-danger-soft text-danger',
  withheld: 'bg-surface-tertiary text-content-muted',
  retracted: 'bg-warning-soft text-warning',
};

/**
 * What this installation sent, newest first: the place, the field, a short
 * form of the value and what the service made of it. Read only while the fold
 * is open, a page at a time, and only the newest FOLDED rows until opened.
 */
export default function PlaceContribLog() {
  const { t, locale } = useTranslation();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PlaceContribLogResult | 'all'>('all');
  const [field, setField] = useState<PlaceContribField | 'all'>('all');
  const [data, setData] = useState<PlaceContribLogResponse | null>(null);
  const [open, setOpen] = useState(false);
  // The query that failed to load, so a new page or filter clears the message by itself.
  const query = `${page}|${result}|${field}`;
  const [failedQuery, setFailedQuery] = useState<string | null>(null);
  const failed = failedQuery === query;

  useEffect(() => {
    const controller = new AbortController();
    placeContribRepo
      .log(
        {
          page,
          perPage: PER_PAGE,
          ...(result === 'all' ? {} : { result }),
          ...(field === 'all' ? {} : { field }),
        },
        controller.signal
      )
      .then(setData, () => {
        if (!controller.signal.aborted) setFailedQuery(`${page}|${result}|${field}`);
      });
    return () => controller.abort();
  }, [page, result, field]);

  const pages = data ? Math.max(1, Math.ceil(data.total / PER_PAGE)) : 1;
  const foldable = !!data && (data.entries.length > FOLDED || pages > 1);
  const rows = data ? (open || !foldable ? data.entries : data.entries.slice(0, FOLDED)) : [];
  const day = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        <PillSelect<PlaceContribLogResult | 'all'>
          quiet
          label={t('admin.contribute.log.result')}
          value={result}
          onChange={(v) => {
            setResult(v);
            setPage(1);
          }}
          options={[
            { value: 'all', label: t('admin.contribute.log.allResults') },
            ...RESULTS.map((r) => ({ value: r, label: t(`admin.contribute.result.${r}`) })),
          ]}
        />
        <PillSelect<PlaceContribField | 'all'>
          quiet
          label={t('admin.contribute.log.field')}
          value={field}
          onChange={(v) => {
            setField(v);
            setPage(1);
          }}
          options={[
            { value: 'all', label: t('admin.contribute.log.allFields') },
            ...PLACE_CONTRIB_FIELDS.map((f) => ({ value: f, label: fieldLabel(t, f) })),
          ]}
        />
      </div>

      {failed && (
        <p className="m-0 text-danger" style={fs(12, 'body')}>
          {t('admin.contribute.log.failed')}
        </p>
      )}
      {data && data.entries.length === 0 && (
        <p className="m-0 py-3 text-center text-content-faint" style={fs(12, 'body')}>
          {t('admin.contribute.log.empty')}
        </p>
      )}
      {data && data.entries.length > 0 && (
        <ul className="m-0 list-none divide-y divide-edge-faint overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card p-0">
          {rows.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-3 py-2">
              <span className="w-12 flex-none tabular-nums text-content-faint" style={fs(11.5)}>
                {day.format(new Date(`${e.day}T12:00:00`))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-content" style={fs(12.5, 'body')}>
                  {e.placeName}
                </span>
                {e.valueSummary && (
                  <span className="block truncate text-content-muted" style={fs(11.5)}>
                    {e.valueSummary}
                  </span>
                )}
              </span>
              <span
                className="inline-flex flex-none items-center rounded-full bg-surface-secondary px-2 py-[2px] text-content-secondary"
                style={fs(11)}
              >
                {fieldLabel(t, e.field)}
              </span>
              <span
                className={`inline-flex flex-none items-center rounded-full px-2 py-[2px] font-semibold ${RESULT_LOOK[e.result]}`}
                style={fs(11)}
                title={e.reason ?? undefined}
              >
                {t(`admin.contribute.result.${e.result}`)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {foldable && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 self-start font-medium text-content-muted hover:text-content"
          style={fs(12, 'body')}
        >
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
          />
          {open ? t('common.showLess') : `${t('common.showMore')} (${(data?.total ?? 0) - FOLDED})`}
        </button>
      )}

      {data && open && pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-content-muted" style={fs(12, 'body')}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            aria-label={t('admin.contribute.log.previous')}
            className="grid h-7 w-7 place-items-center rounded-lg border border-edge-faint bg-surface-card disabled:opacity-40"
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <span className="tabular-nums">
            {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            aria-label={t('admin.contribute.log.next')}
            className="grid h-7 w-7 place-items-center rounded-lg border border-edge-faint bg-surface-card disabled:opacity-40"
          >
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
