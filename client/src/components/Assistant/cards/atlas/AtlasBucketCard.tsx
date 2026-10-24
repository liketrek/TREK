import type { AssistantMessage, AtlasBucketEntry, AtlasBucketCard as BucketCard } from '@trek/shared';
import { CalendarDays, Check, NotebookPen, Star, Tag, TriangleAlert } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { SoftPill, WhiteBadge } from '../../../Planner/planParts';
import CountryFlag from '../../../shared/CountryFlag';
import type { ChangeItem } from '../../assistantParts';
import type { CardEntry } from '../cardTypes';
import { FactChange } from '../parts/CardFacts';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardOpenButton } from '../parts/CardOpen';
import { CardMore } from '../parts/CardRows';
import { shortDay, wishMonth } from './atlasCardModel';
import { ATLAS_PAGE } from './atlasPage';
import { ChangeFlag } from './AtlasParts';
import { useAtlasCard } from './useAtlasCard';

/**
 * The bucket list the way the Atlas page lists it: each wish as a tile with
 * its flag (a star without a country), its name, the month it is planned for
 * and its notes, a tick with the day for one that came true. In a change card
 * the one wish it adds, changes or removes is the row.
 */

const ICON = { size: 10, strokeWidth: 2.2, 'aria-hidden': true } as const;

function WishTile({ wish }: { wish: AtlasBucketEntry }) {
  const { t } = useTranslation();
  const { countryName, locale } = useAtlasCard();
  const month = wishMonth(wish.targetDate, locale);
  return (
    <li className="flex min-w-0 flex-col items-start gap-1 rounded-2xl border border-edge-faint bg-surface-card p-2.5 shadow-sm">
      <span className="flex h-5 w-full items-center justify-between gap-2">
        {wish.countryCode ? (
          <span role="img" aria-label={countryName(wish.countryCode)}>
            <CountryFlag code={wish.countryCode} size={18} />
          </span>
        ) : (
          <Star size={16} strokeWidth={2.1} aria-hidden="true" className="text-warning" />
        )}
      </span>
      <bdi className="line-clamp-2 w-full break-words text-body font-semibold leading-tight text-content">
        {wish.name}
      </bdi>
      {month && (
        <WhiteBadge icon={<CalendarDays {...ICON} className="flex-none text-content-faint" />}>{month}</WhiteBadge>
      )}
      {wish.notes && <p className="m-0 line-clamp-2 w-full text-caption text-content-muted">{wish.notes}</p>}
      {wish.reachedOn && (
        <span className="flex items-center gap-1 text-caption text-success">
          <Check size={12} strokeWidth={2.4} aria-hidden="true" className="flex-none" />
          {t('assistant.card.atlas.reached', { date: shortDay(wish.reachedOn, locale) })}
        </span>
      )}
    </li>
  );
}

/**
 * The wishes of an answer as tiles; two reads in one answer share the tiles,
 * each wish once. The list is as long as the longest read says it is (what a
 * read shows plus what it left out), never shorter than the wishes shown.
 */
export default function AtlasBucketBlock({ cards }: { cards: readonly CardEntry[]; message: AssistantMessage }) {
  const { t } = useTranslation();
  const { roomy, limits } = useAtlasCard();
  const seen = new Set<string>();
  const wishes: AtlasBucketEntry[] = [];
  let total = 0;
  for (const entry of cards) {
    if (entry.card.kind !== 'atlasBucket') continue;
    total = Math.max(total, entry.card.items.length + entry.card.more);
    for (const wish of entry.card.items) {
      const key = wish.id === null ? `new-${wish.name}` : String(wish.id);
      if (seen.has(key)) continue;
      seen.add(key);
      wishes.push(wish);
    }
  }
  if (wishes.length === 0) return null;
  const shown = wishes.slice(0, limits.wishes);
  const count = Math.max(total, wishes.length);
  return (
    <CardFrame label={t('atlas.bucketTab')}>
      <CardHeader
        icon={Star}
        tone="warning"
        title={t('atlas.bucketTab')}
        count={count}
        actions={<CardOpenButton target={ATLAS_PAGE} labelKey="assistant.card.atlas.open" />}
      />
      <ul className={`m-0 mt-2.5 grid list-none gap-2 p-0 ${roomy ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {shown.map((wish) => (
          <WishTile key={wish.id ?? `new-${wish.name}`} wish={wish} />
        ))}
      </ul>
      <div className="mt-1">
        <CardMore count={count - shown.length} target={ATLAS_PAGE} />
      </div>
    </CardFrame>
  );
}

/** A wish change's lead: its flag, or a star without a country, with what the change does on its corner. */
export function AtlasBucketLead({ card, item }: { card: BucketCard; item: ChangeItem }) {
  return <ChangeFlag code={card.items[0].countryCode} item={item} />;
}

/**
 * When a wish is planned for (a date taken away shows struck through) and the
 * region it marks; that an add would repeat a wish already there.
 */
export function AtlasBucketFacts({ card }: { card: BucketCard; item: ChangeItem }) {
  const { t } = useTranslation();
  const { locale } = useAtlasCard();
  const wish = card.items[0];
  const before = card.change?.op === 'update' ? card.change.before : null;
  const month = wishMonth(wish.targetDate, locale);
  const monthBefore = before ? wishMonth(before.targetDate, locale) : null;
  return (
    <>
      {month && (
        <FactChange icon={CalendarDays} before={before && monthBefore !== month ? monthBefore : null} after={month} />
      )}
      {!month && monthBefore && (
        <FactChange icon={CalendarDays} before={monthBefore} after={t('assistant.card.common.removed')} />
      )}
      {wish.regionCode && (
        <WhiteBadge icon={<Tag {...ICON} className="flex-none text-content-faint" />}>{wish.regionCode}</WhiteBadge>
      )}
      {card.change?.duplicate && (
        <SoftPill tone="warning" icon={<TriangleAlert {...ICON} />}>
          {t('assistant.card.atlas.duplicate')}
        </SoftPill>
      )}
    </>
  );
}

/**
 * Under a wish change: the notes of a new wish, the name and notes a change
 * gives an old one (notes taken away show struck through).
 */
export function AtlasBucketBody({ card }: { card: BucketCard; item: ChangeItem }) {
  const { t } = useTranslation();
  const wish = card.items[0];
  const change = card.change;
  if (change?.op === 'update' && change.before) {
    const before = change.before;
    const renamed = before.name !== wish.name;
    const renoted = before.notes !== wish.notes;
    if (!renamed && !renoted) return null;
    return (
      <span className="flex flex-wrap items-center gap-1">
        {renamed && <FactChange icon={Star} before={before.name} after={wish.name} />}
        {renoted && (
          <FactChange
            icon={NotebookPen}
            before={before.notes}
            after={wish.notes ?? t('assistant.card.common.removed')}
          />
        )}
      </span>
    );
  }
  if (change?.op !== 'add' || !wish.notes) return null;
  return <p className="m-0 line-clamp-2 text-caption text-content-muted">{wish.notes}</p>;
}
