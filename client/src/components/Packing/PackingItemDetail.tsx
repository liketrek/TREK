import { ChevronDown, Copy, Minus, Plus, Trash2, X } from 'lucide-react';
import { useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';
import { useTranslation } from '../../i18n';
import { useTripStore } from '../../store/tripStore';
import type { PackingBag, PackingItem } from '../../types';
import { NumericInput } from '../shared/NumericInput';
import { useToast } from '../shared/Toast';
import { bringersOf, packingBringerNames } from './packingBringers';
import { BringerAvatar, MoreBringers } from './PackingBringersCard';
import { bringsItem, packingItemAccess, toggledRecipients, type PackingVisibility } from './packingItemAccess';
import { katColor, packedOf } from './packingListPanel.helpers';
import { WeightInput } from './PackingListPanelWeightInput';
import { PackedCounter } from './PackingPackedCounter';
import { PopoverItem } from './PackingPopover';
import { POPOVER, POPOVER_DIVIDER } from './packingPopoverStyles';
import type { TripMember } from './usePackingListPanel';

type ItemPatch = Partial<Pick<PackingItem, 'name' | 'category' | 'quantity' | 'weight_grams' | 'bag_id'>>;
type Save = (data: ItemPatch) => Promise<void>;

export interface PackingItemDetailProps {
  item: PackingItem;
  tripId: number;
  /** The row the window hangs from. */
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  categories: string[];
  canEdit: boolean;
  bagTrackingEnabled?: boolean;
  bags: PackingBag[];
  onCreateBag: (name: string) => Promise<PackingBag | undefined>;
  tripMembers: TripMember[];
  currentUserId?: number;
  onSetSharing?: (id: number, visibility: PackingVisibility, recipientIds: number[]) => void;
  onClone?: (id: number) => void;
  onJoin?: (id: number, userId?: number) => void;
  onLeave?: (id: number, userId: number) => void;
  onDelete: () => void;
}

const WIDTH = 320;
/** Every value of the window sits in the same soft pill: steppers, fields and the choices that open a list. */
const PILL =
  'inline-flex h-7 min-w-0 max-w-full items-center gap-1.5 rounded-full bg-surface-tertiary text-caption font-semibold text-content';
const STEP =
  'grid size-6 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-content-muted hover:text-content disabled:cursor-default disabled:opacity-35';

const dotStyle = (color: string | undefined): CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: color,
  display: 'inline-block',
  flexShrink: 0,
});
const avatarOf = (m: TripMember) => ({ name: m.username, avatar: m.avatar_url ?? m.avatar ?? null });

/** One line of the window: what it is on the left, its value on the right. */
function Field({ name, children }: Readonly<{ name: string; children: ReactNode }>) {
  return (
    <div className="flex min-h-[38px] items-center gap-2.5 px-2.5 py-[3px]">
      <span className="w-[92px] shrink-0 text-caption font-medium text-content-muted">{name}</span>
      <div className="flex min-w-0 flex-1 items-center justify-end">{children}</div>
    </div>
  );
}

/** A pill that opens a short list right under its line, like a select would. */
function Choice({
  open,
  onToggle,
  lead,
  text,
  disabled,
}: Readonly<{ open: boolean; onToggle: () => void; lead?: ReactNode; text: string; disabled: boolean }>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-expanded={open}
      className={`${PILL} border-0 py-0 pe-2 ps-3 font-[inherit] ${disabled ? 'cursor-default pe-3' : 'cursor-pointer'}`}
    >
      {lead}
      <span className="truncate">{text}</span>
      {!disabled && (
        <ChevronDown
          size={13}
          className={`shrink-0 text-content-faint transition-transform ${open ? 'rotate-180' : ''}`}
        />
      )}
    </button>
  );
}

/** The short list a Choice opens, set in under its line. */
function ChoiceList({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="mx-1.5 mb-1 max-h-56 overflow-y-auto rounded-[10px] bg-surface-secondary p-[3px]">{children}</div>
  );
}

/** How many of the item: minus, the number to type into, plus. */
function QuantityStepper({ value, onSave }: Readonly<{ value: number; onSave: (qty: number) => void }>) {
  const { t } = useTranslation();
  // What is being typed while the field has focus; null shows the stored amount.
  const [draft, setDraft] = useState<string | null>(null);
  const commit = (next: number) => {
    const qty = Math.max(1, Math.min(999, next || 1));
    setDraft(null);
    if (qty !== value) onSave(qty);
  };
  return (
    <div className={`${PILL} px-0.5`} role="group" aria-label={t('packing.quantity')}>
      <button
        type="button"
        className={STEP}
        aria-label={t('packing.quantityLess')}
        disabled={value <= 1}
        onClick={() => commit(value - 1)}
      >
        <Minus size={12} strokeWidth={2.5} />
      </button>
      <NumericInput
        value={draft ?? String(value)}
        onValueChange={setDraft}
        onFocus={() => setDraft(String(value))}
        onBlur={() => commit(Number(draft ?? value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className="w-8 border-0 bg-transparent p-0 text-center font-[inherit] text-caption font-semibold text-content outline-none"
      />
      <button
        type="button"
        className={STEP}
        aria-label={t('packing.quantityMore')}
        disabled={value >= 999}
        onClick={() => commit(value + 1)}
      >
        <Plus size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function BagChoice({
  item,
  bags,
  canEdit,
  onCreateBag,
  save,
}: Readonly<{
  item: PackingItem;
  bags: PackingBag[];
  canEdit: boolean;
  onCreateBag: (name: string) => Promise<PackingBag | undefined>;
  save: Save;
}>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [newBag, setNewBag] = useState('');
  const selected = bags.find((b) => b.id === item.bag_id);
  const pick = (bagId: number | null) => {
    setOpen(false);
    if ((item.bag_id ?? null) !== bagId) void save({ bag_id: bagId });
  };
  const create = async () => {
    const name = newBag.trim();
    if (!name) return;
    const bag = await onCreateBag(name);
    if (bag) await save({ bag_id: bag.id });
    setNewBag('');
    setOpen(false);
  };
  return (
    <>
      <Field name={t('packing.detail.bag')}>
        <Choice
          open={open}
          disabled={!canEdit}
          text={selected?.name || t('packing.noBag')}
          onToggle={() => setOpen((o) => !o)}
          lead={selected ? <span aria-hidden style={dotStyle(selected.color)} /> : undefined}
        />
      </Field>
      {open && (
        <ChoiceList>
          <PopoverItem
            label={t('packing.noBag')}
            active={!item.bag_id}
            onClick={() => pick(null)}
            icon={
              <span className="inline-block size-2 rounded-full border-[1.5px] border-dashed border-content-faint" />
            }
          />
          {bags.map((b) => (
            <PopoverItem
              key={b.id}
              label={b.name}
              active={item.bag_id === b.id}
              onClick={() => pick(b.id)}
              icon={<span style={dotStyle(b.color)} />}
            />
          ))}
          {/* A new bag is typed in as one more line of the list: no frame, the
              add as a small round button that darkens once there is a name. */}
          <div className="flex items-center gap-[9px] rounded-[9px] py-1 pe-1.5 ps-2.5">
            <span aria-hidden className="inline-flex w-4 shrink-0 justify-center text-content-faint">
              <Plus size={13} />
            </span>
            <input
              value={newBag}
              onChange={(e) => setNewBag(e.target.value)}
              placeholder={t('packing.addBag')}
              aria-label={t('packing.bagName')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void create();
              }}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 font-[inherit] text-caption text-content outline-none placeholder:text-content-faint"
            />
            <button
              type="button"
              aria-label={t('packing.addBag')}
              onClick={() => void create()}
              disabled={!newBag.trim()}
              className={`grid size-6 shrink-0 place-items-center rounded-full border-0 transition-colors ${newBag.trim() ? 'cursor-pointer bg-accent text-accent-text' : 'cursor-default bg-transparent text-content-faint'}`}
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>
        </ChoiceList>
      )}
    </>
  );
}

/** Who brings a common item: a pill with their faces that opens the trip's people to tick on or off (#3098). */
function Bringers({
  item,
  members,
  onJoin,
  onLeave,
}: Readonly<{
  item: PackingItem;
  members: TripMember[];
  onJoin: (id: number, userId?: number) => void;
  onLeave: (id: number, userId: number) => void;
}>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const faces = bringersOf(item, members);
  const lead =
    faces.length > 0 ? (
      <span className="-ms-2 inline-flex shrink-0">
        <BringerAvatar bringer={faces[0]} />
        {faces.length > 1 && (
          <span className="ms-1.5 inline-flex">
            <MoreBringers count={faces.length - 1} />
          </span>
        )}
      </span>
    ) : undefined;
  return (
    <>
      <Field name={t('packing.bringersTitle')}>
        <Choice
          open={open}
          disabled={false}
          lead={lead}
          text={faces.length > 0 ? packingBringerNames(item) : t('packing.bringersNobody')}
          onToggle={() => setOpen((o) => !o)}
        />
      </Field>
      {open && (
        <ChoiceList>
          {members.map((m) => {
            const on = bringsItem(item, m.id);
            return (
              <PopoverItem
                key={m.id}
                label={m.username}
                active={on}
                icon={<BringerAvatar bringer={avatarOf(m)} />}
                onClick={() => (on ? onLeave(item.id, m.id) : onJoin(item.id, m.id))}
              />
            );
          })}
        </ChoiceList>
      )}
    </>
  );
}

/** Who sees the item: the whole trip, only its owner, or people the owner picks (#858). */
function Visibility({
  item,
  members,
  currentUserId,
  onSetSharing,
}: Readonly<{
  item: PackingItem;
  members: TripMember[];
  currentUserId?: number;
  onSetSharing: (id: number, visibility: PackingVisibility, recipientIds: number[]) => void;
}>) {
  const { t } = useTranslation();
  const { recipientIds, visibility: current } = packingItemAccess(item, currentUserId);
  const [picking, setPicking] = useState(false);
  const shown: PackingVisibility = picking ? 'shared' : current;
  const others = members.filter((m) => m.id !== item.owner_id && m.id !== currentUserId);
  const choose = (next: PackingVisibility) => {
    setPicking(next === 'shared');
    if (next !== 'shared') onSetSharing(item.id, next, []);
  };
  const toggle = (uid: number) => {
    const next = toggledRecipients(recipientIds, uid);
    onSetSharing(item.id, next.visibility, next.recipientIds);
  };
  const options: { id: PackingVisibility; label: string }[] = [
    { id: 'common', label: t('packing.filterAll') },
    { id: 'personal', label: t('packing.visibility.me') },
    { id: 'shared', label: t('packing.visibility.some') },
  ];
  return (
    <>
      <Field name={t('packing.detail.visibility')}>
        <div role="radiogroup" aria-label={t('packing.detail.visibility')} className={`${PILL} gap-0 p-0.5`}>
          {options.map((o) => (
            <button
              type="button"
              role="radio"
              key={o.id}
              aria-checked={shown === o.id}
              onClick={() => choose(o.id)}
              className={`h-6 cursor-pointer whitespace-nowrap rounded-full border-0 px-3 font-[inherit] text-caption font-semibold transition-colors ${shown === o.id ? 'bg-surface-card text-content shadow-sm' : 'bg-transparent text-content-muted hover:text-content'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Field>
      {shown === 'shared' && (
        <ChoiceList>
          {others.length === 0 ? (
            <div className="px-2 py-1.5 text-caption text-content-faint">{t('packing.noOneToShare')}</div>
          ) : (
            others.map((m) => (
              <PopoverItem
                key={m.id}
                label={m.username}
                active={recipientIds.includes(m.id)}
                onClick={() => toggle(m.id)}
                icon={<BringerAvatar bringer={avatarOf(m)} />}
              />
            ))
          )}
        </ChoiceList>
      )}
    </>
  );
}

function DetailHead({
  item,
  canEdit,
  save,
  onClose,
}: Readonly<{ item: PackingItem; canEdit: boolean; save: Save; onClose: () => void }>) {
  const { t } = useTranslation();
  const [name, setName] = useState(item.name);
  const commit = () => {
    const next = name.trim();
    if (!next) {
      setName(item.name);
      return;
    }
    if (next !== item.name) void save({ name: next });
  };
  return (
    <div className="flex items-center gap-2 py-1.5 pe-1.5 ps-2.5">
      {canEdit ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          aria-label={t('common.rename')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          className="min-w-0 flex-1 border-0 bg-transparent py-0.5 font-[inherit] text-body font-bold text-content outline-none"
        />
      ) : (
        <span className="min-w-0 flex-1 truncate text-body font-bold">{item.name}</span>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label={t('common.close')}
        className="flex cursor-pointer rounded-md border-0 bg-transparent p-1 text-content-faint hover:text-content"
      >
        <X size={15} />
      </button>
    </div>
  );
}

function ListChoice({
  item,
  categories,
  canEdit,
  save,
}: Readonly<{ item: PackingItem; categories: string[]; canEdit: boolean; save: Save }>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const category = item.category || t('packing.defaultCategory');
  return (
    <>
      <Field name={t('packing.detail.list')}>
        <Choice
          open={open}
          disabled={!canEdit}
          text={category}
          onToggle={() => setOpen((o) => !o)}
          lead={<span aria-hidden style={dotStyle(katColor(category, categories))} />}
        />
      </Field>
      {open && (
        <ChoiceList>
          {categories.map((cat) => (
            <PopoverItem
              key={cat}
              label={cat}
              active={cat === category}
              icon={<span style={dotStyle(katColor(cat, categories))} />}
              onClick={() => {
                setOpen(false);
                if (cat !== category) void save({ category: cat });
              }}
            />
          ))}
        </ChoiceList>
      )}
    </>
  );
}

/** Amount, pieces packed and weight: the three numbers of an item. */
function Amounts({
  item,
  tripId,
  canEdit,
  bagTrackingEnabled,
  save,
}: Readonly<{ item: PackingItem; tripId: number; canEdit: boolean; bagTrackingEnabled?: boolean; save: Save }>) {
  const { t } = useTranslation();
  const setPackedCount = useTripStore((s) => s.setPackedCount);
  const quantity = item.quantity || 1;
  return (
    <>
      {canEdit && (
        <Field name={t('packing.quantity')}>
          <QuantityStepper value={quantity} onSave={(qty) => void save({ quantity: qty })} />
        </Field>
      )}
      {canEdit && quantity > 1 && (
        <Field name={t('packing.printPacked')}>
          <PackedCounter
            packed={packedOf(item)}
            quantity={quantity}
            onChange={(count) => setPackedCount(tripId, item.id, count)}
            style={{ height: 28, padding: '0 2px' }}
          />
        </Field>
      )}
      {bagTrackingEnabled && (
        <Field name={t('packing.totalWeight')}>
          <div className={`${PILL} px-3`}>
            <WeightInput
              value={item.weight_grams}
              readOnly={!canEdit}
              width={52}
              onSave={(grams) => save({ weight_grams: grams })}
            />
            <span className="text-content-faint">g</span>
          </div>
        </Field>
      )}
    </>
  );
}

/** Which of the people sections the window shows, and with which handlers. */
function sectionsFor({
  item,
  canEdit,
  tripMembers,
  currentUserId,
  onSetSharing,
  onClone,
  onJoin,
  onLeave,
}: Readonly<PackingItemDetailProps>) {
  const { isCommon, isOwner, sharedToMe, canClone } = packingItemAccess(item, currentUserId);
  const bringers = canEdit && isCommon && onJoin && onLeave && tripMembers.length > 0 ? { onJoin, onLeave } : null;
  const sharing = canEdit && isOwner && onSetSharing ? onSetSharing : null;
  const clone = canEdit && canClone && onClone ? onClone : null;
  return { bringers, sharing, sharedToMe, clone };
}

/**
 * Everything about one packing item in one small window at its row: which list,
 * how many and how many are packed, weight and bag, who brings it and who sees
 * it, and the copy and delete actions. The row only shows what is set, so this
 * is where every choice lives, each one a pill that opens at most one short list.
 */
export function PackingItemDetail(props: Readonly<PackingItemDetailProps>) {
  const {
    item,
    tripId,
    anchorRef,
    onClose,
    categories,
    canEdit,
    bagTrackingEnabled,
    bags,
    onCreateBag,
    tripMembers,
    currentUserId,
    onDelete,
  } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const updatePackingItem = useTripStore((s) => s.updatePackingItem);
  const box = useAnchoredPosition(anchorRef, true, { estimatedHeight: 460, offset: 6 });
  if (!box) return null;

  const save: Save = async (data) => {
    try {
      await updatePackingItem(tripId, item.id, data);
    } catch {
      toast.error(t('packing.toast.saveError'));
    }
  };
  const { bringers, sharing, sharedToMe, clone } = sectionsFor(props);

  return createPortal(
    <>
      <div role="presentation" className="fixed inset-0 z-[var(--z-toast)]" onClick={onClose} />
      <div
        role="dialog"
        aria-label={item.name}
        className="trek-menu-enter fixed z-[var(--z-toast)] overflow-y-auto"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
          }
        }}
        style={{
          ...POPOVER,
          width: `min(${WIDTH}px, calc(100vw - 16px))`,
          top: box.top,
          bottom: box.bottom,
          maxHeight: box.maxHeight,
          left: Math.max(8, Math.min(box.left + box.width - WIDTH, window.innerWidth - WIDTH - 8)), // rtl-lint-disable: measured position
        }}
      >
        <DetailHead key={item.name} item={item} canEdit={canEdit} save={save} onClose={onClose} />
        <ListChoice item={item} categories={categories} canEdit={canEdit} save={save} />
        <Amounts item={item} tripId={tripId} canEdit={canEdit} bagTrackingEnabled={bagTrackingEnabled} save={save} />
        {bagTrackingEnabled && (
          <BagChoice item={item} bags={bags} canEdit={canEdit} onCreateBag={onCreateBag} save={save} />
        )}

        {(bringers || sharing || sharedToMe) && <div style={POPOVER_DIVIDER} />}
        {bringers && <Bringers item={item} members={tripMembers} onJoin={bringers.onJoin} onLeave={bringers.onLeave} />}
        {sharing && (
          <Visibility item={item} members={tripMembers} currentUserId={currentUserId} onSetSharing={sharing} />
        )}
        {sharedToMe && (
          <div className="px-2.5 py-1.5 text-caption text-content-muted">
            {t('packing.takenCareOf', { name: item.owner_username || '' })}
          </div>
        )}

        {canEdit && (
          <>
            <div style={POPOVER_DIVIDER} />
            {clone && (
              <PopoverItem
                icon={<Copy size={13} />}
                label={t('packing.cloneToMine')}
                onClick={() => {
                  clone(item.id);
                  onClose();
                }}
              />
            )}
            <PopoverItem
              icon={<Trash2 size={13} />}
              label={t('common.delete')}
              danger
              onClick={() => {
                onClose();
                onDelete();
              }}
            />
          </>
        )}
      </div>
    </>,
    document.body
  );
}
