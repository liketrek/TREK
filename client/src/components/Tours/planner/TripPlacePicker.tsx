import { Check, MapPinned, Search, X } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDistance } from '../../../utils/units';
import { SoftPill } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import PlaceAvatar from '../../shared/PlaceAvatar';
import { NEAR_TOUR_M, type TripPlaceCandidate, type TripPlaceWaypoints } from './useTripPlaceWaypoints';

/** How a distance from the tour reads: metres up close, kilometres beyond. */
function distanceLabel(metres: number, unit: 'metric' | 'imperial'): string {
  return formatDistance(metres / 1000, unit);
}

function CandidateRow({
  candidate,
  onPick,
  unit,
}: {
  candidate: TripPlaceCandidate;
  onPick: () => void;
  unit: 'metric' | 'imperial';
}) {
  const { t } = useTranslation();
  const { place, category, distanceM, used } = candidate;
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        disabled={used}
        data-testid="trip-place-candidate"
        className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-start transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent enabled:hover:bg-surface-hover disabled:cursor-default"
      >
        <PlaceAvatar place={place} category={category} size={28} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={`min-w-0 truncate font-semibold ${used ? 'text-content-muted' : 'text-content'}`}
            style={fs(12.5, 'body')}
          >
            {place.name}
          </span>
          {category && (
            <span className="min-w-0 truncate text-content-faint" style={fs(10.5, 'body')}>
              {category.name}
            </span>
          )}
        </span>
        {used ? (
          <SoftPill icon={<Check size={10} strokeWidth={2.4} className="flex-none" />}>
            {t('tours.placePicker.inTour')}
          </SoftPill>
        ) : (
          distanceM != null && <SoftPill className="tabular-nums">{distanceLabel(distanceM, unit)}</SoftPill>
        )}
      </button>
    </li>
  );
}

function CandidateGroup({
  title,
  candidates,
  picker,
  unit,
}: {
  title: string;
  candidates: TripPlaceCandidate[];
  picker: TripPlaceWaypoints;
  unit: 'metric' | 'imperial';
}) {
  if (candidates.length === 0) return null;
  return (
    <section>
      <h4
        className="m-0 px-2 pb-1 pt-2 font-semibold uppercase tracking-[0.06em] text-content-faint"
        style={fs(9.5, 'caption')}
      >
        {title}
      </h4>
      <ul className="m-0 flex list-none flex-col gap-px p-0">
        {candidates.map((candidate) => (
          <CandidateRow
            key={candidate.place.id}
            candidate={candidate}
            unit={unit}
            onPick={() => picker.add(candidate.place)}
          />
        ))}
      </ul>
    </section>
  );
}

/**
 * PR1-10: the trip's places to make stops of the tour, unfolded under the
 * waypoints. Searchable, nearest to the tour first and in two groups (near the
 * tour, the rest of the trip); a place a point already stands for says so and
 * is not offered twice. A pick adds the stop and leaves the list open, so a
 * day's huts and lakes go in one after the other.
 */
export function TripPlacePicker({ picker, onClose }: { picker: TripPlaceWaypoints; onClose: () => void }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const [query, setQuery] = useState('');
  const searchId = useId();
  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return picker.candidates;
    return picker.candidates.filter(({ place, category }) =>
      `${place.name} ${category?.name ?? ''} ${place.address ?? ''}`.toLocaleLowerCase().includes(needle)
    );
  }, [picker.candidates, query]);
  const near = matches.filter((candidate) => candidate.distanceM != null && candidate.distanceM <= NEAR_TOUR_M);
  const further = matches.filter((candidate) => !near.includes(candidate));

  return (
    <div
      data-testid="trip-place-picker"
      className="mt-1.5 overflow-hidden rounded-[12px] bg-surface-card shadow-sm ring-1 ring-inset ring-edge-faint"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="flex items-center gap-2 border-b border-edge-faint px-2.5 py-2">
        <Search size={13} strokeWidth={2.2} className="flex-none text-content-faint" />
        <label htmlFor={searchId} className="sr-only">
          {t('tours.placePicker.search')}
        </label>
        <input
          id={searchId}
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('tours.placePicker.search')}
          className="min-w-0 flex-1 border-0 bg-transparent text-content outline-none placeholder:text-content-faint"
          style={fs(12.5, 'body')}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="grid h-6 w-6 flex-none place-items-center rounded-full text-content-faint transition-colors hover:bg-surface-hover hover:text-content"
        >
          <X size={13} strokeWidth={2.2} />
        </button>
      </div>
      <div className="max-h-[280px] overflow-y-auto overscroll-contain p-1">
        {picker.candidates.length === 0 ? (
          <p className="m-0 flex items-start gap-2 px-2 py-3 text-content-muted" style={fs(12, 'body')}>
            <MapPinned size={14} strokeWidth={2} className="mt-0.5 flex-none text-content-faint" />
            {t('tours.placePicker.empty')}
          </p>
        ) : matches.length === 0 ? (
          <p className="m-0 px-2 py-3 text-content-muted" style={fs(12, 'body')}>
            {t('tours.placePicker.noMatch')}
          </p>
        ) : (
          <>
            <CandidateGroup title={t('tours.placePicker.near')} candidates={near} picker={picker} unit={unit} />
            <CandidateGroup
              title={near.length > 0 ? t('tours.placePicker.further') : t('tours.placePicker.all')}
              candidates={further}
              picker={picker}
              unit={unit}
            />
          </>
        )}
      </div>
    </div>
  );
}
