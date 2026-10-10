import React from 'react'
import { Loader2, Map as MapIcon, Settings2 } from 'lucide-react'
import { useTranslation } from '../../i18n'
import Section from '../Settings/Section'
import { SettingRows, SettingsHint } from '../Settings/settingsKit'
import { fs } from '../shared/DialogShell'
import { EditorField, INPUT, Segmented } from '../shared/dialogParts'
import CustomSelect from '../shared/CustomSelect'
import { MapView } from '../Map/MapView'
import { SYMBOLS, currenciesWith } from '../Budget/BudgetPanel.constants'
import type { DistanceUnit, WeekStart } from '../../types'
import { weekStartOptions } from '../../utils/calendarWeek'
import { withTileApiKey } from '../../utils/tileUrl'
import { defaultStyleForProvider } from '../Map/glProviders'
import { MAP_PRESETS, type MapProvider } from '../Settings/mapSettingsModel'
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
  return (
    <div className={stacked ? 'flex flex-col gap-2.5 px-3.5 py-3' : 'flex flex-wrap items-center gap-x-4 gap-y-2 px-3.5 py-3'}>
      <label className={`block font-medium text-content ${stacked ? '' : 'min-w-0 flex-1 basis-40'}`} style={fs(13, 'body')}>
        {label}
      </label>
      {hint && <p className="-mt-2 m-0 leading-snug text-content-faint" style={fs(11.5)}>{hint}</p>}
      <div className={stacked ? 'min-w-0' : 'flex min-w-0 flex-none items-center'}>{children}</div>
    </div>
  )
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

export default function DefaultUserSettingsTab(): React.ReactElement {
  const { t, locale } = useTranslation()
  const {
    defaults, loaded, managed, isSet, save, reset, mapTileUrl, setMapTileUrl, mapboxToken, setMapboxToken,
    cartoKey, setCartoKey, mapboxStyle, setMapboxStyle, mapPreviewPlaces, mapProvider, glStylePresets, styleKey,
    saveMapProvider, pickTilePreset, pickStylePreset, commitStyle,
  } = useDefaultUserSettings({ errorMessage: errorText, previewCreatedAt: () => String(new Date()) })

  // Inside the row's own <label>, after the name: the link only shows once the
  // default is set, and the name stays the label's text.
  const ResetButton = ({ field }: { field: keyof Defaults }) =>
    isSet(field) ? (
      <button type="button"
        onClick={() => reset(field)}
        className="ms-2 align-baseline font-geist font-medium normal-case tracking-normal text-content-muted underline decoration-edge underline-offset-2 hover:text-content"
        style={fs(11)}
      >
        {t('admin.defaultSettings.resetToBuiltIn')}
      </button>
    ) : null

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
    <div>
      <SettingsHint className="mb-4">
        {t('admin.defaultSettings.description')}
      </SettingsHint>

      {/* Two columns from xl up, the same idea as the Settings tab: as one flat list
          the map fields sat a screen below the units while the right half of the page
          stayed empty. Grouped by subject rather than by height — what a user ends up
          seeing on the left, everything that configures the map on the right.
          The columns are deliberately uneven: the left one never needs more than the
          widest option row, while the right one holds four text fields whose values
          are 60-character tile URLs. Only the column gap is set, because Section
          carries its own bottom margin and a row gap would double it once the grid
          collapses. Two cards can sit straight in the grid; a third would need the
          explicit per-column stacks the Settings tab uses, or it leaves a hole. */}
      <div className="grid grid-cols-1 gap-x-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] xl:items-start">
      <Section title={t('admin.defaultSettings.title')} icon={Settings2}>
      <SettingRows>
      {/* Color Mode */}
      <ChoiceRow label={<>{t('settings.colorMode')} <ResetButton field="dark_mode" /></>}>
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
      <ChoiceRow label={<>{t('settings.temperature')} <ResetButton field="temperature_unit" /></>}>
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
      <ChoiceRow label={<>{t('settings.distance')} <ResetButton field="distance_unit" /></>}>
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
      <ChoiceRow label={<>{t('settings.timeFormat')} <ResetButton field="time_format" /></>}>
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
      <ChoiceRow label={<>{t('settings.weekStart')} <ResetButton field="week_start" /></>}>
        <Segmented<WeekStart | ''>
          label={t('settings.weekStart')}
          value={defaults.week_start ?? ''}
          onChange={value => { if (value) void save({ week_start: value }) }}
          options={weekStartOptions(locale)}
        />
      </ChoiceRow>

      {/* Default Currency */}
      <ChoiceRow label={<>{t('settings.currency')} <ResetButton field="default_currency" /></>}>
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
      <ChoiceRow label={<>{t('settings.blurBookingCodes')} <ResetButton field="blur_booking_codes" /></>}>
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
      <SettingsHint className="-mt-2">{t('settings.currencyHint')}</SettingsHint>
      </Section>

      <Section title={t('settings.map')} icon={MapIcon}>
      {/* Map Tile URL */}
      <EditorField label={<>{t('settings.mapTemplate')}<ResetButton field="map_tile_url" /></>} hint={t('settings.mapDefaultHint')}>
        <div className="flex flex-col gap-2">
          <CustomSelect
            value={mapTileUrl}
            onChange={pickTilePreset}
            placeholder={t('settings.mapTemplatePlaceholder.select')}
            options={MAP_PRESETS.map(p => ({ value: p.url, label: p.name }))}
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
        <EditorField label={<>{t('admin.defaultSettings.cartoKey')}<ResetButton field="carto_api_key" /></>} hint={t('admin.defaultSettings.cartoKeyHint')}>
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
      {!managed && <RoutingInstanceFields defaults={defaults} onSave={save} onReset={reset} />}
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
          label={<>{t('admin.defaultSettings.mapProvider')} <ResetButton field="map_provider" /></>}
          hint={t('admin.defaultSettings.mapProviderHint')}
        >
          <Segmented<MapProvider>
            fill
            label={t('admin.defaultSettings.mapProvider')}
            value={mapProvider}
            onChange={saveMapProvider}
            options={[
              { value: 'leaflet', label: t('admin.defaultSettings.providerLeaflet') },
              { value: 'mapbox-gl', label: t('admin.defaultSettings.providerMapbox') },
              { value: 'maplibre-gl', label: t('admin.defaultSettings.providerMapLibre') },
            ]}
          />
        </ChoiceRow>

        {/* The token comes with the instance on a managed install, injected when the
          settings are read. A field here would only let somebody save a worse one. */}
        {mapProvider === 'mapbox-gl' && !managed && (
          <div className={FIELD_ROW}>
            <EditorField label={<>{t('admin.defaultSettings.mapboxToken')}<ResetButton field="mapbox_access_token" /></>} hint={t('admin.defaultSettings.mapboxTokenHint')}>
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
            <EditorField label={<>{t('admin.defaultSettings.mapboxStyle')}<ResetButton field={styleKey} /></>}>
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
          <ChoiceRow label={<>{t('admin.defaultSettings.mapbox3d')} <ResetButton field="mapbox_3d_enabled" /></>}>
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

          <ChoiceRow label={<>{t('admin.defaultSettings.mapboxQuality')} <ResetButton field="mapbox_quality_mode" /></>}>
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
      </div>
    </div>
  )
}
