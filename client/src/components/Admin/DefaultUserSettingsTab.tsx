import React, { useEffect, useMemo, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { adminApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import Section from '../Settings/Section'
import CustomSelect from '../shared/CustomSelect'
import { MapView } from '../Map/MapView'
import type { Place } from '../../types'

const MAP_PRESETS = [
  { name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { name: 'OpenStreetMap DE', url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png' },
  { name: 'CartoDB Light', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
  { name: 'CartoDB Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  { name: 'Stadia Smooth', url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png' },
]

type Defaults = {
  temperature_unit?: string
  dark_mode?: string | boolean
  time_format?: string
  blur_booking_codes?: boolean
  map_tile_url?: string
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
        fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
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

  useEffect(() => {
    adminApi.getDefaultUserSettings().then((data: Defaults) => {
      setDefaults(data)
      setMapTileUrl(data.map_tile_url || '')
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
    return <p className="text-content-faint" style={{ fontSize: 12, fontStyle: 'italic', padding: 16 }}>Loading…</p>
  }

  const darkMode = defaults.dark_mode

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
    </Section>
  )
}
