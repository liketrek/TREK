import { useRef, useState } from 'react'
import { Check, Link2, Loader2, MapPin, Ticket, TrainFront } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { filesApi } from '../../../../api/client'
import type { TripFile } from '../../../../types'
import type { TripPlanner } from '../MTripShell'
import { Eyebrow, TileHeader } from '../sheets/MTripSheetUi'

interface MFileLinkSheetProps {
  planner: TripPlanner
  /** null closes the sheet; kept mounted through the exit animation via heldRef. */
  file: TripFile | null
  onClose: () => void
}

interface FileLinkRecord {
  id: number
  place_id?: number | string | null
  reservation_id?: number | string | null
}

/**
 * Link picker for a file (spec 03 §5.3 "Verknüpfen", §7.3 m:n): toggles the
 * file's place_id/reservation_id (first link) or an addLink/removeLink file_link
 * record (further links) — the exact two-tier pattern FileManagerAssignModal.tsx
 * uses on desktop, flattened to a single list per section instead of grouping
 * places by day (v1 simplification, see report).
 */
export default function MFileLinkSheet({ planner, file, onClose }: MFileLinkSheetProps) {
  const { t, tripId, places, reservations, TRANSPORT_TYPES, tripActions, toast } = planner
  const open = file != null

  const heldRef = useRef<TripFile | null>(file)
  if (file) heldRef.current = file
  const shown = file ?? heldRef.current

  const [busyKey, setBusyKey] = useState<string | null>(null)

  if (!shown) return <MSheet open={false} onClose={onClose} variant="card" material="glass" />

  const placeIds = new Set<number>()
  if (shown.place_id != null) placeIds.add(shown.place_id)
  for (const id of shown.linked_place_ids || []) if (id != null) placeIds.add(id)

  const resIds = new Set<number>()
  if (shown.reservation_id != null) resIds.add(shown.reservation_id)
  for (const id of shown.linked_reservation_ids || []) if (id != null) resIds.add(id)

  const refresh = () => tripActions.loadFiles(tripId)

  const togglePlace = async (placeId: number) => {
    if (busyKey) return
    const key = `p${placeId}`
    setBusyKey(key)
    try {
      if (placeIds.has(placeId)) {
        if (shown.place_id === placeId) {
          await filesApi.update(tripId, shown.id, { place_id: null })
        } else {
          const linksRes = (await filesApi.getLinks(tripId, shown.id)) as { links: FileLinkRecord[] }
          const link = (linksRes.links || []).find(l => Number(l.place_id) === placeId)
          if (link) await filesApi.removeLink(tripId, shown.id, link.id)
        }
      } else if (shown.place_id == null) {
        await filesApi.update(tripId, shown.id, { place_id: placeId })
      } else {
        await filesApi.addLink(tripId, shown.id, { place_id: placeId })
      }
      refresh()
    } catch {
      toast.error(t('files.toast.assignError'))
    } finally {
      setBusyKey(null)
    }
  }

  const toggleReservation = async (resId: number) => {
    if (busyKey) return
    const key = `r${resId}`
    setBusyKey(key)
    try {
      if (resIds.has(resId)) {
        if (shown.reservation_id === resId) {
          await filesApi.update(tripId, shown.id, { reservation_id: null })
        } else {
          const linksRes = (await filesApi.getLinks(tripId, shown.id)) as { links: FileLinkRecord[] }
          const link = (linksRes.links || []).find(l => Number(l.reservation_id) === resId)
          if (link) await filesApi.removeLink(tripId, shown.id, link.id)
        }
      } else if (shown.reservation_id == null) {
        await filesApi.update(tripId, shown.id, { reservation_id: resId })
      } else {
        await filesApi.addLink(tripId, shown.id, { reservation_id: resId })
      }
      refresh()
    } catch {
      toast.error(t('files.toast.assignError'))
    } finally {
      setBusyKey(null)
    }
  }

  const bookingReservations = reservations.filter(r => !TRANSPORT_TYPES.has(r.type))
  const transportReservations = reservations.filter(r => TRANSPORT_TYPES.has(r.type))
  const isEmpty = places.length === 0 && reservations.length === 0

  return (
    <MSheet open={open} onClose={onClose} variant="card" material="glass" ariaLabel={t('files.linkTitle')}>
      <div className="flex-none px-[18px] pt-4">
        <TileHeader
          icon={<Link2 size={19} strokeWidth={1.8} />}
          title={t('files.linkTitle')}
          sub={shown.original_name}
          onClose={onClose}
          closeLabel={t('common.close')}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px]">
        {isEmpty && (
          <div className="py-8 text-center font-geist text-[0.78125rem] text-m-faint">{t('files.linkEmpty')}</div>
        )}

        {places.length > 0 && (
          <>
            <Eyebrow className="mb-[6px] mt-3">{t('files.assignPlace')}</Eyebrow>
            <div className="flex flex-col gap-1">
              {places.map(p => (
                <LinkRow key={`p${p.id}`} icon={MapPin} label={p.name} active={placeIds.has(p.id)} busy={busyKey === `p${p.id}`} onClick={() => togglePlace(p.id)} />
              ))}
            </div>
          </>
        )}

        {bookingReservations.length > 0 && (
          <>
            <Eyebrow className="mb-[6px] mt-3">{t('files.assignBooking')}</Eyebrow>
            <div className="flex flex-col gap-1">
              {bookingReservations.map(r => (
                <LinkRow key={`r${r.id}`} icon={Ticket} label={r.title} active={resIds.has(r.id)} busy={busyKey === `r${r.id}`} onClick={() => toggleReservation(r.id)} />
              ))}
            </div>
          </>
        )}

        {transportReservations.length > 0 && (
          <>
            <Eyebrow className="mb-[6px] mt-3">{t('files.assignTransport')}</Eyebrow>
            <div className="flex flex-col gap-1">
              {transportReservations.map(r => (
                <LinkRow key={`r${r.id}`} icon={TrainFront} label={r.title} active={resIds.has(r.id)} busy={busyKey === `r${r.id}`} onClick={() => toggleReservation(r.id)} />
              ))}
            </div>
          </>
        )}
      </div>
    </MSheet>
  )
}

function LinkRow({ icon: Icon, label, active, busy, onClick }: {
  icon: LucideIcon
  label: string
  active: boolean
  busy: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`flex w-full items-center gap-[10px] rounded-[13px] border px-3 py-[10px] text-left disabled:opacity-60 ${
        active ? 'border-[color:var(--m-act)] bg-[color:var(--m-ic)]' : 'border-[color:var(--m-rowbr)] bg-m-card'
      }`}
    >
      <Icon size={14} strokeWidth={2} className="flex-none text-m-muted" />
      <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-m-ink">{label}</span>
      {busy ? (
        <Loader2 size={14} className="flex-none animate-spin text-m-faint" />
      ) : active ? (
        <Check size={15} strokeWidth={2.5} className="flex-none text-m-act" />
      ) : null}
    </button>
  )
}
