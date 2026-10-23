import type { PackingCardBag, PackingCardGroup, PackingCardItem } from '@trek/shared';
import { Hash, Lock, Luggage, PackageCheck, PencilLine, Scale, Tag, Users } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { safeHexColor } from '../../../../utils/safeColor';
import { formatWeight } from '../../../Packing/packingListModel';
import { bagFillPct } from '../../../Packing/packingListPanel.helpers';
import { SoftPill, WhiteBadge } from '../../../Planner/planParts';
import { Tooltip } from '../../../shared/Tooltip';
import { ChangeMark, FactChange, NoLonger } from '../parts/CardFacts';
import { PeopleStack, PersonFace } from '../parts/CardPeople';
import { packingColorOf } from './checklistModel';
import { ChecklistHead, ChecklistRow, MoreLine } from './checklistParts';

/**
 * The packing list's own pieces in the chat: a category's head with its
 * colour and people, a bag's head with its swatch, weight and fill, a row
 * with how many, how much it weighs, its bag and its tier, and the facts a
 * change states about a row, old values struck through.
 */

/** A bag's colour, the accent where the bag has none yet. */
const bagColor = (bag: PackingCardBag | undefined) => safeHexColor(bag?.color, 'var(--accent)');

/** The words for a tier, the people a shared item covers named. */
function useTierLabel(): (tier: string, people?: readonly { name: string }[]) => string {
  const { t } = useTranslation();
  return (tier, people = []) => {
    if (tier === 'personal') return t('assistant.card.packing.tierPersonal');
    if (tier === 'shared' && people.length > 0) {
      return t('assistant.card.packing.sharedWith', { names: people.map((person) => person.name).join(', ') });
    }
    return tier === 'shared' ? t('packing.tierShared') : t('assistant.card.packing.tierCommon');
  };
}

/** A bag's small square swatch beside a row; dashed for one a change creates. */
function BagSwatch({ bag, size = 'row' }: { bag: PackingCardBag | undefined; size?: 'row' | 'head' }) {
  const { t } = useTranslation();
  const box = size === 'head' ? 'h-2.5 w-2.5 rounded-[3px]' : 'h-2 w-2 rounded-[2px]';
  const name = bag?.name ?? t('packing.noBag');
  if (!bag || bag.id === null) {
    return (
      <span role="img" aria-label={name} title={name} className={`${box} flex-none border border-dashed border-edge`} />
    );
  }
  return (
    <Tooltip label={name}>
      <span role="img" aria-label={name} className={`${box} flex-none`} style={{ background: bagColor(bag) }} />
    </Tooltip>
  );
}

/**
 * What a row says at its end: how many, how many packed, its weight, its tier
 * and its bag. A bag the card does not carry draws nothing rather than "Unassigned".
 */
/** A row's quantity and weight: quiet figures at its end, no frame each. */
const QUIET = 'text-caption tabular-nums text-content-muted';

/** How many rows a group holds, quiet beside its name. */
function GroupCount({ count }: { count: number }) {
  const { t } = useTranslation();
  return (
    <span
      aria-label={t('tours.packing.items', { count })}
      className="flex-none text-caption tabular-nums text-content-faint"
    >
      {count}
    </span>
  );
}

export function PackingRowAside({ row, bag }: { row: PackingCardItem; bag: PackingCardBag | undefined }) {
  const { t } = useTranslation();
  const personal = t('assistant.card.packing.tierPersonal');
  const partial = !row.checked && row.packed > 0 && row.packed < row.quantity;
  return (
    <>
      {row.quantity > 1 && <span className={QUIET}>×{row.quantity}</span>}
      {partial && <span className={QUIET}>{`${row.packed}/${row.quantity}`}</span>}
      {row.weightGrams !== null && <span className={QUIET}>{formatWeight(row.weightGrams)}</span>}
      {row.tier === 'personal' && (
        <Tooltip label={personal}>
          <span role="img" aria-label={personal} className="flex text-content-faint">
            <Lock size={11} strokeWidth={2.2} aria-hidden="true" />
          </span>
        </Tooltip>
      )}
      {row.tier === 'shared' && <PeopleStack people={row.sharedWith} max={2} />}
      {bag && <BagSwatch bag={bag} />}
    </>
  );
}

/** The facts a change states about a row: what it does, and every field it changes, old to new. */
export function PackingRowFacts({
  row,
  bags,
  category,
  quiet = false,
}: {
  row: PackingCardItem;
  bags: ReadonlyMap<string, PackingCardBag>;
  category: string;
  /** An import's rows carry no "New" each. */
  quiet?: boolean;
}) {
  const { t } = useTranslation();
  const tierLabel = useTierLabel();
  if (row.change === 'add') return quiet ? null : <ChangeMark change="new" />;
  if (row.change === 'remove') return <ChangeMark change="removed" />;
  if (row.change === 'check') return <SoftPill tone="success">{t('assistant.card.packing.packed')}</SoftPill>;
  if (row.change === 'uncheck') return <SoftPill>{t('assistant.card.packing.notPacked')}</SoftPill>;
  const bagName = (key: string | null, name?: string | null) =>
    (key ? bags.get(key)?.name : name) ?? t('packing.noBag');
  const noWeight = t('assistant.card.packing.noWeight');
  const grams = (value: string | number | null) => (value === null ? noWeight : formatWeight(Number(value)));
  const facts = row.changed.map(({ field, before }) => {
    if (field === 'name') return { field, icon: PencilLine, before, after: row.name };
    if (field === 'category') return { field, icon: Tag, before, after: category };
    if (field === 'quantity') return { field, icon: Hash, before, after: String(row.quantity) };
    if (field === 'packed') return { field, icon: PackageCheck, before, after: String(row.packed) };
    if (field === 'weight') return { field, icon: Scale, before: grams(before), after: grams(row.weightGrams) };
    if (field === 'bag') return { field, icon: Luggage, before: bagName(null, before), after: bagName(row.bagKey) };
    const icon = row.tier === 'common' ? Users : Lock;
    return { field, icon, before: before ? tierLabel(before) : null, after: tierLabel(row.tier, row.sharedWith) };
  });
  return (
    <>
      {facts.map((fact) => (
        <FactChange key={fact.field} icon={fact.icon} before={fact.before} after={fact.after} />
      ))}
    </>
  );
}

/** One row of a packing card: an answer's as the list shows it, a change's with the facts of the change. */
function PackingRow({
  row,
  bags,
  category,
  inChange,
}: {
  row: PackingCardItem;
  bags: ReadonlyMap<string, PackingCardBag>;
  category: string;
  inChange: boolean;
}) {
  const bag = row.bagKey ? bags.get(row.bagKey) : undefined;
  const facts =
    inChange && row.change !== 'none' ? (
      <span className="mt-1 flex flex-wrap items-center gap-1">
        <PackingRowFacts row={row} bags={bags} category={category} quiet />
      </span>
    ) : null;
  return (
    <ChecklistRow
      done={row.checked}
      pendingTick={inChange && row.change === 'check'}
      struck={row.change === 'remove'}
      name={row.name}
      aside={<PackingRowAside row={row} bag={bag} />}
      under={facts}
    />
  );
}

/** How full a bag is: a thin bar in its colour against its limit (or the heaviest bag), red past the limit. */
function BagFill({ bag, heaviest }: { bag: PackingCardBag; heaviest: number }) {
  if (bag.weightGrams === null) return null;
  const over = bag.limitGrams !== null && bag.weightGrams > bag.limitGrams;
  const pct = bagFillPct(bag.weightGrams, bag.limitGrams, heaviest);
  return (
    <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-surface-secondary" aria-hidden="true">
      <div
        className={`h-full rounded-full ${over ? 'bg-danger' : ''}`}
        style={over ? { width: `${pct}%` } : { width: `${pct}%`, background: bagColor(bag) }}
      />
    </div>
  );
}

/** What a change does to a bag: new, gone with where its items land, or its fields old to new. */
function BagChange({ bag }: { bag: PackingCardBag }) {
  const { t } = useTranslation();
  if (bag.change === 'add') return <SoftPill tone="success">{t('assistant.card.packing.newBag')}</SoftPill>;
  if (bag.change === 'remove') {
    return (
      <>
        <ChangeMark change="removed" />
        {bag.movesOut > 0 && (
          <span className="text-caption text-content-muted">
            {t('assistant.card.packing.movesOut', { count: bag.movesOut })}
          </span>
        )}
      </>
    );
  }
  return (
    <>
      {bag.changed.map(({ field, before }) => {
        if (field === 'name') return <FactChange key={field} icon={PencilLine} before={before} after={bag.name} />;
        if (field === 'limit') {
          const noLimit = t('assistant.card.packing.noLimit');
          const after = bag.limitGrams === null ? noLimit : formatWeight(bag.limitGrams);
          const old = before === null ? noLimit : formatWeight(Number(before));
          return <FactChange key={field} icon={Scale} before={old} after={after} />;
        }
        if (field === 'owner') {
          const owner = bag.owner?.name ?? t('todo.unassigned');
          return <FactChange key={field} icon={Users} before={before ?? t('todo.unassigned')} after={owner} />;
        }
        return <FactChange key={field} icon={Luggage} before={before} after={bag.color ?? ''} />;
      })}
    </>
  );
}

/** A bag's head: swatch, name, weight against its limit, who it belongs to and who packs it, and its fill. */
function BagHead({
  group,
  bag,
  heaviest,
  inChange,
}: {
  group: PackingCardGroup;
  bag: PackingCardBag | undefined;
  heaviest: number;
  inChange: boolean;
}) {
  const { t } = useTranslation();
  if (!bag) {
    const badge = inChange ? undefined : <GroupCount count={group.count} />;
    const lead = <BagSwatch bag={undefined} size="head" />;
    return <ChecklistHead color="" name={t('packing.noBag')} lead={lead} badge={badge} />;
  }
  const over = bag.limitGrams !== null && bag.weightGrams !== null && bag.weightGrams > bag.limitGrams;
  const weight =
    bag.weightGrams === null
      ? null
      : bag.limitGrams === null
        ? formatWeight(bag.weightGrams)
        : t('assistant.card.packing.ofLimit', {
            weight: formatWeight(bag.weightGrams),
            limit: formatWeight(bag.limitGrams),
          });
  return (
    <div>
      <ChecklistHead
        color=""
        name={bag.name}
        lead={<BagSwatch bag={bag} size="head" />}
        badge={
          <>
            {weight && <WhiteBadge>{weight}</WhiteBadge>}
            {over && <SoftPill tone="danger">{t('assistant.card.packing.overLimit')}</SoftPill>}
            {bag.owner && <PersonFace person={bag.owner} size={20} />}
          </>
        }
        people={bag.members}
        removed={bag.membersRemoved}
      />
      {inChange && bag.change !== 'none' && (
        <span className="mt-1 flex flex-wrap items-center gap-1 ps-[18px]">
          <BagChange bag={bag} />
        </span>
      )}
      <BagFill bag={bag} heaviest={heaviest} />
    </div>
  );
}

/**
 * A group of a packing card: its head and its rows, with how many more it
 * left out (on a change too, so an import of twenty never reads as eight),
 * and the people a change takes off it.
 */
export function PackingGroup({
  group,
  bags,
  heaviest,
  inChange,
}: {
  group: PackingCardGroup;
  bags: ReadonlyMap<string, PackingCardBag>;
  heaviest: number;
  inChange: boolean;
}) {
  const { t } = useTranslation();
  const key = group.key;
  const name = key.by === 'category' ? (key.name ?? t('packing.defaultCategory')) : '';
  const bag = key.by === 'bag' && key.bagKey ? bags.get(key.bagKey) : undefined;
  const head =
    key.by === 'bag' ? (
      <BagHead group={group} bag={bag} heaviest={heaviest} inChange={inChange} />
    ) : (
      <ChecklistHead
        color={packingColorOf(key.slot, name)}
        name={name}
        badge={inChange ? undefined : <GroupCount count={group.count} />}
        people={group.assignees}
        removed={group.assigneesRemoved}
      />
    );
  const hidden = group.count - group.items.length;
  const gone = key.by === 'bag' ? (bag?.membersRemoved ?? []) : group.assigneesRemoved;
  return (
    <section className="flex min-w-0 flex-col">
      {head}
      {inChange && gone.length > 0 && (
        <p className="m-0 ps-[18px]">
          <NoLonger names={gone.map((person) => person.name)} />
        </p>
      )}
      {group.items.length > 0 && (
        <ul className="m-0 list-none p-0 ps-1">
          {group.items.map((row, i) => (
            <PackingRow key={`${row.id ?? 'new'}-${i}`} row={row} bags={bags} category={name} inChange={inChange} />
          ))}
        </ul>
      )}
      {group.items.length > 0 && <MoreLine label={hidden > 0 ? t('tours.packing.more', { count: hidden }) : null} />}
    </section>
  );
}
