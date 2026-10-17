import React, { useState, useEffect, useRef } from 'react'
import { Languages, Map, ChevronDown, Rocket } from 'lucide-react'
import { SUPPORTED_LANGUAGES, useTranslation } from '../../i18n'
import { DEFAULT_SETTINGS } from '../../store/settingsStore'
import CustomSelect from '../shared/CustomSelect'
import { Segmented } from '../shared/dialogParts'
import { fs } from '../shared/DialogShell'
import { POPOVER } from '../Packing/packingPopoverStyles'
import { PopoverItem } from '../Packing/PackingPopover'
import { preferredNavAppOptions } from '../Planner/placeNavigation'
import { SYMBOLS, currenciesWith } from '../Budget/BudgetPanel.constants'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'
import { ChoiceChips, SettingRow, SettingRows } from './settingsKit'
import { useSettingSaver } from './useSettingSaver'
import { TRIP_TAB_IDS, TRIP_TAB_LABEL_KEYS } from '../../constants/tripTabs'
import { DEFAULT_START_PAGE, DEFAULT_START_TRIP_TAB } from '../../utils/startDestination'
import type { DistanceUnit } from '../../types'
import { DEFAULT_WEEK_START } from '@trek/shared'
import { weekStartOptions } from '../../utils/calendarWeek'

/** A select on the right of a row: wide enough for a currency or a weekday, never wider than the row. */
const SELECT_BOX = 'w-[260px] max-w-full'

export default function DisplaySettingsTab(): React.ReactElement {
  const { settings, save } = useSettingSaver()
  const { t, locale } = useTranslation()
  const [tempUnit, setTempUnit] = useState<string>(settings.temperature_unit || DEFAULT_SETTINGS.temperature_unit)
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(settings.distance_unit || DEFAULT_SETTINGS.distance_unit)
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
    setTempUnit(settings.temperature_unit || DEFAULT_SETTINGS.temperature_unit)
  }, [settings.temperature_unit])

  useEffect(() => {
    setDistanceUnit(settings.distance_unit || DEFAULT_SETTINGS.distance_unit)
  }, [settings.distance_unit])

  const saveOnOff = (key: OnOffKey, value: boolean) => save(key, value)

  const startPage = settings.start_page === 'active_trip' ? 'active_trip' : DEFAULT_START_PAGE
  const startTripTab = settings.start_trip_tab || DEFAULT_START_TRIP_TAB
  const currentLanguage = SUPPORTED_LANGUAGES.find(o => o.value === settings.language) || SUPPORTED_LANGUAGES[0]

  const pickLanguage = (value: string) => save('language', value)

  return (
    <>
      <Section title={t('settings.general.startup')} icon={Rocket}>
        <SettingRows>
          {/* Where opening TREK lands */}
          <SettingRow
            label={t('settings.startPage')}
            hint={t('settings.startPageHint')}
            control={
              <Segmented
                label={t('settings.startPage')}
                value={startPage}
                options={[
                  { value: 'dashboard', label: t('settings.startPageDashboard') },
                  { value: 'active_trip', label: t('settings.startPageActiveTrip') },
                ]}
                onChange={async value => {
                  await save('start_page', value)
                }}
              />
            }
          />

          {/* Which planner tab the trip opens on — only meaningful for 'active_trip' */}
          {startPage === 'active_trip' && (
            <SettingRow
              label={t('settings.startTripTab')}
              hint={t('settings.startTripTabHint')}
              control={
                <div className={SELECT_BOX}>
                  <CustomSelect
                    value={startTripTab}
                    onChange={async v => {
                      await save('start_trip_tab', String(v))
                    }}
                    options={TRIP_TAB_IDS.map(id => ({ value: id, label: t(TRIP_TAB_LABEL_KEYS[id]) }))}
                  />
                </div>
              }
            />
          )}
        </SettingRows>
      </Section>

      <Section title={t('settings.general.languageRegion')} icon={Languages}>
        <SettingRows>
          {/* Display currency. Unset ('') means "no personal preference": Costs then shows
              each trip in its own currency, instead of forcing every trip through one. */}
          <SettingRow
            label={t('settings.currency')}
            hint={t('settings.currencyHint')}
            control={
              <div className={SELECT_BOX}>
                <CustomSelect
                  value={settings.default_currency || ''}
                  onChange={async v => {
                    await save('default_currency', String(v))
                  }}
                  options={[
                    { value: '', label: t('settings.currencyTrip') },
                    ...currenciesWith(settings.default_currency || '').map(c => ({ value: c, label: `${c} — ${SYMBOLS[c] || c}` })),
                  ]}
                  searchable
                />
              </div>
            }
          />

          {/* Language: every option at a glance on a wide window, a compact list on a narrow one */}
          <SettingRow label={t('settings.language')} stacked>
            <div className="hidden sm:block">
              <ChoiceChips
                label={t('settings.language')}
                value={settings.language}
                options={SUPPORTED_LANGUAGES.map(opt => ({ value: opt.value, label: opt.label }))}
                onChange={pickLanguage}
              />
            </div>
            <div ref={langDropdownRef} className="relative sm:hidden">
              <button
                type="button"
                onClick={() => setLangOpen(v => !v)}
                aria-expanded={langOpen}
                className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-edge bg-surface-input px-3 py-2 text-start font-medium text-content"
                style={fs(13, 'body')}
              >
                <span className="min-w-0 truncate">{currentLanguage?.label}</span>
                <ChevronDown size={14} className={`flex-none text-content-faint transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute inset-x-0 top-[calc(100%+4px)] z-50 max-h-[280px] overflow-y-auto" style={POPOVER}>
                  {SUPPORTED_LANGUAGES.map(opt => (
                    <PopoverItem
                      key={opt.value}
                      icon={null}
                      label={opt.label}
                      active={settings.language === opt.value}
                      onClick={async () => {
                        setLangOpen(false)
                        await pickLanguage(opt.value)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </SettingRow>

          {/* Place names (#1799): searches can answer in another language than the app. */}
          <SettingRow
            label={t('settings.placeLanguage')}
            hint={t('settings.placeLanguageHint')}
            control={
              <div className={SELECT_BOX}>
                <CustomSelect
                  value={settings.place_language || ''}
                  onChange={async v => {
                    await save('place_language', String(v))
                  }}
                  options={[
                    { value: '', label: t('settings.placeLanguageApp') },
                    ...SUPPORTED_LANGUAGES.map(opt => ({ value: opt.value, label: opt.label })),
                  ]}
                  searchable
                />
              </div>
            }
          />

          {/* Temperature */}
          <SettingRow
            label={t('settings.temperature')}
            control={
              <Segmented
                label={t('settings.temperature')}
                value={tempUnit}
                options={[
                  { value: 'celsius', label: '°C Celsius' },
                  { value: 'fahrenheit', label: '°F Fahrenheit' },
                ]}
                onChange={async value => {
                  setTempUnit(value)
                  await save('temperature_unit', value)
                }}
              />
            }
          />

          {/* Distance */}
          <SettingRow
            label={t('settings.distance')}
            control={
              <Segmented<DistanceUnit>
                label={t('settings.distance')}
                value={distanceUnit}
                options={[
                  { value: 'metric', label: 'km Metric' },
                  { value: 'imperial', label: 'mi Imperial' },
                ]}
                onChange={async value => {
                  setDistanceUnit(value)
                  await save('distance_unit', value)
                }}
              />
            }
          />

          {/* Time Format */}
          <SettingRow
            label={t('settings.timeFormat')}
            control={
              <Segmented
                label={t('settings.timeFormat')}
                value={settings.time_format || ''}
                options={[
                  { value: '24h', short: '24h', example: '14:30' },
                  { value: '12h', short: '12h', example: '2:30 PM' },
                ].map(opt => ({
                  value: opt.value,
                  label: <>{opt.short}<span className="hidden font-geist tabular-nums text-content-faint sm:inline">{` (${opt.example})`}</span></>,
                }))}
                onChange={async value => {
                  await save('time_format', value)
                }}
              />
            }
          />

          {/* Week start: the first column of every date picker (#2029) */}
          <SettingRow
            label={t('settings.weekStart')}
            hint={t('settings.weekStartHint')}
            control={
              <div className={SELECT_BOX}>
                <CustomSelect
                  value={settings.week_start || DEFAULT_WEEK_START}
                  onChange={async v => {
                    await save('week_start', String(v))
                  }}
                  options={weekStartOptions(locale)}
                />
              </div>
            }
          />
        </SettingRows>
      </Section>

      <Section title={t('settings.general.travelMap')} icon={Map}>
        <SettingRows>
          {/* Preferred map app (#2423): opt-in, the picker stays the default */}
          <SettingRow
            label={t('settings.preferredNavApp')}
            hint={t('settings.preferredNavAppHint')}
            control={
              <div className={SELECT_BOX}>
                <CustomSelect
                  value={settings.preferred_nav_app || ''}
                  onChange={async v => {
                    await save('preferred_nav_app', String(v))
                  }}
                  options={preferredNavAppOptions(t)}
                />
              </div>
            }
          />

          {/* Date first in day headings (#1953) */}
          <OnOffSetting label={t('settings.dayDateFirst')} hint={t('settings.dayDateFirstHint')} on={settings.day_date_first === true} onChange={value => saveOnOff('day_date_first', value)} />

          {/* Booking route labels */}
          <OnOffSetting label={t('settings.bookingLabels')} hint={t('settings.bookingLabelsHint')} on={settings.map_booking_labels === true} onChange={value => saveOnOff('map_booking_labels', value)} />

          {/* Always show booking routes */}
          <OnOffSetting label={t('settings.alwaysShowRoutes')} hint={t('settings.alwaysShowRoutesHint')} on={settings.map_always_show_routes === true} onChange={value => saveOnOff('map_always_show_routes', value)} />

          {/* Unplanned places as small markers (#2024) */}
          <OnOffSetting label={t('settings.compactUnplanned')} hint={t('settings.compactUnplannedHint')} on={settings.map_compact_unplanned === true} onChange={value => saveOnOff('map_compact_unplanned', value)} />

          {/* Explore places on the map (POI category pill) */}
          <OnOffSetting label={t('settings.mapPoiPill')} hint={t('settings.mapPoiPillHint')} on={settings.map_poi_pill_enabled !== false} onChange={value => saveOnOff('map_poi_pill_enabled', value)} />

          {/* Blur Booking Codes */}
          <OnOffSetting label={t('settings.blurBookingCodes')} on={!!settings.blur_booking_codes} onChange={value => saveOnOff('blur_booking_codes', value)} />

          {/* Optimize route from accommodation */}
          <OnOffSetting label={t('settings.optimizeFromAccommodation')} hint={t('settings.optimizeFromAccommodationHint')} on={settings.optimize_from_accommodation !== false} onChange={value => saveOnOff('optimize_from_accommodation', value)} />
        </SettingRows>
      </Section>
    </>
  )
}

type OnOffKey = 'day_date_first' | 'map_compact_unplanned' | 'map_booking_labels' | 'map_always_show_routes' | 'map_poi_pill_enabled' | 'blur_booking_codes' | 'optimize_from_accommodation'

/** One yes-or-no preference as a row with a switch, the way the planner's settings dialogs ask it. */
function OnOffSetting({ label, hint, on, onChange }: { label: string; hint?: string; on: boolean; onChange: (value: boolean) => void }) {
  return (
    <SettingRow
      label={label}
      hint={hint}
      control={<ToggleSwitch on={on} onToggle={() => onChange(!on)} label={label} />}
    />
  )
}
