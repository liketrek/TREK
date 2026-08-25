import { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, Building2, Calendar, CalendarRange, CalendarX, ChevronDown, Globe, GraduationCap, Loader2, Plus, Trash2, Unlink, X } from 'lucide-react'
import MSheet from '../../components/MSheet'
import MIconBtn from '../../components/MIconBtn'
import MToggle from '../../components/MToggle'
import { useVacayStore } from '../../../store/vacayStore'
import { getIntlLanguage, useTranslation } from '../../../i18n'
import { useToast } from '../../../components/shared/Toast'
import apiClient from '../../../api/client'
import { fetchRegionOptions, fetchSchoolHolidayRegionOptions } from '../../../components/Vacay/holidayRegions'
import { SCHOOL_HOLIDAY_COUNTRY_CONFIG } from '../../../vacay/schoolHolidayCountries'
import { windowMonths } from '../../../vacay/yearWindow'
import { FALLBACK_PERSON_COLOR } from './vacayDayModel'
import type { VacayHolidayCalendar, VacayYearSettings } from '../../../types'

const CALENDAR_COLORS = ['#fecaca', '#fed7aa', '#fde68a', '#bbf7d0', '#a5f3fc', '#c7d2fe', '#e9d5ff', '#fda4af']

interface Option { value: string; label: string }

interface MVacaySettingsSheetProps {
  open: boolean
  onClose: () => void
}

/**
 * Vacay settings sheet: weekend blocking (+ selectable weekend days), week
 * start, carry-over, company holidays, public-holiday calendars (nager.at —
 * label/color/country/region, several) and dissolving the Fusion.
 */
export default function MVacaySettingsSheet({ open, onClose }: MVacaySettingsSheetProps) {
  const { t, language } = useTranslation()
  const toast = useToast()
  const { plan, updatePlan, addHolidayCalendar, updateHolidayCalendar, deleteHolidayCalendar, isFused, dissolve, users } = useVacayStore()
  const [countries, setCountries] = useState<Option[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddSchoolForm, setShowAddSchoolForm] = useState(false)

  useEffect(() => {
    if (!open) return
    apiClient.get('/addons/vacay/holidays/countries').then(r => {
      let displayNames: Intl.DisplayNames | undefined
      try { displayNames = new Intl.DisplayNames([getIntlLanguage(language)], { type: 'region' }) } catch { /* */ }
      const list: Option[] = r.data.map((c: { countryCode: string; name: string }) => ({
        value: c.countryCode,
        label: displayNames ? (displayNames.of(c.countryCode) || c.name) : c.name,
      }))
      list.sort((a, b) => a.label.localeCompare(b.label))
      setCountries(list)
    }).catch(() => {})
  }, [open, language])

  if (!plan) return null

  // Public and school calendars live in the same holiday_calendars list, split by type
  // (a null type predates the school-holiday feature, so it counts as a public holiday).
  const publicHolidayCalendars = (plan.holiday_calendars ?? []).filter(cal => (cal.type ?? 'public_holiday') === 'public_holiday')
  const schoolHolidayCalendars = (plan.holiday_calendars ?? []).filter(cal => cal.type === 'school_holiday')
  const schoolHolidayCountries = countries.filter(country => country.value in SCHOOL_HOLIDAY_COUNTRY_CONFIG)

  const weekendDays: number[] = plan.weekend_days ? String(plan.weekend_days).split(',').map(Number) : [0, 6]
  const weekdayChips = [
    { day: 1, label: t('vacay.mon') },
    { day: 2, label: t('vacay.tue') },
    { day: 3, label: t('vacay.wed') },
    { day: 4, label: t('vacay.thu') },
    { day: 5, label: t('vacay.fri') },
    { day: 6, label: t('vacay.sat') },
    { day: 0, label: t('vacay.sun') },
  ]

  return (
    <MSheet open={open} onClose={onClose} variant="card" material="opaque" ariaLabel={t('vacay.settings')} className="h-[calc(100dvh-120px)]">
      <div className="flex flex-none items-center gap-3 border-b border-[color:var(--m-rowbr)] px-[18px] pb-[10px] pt-4">
        <div className="flex-1 text-[1.0625rem] font-bold">{t('vacay.settings')}</div>
        <MIconBtn variant="neutral" size={34} onClick={onClose} ariaLabel={t('common.close')}>
          <X size={15} strokeWidth={2.2} />
        </MIconBtn>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-2">
        {/* Block weekends */}
        <div className="flex items-start gap-[11px] py-3">
          <CalendarX size={17} strokeWidth={2} className="mt-[1px] flex-none text-m-muted" />
          <div className="flex-1">
            <div className="text-[0.84375rem] font-bold">{t('vacay.blockWeekends')}</div>
            <div className="font-geist text-[0.65625rem] text-m-muted">{t('vacay.blockWeekendsHint')}</div>
          </div>
          <MToggle checked={plan.block_weekends !== false} onChange={() => updatePlan({ block_weekends: !plan.block_weekends })} ariaLabel={t('vacay.blockWeekends')} />
        </div>
        {plan.block_weekends !== false && (
          <>
            <div className="mb-[6px] ml-7 mt-[2px] font-geist text-[0.625rem] font-bold uppercase tracking-[.06em] text-m-faint">
              {t('vacay.weekendDays')}
            </div>
            <div className="mb-[6px] ml-7 flex gap-1">
              {weekdayChips.map(({ day, label }) => {
                const active = weekendDays.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const next = active ? weekendDays.filter(d => d !== day) : [...weekendDays, day]
                      updatePlan({ weekend_days: next.join(',') })
                    }}
                    className={`flex-1 rounded-[10px] py-[7px] text-center text-[0.65625rem] font-semibold ${
                      active ? 'bg-m-act text-m-actfg' : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </>
        )}
        <div className="my-2 h-px bg-[color:var(--m-rowbr)]" />

        {/* Week start */}
        <div className="flex items-start gap-[11px] py-3">
          <Calendar size={17} strokeWidth={2} className="mt-[1px] flex-none text-m-muted" />
          <div className="flex-1">
            <div className="text-[0.84375rem] font-bold">{t('vacay.weekStart')}</div>
            <div className="font-geist text-[0.65625rem] text-m-muted">{t('vacay.weekStartHint')}</div>
          </div>
          <span className="flex flex-none gap-[5px]">
            {[{ value: 1, label: t('vacay.mon') }, { value: 0, label: t('vacay.sun') }].map(({ value, label }) => {
              const active = (plan.week_start ?? 1) === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updatePlan({ week_start: value })}
                  className={`rounded-[10px] px-[13px] py-[7px] text-[0.71875rem] font-semibold ${
                    active ? 'bg-m-act text-m-actfg' : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </span>
        </div>
        <div className="my-2 h-px bg-[color:var(--m-rowbr)]" />

        {/* Carry over */}
        <div className="flex items-start gap-[11px] py-3">
          <ArrowRightLeft size={17} strokeWidth={2} className="mt-[1px] flex-none text-m-muted" />
          <div className="flex-1">
            <div className="text-[0.84375rem] font-bold">{t('vacay.carryOver')}</div>
            <div className="font-geist text-[0.65625rem] text-m-muted">{t('vacay.carryOverHint')}</div>
          </div>
          <MToggle checked={plan.carry_over_enabled} onChange={() => updatePlan({ carry_over_enabled: !plan.carry_over_enabled })} ariaLabel={t('vacay.carryOver')} />
        </div>
        <div className="my-2 h-px bg-[color:var(--m-rowbr)]" />

        {/* Vacation year (#737) — personal, unlike the plan settings around it */}
        <YearTypeRows />
        <div className="my-2 h-px bg-[color:var(--m-rowbr)]" />

        {/* Company holidays */}
        <div className="flex items-start gap-[11px] py-3">
          <Building2 size={17} strokeWidth={2} className="mt-[1px] flex-none text-m-muted" />
          <div className="flex-1">
            <div className="text-[0.84375rem] font-bold">{t('vacay.companyHolidays')}</div>
            <div className="font-geist text-[0.65625rem] text-m-muted">{t('vacay.companyHolidaysHint')} · {t('vacay.companyHolidaysNoDeduct')}</div>
          </div>
          <MToggle checked={plan.company_holidays_enabled} onChange={() => updatePlan({ company_holidays_enabled: !plan.company_holidays_enabled })} ariaLabel={t('vacay.companyHolidays')} />
        </div>
        <div className="my-2 h-px bg-[color:var(--m-rowbr)]" />

        {/* Public holidays + calendar editor */}
        <div className="flex items-start gap-[11px] py-3">
          <Globe size={17} strokeWidth={2} className="mt-[1px] flex-none text-m-muted" />
          <div className="flex-1">
            <div className="text-[0.84375rem] font-bold">{t('vacay.publicHolidays')}</div>
            <div className="font-geist text-[0.65625rem] text-m-muted">{t('vacay.publicHolidaysHint')}</div>
          </div>
          <MToggle checked={plan.holidays_enabled} onChange={() => updatePlan({ holidays_enabled: !plan.holidays_enabled })} ariaLabel={t('vacay.publicHolidays')} />
        </div>
        {plan.holidays_enabled && (
          <>
            {publicHolidayCalendars.map(cal => (
              <CalendarEditor
                key={cal.id}
                cal={cal}
                countries={countries}
                calendarType="public_holiday"
                onUpdate={data => updateHolidayCalendar(cal.id, data)}
                onDelete={() => deleteHolidayCalendar(cal.id)}
              />
            ))}
            {showAddForm ? (
              <AddCalendarDraft
                countries={countries}
                calendarType="public_holiday"
                onAdd={async data => { await addHolidayCalendar({ ...data, type: 'public_holiday' }); setShowAddForm(false) }}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-2 inline-flex items-center gap-[6px] rounded-full border-[1.5px] border-dashed border-[color:var(--m-rowbr)] px-[13px] py-2 font-geist text-[0.6875rem] font-semibold text-m-muted"
              >
                <Plus size={12} strokeWidth={2.2} />
                {t('vacay.addCalendar')}
              </button>
            )}
          </>
        )}
        <div className="my-2 h-px bg-[color:var(--m-rowbr)]" />

        {/* School holidays + calendar editor */}
        <div className="flex items-start gap-[11px] py-3">
          <GraduationCap size={17} strokeWidth={2} className="mt-[1px] flex-none text-m-muted" />
          <div className="flex-1">
            <div className="text-[0.84375rem] font-bold">{t('vacay.schoolHolidays')}</div>
            <div className="font-geist text-[0.65625rem] text-m-muted">{t('vacay.schoolHolidaysHint')}</div>
          </div>
          <MToggle checked={plan.school_holidays_enabled} onChange={() => updatePlan({ school_holidays_enabled: !plan.school_holidays_enabled })} ariaLabel={t('vacay.schoolHolidays')} />
        </div>
        {plan.school_holidays_enabled && (
          <>
            {schoolHolidayCalendars.map(cal => (
              <CalendarEditor
                key={cal.id}
                cal={cal}
                countries={schoolHolidayCountries}
                calendarType="school_holiday"
                onUpdate={data => updateHolidayCalendar(cal.id, data)}
                onDelete={() => deleteHolidayCalendar(cal.id)}
              />
            ))}
            {showAddSchoolForm ? (
              <AddCalendarDraft
                countries={schoolHolidayCountries}
                calendarType="school_holiday"
                onAdd={async data => { await addHolidayCalendar({ ...data, type: 'school_holiday' }); setShowAddSchoolForm(false) }}
                onCancel={() => setShowAddSchoolForm(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowAddSchoolForm(true)}
                className="mt-2 inline-flex items-center gap-[6px] rounded-full border-[1.5px] border-dashed border-[color:var(--m-rowbr)] px-[13px] py-2 font-geist text-[0.6875rem] font-semibold text-m-muted"
              >
                <Plus size={12} strokeWidth={2.2} />
                {t('vacay.addCalendar')}
              </button>
            )}
          </>
        )}

        {/* Dissolve Fusion */}
        {isFused && (
          <div className="mt-[14px] rounded-2xl border border-[rgba(214,39,59,.16)] bg-[rgba(214,39,59,.07)] p-[13px]">
            <div className="flex items-center gap-[9px]">
              <Unlink size={16} strokeWidth={2} className="flex-none text-[#D6273B]" />
              <div className="flex-1">
                <div className="text-[0.8125rem] font-bold">{t('vacay.dissolve')}</div>
                <div className="font-geist text-[0.625rem] text-m-muted">{t('vacay.dissolveHint')}</div>
              </div>
            </div>
            <div className="mt-[9px] flex flex-wrap gap-[6px]">
              {users.map(u => (
                <span key={u.id} className="inline-flex items-center gap-[5px] rounded-full bg-[color:var(--m-sheetop)] px-[10px] py-[3px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: u.color || FALLBACK_PERSON_COLOR }} />
                  <span className="text-[0.6875rem] font-semibold">{u.username}</span>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={async () => { await dissolve(); toast.success(t('vacay.dissolved')); onClose() }}
              className="mt-[10px] w-full rounded-xl bg-[#D6273B] p-[11px] text-center text-[0.78125rem] font-bold text-white"
            >
              {t('vacay.dissolveAction')}
            </button>
          </div>
        )}
      </div>
    </MSheet>
  )
}

/**
 * Leave-year type (#737): calendar (Jan–Dec), fiscal (fixed month/day) or
 * anniversary (the hire date's month/day). Unlike everything else in this sheet
 * it is a per-user setting, so fused members each keep their own.
 */
function YearTypeRows() {
  const { t, locale } = useTranslation()
  const { yearSettings, updateYearSettings, selectedYear } = useVacayStore()
  const type = yearSettings.year_type

  const monthOptions: Option[] = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'long' })
    return Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: fmt.format(new Date(2026, i, 1)) }))
  }, [locale])

  const save = (patch: Partial<VacayYearSettings>) => {
    const next = { ...yearSettings, ...patch }
    updateYearSettings({
      year_type: next.year_type,
      year_start_month: next.year_start_month,
      year_start_day: Math.min(next.year_start_day, monthDayCap(next.year_start_month)),
      hire_date: next.hire_date,
    })
  }

  const months = windowMonths(selectedYear, yearSettings)
  const fmtShort = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' })
  const windowLabel = `${fmtShort.format(new Date(months[0].year, months[0].month, 1))} – ${fmtShort.format(new Date(months[11].year, months[11].month, 1))}`

  return (
    <>
      <div className="flex items-start gap-[11px] py-3">
        <CalendarRange size={17} strokeWidth={2} className="mt-[1px] flex-none text-m-muted" />
        <div className="flex-1">
          <div className="text-[0.84375rem] font-bold">{t('vacay.yearType')}</div>
          <div className="font-geist text-[0.65625rem] text-m-muted">{t('vacay.yearTypeHint')}</div>
        </div>
      </div>
      <div className="ml-7 flex gap-1">
        {([
          { value: 'calendar', label: t('vacay.yearTypeCalendar') },
          { value: 'fiscal', label: t('vacay.yearTypeFiscal') },
          { value: 'anniversary', label: t('vacay.yearTypeAnniversary') },
        ] as const).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => save({ year_type: value })}
            className={`flex-1 rounded-[10px] px-1 py-[7px] text-center text-[0.65625rem] font-semibold ${
              type === value ? 'bg-m-act text-m-actfg' : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {type === 'fiscal' && (
        <div className="ml-7 flex gap-2">
          <span className="min-w-0 flex-1">
            <SelectRow
              value={String(yearSettings.year_start_month)}
              placeholder={t('vacay.yearStartMonth')}
              options={monthOptions}
              onChange={v => save({ year_start_month: Number.parseInt(v, 10) })}
            />
          </span>
          <span className="w-[86px] flex-none">
            <SelectRow
              value={String(yearSettings.year_start_day)}
              placeholder={t('vacay.yearStartDay')}
              options={Array.from({ length: monthDayCap(yearSettings.year_start_month) }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
              onChange={v => save({ year_start_day: Number.parseInt(v, 10) })}
            />
          </span>
        </div>
      )}

      {type === 'anniversary' && (
        <div className="ml-7">
          <input
            type="date"
            value={yearSettings.hire_date || ''}
            onChange={e => save({ hire_date: e.target.value || null })}
            aria-label={t('vacay.hireDate')}
            className="mt-[7px] w-full rounded-[10px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[11px] py-[9px] font-[inherit] text-[0.78125rem] font-semibold text-m-ink outline-none"
          />
        </div>
      )}

      <div className="ml-7 mt-[6px] font-geist text-[0.625rem] text-m-faint">
        {t('vacay.yearWindow', { year: selectedYear, window: windowLabel })}
      </div>
    </>
  )
}

/** Days a month always has — February caps at 28 so a start date never goes missing in a common year. */
function monthDayCap(month: number): number {
  if (month === 2) return 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

/** Styled native select in the sheet's row look (label + chevron). */
function SelectRow({ value, placeholder, options, onChange }: {
  value: string
  placeholder: string
  options: Option[]
  onChange: (value: string) => void
}) {
  const selected = options.find(o => o.value === value)
  return (
    <span className="relative mt-[7px] flex items-center justify-between rounded-[10px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[11px] py-[9px] text-[0.78125rem] font-semibold">
      <span className={`min-w-0 truncate ${selected ? '' : 'text-m-muted'}`}>{selected ? selected.label : placeholder}</span>
      <ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label={placeholder}
        className="absolute inset-0 w-full cursor-pointer opacity-0"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </span>
  )
}

/** Color swatch that expands into the pastel preset palette. */
function ColorSwatch({ color, onPick }: { color: string; onPick: (color: string) => void }) {
  const { t } = useTranslation()
  const [openPalette, setOpenPalette] = useState(false)
  return (
    <span className="relative flex-none">
      <button
        type="button"
        onClick={() => setOpenPalette(o => !o)}
        aria-label={t('vacay.calendarColor')}
        className="block h-[26px] w-[26px] rounded-lg"
        style={{ background: color }}
      />
      {openPalette && (
        <span className="absolute left-0 top-[32px] z-10 grid w-[124px] grid-cols-4 gap-1 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-2 shadow-[0_8px_24px_rgba(0,0,0,.12)]">
          {CALENDAR_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => { onPick(c); setOpenPalette(false) }}
              className={`h-[22px] w-[22px] rounded-md ${c === color ? 'ring-2 ring-[color:var(--m-ink)]' : ''}`}
              style={{ background: c }}
            />
          ))}
        </span>
      )}
    </span>
  )
}

/**
 * Region options for a holiday-calendar country.
 *
 * The loaded list is tagged with the country it belongs to, so switching country
 * drops the previous list in the same render instead of leaving it selectable while
 * the next request is still running (#1813: picking a German region for the
 * Netherlands was possible that way). `loadingRegions` tells "not answered yet"
 * apart from "this country has no regions"; on the list alone both are empty.
 */
function useRegionOptions(country: string, calendarType: 'public_holiday' | 'school_holiday') {
  const [loaded, setLoaded] = useState<{ country: string; options: Option[] }>({ country: '', options: [] })

  useEffect(() => {
    if (!country) return
    const load = calendarType === 'school_holiday' ? fetchSchoolHolidayRegionOptions : fetchRegionOptions
    let stale = false
    load(country).then(options => { if (!stale) setLoaded({ country, options }) })
    return () => { stale = true }
  }, [country, calendarType])

  const ready = loaded.country === country
  return { regions: ready ? loaded.options : [], loadingRegions: Boolean(country) && !ready }
}

function CalendarEditor({ cal, countries, calendarType = 'public_holiday', onUpdate, onDelete }: {
  cal: VacayHolidayCalendar
  countries: Option[]
  calendarType?: 'public_holiday' | 'school_holiday'
  onUpdate: (data: { region?: string; color?: string; label?: string | null }) => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const [label, setLabel] = useState(cal.label || '')
  // A school-holiday group carries a `|group:…` suffix — strip it before the
  // country is read off, otherwise the region lookup finds nothing.
  const [baseRegion] = cal.region.split('|')
  const country = baseRegion.split('-')[0]
  const region = cal.region.includes('|group:') || baseRegion.includes('-') ? cal.region : ''
  const { regions } = useRegionOptions(country, calendarType)

  useEffect(() => { setLabel(cal.label || '') }, [cal.label])

  return (
    <div className="mt-2 rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3">
      <div className="flex items-center gap-[9px]">
        <ColorSwatch color={cal.color} onPick={c => { if (c !== cal.color) onUpdate({ color: c }) }} />
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={() => { const v = label.trim() || null; if (v !== cal.label) onUpdate({ label: v }) }}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          placeholder={t('vacay.calendarLabel')}
          className="min-w-0 flex-1 rounded-[10px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[11px] py-[9px] font-[inherit] text-[0.78125rem] font-semibold text-m-ink outline-none"
        />
        <MIconBtn variant="neutral" size={30} onClick={onDelete} ariaLabel={t('common.delete')} className="border border-[color:var(--m-rowbr)] !bg-[color:var(--m-sheetop)]">
          <Trash2 size={13} strokeWidth={2} className="text-m-muted" />
        </MIconBtn>
      </div>
      <SelectRow value={country} placeholder={t('vacay.selectCountry')} options={countries} onChange={v => onUpdate({ region: v })} />
      {regions.length > 0 && (
        <SelectRow value={region} placeholder={t('vacay.selectRegion')} options={regions} onChange={v => onUpdate({ region: v })} />
      )}
    </div>
  )
}

function AddCalendarDraft({ countries, calendarType = 'public_holiday', onAdd, onCancel }: {
  countries: Option[]
  calendarType?: 'public_holiday' | 'school_holiday'
  onAdd: (data: { region: string; color: string; label: string | null }) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [region, setRegion] = useState('')
  const [color, setColor] = useState(CALENDAR_COLORS[0])
  const [label, setLabel] = useState('')

  const [baseRegion] = region.split('|')
  const country = baseRegion.split('-')[0] || ''
  const selectedRegion = region.includes('|group:') || baseRegion.includes('-') ? region : ''
  const { regions, loadingRegions } = useRegionOptions(country, calendarType)

  // Adding is blocked while the region list is on its way: an empty list would
  // otherwise pass as "this country needs no region" and create a calendar that
  // draws nothing (#1813). The button shows a spinner so the wait is visible.
  const canAdd = Boolean(country) && !loadingRegions && (regions.length === 0 || selectedRegion !== '')

  return (
    <div className="mt-2 rounded-[14px] border-[1.5px] border-dashed border-[color:var(--m-rowbr)] p-3">
      <div className="flex items-center gap-[9px]">
        <ColorSwatch color={color} onPick={setColor} />
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder={t('vacay.calendarLabel')}
          className="min-w-0 flex-1 rounded-[10px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[11px] py-[9px] font-[inherit] text-[0.78125rem] font-semibold text-m-ink outline-none"
        />
        <MIconBtn variant="neutral" size={30} onClick={onCancel} ariaLabel={t('common.cancel')} className="border border-[color:var(--m-rowbr)] !bg-[color:var(--m-sheetop)]">
          <X size={13} strokeWidth={2} className="text-m-muted" />
        </MIconBtn>
      </div>
      <SelectRow value={country} placeholder={t('vacay.selectCountry')} options={countries} onChange={setRegion} />
      {regions.length > 0 && (
        <SelectRow value={selectedRegion} placeholder={t('vacay.selectRegion')} options={regions} onChange={setRegion} />
      )}
      <button
        type="button"
        disabled={!canAdd}
        aria-busy={loadingRegions}
        onClick={() => onAdd({ region: region || country, color, label: label.trim() || null })}
        className="mt-[7px] flex w-full items-center justify-center gap-[6px] rounded-[10px] bg-m-act p-[9px] text-[0.78125rem] font-semibold text-m-actfg disabled:opacity-40"
      >
        {loadingRegions && <Loader2 size={13} strokeWidth={2} className="animate-spin" />}
        {t('vacay.add')}
      </button>
    </div>
  )
}
