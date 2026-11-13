import React from 'react'
import { Loader2, Map as MapIcon, Settings2, Route } from 'lucide-react'
import { useTranslation } from '../../i18n'
import Section from '../Settings/Section'
import { SettingRow, SettingRows, SettingsColumns } from '../Settings/settingsKit'
import { fs } from '../shared/DialogShell'
import { EditorField, INPUT, Segmented } from '../shared/dialogParts'
import CustomSelect from '../shared/CustomSelect'
import { MapView } from '../Map/MapView'
import { SYMBOLS, currenciesWith } from '../Budget/BudgetPanel.constants'
import type { DistanceUnit, WeekStart } from '../../types'
import { weekStartOptions } from '../../utils/calendarWeek'
import { dateFormatOptions } from '../../utils/dateFormat'
import { withTileApiKey } from '../../utils/tileUrl'
import { defaultStyleForProvider } from '../Map/glProviders'
import type { MapProvider } from '../Settings/mapSettingsModel'
import RoutingInstanceFields from './RoutingInstanceFields'
import { useDefaultUserSettings, type Defaults } from './useDefaultUserSettings'

/**
 * One default as a row of the card's white box: its name (with the reset link
 * once it is set) on the left, the choice on the right. `stacked` puts a wide
 * choice and a hint under the name. The label sits straight in the row, so the
 * row is the nearest box around both the name and its choice.
 */
function ChoiceRow({
  label,
  hint,
  stacked = false,
  children,
}: {
  label: React.ReactNode
  hint?: string
  stacked?: boolean
  children: React.ReactNode
}) {
  // The settings row every page uses, so a default reads like the setting it presets.
  return <SettingRow label={label} hint={hint} control={children} stacked={stacked} />
}

/** A wide field box inside the white rows, for the map card's token and style. */
const FIELD_ROW = 'px-3.5 py-3'

/** On/Off for a boolean default; neither is pressed while it is unset. */
function onOffValue(value: boolean | undefined): string {
  if (value === true) return 'on'
  if (value === false) return 'off'
  return ''
}

/** The stored colour mode as one of the three choices; a legacy boolean still picks light or dark. */
function colorModeValue(value: string | boolean | undefined): string {
  if (value === true) return 'dark'
  if (value === false) return 'light'
  return value ?? ''
}

/** A failed save names the error it threw, or falls back to the generic one. */
function errorText(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

interface ResetProps {
  shown: boolean
  onReset: () => void
  label: string
}

// Inside the row's own <label>, after the name: the link only shows once the
// default is set, and the name stays the label's text.
function ResetButton({ shown, onReset, label }: ResetProps): React.ReactElement | null {
  if (!shown) return null
  return (
    <button type="button"
      onClick={onReset}
      className="ms-2 align-baseline font-geist font-medium normal-case tracking-normal text-content-muted underline decoration-edge underline-offset-2 hover:text-content"
      style={fs(11)}
    >
      {label}
    </button>
  )
}

export default function DefaultUserSettingsTab(): React.ReactElement {
  const { t, locale } = useTranslation()
  const {
    defaults, loaded, managed, presets, canMapbox, isSet, save, reset, mapTileUrl, setMapTileUrl, mapboxToken, setMapboxToken,
    cartoKey, setCartoKey, mapboxStyle, setMapboxStyle, mapPreviewPlaces, mapProvider, glStylePresets, styleKey,
    saveMapProvider, pickTilePreset, pickStylePreset, commitStyle,
  } = useDefaultUserSettings({ errorMessage: errorText, previewCreatedAt: () => String(new Date()) })

  const resetOf = (field: keyof Defaults): ResetProps => ({
    shown: isSet(field),
    onReset: () => reset(field),
    label: t('admin.defaultSettings.resetToBuiltIn'),
  })

  if (!loaded) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-edge-faint bg-surface-secondary px-4 py-5 text-content-faint" style={fs(12.5, 'body')}>
        <Loader2 size={15} className="animate-spin" />
        Loading…
      </div>
    )
  }

  const darkMode = defaults.dark_mode

  return (
    <SettingsColumns
      left={
      <>

      <Section title={t('admin.defaultSettings.title')} icon={Settings2} hint={t('admin.defaultSettings.description')}>
      <SettingRows>
      {/* Color Mode */}
      <ChoiceRow label={<>{t('settings.colorMode')} <ResetButton {...resetOf('dark_mode')} /></>}>
        <Segmented<string>
          label={t('settings.colorMode')}
          value={colorModeValue(darkMode)}
          onChange={value => save({ dark_mode: value })}
          options={[
            { value: 'light', label: t('settings.light') },
            { value: 'dark', label: t('settings.dark') },
            { value: 'auto', label: t('settings.auto') },
          ]}
        />
      </ChoiceRow>

      {/* Temperature */}
      <ChoiceRow label={<>{t('settings.temperature')} <ResetButton {...resetOf('temperature_unit')} /></>}>
        <Segmented<string>
          label={t('settings.temperature')}
          value={defaults.temperature_unit ?? ''}
          onChange={value => save({ temperature_unit: value })}
          options={[
            { value: 'celsius', label: '°C Celsius' },
            { value: 'fahrenheit', label: '°F Fahrenheit' },
          ]}
        />
      </ChoiceRow>

      {/* Distance */}
      <ChoiceRow label={<>{t('settings.distance')} <ResetButton {...resetOf('distance_unit')} /></>}>
        <Segmented<DistanceUnit | ''>
          label={t('settings.distance')}
          value={defaults.distance_unit ?? ''}
          onChange={value => { if (value) void save({ distance_unit: value }) }}
          options={[
            { value: 'metric', label: 'km Metric' },
            { value: 'imperial', label: 'mi Imperial' },
          ]}
        />
      </ChoiceRow>

      {/* Time Format */}
      <ChoiceRow label={<>{t('settings.timeFormat')} <ResetButton {...resetOf('time_format')} /></>}>
        <Segmented<string>
          label={t('settings.timeFormat')}
          value={defaults.time_format ?? ''}
          onChange={value => save({ time_format: value })}
          options={[
            { value: '24h', label: '24h (14:30)' },
            { value: '12h', label: '12h (2:30 PM)' },
          ]}
        />
      </ChoiceRow>

      {/* Week start: the first column of every date picker (#2029) */}
      <ChoiceRow label={<>{t('settings.weekStart')} <ResetButton {...resetOf('week_start')} /></>}>
        <Segmented<WeekStart | ''>
          label={t('settings.weekStart')}
          value={defaults.week_start ?? ''}
          onChange={value => { if (value) void save({ week_start: value }) }}
          options={weekStartOptions(locale)}
        />
      </ChoiceRow>

      {/* Date format: every date field and numeric date (#2971) */}
      <ChoiceRow label={<>{t('settings.dateFormat')} <ResetButton {...resetOf('date_format')} /></>}>
        <div className="w-[220px] max-w-full">
          <CustomSelect
            value={defaults.date_format ?? ''}
            onChange={value => { if (value) void save({ date_format: String(value) as Defaults['date_format'] }) }}
            options={dateFormatOptions(locale, t('settings.dateFormatAuto'))}
          />
        </div>
      </ChoiceRow>

      {/* Default Currency */}
      <ChoiceRow label={<>{t('settings.currency')} <ResetButton {...resetOf('default_currency')} /></>} hint={t('settings.currencyHint')}>
        <div className="w-[220px] max-w-full">
          <CustomSelect
            value={defaults.default_currency || ''}
            onChange={(value: string) => { if (value) void save({ default_currency: value }) }}
            placeholder={t('settings.currency')}
            searchable
            options={currenciesWith(defaults.default_currency).map(c => ({ value: c, label: SYMBOLS[c] ? `${c}  ${SYMBOLS[c]}` : c }))}
          />
        </div>
      </ChoiceRow>

      {/* Blur Booking Codes */}
      <ChoiceRow label={<>{t('settings.blurBookingCodes')} <ResetButton {...resetOf('blur_booking_codes')} /></>}>
        <Segmented<string>
          label={t('settings.blurBookingCodes')}
          value={onOffValue(defaults.blur_booking_codes)}
          onChange={value => save({ blur_booking_codes: value === 'on' })}
          options={[
            { value: 'on', label: t('settings.on') || 'On' },
            { value: 'off', label: t('settings.off') || 'Off' },
          ]}
        />
      </ChoiceRow>
      </SettingRows>
      </Section>
      {/* Which engines answer routes, under the defaults: on its own card it keeps
          the two columns about as long as each other. */}
      {!managed && (
        <Section title={t('admin.defaultSettings.routing')} icon={Route}>
          <RoutingInstanceFields defaults={defaults} onSave={save} onReset={reset} />
        </Section>
      )}
      </>
      }
      right={
      <Section title={t('settings.map')} icon={MapIcon}>
      {/* Map Tile URL */}
      <EditorField label={<>{t('settings.mapTemplate')}<ResetButton {...resetOf('map_tile_url')} /></>} hint={t('settings.mapDefaultHint')}>
        <div className="flex flex-col gap-2">
          <CustomSelect
            value={mapTileUrl}
            onChange={pickTilePreset}
            placeholder={t('settings.mapTemplatePlaceholder.select')}
            options={presets.map(p => ({ value: p.url, label: p.name }))}
          />
          <input
            type="text"
            value={mapTileUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapTileUrl(e.target.value)}
            onBlur={() => save({ map_tile_url: mapTileUrl })}
            placeholder="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            className={`${INPUT} font-geist`}
          />
        </div>
      </EditorField>
      {/* The key comes with the instance on a managed install, injected when the
          settings are read. A field here would only let somebody save a worse one. */}
      {!managed && (
        <EditorField label={<>{t('admin.defaultSettings.cartoKey')}<ResetButton {...resetOf('carto_api_key')} /></>} hint={t('admin.defaultSettings.cartoKeyHint')}>
          <input
            type="text"
            value={cartoKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCartoKey(e.target.value)}
            onBlur={() => save({ carto_api_key: cartoKey })}
            spellCheck={false}
            autoComplete="off"
            className={`${INPUT} font-geist`}
          />
        </EditorField>
      )}
      <div className="relative h-[200px] w-full overflow-hidden rounded-[12px] border border-edge-faint">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {React.createElement(MapView as any, {
          places: mapPreviewPlaces,
          dayPlaces: [],
          route: null,
          routeSegments: null,
          selectedPlaceId: null,
          onMarkerClick: null,
          onMapClick: null,
          onMapContextMenu: null,
          center: [48.8566, 2.3522],
          zoom: 10,
          // Same as the user-facing map tab: the field holds what is being
          // edited, so the key goes back on before the preview resolves it.
          tileUrl: withTileApiKey(mapTileUrl, cartoKey),
          fitKey: null,
          dayOrderMap: [],
          leftWidth: 0,
          rightWidth: 0,
          hasInspector: false,
        })}
      </div>

      {/* ── Map provider / instance-wide Mapbox ───────────────────────── */}
      <SettingRows>
        <ChoiceRow
          stacked
          label={<>{t('admin.defaultSettings.mapProvider')} <ResetButton {...resetOf('map_provider')} /></>}
          hint={t('admin.defaultSettings.mapProviderHint')}
        >
          <Segmented<MapProvider>
            fill
            label={t('admin.defaultSettings.mapProvider')}
            value={mapProvider}
            onChange={saveMapProvider}
            options={[
              { value: 'leaflet', label: t('admin.defaultSettings.providerLeaflet') },
              ...(canMapbox ? [{ value: 'mapbox-gl' as const, label: t('admin.defaultSettings.providerMapbox') }] : []),
              { value: 'maplibre-gl', label: t('admin.defaultSettings.providerMapLibre') },
            ]}
          />
        </ChoiceRow>

        {/* The token comes with the instance on a managed install, injected when the
          settings are read. A field here would only let somebody save a worse one. */}
        {mapProvider === 'mapbox-gl' && !managed && (
          <div className={FIELD_ROW}>
            <EditorField label={<>{t('admin.defaultSettings.mapboxToken')}<ResetButton {...resetOf('mapbox_access_token')} /></>} hint={t('admin.defaultSettings.mapboxTokenHint')}>
              <input
                type="text"
                value={mapboxToken}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapboxToken(e.target.value)}
                onBlur={() => save({ mapbox_access_token: mapboxToken })}
                placeholder="pk.eyJ…"
                spellCheck={false}
                autoComplete="off"
                className={`${INPUT} font-geist`}
              />
            </EditorField>
          </div>
        )}

        {mapProvider !== 'leaflet' && (
          <div className={FIELD_ROW}>
            <EditorField label={<>{t('admin.defaultSettings.mapboxStyle')}<ResetButton {...resetOf(styleKey)} /></>}>
              <div className="flex flex-col gap-2">
                <CustomSelect
                  value={mapboxStyle}
                  onChange={pickStylePreset}
                  placeholder={t('admin.defaultSettings.mapboxStylePlaceholder')}
                  options={glStylePresets.map(p => ({ value: p.url, label: p.name }))}
                />
                <input
                  type="text"
                  value={mapboxStyle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapboxStyle(e.target.value)}
                  onBlur={commitStyle}
                  placeholder={defaultStyleForProvider(mapProvider)}
                  className={`${INPUT} font-geist`}
                />
              </div>
            </EditorField>
          </div>
        )}

        {mapProvider === 'mapbox-gl' && (
          <>
          <ChoiceRow label={<>{t('admin.defaultSettings.mapbox3d')} <ResetButton {...resetOf('mapbox_3d_enabled')} /></>}>
            <Segmented<string>
              label={t('admin.defaultSettings.mapbox3d')}
              value={onOffValue(defaults.mapbox_3d_enabled ?? true)}
              onChange={value => save({ mapbox_3d_enabled: value === 'on' })}
              options={[
                { value: 'on', label: t('settings.on') || 'On' },
                { value: 'off', label: t('settings.off') || 'Off' },
              ]}
            />
          </ChoiceRow>

          <ChoiceRow label={<>{t('admin.defaultSettings.mapboxQuality')} <ResetButton {...resetOf('mapbox_quality_mode')} /></>}>
            <Segmented<string>
              label={t('admin.defaultSettings.mapboxQuality')}
              value={onOffValue(defaults.mapbox_quality_mode ?? false)}
              onChange={value => save({ mapbox_quality_mode: value === 'on' })}
              options={[
                { value: 'on', label: t('settings.on') || 'On' },
                { value: 'off', label: t('settings.off') || 'Off' },
              ]}
            />
          </ChoiceRow>
          </>
        )}
      </SettingRows>
      </Section>
      }
    />
  )
}
