import { useState, useEffect, useMemo } from 'react'
import { type LucideIcon, CalendarOff, AlertCircle, Building2, Unlink, ArrowRightLeft, Globe, Loader2, Plus, Trash2, CalendarDays, CalendarRange, GraduationCap } from 'lucide-react'
import { useVacayStore } from '../../store/vacayStore'
import { getIntlLanguage, useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import CustomSelect from '../shared/CustomSelect'
import apiClient from '../../api/client'
import { fetchRegionOptions, fetchSchoolHolidayRegionOptions } from './holidayRegions'
import { SCHOOL_HOLIDAY_COUNTRY_CONFIG } from '../../vacay/schoolHolidayCountries'
import { windowMonths } from '../../vacay/yearWindow'
import type { VacayHolidayCalendar, VacayYearSettings } from '../../types'

interface VacaySettingsProps {
  onClose: () => void
}

export default function VacaySettings({ onClose }: VacaySettingsProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const { plan, updatePlan, addHolidayCalendar, updateHolidayCalendar, deleteHolidayCalendar, isFused, dissolve, users } = useVacayStore()
  const [countries, setCountries] = useState<{ value: string; label: string }[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddSchoolForm, setShowAddSchoolForm] = useState(false)

  const { language } = useTranslation()

  // Load available countries with localized names
  useEffect(() => {
    apiClient.get('/addons/vacay/holidays/countries').then(r => {
      let displayNames
      try { displayNames = new Intl.DisplayNames([getIntlLanguage(language)], { type: 'region' }) } catch { /* */ }
      const list = r.data.map(c => ({
        value: c.countryCode,
        label: displayNames ? (displayNames.of(c.countryCode) || c.name) : c.name,
      }))
      list.sort((a, b) => a.label.localeCompare(b.label))
      setCountries(list)
    }).catch(() => {})
  }, [language])

  if (!plan) return null

  const toggle = (key: string) => updatePlan({ [key]: !plan[key] })
  const publicHolidayCalendars = (plan.holiday_calendars ?? []).filter(cal => (cal.type ?? 'public_holiday') === 'public_holiday')
  const schoolHolidayCalendars = (plan.holiday_calendars ?? []).filter(cal => cal.type === 'school_holiday')
  const schoolHolidayCountries = countries.filter(country => country.value in SCHOOL_HOLIDAY_COUNTRY_CONFIG)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* ── Column 1 · calendar rules ── */}
        <div className="rounded-2xl p-5 space-y-4" style={{ border: '1px solid var(--vg-line)', background: 'var(--vg-surf2)' }}>
      {/* Block weekends */}
      <SettingToggle
        icon={CalendarOff}
        label={t('vacay.blockWeekends')}
        hint={t('vacay.blockWeekendsHint')}
        value={plan.block_weekends}
        onChange={() => toggle('block_weekends')}
      />

      {/* Weekend days selector */}
      {plan.block_weekends !== false && (
        <div data-testid="weekend-days" style={{ paddingLeft: 36 }}>
          <p className="text-xs font-medium mb-2 text-content-muted">{t('vacay.weekendDays')}</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { day: 1, label: t('vacay.mon') },
              { day: 2, label: t('vacay.tue') },
              { day: 3, label: t('vacay.wed') },
              { day: 4, label: t('vacay.thu') },
              { day: 5, label: t('vacay.fri') },
              { day: 6, label: t('vacay.sat') },
              { day: 0, label: t('vacay.sun') },
            ].map(({ day, label }) => {
              const current: number[] = plan.weekend_days ? String(plan.weekend_days).split(',').map(Number) : [0, 6]
              const active = current.includes(day)
              return (
                <button type="button" key={day} onClick={() => {
                  const next = active ? current.filter(d => d !== day) : [...current, day]
                  updatePlan({ weekend_days: next.join(',') })
                }}
                  style={{
                    padding: '4px 10px', borderRadius: 8, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', border: '1px solid', transition: 'all 0.12s',
                    background: active ? 'var(--text-primary)' : 'var(--bg-card)',
                    borderColor: active ? 'var(--text-primary)' : 'var(--border-primary)',
                    color: active ? 'var(--bg-primary)' : 'var(--text-muted)',
                  }}>
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Week start */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CalendarDays size={16} className="text-content-muted" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span className="text-sm font-medium text-content">{t('vacay.weekStart')}</span>
            <p className="text-xs mt-0.5 text-content-faint">{t('vacay.weekStartHint')}</p>
          </div>
        </div>
        <div style={{ paddingLeft: 36, marginTop: 8 }} className="flex gap-1.5">
          {[
            { value: 1, label: t('vacay.mon') },
            { value: 0, label: t('vacay.sun') },
          ].map(({ value, label }) => {
            const active = (plan.week_start ?? 1) === value
            return (
              <button type="button" key={value} onClick={() => updatePlan({ week_start: value })}
                style={{
                  padding: '4px 10px', borderRadius: 8, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', border: '1px solid', transition: 'all 0.12s',
                  background: active ? 'var(--text-primary)' : 'var(--bg-card)',
                  borderColor: active ? 'var(--text-primary)' : 'var(--border-primary)',
                  color: active ? 'var(--bg-primary)' : 'var(--text-muted)',
                }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Carry-over */}
      <SettingToggle
        icon={ArrowRightLeft}
        label={t('vacay.carryOver')}
        hint={t('vacay.carryOverHint')}
        value={plan.carry_over_enabled}
        onChange={() => toggle('carry_over_enabled')}
      />

      {/* Vacation year (#737) — personal, unlike the plan settings above it */}
      <YearTypePicker />
        </div>

        {/* ── Column 2 · holidays ── */}
        <div className="rounded-2xl p-5 space-y-4" style={{ border: '1px solid var(--vg-line)', background: 'var(--vg-surf2)' }}>
      {/* Company holidays */}
      <div>
        <SettingToggle
          icon={Building2}
          label={t('vacay.companyHolidays')}
          hint={t('vacay.companyHolidaysHint')}
          value={plan.company_holidays_enabled}
          onChange={() => toggle('company_holidays_enabled')}
        />
        {plan.company_holidays_enabled && (
          <div className="ml-7 mt-2">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md" style={{ background: 'var(--vg-surf)', border: '1px solid var(--vg-line)' }}>
              <AlertCircle size={12} style={{ color: 'var(--vg-ink3)' }} />
              <span className="text-[10px]" style={{ color: 'var(--vg-ink3)' }}>{t('vacay.companyHolidaysNoDeduct')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Public holidays */}
      <div>
        <SettingToggle
          icon={Globe}
          label={t('vacay.publicHolidays')}
          hint={t('vacay.publicHolidaysHint')}
          value={plan.holidays_enabled}
          onChange={() => toggle('holidays_enabled')}
        />
        {plan.holidays_enabled && (
          <div className="ml-7 mt-2 space-y-2">
            {publicHolidayCalendars.length === 0 && (
              <p className="text-xs text-content-faint">{t('vacay.noCalendars')}</p>
            )}
            {publicHolidayCalendars.map(cal => (
              <CalendarRow
                key={cal.id}
                cal={cal}
                countries={countries}
                language={language}
                calendarType="public_holiday"
                onUpdate={(data) => updateHolidayCalendar(cal.id, data)}
                onDelete={() => deleteHolidayCalendar(cal.id)}
              />
            ))}
            {showAddForm ? (
              <AddCalendarForm
                countries={countries}
                language={language}
                calendarType="public_holiday"
                onAdd={async (data) => { await addHolidayCalendar({ ...data, type: 'public_holiday' }); setShowAddForm(false) }}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <button type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2.5 rounded-xl border border-dashed transition-colors"
                style={{ borderColor: 'var(--vg-line2)', background: 'var(--vg-surf)', color: 'var(--vg-ink2)' }}
              >
                <Plus size={13} />
                {t('vacay.addCalendar')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* School holidays — sits on the right, directly under Public holidays */}
      <div>
        <SettingToggle
          icon={GraduationCap}
          label={t('vacay.schoolHolidays')}
          hint={t('vacay.schoolHolidaysHint')}
          value={plan.school_holidays_enabled}
          onChange={() => toggle('school_holidays_enabled')}
        />
        {plan.school_holidays_enabled && (
          <div className="ml-7 mt-2 space-y-2">
            {schoolHolidayCalendars.length === 0 && (
              <p className="text-xs text-content-faint">{t('vacay.noSchoolCalendars')}</p>
            )}
            {schoolHolidayCalendars.map(cal => (
              <CalendarRow
                key={cal.id}
                cal={cal}
                countries={schoolHolidayCountries}
                language={language}
                calendarType="school_holiday"
                onUpdate={(data) => updateHolidayCalendar(cal.id, data)}
                onDelete={() => deleteHolidayCalendar(cal.id)}
              />
            ))}
            {showAddSchoolForm ? (
              <AddCalendarForm
                countries={schoolHolidayCountries}
                language={language}
                calendarType="school_holiday"
                defaultColor="#a5f3fc"
                onAdd={async (data) => { await addHolidayCalendar({ ...data, type: 'school_holiday' }); setShowAddSchoolForm(false) }}
                onCancel={() => setShowAddSchoolForm(false)}
              />
            ) : (
              <button type="button"
                onClick={() => setShowAddSchoolForm(true)}
                className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md transition-colors text-content-muted bg-surface-secondary"
              >
                <Plus size={12} />
                {t('vacay.addCalendar')}
              </button>
            )}
          </div>
        )}
      </div>
        </div>
      </div>

      {/* Dissolve fusion */}
      {isFused && (
        <div className="pt-4 mt-2 border-t border-edge-secondary">
          <div className="rounded-xl overflow-hidden border border-[rgba(239,68,68,0.2)]">
            <div className="px-4 py-3 flex items-center gap-3 bg-[rgba(239,68,68,0.06)]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(239,68,68,0.1)]">
                <Unlink size={16} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-content">{t('vacay.dissolve')}</p>
                <p className="text-[11px] text-content-faint">{t('vacay.dissolveHint')}</p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center gap-2 flex-wrap border-t border-t-[rgba(239,68,68,0.1)]">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-secondary">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: u.color || '#6366f1' }} />
                  <span className="text-xs font-medium text-content">{u.username}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-t-[rgba(239,68,68,0.1)]">
              <button type="button"
                onClick={async () => {
                  await dissolve()
                  toast.success(t('vacay.dissolved'))
                  onClose()
                }}
                className="w-full px-3 py-2 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                {t('vacay.dissolveAction')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Leave-year type (#737) ────────────────────────────────────────────────────
/**
 * Per-user leave year: calendar (Jan–Dec), fiscal (a fixed month/day) or
 * anniversary (the hire date's month/day). This is the one setting in this panel
 * that belongs to the person rather than the plan, so fused members can each keep
 * their own — the grid then follows whoever is looking at it.
 */
function YearTypePicker() {
  const { t, locale } = useTranslation()
  const { yearSettings, updateYearSettings, selectedYear } = useVacayStore()
  const type = yearSettings.year_type

  const monthNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'long' })
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2026, i, 1)))
  }, [locale])

  // February caps at 28 so a window start never lands on a date some years lack.
  const maxDay = daysInMonth(yearSettings.year_start_month)

  const save = (patch: Partial<VacayYearSettings>) => {
    const next = { ...yearSettings, ...patch }
    updateYearSettings({
      year_type: next.year_type,
      year_start_month: next.year_start_month,
      year_start_day: Math.min(next.year_start_day, daysInMonth(next.year_start_month)),
      hire_date: next.hire_date,
    })
  }

  const months = windowMonths(selectedYear, yearSettings)
  const shortMonth = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' })
  const windowLabel = `${shortMonth.format(new Date(months[0].year, months[0].month, 1))} – ${shortMonth.format(new Date(months[11].year, months[11].month, 1))}`

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CalendarRange size={16} className="text-content-muted" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span className="text-sm font-medium text-content">{t('vacay.yearType')}</span>
          <p className="text-xs mt-0.5 text-content-faint">{t('vacay.yearTypeHint')}</p>
        </div>
      </div>
      <div style={{ paddingLeft: 36, marginTop: 8 }} className="flex flex-wrap gap-1.5">
        {([
          { value: 'calendar', label: t('vacay.yearTypeCalendar') },
          { value: 'fiscal', label: t('vacay.yearTypeFiscal') },
          { value: 'anniversary', label: t('vacay.yearTypeAnniversary') },
        ] as const).map(({ value, label }) => (
          <button type="button" key={value} onClick={() => save({ year_type: value })}
            style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', border: '1px solid', transition: 'all 0.12s',
              background: type === value ? 'var(--text-primary)' : 'var(--bg-card)',
              borderColor: type === value ? 'var(--text-primary)' : 'var(--border-primary)',
              color: type === value ? 'var(--bg-primary)' : 'var(--text-muted)',
            }}>
            {label}
          </button>
        ))}
      </div>

      {type === 'fiscal' && (
        <div style={{ paddingLeft: 36, marginTop: 8 }} className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <CustomSelect
              value={String(yearSettings.year_start_month)}
              onChange={v => save({ year_start_month: Number.parseInt(String(v), 10) })}
              options={monthNames.map((label, i) => ({ value: String(i + 1), label }))}
              placeholder={t('vacay.yearStartMonth')}
            />
          </div>
          <div className="w-[92px] shrink-0">
            <CustomSelect
              value={String(yearSettings.year_start_day)}
              onChange={v => save({ year_start_day: Number.parseInt(String(v), 10) })}
              options={Array.from({ length: maxDay }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
              placeholder={t('vacay.yearStartDay')}
            />
          </div>
        </div>
      )}

      {type === 'anniversary' && (
        <div style={{ paddingLeft: 36, marginTop: 8 }}>
          <input
            type="date"
            value={yearSettings.hire_date || ''}
            onChange={e => save({ hire_date: e.target.value || null })}
            aria-label={t('vacay.hireDate')}
            style={{ width: '100%', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, padding: '8px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none' }}
          />
          {!yearSettings.hire_date && (
            <p className="text-[11px] mt-1 text-content-faint">{t('vacay.hireDateHint')}</p>
          )}
        </div>
      )}

      <p className="text-[11px] mt-2 text-content-faint" style={{ paddingLeft: 36 }}>
        {t('vacay.yearWindow', { year: selectedYear, window: windowLabel })}
      </p>
    </div>
  )
}

/** Days a month can always offer — February caps at 28 so no window start is skipped in a common year. */
function daysInMonth(month: number): number {
  if (month === 2) return 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

interface SettingToggleProps {
  icon: LucideIcon
  label: string
  hint: string
  value: boolean
  onChange: () => void
}

function SettingToggle({ icon: Icon, label, hint, value, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Icon size={15} className="shrink-0 text-content-muted" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-content">{label}</p>
          <p className="text-[11px] text-content-faint">{hint}</p>
        </div>
      </div>
      <button type="button" onClick={onChange}
        className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-content' : 'bg-edge'}`}>
        <span className="absolute left-1 h-4 w-4 rounded-full transition-transform duration-200 bg-surface-card"
          style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }} />
      </button>
    </div>
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
  const [loaded, setLoaded] = useState<{ country: string; options: { value: string; label: string }[] }>({ country: '', options: [] })

  useEffect(() => {
    if (!country) return
    const load = calendarType === 'school_holiday' ? fetchSchoolHolidayRegionOptions : fetchRegionOptions
    let stale = false
    load(country).then(options => { if (!stale) setLoaded({ country, options }) })
    return () => { stale = true }
  }, [calendarType, country])

  const ready = loaded.country === country
  return { regions: ready ? loaded.options : [], loadingRegions: Boolean(country) && !ready }
}

// ── Existing calendar row (inline edit) ──────────────────────────────────────
function CalendarRow({ cal, countries, calendarType, onUpdate, onDelete }: {
  cal: VacayHolidayCalendar
  countries: { value: string; label: string }[]
  language: string
  calendarType: 'public_holiday' | 'school_holiday'
  onUpdate: (data: { region?: string; color?: string; label?: string | null }) => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const [localColor, setLocalColor] = useState(cal.color)
  const [localLabel, setLocalLabel] = useState(cal.label || '')

  const [baseRegion] = cal.region.split('|')
  const selectedCountry = baseRegion.split('-')[0]
  const selectedRegion = cal.region.includes('|group:') || baseRegion.includes('-') ? cal.region : ''
  const { regions } = useRegionOptions(selectedCountry, calendarType)

  useEffect(() => { setLocalColor(cal.color) }, [cal.color])
  useEffect(() => { setLocalLabel(cal.label || '') }, [cal.label])

  const PRESET_COLORS = ['#fecaca', '#fed7aa', '#fde68a', '#bbf7d0', '#a5f3fc', '#c7d2fe', '#e9d5ff', '#fda4af', '#6366f1', '#ef4444', '#22c55e', '#3b82f6']
  const [showColorPicker, setShowColorPicker] = useState(false)

  return (
    <div className="flex gap-3 items-start p-3 rounded-xl" style={{ background: 'var(--vg-surf)', border: '1px solid var(--vg-line)' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          style={{ width: 28, height: 28, borderRadius: 8, background: localColor, border: '2px solid var(--border-primary)', cursor: 'pointer' }}
          title={t('vacay.calendarColor')}
        />
        {showColorPicker && (
          <div style={{ position: 'absolute', top: 34, left: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 12, padding: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, width: 120 }}>
            {PRESET_COLORS.map(c => (
              <button type="button" key={c} onClick={() => { setLocalColor(c); setShowColorPicker(false); if (c !== cal.color) onUpdate({ color: c }) }}
                style={{ width: 24, height: 24, borderRadius: 6, background: c, border: localColor === c ? '2px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <input
          type="text"
          value={localLabel}
          onChange={e => setLocalLabel(e.target.value)}
          onBlur={() => { const v = localLabel.trim() || null; if (v !== cal.label) onUpdate({ label: v }) }}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          placeholder={t('vacay.calendarLabel')}
          style={{ width: '100%', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, padding: '8px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none' }}
        />
        <CustomSelect
          value={selectedCountry}
          onChange={v => onUpdate({ region: String(v) })}
          options={countries}
          placeholder={t('vacay.selectCountry')}
          searchable
        />
        {regions.length > 0 && (
          <CustomSelect
            value={selectedRegion}
            onChange={v => onUpdate({ region: String(v) })}
            options={regions}
            placeholder={t('vacay.selectRegion')}
            searchable
          />
        )}
      </div>
      <button type="button"
        onClick={onDelete}
        className="shrink-0 p-1.5 rounded-md transition-colors text-content-faint"
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── Add-new-calendar form ─────────────────────────────────────────────────────
function AddCalendarForm({ countries, calendarType, onAdd, onCancel, defaultColor = '#fecaca' }: {
  countries: { value: string; label: string }[]
  language: string
  calendarType: 'public_holiday' | 'school_holiday'
  onAdd: (data: { region: string; color: string; label: string | null }) => void
  onCancel: () => void
  defaultColor?: string
}) {
  const { t } = useTranslation()
  const [region, setRegion] = useState('')
  const [color, setColor] = useState(defaultColor)
  const [label, setLabel] = useState('')

  const [baseRegion] = region.split('|')
  const selectedCountry = baseRegion.split('-')[0] || ''
  const selectedRegion = region.includes('|group:') || baseRegion.includes('-') ? region : ''
  const { regions, loadingRegions } = useRegionOptions(selectedCountry, calendarType)

  // Adding is blocked while the region list is on its way: an empty list would
  // otherwise pass as "this country needs no region" and create a calendar that
  // draws nothing (#1813). The button shows a spinner so the wait is visible.
  const canAdd = Boolean(selectedCountry) && !loadingRegions && (regions.length === 0 || selectedRegion !== '')

  const PRESET_COLORS = ['#fecaca', '#fed7aa', '#fde68a', '#bbf7d0', '#a5f3fc', '#c7d2fe', '#e9d5ff', '#fda4af', '#6366f1', '#ef4444', '#22c55e', '#3b82f6']
  const [showColorPicker, setShowColorPicker] = useState(false)

  return (
    <div className="flex gap-3 items-start p-3 rounded-xl border border-dashed" style={{ borderColor: 'var(--vg-line2)', background: 'var(--vg-surf)' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          style={{ width: 28, height: 28, borderRadius: 8, background: color, border: '2px solid var(--border-primary)', cursor: 'pointer' }}
          title={t('vacay.calendarColor')}
        />
        {showColorPicker && (
          <div style={{ position: 'absolute', top: 34, left: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 12, padding: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, width: 120 }}>
            {PRESET_COLORS.map(c => (
              <button type="button" key={c} onClick={() => { setColor(c); setShowColorPicker(false) }}
                style={{ width: 24, height: 24, borderRadius: 6, background: c, border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder={t('vacay.calendarLabel')}
          style={{ width: '100%', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, padding: '8px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none' }}
        />
        <CustomSelect
          value={selectedCountry}
          onChange={v => setRegion(String(v))}
          options={countries}
          placeholder={t('vacay.selectCountry')}
          searchable
        />
        {regions.length > 0 && (
          <CustomSelect
            value={selectedRegion}
            onChange={v => setRegion(String(v))}
            options={regions}
            placeholder={t('vacay.selectRegion')}
            searchable
          />
        )}
        <div className="flex gap-1.5 pt-0.5">
          <button type="button"
            disabled={!canAdd}
            aria-busy={loadingRegions}
            onClick={() => onAdd({ region: region || selectedCountry, color, label: label.trim() || null })}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded-md font-medium transition-colors disabled:opacity-40 bg-content text-surface-card"
          >
            {loadingRegions && <Loader2 size={12} className="animate-spin" />}
            {t('vacay.add')}
          </button>
          <button type="button"
            onClick={onCancel}
            className="text-xs px-2 py-1.5 rounded-md transition-colors bg-surface-secondary text-content-muted"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
