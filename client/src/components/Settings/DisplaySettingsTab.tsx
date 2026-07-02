import React, { useState, useEffect, useRef } from 'react'
import { Languages, Map, ChevronDown, Check } from 'lucide-react'
import { SUPPORTED_LANGUAGES, useTranslation } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import { useToast } from '../shared/Toast'
import CustomSelect from '../shared/CustomSelect'
import { CURRENCIES, SYMBOLS } from '../Budget/BudgetPanel.constants'
import Section from './Section'
import type { DistanceUnit } from '../../types'

export default function DisplaySettingsTab(): React.ReactElement {
  const { settings, updateSetting } = useSettingsStore()
  const { t } = useTranslation()
  const toast = useToast()
  const [tempUnit, setTempUnit] = useState<string>(settings.temperature_unit || 'celsius')
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(settings.distance_unit || 'metric')
  const [langOpen, setLangOpen] = useState(false)
  const langDropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!langOpen) return
    const handler = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [langOpen])

  useEffect(() => {
    setTempUnit(settings.temperature_unit || 'celsius')
  }, [settings.temperature_unit])

  useEffect(() => {
    setDistanceUnit(settings.distance_unit || 'metric')
  }, [settings.distance_unit])

  return (
    <>
      <Section title={t('settings.general.languageRegion')} icon={Languages}>
      {/* Display currency */}
      <div>
        <label className="block text-sm font-medium mb-2 text-content-secondary">{t('settings.currency')}</label>
        <CustomSelect
          value={settings.default_currency || 'EUR'}
          onChange={async v => {
            try { await updateSetting('default_currency', String(v)) }
            catch (e: unknown) { toast.error(e instanceof Error ? e.message : t('common.error')) }
          }}
          options={CURRENCIES.map(c => ({ value: c, label: `${c} — ${SYMBOLS[c] || c}` }))}
          searchable
        />
        <p className="text-xs text-content-faint mt-2">{t('settings.currencyHint')}</p>
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium mb-2 text-content-secondary">{t('settings.language')}</label>
        {/* Desktop: Button grid */}
        <div className="hidden sm:flex flex-wrap gap-3">
          {SUPPORTED_LANGUAGES.map(opt => (
            <button
              key={opt.value}
              onClick={async () => {
                try { await updateSetting('language', opt.value) }
                catch (e: unknown) { toast.error(e instanceof Error ? e.message : t('common.error')) }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500,
                border: settings.language === opt.value ? '2px solid var(--text-primary)' : '2px solid var(--border-primary)',
                background: settings.language === opt.value ? 'var(--bg-hover)' : 'var(--bg-card)',
                color: 'var(--text-primary)',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {/* Mobile: Custom dropdown */}
        <div ref={langDropdownRef} className="sm:hidden" style={{ position: 'relative' }}>
          {(() => {
            const current = SUPPORTED_LANGUAGES.find(o => o.value === settings.language) || SUPPORTED_LANGUAGES[0]
            return (
              <button
                type="button"
                onClick={() => setLangOpen(v => !v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 10,
                  border: '2px solid var(--border-primary)',
                  background: 'var(--bg-card)', color: 'var(--text-primary)',
                  fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current?.label}</span>
                <ChevronDown size={14} className="text-content-faint" style={{ flexShrink: 0, transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
            )
          })()}
          {langOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
              background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: 4, maxHeight: 280, overflowY: 'auto',
            }}>
              {SUPPORTED_LANGUAGES.map(opt => {
                const active = settings.language === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={async () => {
                      setLangOpen(false)
                      try { await updateSetting('language', opt.value) }
                      catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.error')) }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '9px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: active ? 'var(--bg-hover)' : 'transparent',
                      fontFamily: 'inherit', fontSize: 'calc(14px * var(--fs-scale-body, 1))', color: 'var(--text-primary)',
                      textAlign: 'left', fontWeight: active ? 600 : 500,
                    }}
                  >
                    <span style={{ flex: 1 }}>{opt.label}</span>
                    {active && <Check size={14} strokeWidth={2.5} color="var(--accent)" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Temperature */}
      <div>
        <label className="block text-sm font-medium mb-2 text-content-secondary">{t('settings.temperature')}</label>
        <div className="flex gap-3">
          {[
            { value: 'celsius', label: '°C Celsius' },
            { value: 'fahrenheit', label: '°F Fahrenheit' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={async () => {
                setTempUnit(opt.value)
                try { await updateSetting('temperature_unit', opt.value) }
                catch (e: unknown) { toast.error(e instanceof Error ? e.message : t('common.error')) }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500,
                border: tempUnit === opt.value ? '2px solid var(--text-primary)' : '2px solid var(--border-primary)',
                background: tempUnit === opt.value ? 'var(--bg-hover)' : 'var(--bg-card)',
                color: 'var(--text-primary)',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Distance */}
      <div>
        <label className="block text-sm font-medium mb-2 text-content-secondary">{t('settings.distance')}</label>
        <div className="flex gap-3">
          {([
            { value: 'metric', label: 'km Metric' },
            { value: 'imperial', label: 'mi Imperial' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={async () => {
                setDistanceUnit(opt.value)
                try { await updateSetting('distance_unit', opt.value) }
                catch (e: unknown) { toast.error(e instanceof Error ? e.message : t('common.error')) }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500,
                border: distanceUnit === opt.value ? '2px solid var(--text-primary)' : '2px solid var(--border-primary)',
                background: distanceUnit === opt.value ? 'var(--bg-hover)' : 'var(--bg-card)',
                color: 'var(--text-primary)',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Format */}
      <div>
        <label className="block text-sm font-medium mb-2 text-content-secondary">{t('settings.timeFormat')}</label>
        <div className="flex gap-3">
          {[
            { value: '24h', short: '24h', example: '14:30' },
            { value: '12h', short: '12h', example: '2:30 PM' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={async () => {
                try { await updateSetting('time_format', opt.value) }
                catch (e: unknown) { toast.error(e instanceof Error ? e.message : t('common.error')) }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500,
                border: settings.time_format === opt.value ? '2px solid var(--text-primary)' : '2px solid var(--border-primary)',
                background: settings.time_format === opt.value ? 'var(--bg-hover)' : 'var(--bg-card)',
                color: 'var(--text-primary)',
                transition: 'all 0.15s',
              }}
            >
              {opt.short}
              <span className="hidden sm:inline">{` (${opt.example})`}</span>
            </button>
          ))}
        </div>
      </div>
      </Section>

      <Section title={t('settings.general.travelMap')} icon={Map}>
      {/* Booking route labels */}
      <div>
        <label className="block text-sm font-medium mb-2 text-content-secondary">{t('settings.bookingLabels')}</label>
        <div className="flex gap-3">
          {[
            { value: true, label: t('settings.on') || 'On' },
            { value: false, label: t('settings.off') || 'Off' },
          ].map(opt => (
            <button
              key={String(opt.value)}
              onClick={async () => {
                try { await updateSetting('map_booking_labels', opt.value) }
                catch (e: unknown) { toast.error(e instanceof Error ? e.message : t('common.error')) }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500,
                border: (settings.map_booking_labels === true) === opt.value ? '2px solid var(--text-primary)' : '2px solid var(--border-primary)',
                background: (settings.map_booking_labels === true) === opt.value ? 'var(--bg-hover)' : 'var(--bg-card)',
                color: 'var(--text-primary)',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs mt-1 text-content-faint">{t('settings.bookingLabelsHint')}</p>
      </div>

      {/* Explore places on the map (POI category pill) */}
      <div>
        <label className="block text-sm font-medium mb-2 text-content-secondary">{t('settings.mapPoiPill')}</label>
        <div className="flex gap-3">
          {[
            { value: true, label: t('settings.on') || 'On' },
            { value: false, label: t('settings.off') || 'Off' },
          ].map(opt => (
            <button
              key={String(opt.value)}
              onClick={async () => {
                try { await updateSetting('map_poi_pill_enabled', opt.value) }
                catch (e: unknown) { toast.error(e instanceof Error ? e.message : t('common.error')) }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500,
                border: (settings.map_poi_pill_enabled !== false) === opt.value ? '2px solid var(--text-primary)' : '2px solid var(--border-primary)',
                background: (settings.map_poi_pill_enabled !== false) === opt.value ? 'var(--bg-hover)' : 'var(--bg-card)',
                color: 'var(--text-primary)',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs mt-1 text-content-faint">{t('settings.mapPoiPillHint')}</p>
      </div>

      {/* Blur Booking Codes */}
      <div>
        <label className="block text-sm font-medium mb-2 text-content-secondary">{t('settings.blurBookingCodes')}</label>
        <div className="flex gap-3">
          {[
            { value: true, label: t('settings.on') || 'On' },
            { value: false, label: t('settings.off') || 'Off' },
          ].map(opt => (
            <button
              key={String(opt.value)}
              onClick={async () => {
                try { await updateSetting('blur_booking_codes', opt.value) }
                catch (e: unknown) { toast.error(e instanceof Error ? e.message : t('common.error')) }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500,
                border: (!!settings.blur_booking_codes) === opt.value ? '2px solid var(--text-primary)' : '2px solid var(--border-primary)',
                background: (!!settings.blur_booking_codes) === opt.value ? 'var(--bg-hover)' : 'var(--bg-card)',
                color: 'var(--text-primary)',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Optimize route from accommodation */}
      <div>
        <label className="block text-sm font-medium mb-2 text-content-secondary">{t('settings.optimizeFromAccommodation')}</label>
        <div className="flex gap-3">
          {[
            { value: true, label: t('settings.on') || 'On' },
            { value: false, label: t('settings.off') || 'Off' },
          ].map(opt => (
            <button
              key={String(opt.value)}
              onClick={async () => {
                try { await updateSetting('optimize_from_accommodation', opt.value) }
                catch (e: unknown) { toast.error(e instanceof Error ? e.message : t('common.error')) }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500,
                border: (settings.optimize_from_accommodation !== false) === opt.value ? '2px solid var(--text-primary)' : '2px solid var(--border-primary)',
                background: (settings.optimize_from_accommodation !== false) === opt.value ? 'var(--bg-hover)' : 'var(--bg-card)',
                color: 'var(--text-primary)',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs mt-1 text-content-faint">{t('settings.optimizeFromAccommodationHint')}</p>
      </div>
      </Section>
    </>
  )
}
