import { AlertTriangle, Expand, RefreshCw, WifiOff } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { formatDistance } from '../../../utils/units';
import { TOUR_POI_LOOKS } from '../../Map/poiCategories';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { TourNotice } from '../tourParts';
import type { TourPoiSearch } from './useTourPoiSearch';

type Unit = Parameters<typeof formatDistance>[1];

const km = (metres: number) => metres / 1000;

/** Seconds as a clock, 0:17 or 1:05. */
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * PLN-05: the search sent again from the notice that says why. While the wait
 * the server named runs it counts down instead, and says what it waits for.
 */
function RetryButton({ search }: { search: TourPoiSearch }) {
  const { t } = useTranslation();
  const waiting = search.retryInS > 0;
  const loading = search.status === 'loading';
  const held = waiting || loading;
  const button = (
    <button
      type="button"
      onClick={() => {
        if (!held) void search.search();
      }}
      aria-disabled={held || undefined}
      data-testid="tour-poi-retry"
      className={`inline-flex flex-none items-center gap-1 rounded-full px-1.5 font-semibold tabular-nums text-current ${held ? 'cursor-default opacity-60' : 'hover:bg-surface-hover'}`}
      style={fs(11.5, 'body')}
    >
      <RefreshCw size={12} strokeWidth={2.2} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
      {waiting ? t('tours.poi.retryIn', { time: clock(search.retryInS) }) : t('tours.poi.retry')}
    </button>
  );
  return waiting ? (
    <Tooltip label={t('tours.poi.retryHint')} placement="top">
      {button}
    </Tooltip>
  ) : (
    button
  );
}

/** The search sent again with the next wider corridor, while there is one. */
function WidenButton({ search, unit }: { search: TourPoiSearch; unit: Unit }) {
  const { t } = useTranslation();
  const wider = search.widerCorridorM;
  if (wider === null) return null;
  return (
    <button
      type="button"
      onClick={search.widen}
      disabled={!search.canSearch}
      data-testid="tour-poi-widen"
      className="inline-flex items-center gap-1 rounded-full border border-edge bg-surface-card px-2 py-0.5 font-medium text-content hover:bg-surface-hover disabled:cursor-default disabled:opacity-50"
      style={fs(11.5, 'body')}
    >
      <Expand size={11} strokeWidth={2.2} aria-hidden="true" />
      {t('tours.poi.widen', { distance: formatDistance(km(wider), unit) })}
    </button>
  );
}

/** A warning of the search, with the way to send it again where that may help. */
function WarningNotice({ text, search }: { text: string; search?: TourPoiSearch }) {
  return (
    <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
      {search ? (
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span>{text}</span>
          <RetryButton search={search} />
        </span>
      ) : (
        text
      )}
    </TourNotice>
  );
}

/**
 * What the search answered beyond its places: offline, failed, kinds that
 * could not be searched, partly searched, cut, or empty. That the answer is
 * out of date the search button says, as it is what to press then. Nothing
 * found is said only when every kind was searched along the whole line, with
 * the next wider corridor one press away, as it is when no e-bike charger
 * was found among other places; a failure or a gap carries its own retry.
 */
export function SearchNotices({ search, unit }: { search: TourPoiSearch; unit: Unit }) {
  const { t } = useTranslation();
  const { status, answer } = search;
  if (status === 'offline')
    return <TourNotice icon={<WifiOff size={13} strokeWidth={2} />}>{t('tours.poi.offline')}</TourNotice>;
  if (status === 'error') return <WarningNotice text={t('tours.poi.failed')} search={search} />;
  if (!answer) return null;
  const unavailable = answer.unavailable.map((category) => t(TOUR_POI_LOOKS[category].labelKey)).join(', ');
  const notes = [
    { text: unavailable && t('tours.poi.unavailable', { kinds: unavailable }), retry: true },
    { text: answer.partial && t('tours.poi.partial'), retry: !unavailable },
    { text: answer.capped && t('tours.poi.capped'), retry: false },
    { text: answer.truncated && t('tours.poi.truncated'), retry: false },
  ].filter((note): note is { text: string; retry: boolean } => !!note.text);
  // A gap wants a retry, not a wider corridor, and changed choices were not searched yet.
  const searchedAll = answer.unavailable.length === 0 && !answer.partial && !search.outdated;
  const empty = answer.pois.length === 0 && searchedAll;
  // BIK-07: few chargers are tagged for bikes, so none found is said, not left to look like a fault.
  // A cut answer may have lost them to the cut, which its own note already says.
  const noChargers =
    searchedAll &&
    !answer.truncated &&
    !answer.capped &&
    search.categories.includes('ebike_charging') &&
    !answer.pois.some((poi) => poi.category === 'ebike_charging');
  return (
    <>
      {notes.map((note) => (
        <WarningNotice key={note.text} text={note.text} search={note.retry ? search : undefined} />
      ))}
      {empty && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <p className="m-0 text-content-muted" style={fs(12, 'body')}>
            {t('tours.poi.empty', { distance: formatDistance(km(search.corridorM), unit) })}
          </p>
          <WidenButton search={search} unit={unit} />
        </div>
      )}
      {noChargers && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5" data-testid="tour-poi-charging-few">
          <p className="m-0 text-content-muted" style={fs(12, 'body')}>
            {t('tours.poi.charging.fewMapped')}
          </p>
          {/* Nothing at all found offers the wider corridor above already. */}
          {!empty && <WidenButton search={search} unit={unit} />}
        </div>
      )}
    </>
  );
}
