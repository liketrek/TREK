import type { TravelPlanDraftDay, TravelPlanLeg } from '@trek/shared';
import { Banknote, Clock, MapPin, Navigation, Route } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../i18n';
import type { Translate } from './aiPlanModel';
import { dayNavigationUrl, placeNavigationUrl, type DraftTravelMode } from './draftNavigation';

interface TravelDraftTimelineProps {
  days: TravelPlanDraftDay[];
  /** Drive or walk, shared with the map legend so both surfaces agree. */
  navMode: DraftTravelMode;
}

function formatDay(date: string, locale: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(locale, { month: 'short', day: 'numeric', weekday: 'short', timeZone: 'UTC' });
}

/** A CNY range as the one string the timeline shows; both ends in the traveller's locale. */
function formatCny(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value);
}

/** Each mode spelled as `t()` literals, so the key scan can see every one of them. */
function travelModeLabel(mode: TravelPlanLeg['mode'], t: Translate): string {
  switch (mode) {
    case 'walk':
      return t('planner.ai.travelMode.walk');
    case 'public_transit':
      return t('planner.ai.travelMode.public_transit');
    case 'drive':
      return t('planner.ai.travelMode.drive');
    case 'train':
      return t('planner.ai.travelMode.train');
    case 'flight':
      return t('planner.ai.travelMode.flight');
    case 'other':
      return t('planner.ai.travelMode.other');
  }
}

/** Day-by-day proposal: times, places, the leg from the previous stop and its price. */
export default function TravelDraftTimeline({ days, navMode }: TravelDraftTimelineProps): React.ReactElement {
  const { t, locale } = useTranslation();

  return (
    <div className="space-y-4">
      {days.map((day, dayIndex) => {
        const navigationUrl = dayNavigationUrl(day.items, navMode);
        return (
          <section key={day.date} className="rounded-2xl border border-edge bg-surface-card p-4 shadow-sm sm:p-5">
            <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-edge-faint pb-3">
              <h3 className="text-sm font-semibold text-content">
                {t('planner.dayN', { n: dayIndex + 1 })}
                <span className="ms-2 font-normal text-content-muted">{formatDay(day.date, locale)}</span>
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-content-muted">{t('planner.placeN', { n: day.items.length })}</span>
                {navigationUrl && (
                  <a
                    href={navigationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-edge px-2 py-1 text-xs font-medium text-content-secondary transition hover:bg-surface-hover hover:text-content"
                  >
                    <Navigation size={11} />
                    {t('planner.ai.navigate')}
                  </a>
                )}
              </div>
            </header>

            {day.items.length === 0 ? (
              <p className="py-2 text-sm text-content-muted">{t('planner.ai.emptyDay')}</p>
            ) : (
              <ol className="space-y-5">
                {day.items.map((item, itemIndex) => (
                  <li key={`${day.date}-${itemIndex}`} className="relative ps-6">
                    <span
                      aria-hidden
                      className="absolute start-0 top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-accent-subtle"
                    />
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-content">{item.place.name}</span>
                      {item.arriveAt && (
                        <span className="inline-flex items-center gap-1 text-xs text-content-muted">
                          <Clock size={12} />
                          {item.leaveAt ? `${item.arriveAt}–${item.leaveAt}` : item.arriveAt}
                        </span>
                      )}
                    </div>

                    {item.activity && <p className="mt-1 text-sm text-content-secondary">{item.activity}</p>}

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-muted">
                      {item.travelFromPrevious && (
                        <span className="inline-flex items-center gap-1">
                          <Route size={12} />
                          {travelModeLabel(item.travelFromPrevious.mode, t)}
                          <span>·</span>
                          {t('dawarich.duration.minutes', { minutes: item.travelFromPrevious.minutes })}
                          {item.travelFromPrevious.distanceMeters !== null && (
                            <>
                              <span>·</span>
                              {(item.travelFromPrevious.distanceMeters / 1000).toFixed(1)} km
                            </>
                          )}
                        </span>
                      )}
                      {item.estimatedCostCny && (
                        <span className="inline-flex items-center gap-1">
                          <Banknote size={12} />
                          {formatCny(item.estimatedCostCny.min, locale)}–{formatCny(item.estimatedCostCny.max, locale)}
                        </span>
                      )}
                      <span
                        className="inline-flex items-center gap-1 text-content-faint"
                        title={`${item.source.provider} · ${item.source.checkedAt}`}
                      >
                        <MapPin size={12} />
                        {item.place.provider}
                      </span>
                      {typeof item.place.rating === 'number' && (
                        <span className="inline-flex items-center gap-1 text-content-muted">
                          ★ {item.place.rating.toFixed(1)}
                        </span>
                      )}
                      {(item.place.hours?.length ?? 0) > 0 && (
                        <span
                          className="inline-flex max-w-[14rem] items-center gap-1 truncate text-content-faint"
                          title={item.place.hours.join('；')}
                        >
                          <Clock size={12} />
                          {item.place.hours[0]}
                        </span>
                      )}
                      <a
                        href={placeNavigationUrl(item.place, navMode)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-content-secondary transition hover:text-content"
                      >
                        <Navigation size={12} />
                        {t('planner.ai.navigateTo')}
                      </a>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}
