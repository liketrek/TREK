import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from '../../i18n';
import { formatDate } from '../../pages/journeyDetail/JourneyDetailPage.helpers';
import type { JourneyEntry } from '../../store/journeyStore';
import { formatLocationName } from '../../utils/formatters';
import type { JourneyMapAutoHandle as JourneyMapHandle } from './JourneyMapAuto';
import JourneyMap from './JourneyMapAuto';

export function MapView({
  entries,
  mapEntries,
  sortedDates,
  activeLocationId,
  fullMapRef,
  onLocationClick,
}: {
  entries: JourneyEntry[];
  mapEntries: JourneyEntry[];
  sortedDates: string[];
  activeLocationId: string | null;
  fullMapRef: React.RefObject<JourneyMapHandle | null>;
  onLocationClick: (id: string) => void;
}) {
  const { t, locale } = useTranslation();
  // group map entries by date
  const byDate = new Map<string, { entry: JourneyEntry; globalIdx: number }[]>();
  mapEntries.forEach((e, i) => {
    const d = e.entry_date;
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push({ entry: e, globalIdx: i });
  });
  const dates = [...byDate.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const mapItems = useMemo(
    () =>
      mapEntries.map((e) => ({
        id: String(e.id),
        lat: e.location_lat!,
        lng: e.location_lng!,
        title: e.title || '',
        mood: e.mood,
        entry_date: e.entry_date,
      })),
    [mapEntries]
  );

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <JourneyMap
        ref={fullMapRef}
        checkins={[]}
        entries={mapItems as any}
        height={560}
        activeMarkerId={activeLocationId}
        onMarkerClick={onLocationClick}
      />

      {/* Locations list */}
      <div>
        {/* Stats header */}
        {mapEntries.length > 0 && (
          <div className="mx-5 mb-2 mt-4 grid grid-cols-3 gap-2">
            {[
              { value: mapEntries.length, label: t('journey.stats.places') },
              { value: dates.length, label: t('journey.stats.days') },
              { value: entries.filter((e) => e.type === 'entry').length, label: 'Stories' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-800">
                <div className="text-[17px] font-bold tracking-tight text-zinc-900 dark:text-white">{s.value}</div>
                <div className="text-[9px] font-medium uppercase tracking-[0.06em] text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Day groups */}
        <div className="px-5 pb-5">
          {dates.map((date, dayIdx) => {
            const items = byDate.get(date)!;
            const fd = formatDate(date, locale);

            return (
              <div key={date}>
                {/* Day separator */}
                <div className="flex items-center gap-2.5 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                    {t('journey.detail.day', { number: dayIdx + 1 })}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-400">
                    {fd.month} {fd.day}
                  </span>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                </div>

                {/* Location items */}
                {items.map(({ entry: e, globalIdx }, itemIdx) => {
                  const isActive = activeLocationId === String(e.id);
                  const showConnector = itemIdx < items.length - 1;

                  return (
                    <div key={e.id}>
                      <button
                        type="button"
                        onClick={() => onLocationClick(String(e.id))}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-[14px] p-3 text-left transition-all ${
                          isActive
                            ? 'translate-x-0.5 border border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800'
                            : 'border border-zinc-200 bg-white hover:translate-x-0.5 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500'
                        }`}
                      >
                        {/* Number badge */}
                        <div
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-white text-[13px] font-bold dark:border-zinc-900 ${
                            isActive
                              ? 'bg-zinc-900 text-white shadow-[0_0_0_2px_rgba(0,0,0,0.15)] dark:bg-white dark:text-zinc-900'
                              : 'bg-zinc-900 text-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:bg-white dark:text-zinc-900'
                          }`}
                        >
                          {globalIdx + 1}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex items-center gap-1.5">
                            <span className="truncate text-[14px] font-semibold text-zinc-900 dark:text-white">
                              {e.title || e.location_name}
                            </span>
                          </div>
                          <div className="truncate text-[11px] text-zinc-500">
                            {formatLocationName(e.location_name)}
                            {e.entry_time ? ` · ${e.entry_time}` : ''}
                          </div>
                        </div>

                        {/* Chevron */}
                        <ChevronRight
                          size={14}
                          className={`flex-shrink-0 ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-300 dark:text-zinc-600'}`}
                        />
                      </button>

                      {/* Connector line */}
                      {showConnector && (
                        <div className="ml-[18px] h-2 w-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
