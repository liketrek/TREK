import type {
  CollectionCardDelta,
  CollectionCardLabel,
  CollectionCardList,
  CollectionCardPlace,
  CollectionListsCard,
  CollectionPlacesCard,
} from '@trek/shared';
import { Bookmark, Info, Tag } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '../../../../i18n';
import { STATUS_META } from '../../../Collections/collectionStatus';
import { type PillTone, SoftPill, WhiteBadge } from '../../../Planner/planParts';
import PlaceAvatar from '../../../shared/PlaceAvatar';
import type { ChangeItem } from '../../assistantParts';
import { verbLookOf } from '../cardLooks';
import { ChangeMark, FactChange } from '../parts/CardFacts';
import KindTile from '../parts/KindTile';
import { avatarCategory, avatarPlace, labelsById, MAX_FACTS } from './collectionCardModel';
import { LabelChip, ListDot, RatingPill, StatusPill } from './collectionCardParts';

/**
 * The collections inside a change card: the saved place in front, with the
 * tile of what happens on its corner (an overlapping stack for several), and
 * on the faint line what the change does in small pills (its list, the
 * status from and to, labels added or taken away, a vote, the fields it
 * touches, a move), with warnings where a place is saved or in the trip
 * already. An applied change says what it did instead: saved, a duplicate,
 * how many went in.
 */

type T = (key: string, params?: Record<string, string | number>) => string;

const COPY_TOOL = 'copy_collection_places_to_trip';

/** The fields a change touches, each by the label the other change cards name it with. */
const FIELD_LOOK: Record<CollectionCardDelta['fields'][number], { labelKey: string }> = {
  name: { labelKey: 'assistant.change.label.name' },
  address: { labelKey: 'assistant.change.label.address' },
  coordinates: { labelKey: 'assistant.change.label.coordinates' },
  description: { labelKey: 'assistant.change.label.description' },
  notes: { labelKey: 'assistant.change.label.notes' },
  category: { labelKey: 'assistant.change.label.category' },
  link: { labelKey: 'assistant.change.label.link' },
  photo: { labelKey: 'assistant.card.collection.photo' },
};

/** The verb's tile, as the row shows it without a place. */
function VerbTile({ item, size }: { item: ChangeItem; size: 'xs' | 'sm' }) {
  const look = item.preview ? verbLookOf(item.preview.verbKey) : null;
  return <KindTile icon={look?.Icon ?? null} tone={look?.tone ?? 'info'} size={size} />;
}

export function CollectionPlaceLead({ card, item }: { card: CollectionPlacesCard; item: ChangeItem }) {
  const [single] = card.places;
  if (!single) return <VerbTile item={item} size="sm" />;
  if (card.places.length === 1) {
    return (
      <span className="relative flex-none">
        <PlaceAvatar place={avatarPlace(single, -1)} size={28} category={avatarCategory(single)} />
        <span className="absolute -bottom-0.5 -end-0.5 flex">
          <VerbTile item={item} size="xs" />
        </span>
      </span>
    );
  }
  const stacked = card.places.slice(0, 4);
  const extra = card.places.length - stacked.length + card.more;
  return (
    <span className="flex flex-none items-center">
      {stacked.map((place, index) => (
        <span key={place.id ?? `new-${index}`} className={index === 0 ? 'flex' : '-ms-1.5 flex'}>
          <PlaceAvatar place={avatarPlace(place, -(index + 1))} size={20} category={avatarCategory(place)} />
        </span>
      ))}
      {extra > 0 && <WhiteBadge className="ms-1">+{extra}</WhiteBadge>}
    </span>
  );
}

/** One small fact in words. */
function Pill({ tone, text }: { tone?: PillTone; text: string }) {
  return (
    <SoftPill tone={tone}>
      <bdi className="truncate">{text}</bdi>
    </SoftPill>
  );
}

/** At most MAX_FACTS pills, the rest counted. */
function Capped({ pills }: { pills: ReactNode[] }) {
  const rest = pills.length - MAX_FACTS;
  return (
    <>
      {pills.slice(0, MAX_FACTS)}
      {rest > 0 && <WhiteBadge>+{rest}</WhiteBadge>}
    </>
  );
}

function ListChip({ list }: { list: CollectionCardList }) {
  return (
    <SoftPill icon={<ListDot color={list.color} size={8} />}>
      <bdi className="truncate">{list.name}</bdi>
    </SoftPill>
  );
}

function statusChange(status: NonNullable<CollectionCardDelta['status']>, t: T): ReactNode {
  const to = STATUS_META[status.to];
  const before = status.from ? t(STATUS_META[status.from].labelKey) : null;
  const tone = status.to === 'visited' ? 'success' : 'neutral';
  return <FactChange key="status" icon={to.icon} before={before} after={t(to.labelKey)} tone={tone} />;
}

/** What an applied change did, from the tool's answer. */
function outcomePills(card: CollectionPlacesCard, t: T): ReactNode[] {
  const outcome = card.outcome;
  if (!outcome) return [];
  if (outcome.type === 'duplicate') {
    const text = t('assistant.card.collection.alreadySaved', { name: outcome.name });
    return [<FactChange key="duplicate" icon={Info} before={null} after={text} tone="info" />];
  }
  if (outcome.type === 'statusSet') {
    const text = t('assistant.card.collection.statusSet', { count: outcome.updated });
    return [<Pill key="set" tone="success" text={text} />];
  }
  const copied = t('assistant.card.collection.copied', { count: outcome.copied });
  const pills: ReactNode[] = [<Pill key="copied" tone="success" text={copied} />];
  if (outcome.skipped > 0) {
    const skipped = t('assistant.card.collection.skipped', { count: outcome.skipped });
    pills.push(<Pill key="skipped" text={skipped} />);
  }
  return pills;
}

/** Labels a change adds and takes away, as chips in their colours. */
function labelPills(added: number[], removed: number[], labels: Map<number, CollectionCardLabel>): ReactNode[] {
  const chip = (id: number, mark: 'add' | 'remove') => {
    const label = labels.get(id);
    return label ? [<LabelChip key={`${mark}-${id}`} label={label} mark={mark} />] : [];
  };
  return [...added.flatMap((id) => chip(id, 'add')), ...removed.flatMap((id) => chip(id, 'remove'))];
}

/** What a held change does to a saved place: its status, labels, vote, fields, list, removal. */
function deltaPills(delta: CollectionCardDelta, card: CollectionPlacesCard, t: T): ReactNode[] {
  const pills: ReactNode[] = [];
  if (delta.status) pills.push(statusChange(delta.status, t));
  pills.push(...labelPills(delta.labelsAdded, delta.labelsRemoved, labelsById(card.labels)));
  if (delta.rating) {
    const to = delta.rating.to;
    const cleared = t('assistant.card.collection.ratingCleared');
    pills.push(to === null ? <Pill key="rating" text={cleared} /> : <RatingPill key="rating" rating={to} />);
  }
  for (const field of delta.fields) pills.push(<Pill key={field} text={t(FIELD_LOOK[field].labelKey)} />);
  if (delta.movedTo) {
    const text = t('assistant.card.collection.moveTo', { name: delta.movedTo.name });
    pills.push(<Pill key="move" tone="info" text={text} />);
  }
  if (delta.removed) pills.push(<Pill key="removed" tone="danger" text={t('assistant.card.collection.removed')} />);
  return pills;
}

/** What a change does to its one saved place; a place to save shows the status it gets. */
function placePills(place: CollectionCardPlace, card: CollectionPlacesCard, tool: string | null, t: T): ReactNode[] {
  const pills: ReactNode[] = place.delta
    ? deltaPills(place.delta, card, t)
    : [<StatusPill key="status" status={place.status} />];
  for (const saved of place.savedIn) {
    const text = t('assistant.card.collection.alreadySaved', { name: saved.name });
    pills.push(<Pill key={`saved-${saved.listId}`} tone="warning" text={text} />);
  }
  // Once a copy ran, its outcome names what it skipped; the warning is for the held copy.
  if (place.inTripPlaceId !== null && !(tool === COPY_TOOL && card.outcome)) {
    const skipped = tool === COPY_TOOL;
    const text = skipped ? t('assistant.card.collection.willSkip', { count: 1 }) : t('assistant.place.inTrip');
    pills.push(<Pill key="trip" tone={skipped ? 'warning' : 'info'} text={text} />);
  }
  return pills;
}

/**
 * What a change does to several saved places at once. Only a held copy into
 * the trip warns of the places the trip has: a save from the trip names trip
 * places by nature, and a copy that ran says what it skipped.
 */
function manyPills(card: CollectionPlacesCard, tool: string | null, t: T): ReactNode[] {
  const status = card.places.find((place) => place.delta?.status)?.delta?.status ?? null;
  const added = [...new Set(card.places.flatMap((place) => place.delta?.labelsAdded ?? []))];
  const removed = [...new Set(card.places.flatMap((place) => place.delta?.labelsRemoved ?? []))];
  const warns = tool === COPY_TOOL && !card.outcome;
  const inTrip = warns ? card.places.filter((place) => place.inTripPlaceId !== null).length : 0;
  const pills: ReactNode[] = [
    <Pill key="count" text={t('collections.placeCount', { count: card.places.length + card.more })} />,
  ];
  if (status) pills.push(statusChange(status, t));
  if (card.everyList) pills.push(<Pill key="every" tone="info" text={t('assistant.card.collection.everyList')} />);
  pills.push(...labelPills(added, removed, labelsById(card.labels)));
  if (inTrip > 0) {
    const text = t('assistant.card.collection.willSkip', { count: inTrip });
    pills.push(<Pill key="trip" tone="warning" text={text} />);
  }
  return pills;
}

/** A label a change makes, renames or deletes, with how many places carry it. */
function labelChangePills(card: CollectionPlacesCard, t: T): ReactNode[] {
  return card.labels.flatMap((label) => {
    const mark = label.change === 'add' ? 'add' : label.change === 'remove' ? 'remove' : undefined;
    const renamed = label.before !== null && label.before.name !== label.name;
    const pills: ReactNode[] = [
      renamed ? (
        <FactChange key={`label-${label.name}`} icon={Tag} before={label.before?.name ?? null} after={label.name} />
      ) : (
        <LabelChip key={`label-${label.name}`} label={label} mark={mark} />
      ),
    ];
    if (label.places !== null && label.change !== 'add') {
      const text = t('assistant.card.collection.labelUsedBy', { count: label.places });
      pills.push(<Pill key={`used-${label.name}`} text={text} />);
    }
    return pills;
  });
}

export function CollectionPlaceFacts({ card, item }: { card: CollectionPlacesCard; item: ChangeItem }) {
  const { t } = useTranslation();
  const [single] = card.places;
  const tool = item.preview?.tool ?? null;
  const pills = outcomePills(card, t);
  if (card.list) pills.push(<ListChip key="list" list={card.list} />);
  if (!single) pills.push(...labelChangePills(card, t));
  else if (card.places.length === 1) pills.push(...placePills(single, card, tool, t));
  else pills.push(...manyPills(card, tool, t));
  if (card.otherTrip) {
    pills.push(<Pill key="other" tone="warning" text={t('assistant.card.collection.otherTrip')} />);
  }
  return <Capped pills={pills} />;
}

/** What a change does to a list: new, renamed, deleted with what goes, an invite answered or withdrawn, a new order. */
function listPills(card: CollectionListsCard, t: T, locale: string): ReactNode[] {
  const [row] = card.lists;
  if (!row) return [];
  const person = row.person?.name ?? '';
  switch (row.change) {
    case 'add':
      return [<ChangeMark key="mark" change="new" />];
    case 'update':
      return row.before && row.before.name !== row.name
        ? [<FactChange key="name" icon={Bookmark} before={row.before.name} after={row.name} />]
        : [<ChangeMark key="mark" change="changed" />];
    case 'remove': {
      const pills: ReactNode[] = [<ChangeMark key="mark" change="willDelete" />];
      if (row.placeCount !== null) {
        pills.push(<Pill key="places" text={t('collections.placeCount', { count: row.placeCount })} />);
      }
      if (row.memberCount > 0) {
        const members = t('assistant.card.collection.members', { count: row.memberCount });
        pills.push(<Pill key="members" text={members} />);
      }
      return pills;
    }
    case 'join':
    case 'decline': {
      const tone = row.change === 'join' ? 'info' : 'neutral';
      return [<Pill key="invite" tone={tone} text={t('assistant.card.collection.invite', { name: person })} />];
    }
    case 'withdraw':
      return [<Pill key="withdraw" tone="warning" text={t('assistant.card.collection.withdraw', { name: person })} />];
    case 'order':
      return card.lists.map((list, index) => (
        <Pill key={list.id ?? index} text={`${(index + 1).toLocaleString(locale)} ${list.name}`} />
      ));
    default:
      return [];
  }
}

export function CollectionListFacts({ card }: { card: CollectionListsCard }) {
  const { t, locale } = useTranslation();
  return <Capped pills={listPills(card, t, locale)} />;
}
