import { cheapestEnergy, type ChargingEnergyPrice, type ChargingInfo as Info } from '@trek/shared';
import { ChevronDown, Coins, PlugZap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/TranslationContext';
import { chargingRepo } from '../../repo/chargingRepo';
import { useTripStore } from '../../store/tripStore';
import { isEffectivelyOffline } from '../../sync/networkMode';
import { Tooltip } from '../shared/Tooltip';

/**
 * Which station the panel is asking about, one way or the other.
 *
 * A stop on the trip is named by its `places` row. A station found along the route has
 * no row yet, and the availability and the price are exactly what somebody wants before
 * deciding to add it, so that one is named by where it is instead. The two are mutually
 * exclusive: the optional `undefined` members are what stop a caller passing both and
 * leaving it to the component to guess which it meant.
 */
type ChargingTarget =
  | { placeId: number; lat?: undefined; lng?: undefined; name?: undefined }
  | { placeId?: undefined; lat: number; lng: number; name: string };

/**
 * A charger's two compact badges: the free points of all its points, when that is known
 * and fresh, and its cheapest energy price. The live badge on the rail draws them, and so
 * does the assistant's card of one look at the charger, which never asks again.
 */
export function ChargingBadges({
  label,
  known,
  fresh = true,
  available,
  total,
  energy,
}: {
  /** What the availability badge says when it is pointed at. */
  label: string;
  known: boolean;
  /** False for a count checked a while ago: still shown, but no longer green. */
  fresh?: boolean;
  available: number | null;
  total: number | null;
  energy: ChargingEnergyPrice | null;
}) {
  const { t } = useTranslation();
  const price = (value: number, currency: string) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap align-middle text-[length:calc(10px*var(--fs-scale-caption,1))] font-medium leading-none">
      <Tooltip label={label}>
        <span
          className={`inline-flex items-center gap-1 rounded px-1 py-0.5 ${known && fresh && available! > 0 ? 'bg-success-soft text-success' : 'bg-surface-secondary text-content-muted'}`}
        >
          <PlugZap size={10} />
          {known ? `${available}/${total}` : '?'}
        </span>
      </Tooltip>
      {energy && (
        <Tooltip label={t('roadtrip.charging.note')}>
          <span className="inline-flex items-center gap-1 rounded bg-surface-secondary px-1 py-0.5 text-content-muted">
            <Coins size={10} />
            {price(energy.price, energy.currency)}/kWh*
          </span>
        </Tooltip>
      )}
    </span>
  );
}

export default function ChargingInfo({
  placeId,
  lat,
  lng,
  name,
  compact = false,
}: ChargingTarget & { compact?: boolean }) {
  const tripId = useTripStore((s) => s.trip?.id);
  const { t } = useTranslation();
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setInfo(null);
    setLoading(true);
    const refresh = async () => {
      if (!tripId || document.hidden) return;
      try {
        const value =
          placeId != null
            ? await chargingRepo.read(tripId, placeId)
            : await chargingRepo.readAt(tripId, lat!, lng!, name!);
        if (active) setInfo(value);
      } catch {
        if (active) setInfo(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    const offline = () => {
      setInfo(null);
      setLoading(false);
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60000);
    window.addEventListener('offline', offline);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('offline', offline);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
    // The identity of the station, whichever way it was given: a changed coordinate is a
    // different charger and has to re-ask, exactly as a changed place id does.
  }, [tripId, placeId, lat, lng, name]);
  const known =
    !isEffectivelyOffline() &&
    info?.available != null &&
    !info.stale &&
    Date.now() - Date.parse(info.checkedAt) < 120000;
  const status = loading
    ? t('common.loading')
    : known
      ? `${info.available}/${info.total} ${t('roadtrip.charging.available')}`
      : t(info?.stale ? 'roadtrip.charging.stale' : 'roadtrip.charging.unknown');
  const components =
    info?.tariffs.flatMap((tariff) =>
      tariff.components.map((component) => ({ ...component, currency: tariff.currency }))
    ) ?? [];
  // The same price the assistant's card shows: tax included, no condition, one currency.
  const cheapest = info ? cheapestEnergy(info.tariffs) : null;
  const price = (value: number, currency: string) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  const label = `${status}${info?.updatedAt ? ` (${new Date(info.updatedAt).toLocaleString()})` : ''}`;
  if (compact)
    return (
      <ChargingBadges
        label={label}
        known={known}
        available={info?.available ?? null}
        total={info?.total ?? null}
        energy={cheapest}
      />
    );
  return (
    <details className="group rounded-[10px] bg-surface-hover text-[length:calc(12px*var(--fs-scale-body,1))] text-content-secondary">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <PlugZap size={13} className="shrink-0 text-content-faint" />
        <span className="font-medium">{t('roadtrip.poi.charging')}</span>
        <span className="ms-2 text-content-muted">{status}</span>
        {cheapest && (
          <span className="ms-auto whitespace-nowrap font-medium">{price(cheapest.price, cheapest.currency)}/kWh*</span>
        )}
        <ChevronDown
          size={13}
          className={'shrink-0 text-content-faint group-open:rotate-180 ' + (cheapest ? '' : 'ms-auto')}
        />
      </summary>
      <div className="space-y-2 px-3 pb-3 text-content-muted">
        {info?.station && <p>{info.station}</p>}
        <div className="space-y-1">
          <p className="font-medium">{t('roadtrip.charging.prices')}</p>
          {!components.length && (
            <p className="text-content-muted">
              {info?.pricesUnavailable ? `${t('common.error')}: ` : ''}
              {t('roadtrip.charging.unknown')}
            </p>
          )}
          {components.map((component, index) => (
            <p key={index}>
              {price(component.price, component.currency)}
              {component.kind === 'ENERGY'
                ? '/kWh'
                : ['TIME', 'PARKING_TIME'].includes(component.kind)
                  ? '/h'
                  : ''}{' '}
              {component.kind === 'FLAT' ? 'Σ' : ''}
              {component.conditional || !component.taxIncluded ? '*' : ''}
              {component.afterSeconds != null && component.afterSeconds > 0
                ? ` (> ${Math.round(component.afterSeconds / 60)} min)`
                : ''}
            </p>
          ))}
          {!!components.length && <p className="text-content-muted">* {t('roadtrip.charging.note')}</p>}
        </div>
        <p className="text-content-muted">{t('roadtrip.charging.coverage')}</p>
        {info?.source && (
          <p className="text-content-muted">
            <a
              className="underline"
              href={
                info.sourceUrl?.startsWith('https://')
                  ? info.sourceUrl
                  : 'https://mobidata-bw.de/de/dataset/e-ladesaulen'
              }
              target="_blank"
              rel="noreferrer"
            >
              {info.source}
            </a>{' '}
            ·{' '}
            <a
              className="underline"
              href="https://mobidata-bw.de/de/dataset/e-ladesaulen"
              target="_blank"
              rel="noreferrer"
            >
              MobiData BW
            </a>
            <br />
            {info.license}
            {info.updatedAt && ` · ${new Date(info.updatedAt).toLocaleString()}`}
          </p>
        )}
      </div>
    </details>
  );
}
