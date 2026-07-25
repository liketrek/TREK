import { useEffect, useState } from 'react'
import { Check, Hotel, MapPin, X } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import MIconBtn from '../../../components/MIconBtn'
import CustomSelect from '../../../../components/shared/CustomSelect'
import CustomTimePicker from '../../../../components/shared/CustomTimePicker'
import { accommodationsApi } from '../../../../api/client'
import { useTranslation } from '../../../../i18n'
import { Eyebrow } from './MTripSheetUi'
import type { MTripSheetsProps } from '../MTripShell'

interface AccommodationPayload {
  dayId?: number
  /** Present = edit an existing accommodation, absent = add. */
  accId?: number
}

interface HotelForm {
  check_in: string
  check_in_end: string
  check_out: string
  confirmation: string
  place_id: number | null
}

const EMPTY_FORM: HotelForm = { check_in: '', check_in_end: '', check_out: '', confirmation: '', place_id: null }

/**
 * Add/edit accommodation sheet — the mobile counterpart of the desktop
 * HotelPickerModal (day-plan panel). Marks one of the trip's places as a stay
 * across a day range, with check-in/until/check-out times and a confirmation
 * code. Opened from the day sheet's "Add accommodation" button; saving goes
 * through accommodationsApi and refreshes the planner's tripAccommodations.
 */
export default function MAccommodationSheet({ planner, shell }: MTripSheetsProps) {
  const { t, locale } = useTranslation()
  const open = shell.sheet?.id === 'accommodation'
  const payload = (shell.sheet?.payload ?? {}) as AccommodationPayload
  const { days, places, categories, tripId } = planner

  const editing = payload.accId != null
    ? planner.tripAccommodations.find(a => a.id === payload.accId) ?? null
    : null

  const [range, setRange] = useState<{ start: number; end: number }>(() => ({
    start: days[0]?.id ?? 0,
    end: days[days.length - 1]?.id ?? 0,
  }))
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null)
  const [form, setForm] = useState<HotelForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Seed on open. Default range checks out the next day (matches the desktop).
  useEffect(() => {
    if (!open) return
    if (editing) {
      setRange({ start: editing.start_day_id, end: editing.end_day_id })
      setForm({
        check_in: editing.check_in || '',
        check_in_end: editing.check_in_end || '',
        check_out: editing.check_out || '',
        confirmation: editing.confirmation || '',
        place_id: editing.place_id ?? null,
      })
    } else {
      const idx = days.findIndex(d => d.id === payload.dayId)
      setRange({ start: payload.dayId ?? 0, end: (idx >= 0 && days[idx + 1]?.id) || payload.dayId || 0 })
      setForm(EMPTY_FORM)
    }
    setCategoryFilter(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payload.dayId, payload.accId])

  // Cancelling / saving returns to the day sheet it was opened from.
  const back = () => shell.openSheet('day', { dayId: payload.dayId })

  const firstId = days[0]?.id
  const lastId = days[days.length - 1]?.id
  const allDays = days.length > 0 && range.start === firstId && range.end === lastId

  const dayOptions = days.map((d, i) => ({
    value: d.id,
    label: d.title || t('planner.dayN', { n: i + 1 }),
    badge: d.date
      ? new Date(d.date + 'T00:00:00Z').toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
      : (d.title ? t('planner.dayN', { n: i + 1 }) : undefined),
  }))

  const filteredPlaces = categoryFilter != null ? places.filter(p => p.category_id === categoryFilter) : places

  const save = async () => {
    if (!form.place_id || saving) return
    setSaving(true)
    try {
      const body = {
        place_id: form.place_id,
        start_day_id: range.start,
        end_day_id: range.end,
        check_in: form.check_in || null,
        check_in_end: form.check_in_end || null,
        check_out: form.check_out || null,
        confirmation: form.confirmation || null,
      }
      if (editing) await accommodationsApi.update(tripId, editing.id, body)
      else await accommodationsApi.create(tripId, body)
      planner.loadAccommodations()
      back()
    } catch {
      planner.toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <MSheet
      open={open}
      onClose={back}
      variant="card"
      material="glass"
      ariaLabel={editing ? t('day.editAccommodation') : t('day.addAccommodation')}
    >
      {/* Header — mirrors the place detail sheet's chrome */}
      <div className="flex-none px-[18px] pt-4">
        <div className="flex items-center gap-3">
          <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[14px] bg-[color:var(--m-ic)] text-m-muted">
            <Hotel size={18} strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1 text-[1rem] font-bold">
            {editing ? t('day.editAccommodation') : t('day.addAccommodation')}
          </div>
          <MIconBtn variant="neutral" size={34} onClick={back} ariaLabel={t('common.close')}>
            <X size={15} strokeWidth={2.2} />
          </MIconBtn>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[16px]">
        {/* Apply to days */}
        <Eyebrow className="mb-[6px] mt-[14px]">{t('day.hotelDayRange')}</Eyebrow>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <CustomSelect
              value={range.start}
              onChange={v => setRange(prev => {
                const id = Number(v)
                return { start: id, end: days.findIndex(d => d.id === id) > days.findIndex(d => d.id === prev.end) ? id : prev.end }
              })}
              options={dayOptions}
              size="sm"
            />
          </div>
          <span className="flex-none text-m-faint">→</span>
          <div className="min-w-0 flex-1">
            <CustomSelect
              value={range.end}
              onChange={v => setRange(prev => {
                const id = Number(v)
                return { start: days.findIndex(d => d.id === id) < days.findIndex(d => d.id === prev.start) ? id : prev.start, end: id }
              })}
              options={dayOptions}
              size="sm"
            />
          </div>
          <button
            type="button"
            onClick={() => setRange({ start: firstId ?? 0, end: lastId ?? 0 })}
            className={`flex-none rounded-full px-[14px] py-[7px] text-[0.71875rem] font-semibold ${
              allDays ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'
            }`}
          >
            {t('day.allDays')}
          </button>
        </div>

        {/* Check-in / until / check-out */}
        <div className="mt-3 flex gap-2">
          <div className="min-w-0 flex-1">
            <Eyebrow className="mb-[4px]">{t('day.checkIn')}</Eyebrow>
            <CustomTimePicker value={form.check_in} onChange={v => setForm(f => ({ ...f, check_in: v }))} placeholder="14:00" />
          </div>
          <div className="min-w-0 flex-1">
            <Eyebrow className="mb-[4px]">{t('day.checkInUntil')}</Eyebrow>
            <CustomTimePicker value={form.check_in_end} onChange={v => setForm(f => ({ ...f, check_in_end: v }))} placeholder="22:00" />
          </div>
          <div className="min-w-0 flex-1">
            <Eyebrow className="mb-[4px]">{t('day.checkOut')}</Eyebrow>
            <CustomTimePicker value={form.check_out} onChange={v => setForm(f => ({ ...f, check_out: v }))} placeholder="11:00" />
          </div>
        </div>

        {/* Confirmation */}
        <Eyebrow className="mb-[5px] mt-3">{t('day.confirmation')}</Eyebrow>
        <input
          type="text"
          value={form.confirmation}
          onChange={e => setForm(f => ({ ...f, confirmation: e.target.value }))}
          placeholder="ABC-12345"
          className="box-border w-full rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[10px] text-[0.8125rem] font-medium text-m-ink outline-none placeholder:text-m-faint"
        />

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-[6px]">
            <FilterChip active={categoryFilter == null} onClick={() => setCategoryFilter(null)} label={t('day.allDays')} />
            {categories.map(c => (
              <FilterChip
                key={c.id}
                active={categoryFilter === c.id}
                color={c.color}
                onClick={() => setCategoryFilter(c.id)}
                label={c.name}
              />
            ))}
          </div>
        )}

        {/* Place picker */}
        <Eyebrow className="mb-[6px] mt-3">{t('reservations.meta.pickHotel')}</Eyebrow>
        {filteredPlaces.length === 0 ? (
          <p className="rounded-[14px] bg-[color:var(--m-ic)] px-3 py-6 text-center font-geist text-[0.75rem] text-m-faint">
            {t('day.noPlacesForHotel')}
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filteredPlaces.map(p => {
              const sel = form.place_id === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, place_id: p.id }))}
                  className={`flex items-center gap-[10px] rounded-[14px] border px-3 py-[9px] text-left ${
                    sel ? 'border-[color:var(--m-act)] bg-[color:var(--m-inner)]' : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]'
                  }`}
                >
                  <div className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-[10px] bg-[color:var(--m-card)]">
                    {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <MapPin size={14} className="text-m-faint" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.8125rem] font-semibold text-m-ink">{p.name}</div>
                    {p.address && <div className="truncate font-geist text-[0.65625rem] text-m-muted">{p.address}</div>}
                  </div>
                  {sel && (
                    <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-m-act text-m-actfg">
                      <Check size={13} strokeWidth={2.4} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-none gap-2 p-[0_18px_16px]">
        <button type="button" onClick={back} className="flex-1 rounded-full bg-[color:var(--m-ic)] py-[10px] text-[0.8125rem] font-semibold text-m-ink">
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!form.place_id || saving}
          className="flex-1 rounded-full bg-m-act py-[10px] text-[0.8125rem] font-semibold text-m-actfg disabled:opacity-50"
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </MSheet>
  )
}

function FilterChip({ active, color, onClick, label }: {
  active: boolean
  color?: string | null
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-[11px] py-[5px] font-geist text-[0.65625rem] font-bold ${active ? 'text-white' : 'bg-[color:var(--m-ic)] text-m-muted'}`}
      style={active ? { background: color || 'var(--m-act)' } : undefined}
    >
      {label}
    </button>
  )
}
