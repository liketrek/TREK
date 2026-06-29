import React, { useEffect, useMemo, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { adminApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import Section from '../Settings/Section'
import CustomSelect from '../shared/CustomSelect'
import { MapView } from '../Map/MapView'
import { CURRENCIES, SYMBOLS } from '../Budget/BudgetPanel.constants'
import type { DistanceUnit, Place } from '../../types'
import {
  MAPBOX_DEFAULT_STYLE,
  defaultStyleForProvider,
  getStylePresets,
  isOpenFreeMapStyle,
  normalizeStyleForProvider,
  styleSettingKey,
  type GlMapProvider,
} from '../Map/glProviders'

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

function OptionRow({
  label,
  hint,
  children,
}: {
  label: React.ReactNode
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-content-secondary">
        {label}
      </label>
      {hint && <p className="text-xs mb-2 text-content-faint">{hint}</p>}
      <div className="flex gap-3 flex-wrap">{children}</div>
    </div>
  )
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500,
        border: active ? '2px solid var(--text-primary)' : '2px solid var(--border-primary)',
        background: active ? 'var(--bg-hover)' : 'var(--bg-card)',
        color: 'var(--text-primary)',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

export default function DefaultUserSettingsTab(): React.ReactElement {
  const { t } = useTranslation()
  const toast = useToast()
  const [defaults, setDefaults] = useState<Defaults>({})
  const [loaded, setLoaded] = useState(false)
  const [mapTileUrl, setMapTileUrl] = useState('')
  const [mapboxToken, setMapboxToken] = useState('')
  const [mapboxStyle, setMapboxStyle] = useState('')

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
        onClick={() => reset(field)}
        className="text-xs ml-2 text-content-faint underline"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
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
    return <p className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontStyle: 'italic', padding: 16 }}>Loading…</p>
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

  return (
    <Section title={t('admin.defaultSettings.title')} icon={Settings2}>
      <p className="text-sm text-content-faint" style={{ marginTop: -8 }}>
        {t('admin.defaultSettings.description')}
      </p>

      {/* Color Mode */}
      <OptionRow label={<>{t('settings.colorMode')} <ResetButton field="dark_mode" /></>}>
        {([
          { value: 'light', label: t('settings.light') },
          { value: 'dark', label: t('settings.dark') },
          { value: 'auto', label: t('settings.auto') },
        ] as const).map(opt => (
          <OptionButton
            key={opt.value}
            active={darkMode === opt.value || (opt.value === 'light' && darkMode === false) || (opt.value === 'dark' && darkMode === true)}
            onClick={() => save({ dark_mode: opt.value })}
          >
            {opt.label}
          </OptionButton>
        ))}
      </OptionRow>

      {/* Temperature */}
      <OptionRow label={<>{t('settings.temperature')} <ResetButton field="temperature_unit" /></>}>
        {([
          { value: 'celsius', label: '°C Celsius' },
          { value: 'fahrenheit', label: '°F Fahrenheit' },
        ] as const).map(opt => (
          <OptionButton
            key={opt.value}
            active={defaults.temperature_unit === opt.value}
            onClick={() => save({ temperature_unit: opt.value })}
          >
            {opt.label}
          </OptionButton>
        ))}
      </OptionRow>

      {/* Distance */}
      <OptionRow label={<>{t('settings.distance')} <ResetButton field="distance_unit" /></>}>
        {([
          { value: 'metric', label: 'km Metric' },
          { value: 'imperial', label: 'mi Imperial' },
        ] as const).map(opt => (
          <OptionButton
            key={opt.value}
            active={defaults.distance_unit === opt.value}
            onClick={() => save({ distance_unit: opt.value })}
          >
            {opt.label}
          </OptionButton>
        ))}
      </OptionRow>

      {/* Time Format */}
      <OptionRow label={<>{t('settings.timeFormat')} <ResetButton field="time_format" /></>}>
        {([
          { value: '24h', label: '24h (14:30)' },
          { value: '12h', label: '12h (2:30 PM)' },
        ] as const).map(opt => (
          <OptionButton
            key={opt.value}
            active={defaults.time_format === opt.value}
            onClick={() => save({ time_format: opt.value })}
          >
            {opt.label}
          </OptionButton>
        ))}
      </OptionRow>

      {/* Default Currency */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-content-secondary">
          {t('settings.currency')} <ResetButton field="default_currency" />
        </label>
        <CustomSelect
          value={defaults.default_currency || ''}
          onChange={(value: string) => { if (value) save({ default_currency: value }) }}
          placeholder={t('settings.currency')}
          searchable
          options={CURRENCIES.map(c => ({ value: c, label: SYMBOLS[c] ? `${c}  ${SYMBOLS[c]}` : c }))}
          size="sm"
          style={{ maxWidth: 240 }}
        />
        <p className="text-xs mt-1 text-content-faint">{t('settings.currencyHint')}</p>
      </div>

      {/* Blur Booking Codes */}
      <OptionRow label={<>{t('settings.blurBookingCodes')} <ResetButton field="blur_booking_codes" /></>}>
        {([
          { value: true, label: t('settings.on') || 'On' },
          { value: false, label: t('settings.off') || 'Off' },
        ] as const).map(opt => (
          <OptionButton
            key={String(opt.value)}
            active={defaults.blur_booking_codes === opt.value}
            onClick={() => save({ blur_booking_codes: opt.value })}
          >
            {opt.label}
          </OptionButton>
        ))}
      </OptionRow>

      {/* Map Tile URL */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-content-secondary">
          {t('settings.mapTemplate')}
          <ResetButton field="map_tile_url" />
        </label>
        <CustomSelect
          value={mapTileUrl}
          onChange={(value: string) => { if (value) { setMapTileUrl(value); save({ map_tile_url: value }) } }}
          placeholder={t('settings.mapTemplatePlaceholder.select')}
          options={MAP_PRESETS.map(p => ({ value: p.url, label: p.name }))}
          size="sm"
          style={{ marginBottom: 8 }}
        />
        <input
          type="text"
          value={mapTileUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapTileUrl(e.target.value)}
          onBlur={() => save({ map_tile_url: mapTileUrl })}
          placeholder="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        />
        <p className="text-xs mt-1 text-content-faint">{t('settings.mapDefaultHint')}</p>
        <div style={{ position: 'relative', height: '200px', width: '100%', marginTop: 12 }}>
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
      </div>

      {/* ── Map provider / instance-wide Mapbox ───────────────────────── */}
      <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 20, marginTop: 4 }}>
        <OptionRow
          label={<>{t('admin.defaultSettings.mapProvider')} <ResetButton field="map_provider" /></>}
          hint={t('admin.defaultSettings.mapProviderHint')}
        >
          {([
            { value: 'leaflet', label: t('admin.defaultSettings.providerLeaflet') },
            { value: 'mapbox-gl', label: t('admin.defaultSettings.providerMapbox') },
            { value: 'maplibre-gl', label: t('admin.defaultSettings.providerMapLibre') },
          ] as const).map(opt => (
            <OptionButton
              key={opt.value}
              active={mapProvider === opt.value}
              onClick={() => saveMapProvider(opt.value)}
            >
              {opt.label}
            </OptionButton>
          ))}
        </OptionRow>

        {mapProvider !== 'leaflet' && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {mapProvider === 'mapbox-gl' && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-content-secondary">
                {t('admin.defaultSettings.mapboxToken')}
                <ResetButton field="mapbox_access_token" />
              </label>
              <input
                type="text"
                value={mapboxToken}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapboxToken(e.target.value)}
                onBlur={() => save({ mapbox_access_token: mapboxToken })}
                placeholder="pk.eyJ…"
                spellCheck={false}
                autoComplete="off"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
              <p className="text-xs mt-1 text-content-faint">{t('admin.defaultSettings.mapboxTokenHint')}</p>
            </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5 text-content-secondary">
                {t('admin.defaultSettings.mapboxStyle')}
                <ResetButton field={styleKey} />
              </label>
              <CustomSelect
                value={mapboxStyle}
                onChange={(value: string) => { if (value) { setMapboxStyle(value); save({ [styleKey]: value }) } }}
                placeholder={t('admin.defaultSettings.mapboxStylePlaceholder')}
                options={glStylePresets.map(p => ({ value: p.url, label: p.name }))}
                size="sm"
                style={{ marginBottom: 8 }}
              />
              <input
                type="text"
                value={mapboxStyle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapboxStyle(e.target.value)}
                onBlur={() => {
                  const nextStyle = normalizeStyleForProvider(mapProvider, mapboxStyle)
                  setMapboxStyle(nextStyle)
                  save({ [styleKey]: nextStyle })
                }}
                placeholder={defaultStyleForProvider(mapProvider)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div>

            {mapProvider === 'mapbox-gl' && (
            <>
            <OptionRow label={<>{t('admin.defaultSettings.mapbox3d')} <ResetButton field="mapbox_3d_enabled" /></>}>
              {([
                { value: true, label: t('settings.on') || 'On' },
                { value: false, label: t('settings.off') || 'Off' },
              ] as const).map(opt => (
                <OptionButton key={String(opt.value)} active={(defaults.mapbox_3d_enabled ?? true) === opt.value} onClick={() => save({ mapbox_3d_enabled: opt.value })}>
                  {opt.label}
                </OptionButton>
              ))}
            </OptionRow>

            <OptionRow label={<>{t('admin.defaultSettings.mapboxQuality')} <ResetButton field="mapbox_quality_mode" /></>}>
              {([
                { value: true, label: t('settings.on') || 'On' },
                { value: false, label: t('settings.off') || 'Off' },
              ] as const).map(opt => (
                <OptionButton key={String(opt.value)} active={(defaults.mapbox_quality_mode ?? false) === opt.value} onClick={() => save({ mapbox_quality_mode: opt.value })}>
                  {opt.label}
                </OptionButton>
              ))}
            </OptionRow>
            </>
            )}
          </div>
        )}
      </div>
    </Section>
  )
}
