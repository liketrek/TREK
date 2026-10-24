import type { TourListItem } from '@trek/shared';
import { AlertTriangle, ArrowUpRight, Backpack, Check, Link2, PackageOpen, Unlink } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import type { PackingItem } from '../../../types';
import { BOX } from '../../Planner/bookings/bookingParts';
import { SoftPill, WhiteBadge } from '../../Planner/planParts';
import { DialogSection, fs } from '../../shared/DialogShell';
import { CardAction, TourNotice } from '../tourParts';
import { linkName } from './packingLinkName';
import { CheckCircle, DimmedLink, PackedBar, PackTile } from './packingLinkParts';
import { TourPackingLinkDialog } from './TourPackingLinkDialog';
import { useTourPackingLink, type TourPackingLinkController } from './useTourPackingLink';

/** How many items of the list the card shows before it says how many more there are. */
const SHOWN_ITEMS = 5;

/** The quiet pill beside the section's label, like the upload of a tour's files. */
function SectionPill({ onClick, icon, children }: { onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full bg-surface-card px-2 py-[2px] font-geist font-semibold text-content-muted shadow-sm transition-colors hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      style={fs(10.5)}
    >
      {icon}
      {children}
    </button>
  );
}

/** One item as Packing keeps it, read only: ticked off or not, its name and how many. */
function ItemRow({ item }: { item: PackingItem }) {
  return (
    <li className="flex min-w-0 items-center gap-2 py-1">
      <CheckCircle done={!!item.checked} />
      <span
        className={`min-w-0 flex-1 truncate ${item.checked ? 'text-content-faint line-through' : 'text-content-secondary'}`}
        style={fs(12, 'body')}
      >
        {item.name}
      </span>
      {(item.quantity ?? 1) > 1 && <WhiteBadge>×{item.quantity}</WhiteBadge>}
    </li>
  );
}

/** The linked list as it reads now: its items with how many are packed, or why there are none to show. */
function LinkedCard({ packing, onOpenPacking }: { packing: TourPackingLinkController; onOpenPacking?: () => void }) {
  const { t } = useTranslation();
  const { link, linked } = packing;
  if (!link || !linked) return null;
  const name = linkName(link, t);
  if (linked.state === 'missing') {
    return (
      <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
        {t('tours.packing.missing', { name })}
      </TourNotice>
    );
  }
  const total = linked.items.length;
  const allPacked = total > 0 && linked.packed === total;
  const more = total - SHOWN_ITEMS;
  return (
    <div className={`${BOX} flex flex-col gap-2.5 px-3 py-2.5`} data-testid="tour-packing-card">
      <div className="flex min-w-0 items-center gap-2.5">
        <PackTile count={total} color={packing.linkedColor} />
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate font-semibold text-content" style={fs(13, 'body')}>
            {name}
          </p>
          {total > 0 && (
            <p className="m-0 truncate text-content-faint" style={fs(11)}>
              {t('tours.packing.packed', { packed: linked.packed, count: total })}
            </p>
          )}
        </div>
        {allPacked && (
          <SoftPill tone="success" icon={<Check size={11} strokeWidth={2.4} className="flex-none" />}>
            {t('tours.packing.allPacked')}
          </SoftPill>
        )}
      </div>
      {total > 0 ? (
        <>
          <PackedBar packed={linked.packed} total={total} />
          <ul className="m-0 flex list-none flex-col p-0">
            {linked.items.slice(0, SHOWN_ITEMS).map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </ul>
          {more > 0 && (
            <p className="m-0 text-content-faint" style={fs(11)}>
              {t('tours.packing.more', { count: more })}
            </p>
          )}
        </>
      ) : (
        <p className="m-0 flex items-center gap-1.5 text-content-muted" style={fs(12, 'body')}>
          <PackageOpen size={13} strokeWidth={2} className="flex-none text-content-faint" />
          {link.category === null ? t('tours.packing.emptyList') : t('tours.packing.emptyCategory', { name })}
        </p>
      )}
      {onOpenPacking && (
        <div className="flex">
          <CardAction icon={<ArrowUpRight size={13} strokeWidth={2.2} />} onClick={onOpenPacking}>
            {t('tours.packing.open')}
          </CardAction>
        </div>
      )}
    </div>
  );
}

/** No link yet: a quiet dashed card, with the way to make one for who may change the tour. */
function UnlinkedCard({ onLink }: { onLink?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2.5 rounded-[10px] border border-dashed border-edge px-3 py-2.5">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-surface-secondary text-content-faint">
        <Backpack size={16} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-content-faint" style={fs(12, 'body')}>
        {t('tours.packing.none')}
      </span>
      {onLink && (
        <CardAction icon={<Link2 size={13} strokeWidth={2.2} />} onClick={onLink}>
          {t('tours.packing.link')}
        </CardAction>
      )}
    </div>
  );
}

/** The section's body for whatever the link reads as now. */
function SectionBody({
  packing,
  canEdit,
  onOpenPacking,
}: {
  packing: TourPackingLinkController;
  canEdit: boolean;
  onOpenPacking?: () => void;
}) {
  const { t } = useTranslation();
  if (packing.status === 'error') {
    return (
      <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
        <span className="flex flex-wrap items-center gap-2">
          {t('tours.packing.loadFailed')}
          <button type="button" onClick={packing.retry} className="font-semibold underline underline-offset-2">
            {t('tours.planner.retry')}
          </button>
        </span>
      </TourNotice>
    );
  }
  if (!packing.link) return <UnlinkedCard onLink={canEdit ? packing.show : undefined} />;
  if (!packing.packingEnabled) return <DimmedLink link={packing.link} />;
  return <LinkedCard packing={packing} onOpenPacking={onOpenPacking} />;
}

/**
 * P2D-XD-01 in a tour's detail: the packing list, or the category of it, the
 * tour points at, read live from the trip's packing list as this user may see
 * it. Who may change the tour links one, changes it or lets go through the
 * dialog; the items themselves are only ever changed in Packing, which the
 * card opens. Without Packing and without a link there is nothing to show.
 */
export function TourPackingSection({
  tripId,
  tour,
  tourName,
  canEdit,
  onOpenPacking,
}: {
  tripId: number;
  tour: TourListItem;
  tourName: string;
  canEdit: boolean;
  /** Opens the trip's packing list; absent where the detail cannot leave for it. */
  onOpenPacking?: () => void;
}) {
  const { t } = useTranslation();
  const packing = useTourPackingLink({ tripId, tour });
  if (packing.status === 'loading' || (!packing.packingEnabled && !packing.link)) return null;
  const editable = canEdit && packing.status === 'ready';
  let action: ReactNode = null;
  if (editable && packing.link && packing.packingEnabled) {
    action = (
      <SectionPill onClick={packing.show} icon={<Link2 size={11} strokeWidth={2} />}>
        {t('tours.packing.change')}
      </SectionPill>
    );
  } else if (editable && packing.link) {
    // With Packing off a link cannot be made again, so letting go asks first, in the tour's packing dialog.
    action = (
      <SectionPill onClick={packing.show} icon={<Unlink size={11} strokeWidth={2} />}>
        {t('tours.packing.unlink')}
      </SectionPill>
    );
  }
  return (
    <DialogSection className="flex-none" label={t('tours.packing.label')} action={action}>
      <div data-testid="tour-packing-section">
        <SectionBody packing={packing} canEdit={canEdit} onOpenPacking={onOpenPacking} />
      </div>
      <TourPackingLinkDialog packing={packing} tourName={tourName} />
    </DialogSection>
  );
}
