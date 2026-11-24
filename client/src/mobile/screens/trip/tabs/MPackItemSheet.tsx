import { useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, Copy, Minus, Plus, Trash2 } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { FIELD_CLS, FormSheetBody, FormSheetHeader } from '../sheets/PlSheetChrome'
import { avatarSrc } from '../../../../utils/avatarSrc'
import type { PackingBag, PackingItem, TripMember } from '../../../../types'
import type { TripPlanner } from '../MTripShell'
import { isPackingPlaceholder } from '../../../../components/Packing/packingListModel'
import { katColor, packedOf } from '../../../../components/Packing/packingListPanel.helpers'
import { bringsItem, packingItemAccess, toggledRecipients, type PackingVisibility } from '../../../../components/Packing/packingItemAccess'
import { packingBringerNames } from '../../../../components/Packing/packingBringers'

export interface MPackItemSheetProps {
  planner: TripPlanner
  open: boolean
  /** The row re-derives the live item by id each render (WebSocket-safe), like MTransportSheet. */
  itemId: number | null
  bagTrackingEnabled: boolean
  tripMembers: TripMember[]
  currentUserId: number | null
  categories: string[]
  bags: PackingBag[]
  onCreateBag: (name: string) => Promise<PackingBag | undefined>
  onDelete: (item: PackingItem) => void
  onClose: () => void
}

type ItemPatch = Partial<Pick<PackingItem, 'name' | 'category' | 'quantity' | 'weight_grams' | 'bag_id'>>
type Open = 'list' | 'bag' | 'bringers' | null

const PILL = 'inline-flex h-8 min-w-0 max-w-full items-center gap-1.5 rounded-full bg-m-ic text-caption font-semibold text-m-ink'
const STEP = 'flex h-8 w-8 items-center justify-center text-m-muted disabled:opacity-30'

/** One line of the sheet: what it is on the left, its value on the right. */
function Line({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="flex min-h-[46px] items-center gap-3 border-b border-m-rowbr py-[7px] last:border-b-0">
      <span className="w-[96px] flex-none text-caption font-medium text-m-muted">{label}</span>
      <div className="flex min-w-0 flex-1 justify-end">{children}</div>
    </div>
  )
}

/** A pill that opens its choices under the line, like a select. */
function ChoicePill({ open, onToggle, lead, text, disabled = false }: Readonly<{ open: boolean; onToggle: () => void; lead?: ReactNode; text: string; disabled?: boolean }>) {
  return (
    <button type="button" onClick={onToggle} disabled={disabled} aria-expanded={open} className={`${PILL} pe-2.5 ps-3`}>
      {lead}
      <span className="truncate">{text}</span>
      {!disabled && <ChevronDown size={14} strokeWidth={2.2} className={`flex-none text-m-faint transition-transform ${open ? 'rotate-180' : ''}`} />}
    </button>
  )
}

function Choices({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="mb-2 flex flex-col overflow-hidden rounded-[14px] bg-m-ic">{children}</div>
}

function ChoiceRow({ lead, label, on, onClick, danger = false }: Readonly<{ lead?: ReactNode; label: string; on?: boolean; onClick: () => void; danger?: boolean }>) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-[10px] border-b border-m-rowbr px-3 py-[10px] text-start text-body font-medium last:border-b-0 ${danger ? 'text-[color:var(--m-st-danger)]' : 'text-m-ink'}`}>
      {lead && <span className="flex w-5 flex-none justify-center">{lead}</span>}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {on && <Check size={15} strokeWidth={2.4} className="flex-none" />}
    </button>
  )
}

function Dot({ color, dashed = false }: Readonly<{ color?: string; dashed?: boolean }>) {
  return <span aria-hidden className={`inline-block h-[9px] w-[9px] flex-none rounded-full ${dashed ? 'border border-dashed border-m-faint' : ''}`} style={dashed ? undefined : { background: color }} />
}

function Face({ member }: Readonly<{ member: TripMember }>) {
  const src = member.avatar_url || avatarSrc(member.avatar)
  return (
    <span aria-hidden className="flex h-[22px] w-[22px] flex-none items-center justify-center overflow-hidden rounded-full bg-m-act text-[0.625rem] font-bold text-m-actfg">
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : member.username[0]?.toUpperCase()}
    </span>
  )
}

/** Minus, the number, plus: amount and pieces packed share the look. */
function Stepper({ value, min, max, display, label, lessLabel, moreLabel, onChange }: Readonly<{
  value: number; min: number; max: number; display: string; label: string; lessLabel: string; moreLabel: string; onChange: (next: number) => void
}>) {
  return (
    <div role="group" aria-label={label} className={PILL}>
      <button type="button" aria-label={lessLabel} disabled={value <= min} onClick={() => onChange(value - 1)} className={STEP}><Minus size={13} strokeWidth={2.6} /></button>
      <span className="min-w-[34px] text-center tabular-nums">{display}</span>
      <button type="button" aria-label={moreLabel} disabled={value >= max} onClick={() => onChange(value + 1)} className={STEP}><Plus size={13} strokeWidth={2.6} /></button>
    </div>
  )
}

/**
 * Everything about one packing item, as one sheet: name, list, amount and
 * pieces packed, weight and bag, who brings it and who sees it, copy and delete.
 * Each change saves on its own, like the desktop window it mirrors; the rows of
 * the list itself stay short because all of this lives here.
 */
export default function MPackItemSheet({
  planner, open, itemId, bagTrackingEnabled, tripMembers, currentUserId, categories, bags, onCreateBag, onDelete, onClose,
}: MPackItemSheetProps) {
  const { t, toast, tripId, tripActions } = planner
  const liveItem = itemId != null ? planner.packingItems.find(i => i.id === itemId) ?? null : null
  const heldRef = useRef<PackingItem | null>(null)
  if (liveItem) heldRef.current = liveItem
  const item = liveItem ?? heldRef.current

  const [openChoice, setOpenChoice] = useState<Open>(null)
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [weightDraft, setWeightDraft] = useState<string | null>(null)
  const [newBag, setNewBag] = useState('')
  const [picking, setPicking] = useState(false)

  if (!item) return <MSheet open={false} onClose={onClose} />

  const close = () => { setOpenChoice(null); setPicking(false); setNameDraft(null); onClose() }
  const save = async (patch: ItemPatch) => {
    try { await tripActions.updatePackingItem(tripId, item.id, patch) } catch { toast.error(t('packing.toast.saveError')) }
  }
  const toggleChoice = (which: Exclude<Open, null>) => setOpenChoice(c => (c === which ? null : which))

  const isPlaceholder = isPackingPlaceholder(item)
  const canEdit = planner.can('packing_edit', planner.trip)
  const access = packingItemAccess(item, currentUserId)
  const category = item.category || t('packing.defaultCategory')
  const quantity = item.quantity || 1
  const selectedBag = bags.find(b => b.id === item.bag_id)
  const shownVisibility: PackingVisibility = picking ? 'shared' : access.visibility
  const others = tripMembers.filter(m => m.id !== item.owner_id && m.id !== currentUserId)
  const bringerFaces = tripMembers.filter(m => bringsItem(item, m.id))

  const commitName = () => {
    const next = (nameDraft ?? '').trim()
    if (nameDraft !== null && next && next !== item.name) void save({ name: next })
    setNameDraft(null)
  }
  const commitWeight = () => {
    if (weightDraft === null) return
    const grams = weightDraft.trim() === '' ? null : Math.max(0, Number.parseInt(weightDraft, 10) || 0)
    setWeightDraft(null)
    if (grams !== (item.weight_grams ?? null)) void save({ weight_grams: grams })
  }
  const createBag = async () => {
    const name = newBag.trim()
    if (!name) return
    const bag = await onCreateBag(name)
    if (bag) await save({ bag_id: bag.id })
    setNewBag(''); setOpenChoice(null)
  }
  const chooseVisibility = (next: PackingVisibility) => {
    setPicking(next === 'shared')
    if (next !== 'shared') tripActions.setPackingItemSharing(tripId, item.id, next, [])
  }
  const toggleRecipient = (userId: number) => {
    const next = toggledRecipients(access.recipientIds, userId)
    tripActions.setPackingItemSharing(tripId, item.id, next.visibility, next.recipientIds)
  }
  const toggleBringer = (userId: number) => (
    bringsItem(item, userId)
      ? tripActions.removePackingContributor(tripId, item.id, userId)
      : tripActions.addPackingContributor(tripId, item.id, userId)
  )

  const visibilityOptions: { id: PackingVisibility; label: string }[] = [
    { id: 'common', label: t('packing.filterAll') },
    { id: 'personal', label: t('packing.visibility.me') },
    { id: 'shared', label: t('packing.visibility.some') },
  ]

  return (
    <MSheet open={open} onClose={close} form ariaLabel={t('packing.editItem')}>
      <FormSheetHeader title={t('packing.editItem')} subtitle={category} onClose={close} closeLabel={t('common.close')} />
      <FormSheetBody>
        <input
          type="text"
          value={nameDraft ?? (isPlaceholder ? '' : item.name)}
          readOnly={!canEdit}
          onFocus={() => setNameDraft(isPlaceholder ? '' : item.name)}
          onChange={e => setNameDraft(e.target.value)}
          onBlur={commitName}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
          placeholder={t('packing.addItemPlaceholder')}
          aria-label={t('packing.itemName')}
          className={`${FIELD_CLS} mb-2`}
        />

        <Line label={t('packing.detail.list')}>
          <ChoicePill open={openChoice === 'list'} disabled={!canEdit} onToggle={() => toggleChoice('list')} lead={<Dot color={katColor(category, categories)} />} text={category} />
        </Line>
        {openChoice === 'list' && (
          <Choices>
            {categories.map(cat => (
              <ChoiceRow key={cat} lead={<Dot color={katColor(cat, categories)} />} label={cat} on={cat === category}
                onClick={() => { setOpenChoice(null); if (cat !== category) void save({ category: cat }) }} />
            ))}
          </Choices>
        )}

        {canEdit && (
          <Line label={t('packing.quantity')}>
            <Stepper value={quantity} min={1} max={999} display={String(quantity)} label={t('packing.quantity')}
              lessLabel={t('packing.quantityLess')} moreLabel={t('packing.quantityMore')} onChange={qty => void save({ quantity: qty })} />
          </Line>
        )}
        {canEdit && quantity > 1 && (
          <Line label={t('packing.printPacked')}>
            <Stepper value={packedOf(item)} min={0} max={quantity} display={`${packedOf(item)}/${quantity}`} label={t('packing.printPacked')}
              lessLabel={t('packing.packedLess')} moreLabel={t('packing.packedMore')} onChange={count => tripActions.setPackedCount(tripId, item.id, count)} />
          </Line>
        )}
        {bagTrackingEnabled && (
          <Line label={t('packing.totalWeight')}>
            <div className={`${PILL} px-3`}>
              <input
                type="text"
                inputMode="numeric"
                value={weightDraft ?? (item.weight_grams != null ? String(item.weight_grams) : '')}
                readOnly={!canEdit}
                onFocus={() => setWeightDraft(item.weight_grams != null ? String(item.weight_grams) : '')}
                onChange={e => setWeightDraft(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={commitWeight}
                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                placeholder="—"
                aria-label={t('packing.totalWeight')}
                className="w-14 bg-transparent text-end tabular-nums text-m-ink outline-none placeholder:text-m-faint"
              />
              <span className="text-m-faint">g</span>
            </div>
          </Line>
        )}
        {bagTrackingEnabled && (
          <>
            <Line label={t('packing.detail.bag')}>
              <ChoicePill open={openChoice === 'bag'} disabled={!canEdit} onToggle={() => toggleChoice('bag')}
                lead={selectedBag ? <Dot color={selectedBag.color} /> : undefined} text={selectedBag?.name || t('packing.noBag')} />
            </Line>
            {openChoice === 'bag' && (
              <Choices>
                <ChoiceRow lead={<Dot dashed />} label={t('packing.noBag')} on={!item.bag_id}
                  onClick={() => { setOpenChoice(null); if (item.bag_id) void save({ bag_id: null }) }} />
                {bags.map(b => (
                  <ChoiceRow key={b.id} lead={<Dot color={b.color} />} label={b.name} on={item.bag_id === b.id}
                    onClick={() => { setOpenChoice(null); if (item.bag_id !== b.id) void save({ bag_id: b.id }) }} />
                ))}
                <div className="flex items-center gap-[10px] px-3 py-[7px]">
                  <span aria-hidden className="flex w-5 flex-none justify-center text-m-faint"><Plus size={14} /></span>
                  <input value={newBag} onChange={e => setNewBag(e.target.value)} placeholder={t('packing.addBag')} aria-label={t('packing.bagName')}
                    onKeyDown={e => { if (e.key === 'Enter') void createBag() }}
                    className="min-w-0 flex-1 bg-transparent text-body text-m-ink outline-none placeholder:text-m-faint" />
                  <button type="button" onClick={() => void createBag()} disabled={!newBag.trim()} aria-label={t('packing.addBag')}
                    className={`flex h-7 w-7 flex-none items-center justify-center rounded-full ${newBag.trim() ? 'bg-m-act text-m-actfg' : 'text-m-faint'}`}>
                    <Plus size={14} strokeWidth={2.4} />
                  </button>
                </div>
              </Choices>
            )}
          </>
        )}

        {canEdit && !isPlaceholder && access.isCommon && tripMembers.length > 0 && (
          <>
            <Line label={t('packing.bringersTitle')}>
              <ChoicePill open={openChoice === 'bringers'} onToggle={() => toggleChoice('bringers')}
                lead={bringerFaces.length > 0 ? <span className="-ms-1.5 flex"><Face member={bringerFaces[0]} /></span> : undefined}
                text={bringerFaces.length > 0 ? packingBringerNames(item) : t('packing.bringersNobody')} />
            </Line>
            {openChoice === 'bringers' && (
              <Choices>
                {tripMembers.map(m => (
                  <ChoiceRow key={m.id} lead={<Face member={m} />} label={m.username} on={bringsItem(item, m.id)} onClick={() => toggleBringer(m.id)} />
                ))}
              </Choices>
            )}
          </>
        )}

        {canEdit && !isPlaceholder && access.isOwner && (
          <>
            <Line label={t('packing.detail.visibility')}>
              <div role="radiogroup" aria-label={t('packing.detail.visibility')} className={`${PILL} gap-0 p-[3px]`}>
                {visibilityOptions.map(o => (
                  <button key={o.id} type="button" role="radio" aria-checked={shownVisibility === o.id} onClick={() => chooseVisibility(o.id)}
                    className={`h-[26px] whitespace-nowrap rounded-full px-2.5 ${shownVisibility === o.id ? 'bg-m-act text-m-actfg' : 'text-m-muted'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </Line>
            {shownVisibility === 'shared' && (
              <Choices>
                {others.length === 0
                  ? <div className="px-3 py-[10px] text-caption text-m-faint">{t('packing.noOneToShare')}</div>
                  : others.map(m => (
                    <ChoiceRow key={m.id} lead={<Face member={m} />} label={m.username} on={access.recipientIds.includes(m.id)} onClick={() => toggleRecipient(m.id)} />
                  ))}
              </Choices>
            )}
          </>
        )}

        {access.sharedToMe && (
          <p className="my-2 text-caption text-m-muted">
            {item.owner_username ? t('packing.takenCareOf', { name: item.owner_username }) : t('packing.tierPersonalHint')}
          </p>
        )}

        {canEdit && (
          <div className="mt-3 flex flex-col overflow-hidden rounded-[14px] bg-m-ic">
            {access.canClone && !isPlaceholder && (
              <ChoiceRow lead={<Copy size={15} strokeWidth={2} />} label={t('packing.cloneToMine')} onClick={() => { tripActions.clonePackingItem(tripId, item.id); close() }} />
            )}
            <ChoiceRow lead={<Trash2 size={15} strokeWidth={2} />} label={t('common.delete')} danger onClick={() => { close(); onDelete(item) }} />
          </div>
        )}
      </FormSheetBody>
    </MSheet>
  )
}
