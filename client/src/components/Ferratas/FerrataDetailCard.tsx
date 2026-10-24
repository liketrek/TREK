import { Check, ExternalLink, MapPinPlus, MoveHorizontal, Route, X } from 'lucide-react';

import type { Ferrata } from '@trek/shared';

import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { formatDistance } from '../../utils/units';
import { MAP_CARD_GLASS } from '../Map/mapControlShadow';
import { SoftPill } from '../Planner/planParts';
import { fs } from '../shared/DialogShell';
import { type FerrataGroup, ferrataLabel } from './ferrataGroups';
import { ferrataOsmUrl } from './ferrataModel';

/**
 * One via ferrata, picked on the map: its name, the route it belongs to, its
 * grade range and total length as badges, and the way back to the source.
 * `segment` is the OSM way that was clicked, which the source link opens.
 * OpenStreetMap's data is ODbL, which asks for the attribution next to
 * anything shown from it, so the card carries it rather than relying on the
 * map's own corner.
 */
export default function FerrataDetailCard({
  group,
  segment,
  onClose,
  onAdopt,
  onTour = false,
  width,
}: {
  group: FerrataGroup;
  segment: Ferrata;
  onClose?: () => void;
  /** Puts the ferrata onto the tour being planned; absent where the tour cannot be edited. */
  onAdopt?: (group: FerrataGroup) => void;
  /** The tour on the map already climbs this ferrata: the card says so instead of offering it again. */
  onTour?: boolean;
  /** Set when the card stands on another control and takes its width. */
  width?: number;
}) {
  const { t } = useTranslation();
  const unit = useSettingsStore((s) => s.settings.distance_unit);
  const label = ferrataLabel(group, t);
  const name = label.name;
  // The route line only adds something when it is not already the title.
  const route = group.routeName && group.routeName !== name ? group.routeName : null;
  // Without any grade the badge says so, rather than leaving a gap.
  const grade = label.grade ?? t('ferratas.unknownGrade');

  return (
    <article
      className={`rounded-2xl p-3 text-content ${width ? '' : 'w-max min-w-[min(18rem,calc(100vw_-_2rem))] max-w-[22.5rem]'}`}
      style={{ ...MAP_CARD_GLASS, width }}
      data-testid="ferrata-detail-card"
    >
      <div className="flex items-start gap-2">
        <Route size={16} className="mt-0.5 flex-none text-content-muted" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 break-words font-semibold" style={fs(14, 'body')} title={name}>
            {name}
          </h3>
          {route && <p className="truncate text-caption text-content-muted">{route}</p>}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="flex-none rounded-lg p-1 text-content-muted hover:bg-surface-hover hover:text-content"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <SoftPill>{grade}</SoftPill>
        {group.lengthM > 0 && (
          <SoftPill icon={<MoveHorizontal size={11} aria-hidden="true" />}>
            {formatDistance(group.lengthM / 1000, unit ?? 'metric')}
          </SoftPill>
        )}
      </div>
      {onTour ? (
        <div className="mt-3 flex" data-testid="ferrata-on-tour">
          <SoftPill tone="success" icon={<Check size={11} strokeWidth={2.4} className="flex-none" />}>
            {t('ferratas.onTour')}
          </SoftPill>
        </div>
      ) : (
        onAdopt && (
          <button
            type="button"
            onClick={() => onAdopt(group)}
            data-testid="ferrata-adopt"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-accent px-3 py-1.5 font-semibold text-accent-text shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            style={fs(12, 'body')}
          >
            <MapPinPlus size={13} strokeWidth={2.2} aria-hidden="true" />
            {t('ferratas.adopt')}
          </button>
        )
      )}
      <a
        href={ferrataOsmUrl(segment)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 font-medium text-content hover:underline"
        style={fs(12, 'body')}
      >
        {t('ferratas.viewInOsm')}
        <ExternalLink size={13} aria-hidden="true" />
      </a>
      <p className="mt-2 border-t border-edge-faint pt-2 text-content-faint" style={fs(9)}>
        {t('ferratas.attribution')}
      </p>
    </article>
  );
}
