import type { TourPackingLink } from '@trek/shared';
import { Backpack, Check, type LucideIcon, Package, PowerOff } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { tintOf, WhiteBadge } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import { TourNotice } from '../tourParts';
import { linkName } from './packingLinkName';

/** A link while Packing is off: dimmed, not hidden, since the tour still points at the list it cannot show. */
export function DimmedLink({ link }: { link: TourPackingLink }) {
  const { t } = useTranslation();
  return (
    <div className="opacity-70" data-testid="tour-packing-dimmed">
      <TourNotice icon={<PowerOff size={13} strokeWidth={2} />}>
        <span className="font-semibold text-content-secondary">{linkName(link, t)}</span>
        <span className="block">{t('tours.packing.addonOff')}</span>
      </TourNotice>
    </div>
  );
}

/** A packing category's own colour, as the packing list gives it, with a soft halo of the same colour. */
export function CategoryDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="h-2.5 w-2.5 flex-none rounded-full"
      style={{ background: color, boxShadow: `0 0 0 3px ${tintOf(color, 24)}` }}
    />
  );
}

/** How many items a list or category holds, as a badge; the count is read out in words. */
export function CountBadge({ count }: { count: number }) {
  const { t } = useTranslation();
  return (
    <span aria-label={t('tours.packing.items', { count })} className="inline-flex">
      <WhiteBadge icon={<Package size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
        {count}
      </WhiteBadge>
    </span>
  );
}

/**
 * The round tile of a list with its item count on the corner, the way a
 * waypoint's number carries its marks: a backpack for packing, another glyph
 * for another list (the chat's to-dos). A category colour sits on the other
 * corner when the list is one category of it.
 */
export function PackTile({
  count,
  color,
  icon: Icon = Backpack,
}: {
  count: number;
  color: string | null;
  icon?: LucideIcon;
}) {
  return (
    <span className="relative grid h-9 w-9 flex-none place-items-center rounded-full bg-surface-secondary text-content-muted">
      <Icon size={16} strokeWidth={2} aria-hidden="true" />
      <span
        aria-hidden="true"
        className="absolute -end-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 font-geist font-semibold tabular-nums text-accent-text ring-2 ring-surface-card"
        style={fs(9.5)}
      >
        {count}
      </span>
      {color && (
        <span className="absolute -bottom-0.5 -start-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-surface-card">
          <CategoryDot color={color} />
        </span>
      )}
    </span>
  );
}

/**
 * The round check of a list row: filled once it is done, an empty ring before.
 * `pending` draws a dashed accent ring around it, for a tick a change has not
 * made yet.
 */
export function CheckCircle({ done, pending = false }: { done: boolean; pending?: boolean }) {
  return (
    <span
      className={`grid h-4 w-4 flex-none place-items-center rounded-full ${done ? 'bg-accent text-accent-text' : 'ring-1 ring-inset ring-edge'} ${pending ? 'outline-dashed outline-1 outline-offset-2 outline-accent' : ''}`}
    >
      {done && <Check size={10} strokeWidth={3} aria-hidden="true" />}
    </span>
  );
}

/** How much of a list is packed, as a thin bar in the accent colour. */
export function PackedBar({ packed, total }: { packed: number; total: number }) {
  const share = total > 0 ? Math.min(1, packed / total) : 0;
  return (
    <div className="h-1 overflow-hidden rounded-full bg-surface-secondary" aria-hidden="true">
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-300"
        style={{ width: `${share * 100}%` }}
      />
    </div>
  );
}
