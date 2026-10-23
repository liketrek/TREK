import type { PackingListCard as PackingCard, PackingCardGroup } from '@trek/shared';
import { Check } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { SoftPill } from '../../../Planner/planParts';
import { PackedBar, PackTile } from '../../../Tours/packing/packingLinkParts';
import AssistantChangeFields from '../../AssistantChangeFields';
import type { ChangeItem } from '../../assistantParts';
import type { CardEntry, EntityTarget } from '../cardTypes';
import CardFrame from '../parts/CardFrame';
import { isRunnable, mergePackingCards, packingColorOf, rowCount } from './checklistModel';
import { ChecklistFoot, ChecklistRun, type RunEntry, type RunProps } from './checklistParts';
import { PackingGroup, PackingRowAside, PackingRowFacts } from './packingParts';

/**
 * The packing list in the chat, drawn like the list a tour shows: the
 * backpack tile with its count, how much is packed, then the groups (by
 * category with their colour and people, or by bag with weight and fill) and
 * their rows. An answer sits in its own card with the way into the list; a
 * change draws its rows inside the change card: one row's facts on its line,
 * several rows (an import, a template) or a bag or category under it, and a
 * run of single-row changes as one checklist.
 */

const PACKING_TARGET: EntityTarget = { kind: 'tab', tab: 'listen', sub: 'packing' };

/** How the groups a card leaves out are counted, by what it groups by. */
const MORE_GROUPS = {
  bag: { labelKey: 'assistant.card.packing.moreBags' },
  category: { labelKey: 'assistant.card.packing.moreCategories' },
} as const;

/** The bags of a card by key, and the heaviest one, the scale for bags without a limit. */
function bagsOf(card: PackingCard) {
  const bags = new Map(card.bags.map((bag) => [bag.key, bag]));
  const heaviest = Math.max(1, ...card.bags.map((bag) => bag.weightGrams ?? 0));
  return { bags, heaviest };
}

const groupKeyOf = (group: PackingCardGroup) =>
  group.key.by === 'bag' ? `bag:${group.key.bagKey ?? ''}` : `category:${group.key.name ?? ''}`;

/** The groups of a card, as the list shows them; the heads of a bag overview sit closer. */
function PackingGroups({ card, inChange }: { card: PackingCard; inChange: boolean }) {
  const { bags, heaviest } = bagsOf(card);
  const overview = rowCount(card) === 0;
  return (
    <div className={`flex min-w-0 flex-col ${overview ? 'gap-2' : 'gap-1.5'}`}>
      {card.groups.map((group) => (
        <PackingGroup key={groupKeyOf(group)} group={group} bags={bags} heaviest={heaviest} inChange={inChange} />
      ))}
    </div>
  );
}

/** The card's title: the list, the bags, or the tour or template it is about. */
function useTitle(card: PackingCard): string {
  const { t } = useTranslation();
  if (card.source.type !== 'trip') return card.source.name;
  return card.groupBy === 'bag' && rowCount(card) === 0
    ? t('assistant.card.packing.bagsTitle')
    : t('assistant.card.packing.title');
}

/** The head of an answer: the tile with the count, the title, how much is packed, and "All packed" once it is. */
function PackingHead({ card }: { card: PackingCard }) {
  const { t } = useTranslation();
  const title = useTitle(card);
  const source = card.source;
  const total = card.progress?.total ?? card.groups.reduce((sum, group) => sum + group.count, 0);
  const packed = card.progress?.packed ?? 0;
  let caption: string | null = null;
  if (source.type === 'tour') caption = t('assistant.card.packing.forTour');
  else if (source.type === 'template') caption = t('assistant.card.packing.templateAdds', { count: source.itemCount });
  else if (card.progress && total > 0) caption = t('tours.packing.packed', { packed, count: total });
  const first = card.groups[0]?.key;
  const color =
    source.type === 'tour' && source.category !== null && first?.by === 'category'
      ? packingColorOf(first.slot, source.category)
      : null;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <PackTile count={source.type === 'template' ? source.itemCount : total} color={color} />
      <div className="min-w-0 flex-1">
        <p title={title} className="m-0 line-clamp-2 text-body font-semibold leading-tight text-content">
          {title}
        </p>
        {caption && (
          <p title={caption} className="m-0 truncate text-caption text-content-faint">
            {caption}
          </p>
        )}
      </div>
      {card.progress && total > 0 && packed === total && (
        <SoftPill tone="success" icon={<Check size={11} strokeWidth={2.4} className="flex-none" />}>
          {t('tours.packing.allPacked')}
        </SoftPill>
      )}
    </div>
  );
}

/** One answer card. */
function PackingAnswer({ card }: { card: PackingCard }) {
  const title = useTitle(card);
  const progress = card.progress;
  return (
    <CardFrame label={title}>
      <div className="flex min-w-0 flex-col gap-2.5">
        <PackingHead card={card} />
        {progress && progress.total > 0 && <PackedBar packed={progress.packed} total={progress.total} />}
        <PackingGroups card={card} inChange={false} />
        <ChecklistFoot
          more={card.moreGroups}
          moreKey={MORE_GROUPS[card.groupBy].labelKey}
          target={PACKING_TARGET}
          openKey="tours.packing.open"
        />
      </div>
    </CardFrame>
  );
}

/** The packing answers of one group: consecutive cards of one list read as one, the others stacked. */
export function PackingListBlock({ cards }: { cards: readonly CardEntry[] }) {
  const lists = mergePackingCards(cards.flatMap((entry) => (entry.card.kind === 'packingList' ? [entry.card] : [])));
  return (
    <div className="flex flex-col gap-2">
      {lists.map((card, i) => (
        <PackingAnswer key={`${card.source.type}-${i}`} card={card} />
      ))}
    </div>
  );
}

/** The facts of a change of one row on its line; any other change keeps the fields of its preview. */
export function PackingChangeFacts({ card, item }: { card: PackingCard; item: ChangeItem }) {
  const group = card.groups[0];
  const row = group?.items[0];
  if (!isRunnable(card) || !group || !row) return <AssistantChangeFields rows={item.preview?.rows ?? []} />;
  const { bags } = bagsOf(card);
  const category = group.key.by === 'category' ? (group.key.name ?? '') : '';
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1">
      <PackingRowAside row={row} bag={row.bagKey ? bags.get(row.bagKey) : undefined} />
      <PackingRowFacts row={row} bags={bags} category={category} />
    </span>
  );
}

/** Under a change that is more than one row: the template it adds, or its groups, bags and people. */
export function PackingChangeBody({ card }: { card: PackingCard; item: ChangeItem }) {
  const { t } = useTranslation();
  if (isRunnable(card)) return null;
  const source = card.source;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {source.type === 'template' && card.groups.length === 0 && (
        <p className="m-0 text-caption text-content-muted">
          {t('assistant.card.packing.templateAdds', { count: source.itemCount })}
        </p>
      )}
      {source.type === 'tour' && (
        <p className="m-0 text-caption text-content-muted">{t('assistant.card.packing.forTour')}</p>
      )}
      <PackingGroups card={card} inChange />
    </div>
  );
}

/** A waiting change of one row as a row of a run: the category's head, the row's name, end and facts. */
function packingEntry(item: ChangeItem): RunEntry | null {
  const card = item.card?.kind === 'packingList' ? item.card : null;
  const group = card?.groups[0];
  const row = group?.items[0];
  if (!card || !group || !row) return null;
  const { bags } = bagsOf(card);
  const category = group.key.by === 'category' ? (group.key.name ?? '') : '';
  return {
    item,
    change: row.change,
    headKey: groupKeyOf(group),
    head: <PackingGroup group={{ ...group, items: [] }} bags={bags} heaviest={1} inChange />,
    name: row.name,
    facts: (
      <>
        <PackingRowAside row={row} bag={row.bagKey ? bags.get(row.bagKey) : undefined} />
        <PackingRowFacts row={row} bags={bags} category={category} />
      </>
    ),
  };
}

/**
 * Two or more waiting changes of one row each, as one checklist: the
 * category's head once, a row per change with its name, what it says at its
 * end and what the change does.
 */
export function PackingChangeRun(props: RunProps) {
  return <ChecklistRun {...props} entryOf={packingEntry} />;
}
