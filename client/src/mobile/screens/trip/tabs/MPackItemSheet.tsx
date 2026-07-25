import { useEffect, useRef, useState } from 'react'
import { Check, Copy, HandHelping, Share2, UserRound, Users } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { Eyebrow, FIELD_CLS, FormSheetFooter, FormSheetHeader } from '../sheets/PlSheetChrome'
import { avatarSrc } from '../../../../utils/avatarSrc'
import type { PackingItem, TripMember } from '../../../../types'
import type { TripPlanner } from '../MTripShell'
import { isPackingPlaceholder } from './listsModel'

export interface MPackItemSheetProps {
  planner: TripPlanner
  open: boolean
  /** The row re-derives the live item by id each render (WebSocket-safe), like MTransportSheet. */
  itemId: number | null
  bagTrackingEnabled: boolean
  tripMembers: TripMember[]
  currentUserId: number | null
  onClose: () => void
}

/**
 * Item editor (spec 03 §4.4 `r.edit`): name, quantity, weight (bag-tracking
 * only) and the three-tier sharing control (#858) — Common / Personal /
 * Shared-with-picker for the owner, a "bring it too" pledge + clone for a
 * non-owner viewing a Common item, or a read-only note for a recipient.
 * Category and bag stay on the row itself (colour dot / bag picker), not
 * duplicated here.
 */
export default function MPackItemSheet({
  planner, open, itemId, bagTrackingEnabled, tripMembers, currentUserId, onClose,
}: MPackItemSheetProps) {
  const { t, toast, tripId, tripActions } = planner

  const liveItem = itemId != null ? planner.packingItems.find(i => i.id === itemId) ?? null : null
  const heldRef = useRef<PackingItem | null>(null)
  if (liveItem) heldRef.current = liveItem
  const item = liveItem ?? heldRef.current

  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [weight, setWeight] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !item) return
    setName(isPackingPlaceholder(item) ? '' : item.name)
    setQuantity(String(item.quantity || 1))
    setWeight(item.weight_grams != null ? String(item.weight_grams) : '')
  }, [open, item])

  if (!item) {
    return <MSheet open={false} onClose={onClose} />
  }

  const isPlaceholder = isPackingPlaceholder(item)
  const isCommon = !item.is_private
  const isOwner = item.owner_id == null || item.owner_id === currentUserId
  const recipientIds = (item.recipients || []).map(r => r.user_id)
  const visibility: 'common' | 'personal' | 'shared' = isCommon ? 'common' : recipientIds.length > 0 ? 'shared' : 'personal'
  const iAmContributor = (item.contributors || []).some(c => c.user_id === currentUserId)
  const others = tripMembers.filter(m => m.id !== item.owner_id && m.id !== currentUserId)

  const setSharing = (nextVisibility: 'common' | 'personal' | 'shared', nextRecipients: number[]) => {
    tripActions.setPackingItemSharing(tripId, item.id, nextVisibility, nextRecipients)
  }
  const toggleRecipient = (userId: number) => {
    const next = recipientIds.includes(userId) ? recipientIds.filter(id => id !== userId) : [...recipientIds, userId]
    setSharing('shared', next)
  }
  const toggleContribute = () => {
    if (iAmContributor) {
      if (currentUserId != null) tripActions.removePackingContributor(tripId, item.id, currentUserId)
    } else {
      tripActions.addPackingContributor(tripId, item.id)
    }
  }
  const cloneItem = () => {
    tripActions.clonePackingItem(tripId, item.id)
    onClose()
  }

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName || saving) { onClose(); return }
    setSaving(true)
    try {
      const qty = Math.max(1, Math.min(999, parseInt(quantity, 10) || 1))
      const weightVal = weight.trim() === '' ? null : Math.max(0, parseInt(weight, 10) || 0)
      await tripActions.updatePackingItem(tripId, item.id, {
        name: trimmedName,
        quantity: qty,
        ...(bagTrackingEnabled ? { weight_grams: weightVal } : {}),
      })
      onClose()
    } catch {
      toast.error(t('packing.toast.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const pillCls = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-[6px] rounded-full px-3 py-[9px] text-[0.75rem] font-semibold ${
      active ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'
    }`

  return (
    <MSheet open={open} onClose={onClose} ariaLabel={t('packing.editItem')}>
      <FormSheetHeader
        title={t('packing.editItem')}
        subtitle={item.category || t('packing.defaultCategory')}
        onClose={onClose}
        closeLabel={t('common.close')}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[6px] pt-1">
        <Eyebrow className="mb-[5px] uppercase">{t('packing.itemName')}</Eyebrow>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={isPlaceholder ? t('packing.addItemPlaceholder') : undefined}
          className={FIELD_CLS}
        />

        <div className="mt-3 flex gap-2">
          <div className="min-w-0 flex-1">
            <Eyebrow className="mb-[5px] uppercase">{t('packing.itemQuantity')}</Eyebrow>
            <input
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={e => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
              className={`${FIELD_CLS} text-center tabular-nums`}
            />
          </div>
          {bagTrackingEnabled && (
            <div className="min-w-0 flex-1">
              <Eyebrow className="mb-[5px] uppercase">{t('packing.itemWeight')}</Eyebrow>
              <input
                type="text"
                inputMode="numeric"
                value={weight}
                onChange={e => setWeight(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="—"
                className={`${FIELD_CLS} text-center tabular-nums`}
              />
            </div>
          )}
        </div>

        {!isPlaceholder && (
          <>
            <Eyebrow className="mb-[6px] mt-4 uppercase">{t('packing.share')}</Eyebrow>

            {!isOwner && isCommon && (
              <div className="rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3">
                {item.owner_username && (
                  <div className="mb-[9px] font-geist text-[0.6875rem] text-m-muted">
                    {t('packing.broughtBy', { name: item.owner_username })}
                  </div>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={toggleContribute} className={pillCls(iAmContributor)}>
                    <HandHelping size={13} strokeWidth={2} />
                    {iAmContributor ? t('packing.alsoBringingStop') : t('packing.alsoBring')}
                  </button>
                  <button type="button" onClick={cloneItem} className={pillCls(false)}>
                    <Copy size={13} strokeWidth={2} />
                    {t('packing.cloneToMine')}
                  </button>
                </div>
              </div>
            )}

            {!isOwner && !isCommon && (
              <div className="rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3 font-geist text-[0.6875rem] text-m-muted">
                {item.owner_username ? t('packing.takenCareOf', { name: item.owner_username }) : t('packing.tierPersonalHint')}
              </div>
            )}

            {isOwner && (
              <div className="flex flex-col gap-[6px]">
                <div className="flex gap-[6px]">
                  <button type="button" onClick={() => setSharing('common', [])} className={pillCls(visibility === 'common')}>
                    <Users size={13} strokeWidth={2} />
                    {t('packing.viewCommon')}
                  </button>
                  <button type="button" onClick={() => setSharing('personal', [])} className={pillCls(visibility === 'personal')}>
                    <UserRound size={13} strokeWidth={2} />
                    {t('packing.tierPersonal')}
                  </button>
                </div>

                <div className="mt-1 flex items-center gap-[5px] font-geist text-[0.625rem] font-bold uppercase tracking-[.06em] text-m-faint">
                  <Share2 size={11} strokeWidth={2.2} />
                  {t('packing.tierShared')}
                </div>
                <div className="flex flex-col gap-1 rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[6px]">
                  {others.length === 0 ? (
                    <div className="px-2 py-1 font-geist text-[0.6875rem] text-m-faint">{t('packing.noOneToShare')}</div>
                  ) : (
                    others.map(m => {
                      const on = recipientIds.includes(m.id)
                      const src = m.avatar_url || avatarSrc(m.avatar)
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleRecipient(m.id)}
                          className="flex items-center gap-[8px] rounded-[9px] px-[8px] py-[7px] text-left"
                        >
                          <span className="flex h-[22px] w-[22px] flex-none items-center justify-center overflow-hidden rounded-full bg-m-act text-[0.625rem] font-bold text-m-actfg">
                            {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : m.username[0]?.toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-semibold text-m-ink">{m.username}</span>
                          {on && <Check size={14} strokeWidth={2.4} className="flex-none text-m-ink" />}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <FormSheetFooter
        onCancel={onClose}
        cancelLabel={t('common.cancel')}
        onSubmit={handleSave}
        submitLabel={t('common.save')}
        submitDisabled={!name.trim() || saving}
      />
    </MSheet>
  )
}
