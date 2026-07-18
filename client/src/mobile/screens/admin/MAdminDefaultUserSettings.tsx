import React, { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Settings2 } from 'lucide-react'
import { adminApi } from '../../../api/client'
import { useTranslation } from '../../../i18n'
import { useToast } from '../../../components/shared/Toast'
import { MapView } from '../../../components/Map/MapView'
import { SYMBOLS, currenciesWith } from '../../../components/Budget/BudgetPanel.constants'
import type { DistanceUnit, Place } from '../../../types'
import {
  MAPBOX_DEFAULT_STYLE,
  defaultStyleForProvider,
  getStylePresets,
  isOpenFreeMapStyle,
  normalizeStyleForProvider,
  styleSettingKey,
  type GlMapProvider,
} from '../../../components/Map/glProviders'
import MToggle from '../../components/MToggle'
import MSegmented from '../../components/MSegmented'
import { MAdminCard, MAdminCardHead, MAdminField, MAdminInput, MAdminRow } from './MAdminUi'
import { MSetSelectRow } from '../settings/MSettingsUi'
import MSetPickerSheet from '../settings/MSetPickerSheet'

const MAP_PRESETS = [
  { name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { name: 'OpenStreetMap DE', url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png' },
  { name: 'CartoDB Light', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
  { name: 'CartoDB Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  { name: 'Stadia Smooth', url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png' },
]

type Defaults = {
  temperature_unit?: string
  distance_unit?: DistanceUnit
  dark_mode?: string | boolean
  time_format?: string
  default_currency?: string
  blur_booking_codes?: boolean
  map_tile_url?: string
  map_provider?: string
  mapbox_access_token?: string
  mapbox_style?: string
  maplibre_style?: string
  mapbox_3d_enabled?: boolean
  mapbox_quality_mode?: boolean
}

type MapProvider = 'leaflet' | GlMapProvider

function normalizeProvider(value: unknown): MapProvider {
  return value === 'mapbox-gl' || value === 'maplibre-gl' ? value : 'leaflet'
}

function styleForProvider(provider: MapProvider, style?: string | null): string {
  if (provider === 'leaflet') return style || MAPBOX_DEFAULT_STYLE
  if (provider === 'mapbox-gl' && isOpenFreeMapStyle(style)) return MAPBOX_DEFAULT_STYLE
  return normalizeStyleForProvider(provider, style)
}

// Mobile-native rebuild of the desktop DefaultUserSettingsTab. Identical data
// layer (adminApi defaults, per-change auto-save, reset-to-built-in) — only the
// presentation is relaid on the admin mobile design system.
export default function MAdminDefaultUserSettings(): React.ReactElement {
  const { t } = useTranslation()
  const toast = useToast()
  const [defaults, setDefaults] = useState<Defaults>({})
  const [loaded, setLoaded] = useState(false)
  const [mapTileUrl, setMapTileUrl] = useState('')
  const [mapboxToken, setMapboxToken] = useState('')
  const [mapboxStyle, setMapboxStyle] = useState('')
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  const [styleOpen, setStyleOpen] = useState(false)

  useEffect(() => {
    adminApi.getDefaultUserSettings().then((data: Defaults) => {
      const provider = normalizeProvider(data.map_provider)
      setDefaults(data)
      setMapTileUrl(data.map_tile_url || '')
      setMapboxToken(data.mapbox_access_token || '')
      setMapboxStyle(provider === 'leaflet' ? (data.mapbox_style || '') : styleForProvider(provider, provider === 'maplibre-gl' ? data.maplibre_style : data.mapbox_style))
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  const save = async (patch: Partial<Defaults>) => {
    try {
      const updated = await adminApi.updateDefaultUserSettings(patch as Record<string, unknown>)
      setDefaults(updated)
      toast.success(t('admin.defaultSettings.saved'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  const reset = async (key: keyof Defaults) => {
    try {
      const updated = await adminApi.updateDefaultUserSettings({ [key]: null })
      setDefaults(updated)
      if (key === 'map_tile_url') setMapTileUrl('')
      if (key === 'mapbox_access_token') setMapboxToken('')
      if (key === 'mapbox_style' || key === 'maplibre_style') {
        const provider = normalizeProvider(defaults.map_provider)
        setMapboxStyle(provider === 'leaflet' ? '' : defaultStyleForProvider(provider))
      }
      toast.success(t('admin.defaultSettings.reset'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  const isSet = (key: keyof Defaults) => defaults[key] !== undefined

  const ResetButton = ({ field }: { field: keyof Defaults }) =>
    isSet(field) ? (
      <button
        type="button"
        onClick={() => reset(field)}
        className="ml-2 font-geist text-[0.625rem] font-medium text-m-faint underline"
      >
        {t('admin.defaultSettings.resetToBuiltIn')}
      </button>
    ) : null

  const mapPreviewPlaces = useMemo((): Place[] => [{
    id: 1,
    trip_id: 1,
    name: 'Preview center',
    description: null,
    notes: null,
    lat: 48.8566,
    lng: 2.3522,
    address: null,
    category_id: null,
    price: null,
    currency: null,
    image_url: null,
    google_place_id: null,
    osm_id: null,
    route_geometry: null,
    place_time: null,
    end_time: null,
    duration_minutes: null,
    transport_mode: null,
    website: null,
    phone: null,
    created_at: Date(),
  }], [])

  if (!loaded) {
    return (
      <MAdminCard>
        <p className="font-geist text-[0.75rem] italic text-m-faint">Loading…</p>
      </MAdminCard>
    )
  }

  const darkMode = defaults.dark_mode
  const mapProvider = normalizeProvider(defaults.map_provider)
  const glStylePresets = mapProvider === 'leaflet' ? [] : getStylePresets(mapProvider)
  const styleKey: keyof Defaults = mapProvider === 'maplibre-gl' ? 'maplibre_style' : 'mapbox_style'
  const saveMapProvider = (nextProvider: MapProvider) => {
    const patch: Partial<Defaults> = { map_provider: nextProvider }
    if (nextProvider !== 'leaflet') {
      // Load + save the new provider's own style slot so the other provider's style is kept.
      const slot = nextProvider === 'maplibre-gl' ? defaults.maplibre_style : defaults.mapbox_style
      const nextStyle = styleForProvider(nextProvider, slot)
      setMapboxStyle(nextStyle)
      patch[styleSettingKey(nextProvider)] = nextStyle
    }
    save(patch)
  }

  // No active value when the setting is unset → segmented shows no pill, matching
  // the desktop tab (which only highlights a button once a default is chosen).
  const colorModeValue =
    darkMode === 'dark' || darkMode === true
      ? 'dark'
      : darkMode === 'light' || darkMode === false
        ? 'light'
        : darkMode === 'auto'
          ? 'auto'
          : ''

  const modeOptions: { value: string; label: React.ReactNode }[] = [
    { value: 'light', label: t('settings.light') },
    { value: 'dark', label: t('settings.dark') },
    { value: 'auto', label: t('settings.auto') },
  ]
  const tempOptions: { value: string; label: React.ReactNode }[] = [
    { value: 'celsius', label: '°C Celsius' },
    { value: 'fahrenheit', label: '°F Fahrenheit' },
  ]
  const distanceOptions: { value: string; label: React.ReactNode }[] = [
    { value: 'metric', label: 'km Metric' },
    { value: 'imperial', label: 'mi Imperial' },
  ]
  const timeOptions: { value: string; label: React.ReactNode }[] = [
    { value: '24h', label: '24h (14:30)' },
    { value: '12h', label: '12h (2:30 PM)' },
  ]
  const providerOptions: { value: string; label: React.ReactNode }[] = [
    { value: 'leaflet', label: t('admin.defaultSettings.providerLeaflet') },
    { value: 'mapbox-gl', label: t('admin.defaultSettings.providerMapbox') },
    { value: 'maplibre-gl', label: t('admin.defaultSettings.providerMapLibre') },
  ]

  const currencyLabel = defaults.default_currency
    ? (SYMBOLS[defaults.default_currency] ? `${defaults.default_currency}  ${SYMBOLS[defaults.default_currency]}` : defaults.default_currency)
    : t('settings.currency')
  const tilePresetLabel = MAP_PRESETS.find((p) => p.url === mapTileUrl)?.name || t('settings.mapTemplatePlaceholder.select')
  const stylePresetLabel = glStylePresets.find((p) => p.url === mapboxStyle)?.name || t('admin.defaultSettings.mapboxStylePlaceholder')
  const chevron = <ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />

  return (
    <div className="space-y-3">
      {/* Display + regional defaults */}
      <MAdminCard>
        <MAdminCardHead title={t('admin.defaultSettings.title')} hint={t('admin.defaultSettings.description')} />

        <div className="mt-2 space-y-[14px]">
          {/* Color Mode */}
          <MAdminField label={<>{t('settings.colorMode')} <ResetButton field="dark_mode" /></>}>
            <MSegmented value={colorModeValue} onChange={(v) => save({ dark_mode: v })} options={modeOptions} />
          </MAdminField>

          {/* Temperature */}
          <MAdminField label={<>{t('settings.temperature')} <ResetButton field="temperature_unit" /></>}>
            <MSegmented value={defaults.temperature_unit || ''} onChange={(v) => save({ temperature_unit: v })} options={tempOptions} />
          </MAdminField>

          {/* Distance */}
          <MAdminField label={<>{t('settings.distance')} <ResetButton field="distance_unit" /></>}>
            <MSegmented value={defaults.distance_unit || ''} onChange={(v) => save({ distance_unit: v as DistanceUnit })} options={distanceOptions} />
          </MAdminField>

          {/* Time Format */}
          <MAdminField label={<>{t('settings.timeFormat')} <ResetButton field="time_format" /></>}>
            <MSegmented value={defaults.time_format || ''} onChange={(v) => save({ time_format: v })} options={timeOptions} />
          </MAdminField>

          {/* Default Currency */}
          <MAdminField
            label={<>{t('settings.currency')} <ResetButton field="default_currency" /></>}
            hint={t('settings.currencyHint')}
          >
            <MSetSelectRow label={currencyLabel} trailing={chevron} onClick={() => setCurrencyOpen(true)} />
          </MAdminField>

          {/* Blur Booking Codes */}
          <MAdminRow
            first
            title={<>{t('settings.blurBookingCodes')} <ResetButton field="blur_booking_codes" /></>}
            trailing={
              <MToggle
                checked={defaults.blur_booking_codes === true}
                ariaLabel={t('settings.blurBookingCodes')}
                onChange={(v) => save({ blur_booking_codes: v })}
              />
            }
          />
        </div>
      </MAdminCard>

      {/* Map */}
      <MAdminCard>
        <div className="mb-1 flex items-center gap-2 text-[0.875rem] font-extrabold text-m-ink">
          <Settings2 size={16} strokeWidth={2.2} className="flex-none" />
          <span className="min-w-0 flex-1 truncate">{t('settings.mapTemplate')}</span>
        </div>

        <div className="mt-2 space-y-[14px]">
          {/* Map Tile URL */}
          <MAdminField
            label={<>{t('settings.mapTemplate')} <ResetButton field="map_tile_url" /></>}
            hint={t('settings.mapDefaultHint')}
          >
            <MSetSelectRow label={tilePresetLabel} trailing={chevron} onClick={() => setPresetOpen(true)} />
            <MAdminInput
              type="text"
              className="mt-[6px]"
              value={mapTileUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapTileUrl(e.target.value)}
              onBlur={() => save({ map_tile_url: mapTileUrl })}
              placeholder="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </MAdminField>

          {/* Live tile preview */}
          <div className="relative h-[200px] w-full overflow-hidden rounded-xl">
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
              tileUrl: mapTileUrl,
              fitKey: null,
              dayOrderMap: [],
              leftWidth: 0,
              rightWidth: 0,
              hasInspector: false,
            })}
          </div>

          {/* Map provider */}
          <div className="border-t border-[color:var(--m-rowbr)] pt-[14px]">
            <MAdminField
              label={<>{t('admin.defaultSettings.mapProvider')} <ResetButton field="map_provider" /></>}
              hint={t('admin.defaultSettings.mapProviderHint')}
            >
              <MSegmented value={mapProvider} onChange={(v) => saveMapProvider(v as MapProvider)} options={providerOptions} />
            </MAdminField>
          </div>

          {mapProvider !== 'leaflet' && (
            <div className="space-y-[14px]">
              {mapProvider === 'mapbox-gl' && (
                <MAdminField
                  label={<>{t('admin.defaultSettings.mapboxToken')} <ResetButton field="mapbox_access_token" /></>}
                  hint={t('admin.defaultSettings.mapboxTokenHint')}
                >
                  <MAdminInput
                    type="text"
                    value={mapboxToken}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapboxToken(e.target.value)}
                    onBlur={() => save({ mapbox_access_token: mapboxToken })}
                    placeholder="pk.eyJ…"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </MAdminField>
              )}

              <MAdminField label={<>{t('admin.defaultSettings.mapboxStyle')} <ResetButton field={styleKey} /></>}>
                <MSetSelectRow label={stylePresetLabel} trailing={chevron} onClick={() => setStyleOpen(true)} />
                <MAdminInput
                  type="text"
                  className="mt-[6px]"
                  value={mapboxStyle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapboxStyle(e.target.value)}
                  onBlur={() => {
                    const nextStyle = normalizeStyleForProvider(mapProvider, mapboxStyle)
                    setMapboxStyle(nextStyle)
                    save({ [styleKey]: nextStyle })
                  }}
                  placeholder={defaultStyleForProvider(mapProvider)}
                />
              </MAdminField>

              {mapProvider === 'mapbox-gl' && (
                <div>
                  <MAdminRow
                    first
                    title={<>{t('admin.defaultSettings.mapbox3d')} <ResetButton field="mapbox_3d_enabled" /></>}
                    trailing={
                      <MToggle
                        checked={defaults.mapbox_3d_enabled ?? true}
                        ariaLabel={t('admin.defaultSettings.mapbox3d')}
                        onChange={(v) => save({ mapbox_3d_enabled: v })}
                      />
                    }
                  />
                  <MAdminRow
                    title={<>{t('admin.defaultSettings.mapboxQuality')} <ResetButton field="mapbox_quality_mode" /></>}
                    trailing={
                      <MToggle
                        checked={defaults.mapbox_quality_mode ?? false}
                        ariaLabel={t('admin.defaultSettings.mapboxQuality')}
                        onChange={(v) => save({ mapbox_quality_mode: v })}
                      />
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </MAdminCard>

      {/* Pickers */}
      <MSetPickerSheet
        open={currencyOpen}
        onClose={() => setCurrencyOpen(false)}
        title={t('settings.currency')}
        value={defaults.default_currency || ''}
        onSelect={(value) => { if (value) save({ default_currency: value }) }}
        options={currenciesWith(defaults.default_currency).map((c) => ({ value: c, label: SYMBOLS[c] ? `${c}  ${SYMBOLS[c]}` : c }))}
      />

      <MSetPickerSheet
        open={presetOpen}
        onClose={() => setPresetOpen(false)}
        title={t('settings.mapTemplate')}
        value={mapTileUrl}
        onSelect={(value) => { if (value) { setMapTileUrl(value); save({ map_tile_url: value }) } }}
        options={MAP_PRESETS.map((p) => ({ value: p.url, label: p.name }))}
      />

      <MSetPickerSheet
        open={styleOpen}
        onClose={() => setStyleOpen(false)}
        title={t('admin.defaultSettings.mapboxStyle')}
        value={mapboxStyle}
        onSelect={(value) => { if (value) { setMapboxStyle(value); save({ [styleKey]: value }) } }}
        options={glStylePresets.map((p) => ({ value: p.url, label: p.name }))}
      />
    </div>
  )
}
