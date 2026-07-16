import { useState } from 'react'
import { ChevronDown, Languages, Map } from 'lucide-react'
import { useTranslation, SUPPORTED_LANGUAGES } from '../../../i18n'
import { useSettingsStore } from '../../../store/settingsStore'
import { useToast } from '../../../components/shared/Toast'
import { SYMBOLS, currenciesWith } from '../../../components/Budget/BudgetPanel.constants'
import type { Settings, DistanceUnit } from '../../../types'
import { MSetCard, MSetEyebrow, MSetSelectRow, MSetSegments, MSetOnOff, MSetRow } from './MSettingsUi'
import MSetPickerSheet from './MSetPickerSheet'

/**
 * "General" settings section — the demo's Language & region and Travel & map
 * cards, wired to the real user preferences (DisplaySettingsTab parity).
 */
export default function MSettingsGeneral() {
  const { t } = useTranslation()
  const toast = useToast()
  const { settings, updateSetting } = useSettingsStore()
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  const save = async (key: keyof Settings, value: Settings[keyof Settings]) => {
    try {
      await updateSetting(key, value)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t('common.error'))
    }
  }

  const currency = settings.default_currency || ''
  const currencyLabel = currency ? `${currency} — ${SYMBOLS[currency] || currency}` : t('settings.currencyTrip')
  const language = SUPPORTED_LANGUAGES.find((l) => l.value === settings.language) || SUPPORTED_LANGUAGES[0]

  const chevron = <ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />

  const travelRows: {
    key: keyof Settings
    label: string
    sub: string
    on: boolean
    value: (on: boolean) => boolean
  }[] = [
    {
      key: 'map_booking_labels',
      label: t('settings.bookingLabels'),
      sub: t('settings.bookingLabelsHint'),
      on: settings.map_booking_labels === true,
      value: (on) => on,
    },
    {
      key: 'map_poi_pill_enabled',
      label: t('settings.mapPoiPill'),
      sub: t('settings.mapPoiPillHint'),
      on: settings.map_poi_pill_enabled !== false,
      value: (on) => on,
    },
    {
      key: 'blur_booking_codes',
      label: t('settings.blurBookingCodes'),
      sub: t('mobileSettings.blurBookingCodesHint'),
      on: !!settings.blur_booking_codes,
      value: (on) => on,
    },
    {
      key: 'optimize_from_accommodation',
      label: t('settings.optimizeFromAccommodation'),
      sub: t('settings.optimizeFromAccommodationHint'),
      on: settings.optimize_from_accommodation !== false,
      value: (on) => on,
    },
  ]

  return (
    <>
      <MSetCard title={t('settings.general.languageRegion')} icon={Languages}>
        <MSetEyebrow className="mb-[5px]">{t('settings.currency')}</MSetEyebrow>
        <MSetSelectRow label={currencyLabel} trailing={chevron} onClick={() => setCurrencyOpen(true)} />

        <MSetEyebrow className="mb-[5px] mt-[14px]">{t('settings.language')}</MSetEyebrow>
        <MSetSelectRow label={language.label} trailing={chevron} onClick={() => setLangOpen(true)} />

        <MSetEyebrow className="mb-[6px] mt-[14px]">{t('settings.temperature')}</MSetEyebrow>
        <MSetSegments
          value={settings.temperature_unit || 'celsius'}
          onChange={(v) => save('temperature_unit', v)}
          options={[
            { value: 'celsius', label: '°C Celsius' },
            { value: 'fahrenheit', label: '°F Fahrenheit' },
          ]}
        />

        <MSetEyebrow className="mb-[6px] mt-[14px]">{t('settings.distance')}</MSetEyebrow>
        <MSetSegments<DistanceUnit>
          value={settings.distance_unit || 'metric'}
          onChange={(v) => save('distance_unit', v)}
          options={[
            { value: 'metric', label: 'km Metric' },
            { value: 'imperial', label: 'mi Imperial' },
          ]}
        />

        <MSetEyebrow className="mb-[6px] mt-[14px]">{t('settings.timeFormat')}</MSetEyebrow>
        <MSetSegments
          value={settings.time_format || '24h'}
          onChange={(v) => save('time_format', v)}
          options={[
            { value: '24h', label: '24h' },
            { value: '12h', label: '12h' },
          ]}
        />
      </MSetCard>

      <MSetCard title={t('settings.general.travelMap')} icon={Map} className="mt-3">
        <div className="-mt-[6px]">
          {travelRows.map((row) => (
            <MSetRow
              key={row.key as string}
              label={row.label}
              sub={row.sub}
              trailing={
                <MSetOnOff
                  on={row.on}
                  onChange={(on) => save(row.key, row.value(on))}
                  onLabel={t('settings.on')}
                  offLabel={t('settings.off')}
                  ariaLabel={row.label}
                />
              }
            />
          ))}
        </div>
      </MSetCard>

      <MSetPickerSheet
        open={currencyOpen}
        onClose={() => setCurrencyOpen(false)}
        title={t('settings.currency')}
        value={currency}
        onSelect={(v) => save('default_currency', v)}
        options={[
          { value: '', label: t('settings.currencyTrip') },
          ...currenciesWith(currency).map((c) => ({ value: c, label: `${c} — ${SYMBOLS[c] || c}` })),
        ]}
      />

      <MSetPickerSheet
        open={langOpen}
        onClose={() => setLangOpen(false)}
        title={t('settings.language')}
        value={settings.language}
        onSelect={(v) => save('language', v)}
        options={SUPPORTED_LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
      />
    </>
  )
}
