import type { CollectionCardLabel, CollectionCardList, CollectionCardPlace, CollectionStatus } from '@trek/shared';
import { Star } from 'lucide-react';
import type { CSSProperties } from 'react';

import { useTranslation } from '../../../../i18n';
import { safeHexColor } from '../../../../utils/safeColor';
import { STATUS_META } from '../../../Collections/collectionStatus';
import { SoftPill, tintOf, WhiteBadge } from '../../../Planner/planParts';
import PlaceAvatar from '../../../shared/PlaceAvatar';
import { Tooltip } from '../../../shared/Tooltip';
import { useAssistantView } from '../../assistantViewContext';
import { CardFacts } from '../parts/CardFacts';
import { CardOpenButton } from '../parts/CardOpen';
import { CardRow } from '../parts/CardRows';
import { useCardPoint } from '../parts/useCardPoint';
import { avatarCategory, avatarPlace, listTarget } from './collectionCardModel';

/**
 * The pieces the collections' cards are drawn with, the way the Collections
 * page draws them: a list's colour dot and head, a saved place as a row with
 * its photo, status, labels and rating, and a label as a chip in its colour.
 * Every fact is a small pill, as on the planner's rows.
 */

/** A list's colour as a dot; the accent where the list has none. */
export function ListDot({ color, size = 10 }: { color: string | null; size?: 8 | 10 }) {
  return (
    <span
      aria-hidden="true"
      className={`flex-none rounded-full ${size === 8 ? 'h-2 w-2' : 'h-2.5 w-2.5'}`}
      style={{ background: safeHexColor(color, 'var(--accent)') }}
    />
  );
}

/** A list's dot in front of its row, where a place shows its photo. */
export function ListLead({ color }: { color: string | null }) {
  return (
    <span className="grid h-7 w-7 flex-none place-items-center">
      <ListDot color={color} />
    </span>
  );
}

/** A label as a chip in its colour; one a change adds or takes away says so. */
export function LabelChip({
  label,
  mark,
}: {
  label: Pick<CollectionCardLabel, 'name' | 'color'>;
  mark?: 'add' | 'remove';
}) {
  const dot = { '--label': safeHexColor(label.color, 'var(--accent)') } as CSSProperties;
  return (
    <span style={dot} className="inline-flex min-w-0">
      <SoftPill
        tone={mark === 'add' ? 'success' : mark === 'remove' ? 'danger' : 'neutral'}
        icon={<span aria-hidden="true" className="h-2 w-2 flex-none rounded-full bg-[var(--label)]" />}
      >
        {mark === 'add' && <span aria-hidden="true">+</span>}
        {mark === 'remove' && <span aria-hidden="true">−</span>}
        <bdi className={`truncate ${mark === 'remove' ? 'line-through' : ''}`}>{label.name}</bdi>
      </SoftPill>
    </span>
  );
}

/** The first two labels of a place as chips, the rest counted; their names in the count's tooltip. */
function LabelChips({ labels }: { labels: readonly CollectionCardLabel[] }) {
  const rest = labels.slice(2);
  return (
    <>
      {labels.slice(0, 2).map((label) => (
        <LabelChip key={label.id ?? label.name} label={label} />
      ))}
      {rest.length > 0 && (
        <Tooltip label={rest.map((label) => label.name).join(', ')} placement="top">
          <span className="rounded-full">
            <WhiteBadge>+{rest.length}</WhiteBadge>
          </span>
        </Tooltip>
      )}
    </>
  );
}

/** A status with its icon in its colour, as the Collections page shows it; a count beside it on a list head. */
export function StatusPill({ status, count }: { status: CollectionStatus; count?: number }) {
  const { t } = useTranslation();
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const icon = (
    <Icon size={10} strokeWidth={2.4} aria-hidden="true" className="flex-none" style={{ color: meta.color }} />
  );
  return (
    <SoftPill tone={status === 'visited' ? 'success' : 'neutral'} icon={icon}>
      {count !== undefined && <span className="tabular-nums">{count}</span>}
      <span>{t(meta.labelKey)}</span>
    </SoftPill>
  );
}

/** The members' average vote, to a tenth. */
export function RatingPill({ rating }: { rating: number }) {
  const { locale } = useTranslation();
  return (
    <SoftPill icon={<Star size={10} aria-hidden="true" className="flex-none fill-current text-warning" />}>
      <span className="tabular-nums">{rating.toLocaleString(locale, { maximumFractionDigits: 1 })}</span>
    </SoftPill>
  );
}

/**
 * A list's head, tinted in its colour like a planner card's head: its dot and
 * name, its size and the people sharing it, the way to open it, and where
 * the whole list was read, its places per status.
 */
export function ListHead({ list, first = true }: { list: CollectionCardList; first?: boolean }) {
  const { t } = useTranslation();
  const color = safeHexColor(list.color, 'var(--accent)');
  const counts = list.counts;
  const size = list.placeCount === null ? null : t('collections.placeCount', { count: list.placeCount });
  return (
    <div
      className={`-mx-3 -mt-2.5 px-3 pb-2 pt-2.5 ${first ? 'rounded-t-xl' : ''}`}
      style={{ background: tintOf(color) }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <ListDot color={list.color} />
        <bdi title={list.name} className="min-w-0 flex-1 truncate text-body font-semibold leading-tight text-content">
          {list.name}
        </bdi>
        {size && <WhiteBadge>{size}</WhiteBadge>}
        {list.memberCount > 0 && (
          <WhiteBadge>{t('assistant.card.collection.members', { count: list.memberCount })}</WhiteBadge>
        )}
        {list.id !== null && (
          <CardOpenButton target={listTarget(list.id)} labelKey="assistant.card.collection.openList" />
        )}
      </div>
      {counts && (
        <CardFacts>
          {(['idea', 'want', 'visited'] as const).map((status) => (
            <StatusPill key={status} status={status} count={counts[status]} />
          ))}
        </CardFacts>
      )}
    </div>
  );
}

/**
 * A saved place as a row: its photo, its name, its status at the end, and on
 * the line under it its address, labels, rating and whether the trip has it.
 * Resting on a row with a position shows it on the map; a click selects the
 * trip's own place, or moves the map to the saved one.
 */
export function SavedPlaceRow({
  place,
  labels,
  fallbackId,
}: {
  place: CollectionCardPlace;
  labels: readonly CollectionCardLabel[];
  fallbackId: number;
}) {
  const { t } = useTranslation();
  const { variant, onOpen } = useAssistantView();
  const { hover, show } = useCardPoint();
  const { lat, lng, inTripPlaceId } = place;
  const point = lat !== null && lng !== null ? { lat, lng } : null;
  const ref = `col:${place.id ?? fallbackId}`;
  const activate =
    inTripPlaceId !== null && onOpen
      ? () => onOpen({ kind: 'map', placeId: inTripPlaceId, dayId: null })
      : point
        ? () => show(point)
        : undefined;
  const onHover =
    point && variant !== 'fullscreen'
      ? (on: boolean) => hover(on ? { ref, ...point, name: place.name, placeId: inTripPlaceId ?? undefined } : null)
      : undefined;
  return (
    <CardRow
      lead={<PlaceAvatar place={avatarPlace(place, fallbackId)} size={28} category={avatarCategory(place)} />}
      title={
        <bdi title={place.name} className="block truncate">
          {place.name}
        </bdi>
      }
      aside={<StatusPill status={place.status} />}
      onActivate={activate}
      onHover={onHover}
      facts={
        <CardFacts>
          {place.address && (
            <bdi
              title={place.address}
              className="min-w-0 max-w-full truncate text-caption font-normal text-content-faint"
            >
              {place.address}
            </bdi>
          )}
          <LabelChips labels={labels} />
          {place.rating !== null && <RatingPill rating={place.rating} />}
          {inTripPlaceId !== null && <SoftPill tone="info">{t('assistant.place.inTrip')}</SoftPill>}
        </CardFacts>
      }
    />
  );
}
