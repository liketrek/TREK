import type { TravelPlanLodgingArea } from '@trek/shared';
import { BedDouble, MapPin, Star } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../i18n';

interface TravelDraftLodgingProps {
  areas: TravelPlanLodgingArea[];
}

function distanceLabel(meters: number | null): string | null {
  if (meters === null) return null;
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

/**
 * Where to stay, not what it costs. Each card is one cluster of real lodging the
 * map provider returned near a scheduled stop; rates and availability are
 * explicitly out of scope.
 */
export default function TravelDraftLodging({ areas }: TravelDraftLodgingProps): React.ReactElement | null {
  const { t, locale } = useTranslation();
  if (areas.length === 0) return null;

  return (
    <section className="rounded-2xl border border-edge bg-surface-card p-4 shadow-sm sm:p-5">
      <header className="mb-1 flex flex-wrap items-center gap-2">
        <BedDouble size={16} className="text-content-muted" />
        <h2 className="text-sm font-semibold text-content">{t('planner.ai.lodgingTitle')}</h2>
      </header>
      <p className="text-xs text-content-muted">{t('planner.ai.lodgingEstimateNote')}</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <article key={`${area.name}-${area.lat}-${area.lng}`} className="rounded-xl border border-edge-faint p-3">
            <h3 className="text-sm font-semibold text-content">{area.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted">
              <span className="inline-flex items-center gap-1">
                <BedDouble size={11} />
                <span className="tabular-nums">{area.hotelCount}</span>
              </span>
              {area.avgRating !== null && (
                <span className="inline-flex items-center gap-1">
                  <Star size={11} />
                  {t('planner.ai.lodgingAvgRating', {
                    rating: area.avgRating.toLocaleString(locale, { maximumFractionDigits: 1 }),
                  })}
                </span>
              )}
            </div>
            {area.reason && <p className="mt-1.5 text-xs leading-relaxed text-content-muted">{area.reason}</p>}

            {area.sampleHotels.length > 0 && (
              <ul className="mt-2 space-y-1">
                {area.sampleHotels.map((hotel) => {
                  const distance = distanceLabel(hotel.distanceMeters);
                  return (
                    <li
                      key={`${hotel.place.provider}:${hotel.place.providerId}`}
                      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-content-secondary"
                    >
                      <MapPin size={11} className="shrink-0 text-content-faint" />
                      <span className="min-w-0 truncate">{hotel.place.name}</span>
                      {hotel.rating !== null && (
                        <span className="inline-flex items-center gap-0.5 text-content-muted">
                          <Star size={10} />
                          {hotel.rating.toFixed(1)}
                        </span>
                      )}
                      {distance && (
                        <span className="text-content-faint">
                          {t('planner.ai.lodgingSampleDistance', { distance })}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
