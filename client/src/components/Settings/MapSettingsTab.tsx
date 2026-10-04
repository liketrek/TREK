import React, { useState, useEffect, useMemo, useRef, useId, Suspense, type ReactNode } from 'react'
import { Map, Save, Layers, Box, ChevronDown, Check, Globe2, type LucideIcon } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import { useToast } from '../shared/Toast'
import CustomSelect from '../shared/CustomSelect'
import { fs } from '../shared/DialogShell'
import { EditorField, INPUT } from '../shared/dialogParts'
import { POPOVER } from '../Packing/packingPopoverStyles'
import { MapView } from '../Map/MapView'
// The preview loads on demand, and paired with a single engine — a Leaflet-only
// install pays for neither, and a GL install pays for one instead of both.
import ErrorBoundary from '../shared/ErrorBoundary'
import { GlMapPreviewMapbox, GlMapPreviewMaplibre } from '../Map/glLazy'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'
import { SETTINGS_BUTTON_PRIMARY, SettingRow, SettingRows, SettingsHint, StatusPill } from './settingsKit'
import { withTileApiKey } from '../../utils/tileUrl'
import { AMAP_ROAD, AMAP_SATELLITE } from '../../constants/mapDefaults'
import type { Place } from '../../types'
import {
  MAPBOX_DEFAULT_STYLE,
  defaultStyleForProvider,
  getStylePresets,
  isOpenFreeMapStyle,
  normalizeStyleForProvider,
  type GlMapProvider,
} from '../Map/glProviders'
import { useAuthStore } from '../../store/authStore'

interface MapPreset {
  name: string
  url: string
}

const MAP_PRESETS: MapPreset[] = [
  { name: 'OpenStreetMap', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { name: 'OpenStreetMap DE', url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png' },
  // The app default, and a vector style rather than a {z}/{x}/{y} template: no
  // key, no registration, no request limits.
  { name: 'OpenFreeMap Positron', url: 'https://tiles.openfreemap.org/styles/positron' },
  { name: 'OpenFreeMap Bright', url: 'https://tiles.openfreemap.org/styles/bright' },
  // CARTO watermarks keyless tiles since 26.08.2026 and issues keys by mail, so
  // these two need one; without it the map falls back to the default (#2054).
  { name: 'CartoDB Light', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
  { name: 'CartoDB Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  { name: 'Stadia Smooth', url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png' },
  // Amap (高德). GCJ-02 tiles — the map switches to a shifted projection for
  // these so markers still land on the right street (see gcj02Crs.ts). The only
  // basemap here that is genuinely good inside mainland China.
  { name: '高德地图 (Amap)', url: AMAP_ROAD },
  { name: '高德卫星 (Amap Satellite)', url: AMAP_SATELLITE },
]

/** A field holding a URL, token or key: the box look in Geist, so the characters read apart. */
const CODE_INPUT = `${INPUT} font-geist`

/** A style's tag (3D, Satellite, Terrain…): a small quiet chip, so a scan of the list finds the kind of map. */
function TagChip({ tag }: { tag: string }) {
  return (
    <span className="flex-none rounded-[5px] bg-surface-tertiary px-1.5 py-[3px] font-geist font-bold uppercase leading-none tracking-[.06em] text-content-muted" style={fs(9)}>
      {tag}
    </span>
  )
}

function StyleDropdown({ value, provider, onChange }: { value: string; provider: GlMapProvider; onChange: (v: string) => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const presets = getStylePresets(provider)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const selected = presets.find(p => p.url === value)
  const placeholder = provider === 'maplibre-gl'
    ? t('settings.mapOpenFreeMapStylePlaceholder')
    : t('settings.mapStylePlaceholder')

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-edge bg-surface-input px-3 py-2 text-left hover:border-content-faint focus:outline-none focus:ring-2 focus:ring-[color:var(--text-primary)]"
        style={fs(13, 'body')}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={`truncate ${selected ? 'font-medium text-content' : 'text-content-faint'}`}>
            {selected ? selected.name : placeholder}
          </span>
          {selected && (
            <span className="flex flex-none items-center gap-1">
              {(selected.tags || []).map(t => <TagChip key={t} tag={t} />)}
            </span>
          )}
        </span>
        <ChevronDown size={14} className={`flex-none text-content-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+4px)] z-20 max-h-64 overflow-y-auto" style={POPOVER}>
          {presets.map(preset => {
            const isActive = preset.url === value
            return (
              <button
                key={preset.url}
                type="button"
                onClick={() => { onChange(preset.url); setOpen(false) }}
                className={`flex w-full items-center justify-between gap-2 rounded-[9px] px-2.5 py-2 text-left hover:bg-surface-tertiary ${isActive ? 'bg-surface-tertiary' : ''}`}
                style={fs(12.5, 'body')}
              >
                <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="font-medium text-content">{preset.name}</span>
                  {(preset.tags || []).map(t => <TagChip key={t} tag={t} />)}
                </span>
                {isActive && <Check size={13} className="flex-none text-content-muted" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** One engine to pick: an icon tile, its name and what it is, outlined while chosen. */
function ProviderTile({ active, onClick, icon: Icon, name, subtitle, badge }: {
  active: boolean
  onClick: () => void
  icon: LucideIcon
  name: ReactNode
  subtitle: string
  badge?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-w-0 items-start gap-3 rounded-[12px] border bg-surface-card p-3 text-left transition-colors ${active ? 'border-[color:var(--text-primary)] shadow-sm' : 'border-edge hover:border-content-faint'}`}
    >
      <span className={`grid h-8 w-8 flex-none place-items-center rounded-[10px] ${active ? 'bg-accent text-accent-text' : 'bg-surface-tertiary text-content-secondary'}`}>
        <Icon size={15} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="font-semibold text-content" style={fs(13, 'body')}>{name}</span>
          {badge}
        </span>
        <span className="mt-0.5 hidden leading-snug text-content-faint sm:block" style={fs(11.5)}>{subtitle}</span>
      </span>
    </button>
  )
}

type Provider = 'leaflet' | GlMapProvider

function normalizeProvider(value: unknown): Provider {
  return value === 'mapbox-gl' || value === 'maplibre-gl' ? value : 'leaflet'
}

function styleForProvider(provider: Provider, style?: string | null): string {
  if (provider === 'leaflet') return style || MAPBOX_DEFAULT_STYLE
  if (provider === 'mapbox-gl' && isOpenFreeMapStyle(style)) return MAPBOX_DEFAULT_STYLE
  return normalizeStyleForProvider(provider, style)
}

// Each GL provider has its own style slot, so toggling providers never clobbers the
// other one's style. Leaflet/Mapbox use mapbox_style; MapLibre uses maplibre_style.
function slotStyle(provider: Provider, s: { mapbox_style?: string; maplibre_style?: string }): string | undefined {
  return provider === 'maplibre-gl' ? s.maplibre_style : s.mapbox_style
}

/**
 * Somewhere recognisable for the style preview to render. A city shows off label density,
 * 3D buildings and satellite texture in a way open ocean cannot — it is not a user setting,
 * and no map opens here: each map frames itself on its own places.
 */
const PREVIEW_CENTER: [number, number] = [48.8566, 2.3522]
const PREVIEW_ZOOM = 16

export default function MapSettingsTab(): React.ReactElement {
  const { settings, updateSettings } = useSettingsStore()
  const { t } = useTranslation()
  const toast = useToast()
  const initialProvider = normalizeProvider(settings.map_provider)
  const [saving, setSaving] = useState(false)
  const [provider, setProvider] = useState<Provider>(initialProvider)
  const [mapTileUrl, setMapTileUrl] = useState<string>(settings.map_tile_url || '')
  const managed = useAuthStore((s) => s.managed)
  const [mapboxToken, setMapboxToken] = useState<string>(settings.mapbox_access_token || '')
  const [cartoKey, setCartoKey] = useState<string>(settings.carto_api_key || '')
  const [mapboxStyle, setMapboxStyle] = useState<string>(styleForProvider(initialProvider, slotStyle(initialProvider, settings)))
  const [mapbox3d, setMapbox3d] = useState<boolean>(settings.mapbox_3d_enabled !== false)
  const [mapboxQuality, setMapboxQuality] = useState<boolean>(settings.mapbox_quality_mode === true)
  // One chunk per engine — see components/Map/glLazy.tsx.
  const GlMapPreview = provider === 'maplibre-gl' ? GlMapPreviewMaplibre : GlMapPreviewMapbox
  // Ties each eyebrow label to its field, so a click on the label focuses it.
  const fieldId = useId()

  useEffect(() => {
    const nextProvider = normalizeProvider(settings.map_provider)
    setProvider(nextProvider)
    setMapTileUrl(settings.map_tile_url || '')
    setMapboxToken(settings.mapbox_access_token || '')
    setCartoKey(settings.carto_api_key || '')
    setMapboxStyle(styleForProvider(nextProvider, slotStyle(nextProvider, settings)))
    setMapbox3d(settings.mapbox_3d_enabled !== false)
    setMapboxQuality(settings.mapbox_quality_mode === true)
  }, [settings])

  const previewPlaces = useMemo((): Place[] => [{
    id: 1,
    trip_id: 1,
    name: 'Preview',
    description: '',
    lat: PREVIEW_CENTER[0],
    lng: PREVIEW_CENTER[1],
    address: '',
    category_id: 0,
    price: null,
    image_url: null,
    google_place_id: null,
    osm_id: null,
    route_geometry: null,
    place_time: null,
    end_time: null,
    created_at: String(new Date()),
  }], [])

  const saveMapSettings = async (): Promise<void> => {
    setSaving(true)
    try {
      const glStyle = provider === 'leaflet' ? mapboxStyle : normalizeStyleForProvider(provider, mapboxStyle)
      // Save into the active provider's own slot so the other provider's style survives.
      const stylePatch = provider === 'maplibre-gl' ? { maplibre_style: glStyle } : { mapbox_style: glStyle }
      await updateSettings({
        map_provider: provider,
        map_tile_url: mapTileUrl,
        mapbox_access_token: mapboxToken,
        carto_api_key: cartoKey,
        ...stylePatch,
        mapbox_3d_enabled: mapbox3d,
        mapbox_quality_mode: mapboxQuality,
      })
      // Only mirror the normalized style into the form once it is actually persisted.
      setMapboxStyle(glStyle)
      toast.success(t('settings.toast.mapSaved'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  // 3D is available on every style now — pure satellite uses the
  // mapbox-streets-v8 tileset as a fallback building source.
  const supports3d = true
  const changeProvider = (nextProvider: Provider) => {
    setProvider(nextProvider)
    if (nextProvider !== 'leaflet') setMapboxStyle(styleForProvider(nextProvider, mapboxStyle))
  }
  // Only CARTO burns a watermark into keyless tiles, so the nudge is scoped to its hosts.
  const cartoNeedsKey = mapTileUrl.includes('basemaps.cartocdn.com') && !cartoKey.trim()
  const link = 'font-medium text-content-secondary underline decoration-edge underline-offset-2 hover:text-content'

  return (
    <Section title={t('settings.map')} icon={Map}>
      {/* Provider picker — big tiles so the choice is obvious */}
      <SettingRows>
        <SettingRow label={t('settings.mapProvider')} hint={t('settings.mapProviderHint')} stacked>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <ProviderTile
              active={provider === 'leaflet'}
              onClick={() => changeProvider('leaflet')}
              icon={Layers}
              name="Leaflet"
              subtitle={t('settings.mapLeafletSubtitle')}
            />
            <ProviderTile
              active={provider === 'mapbox-gl'}
              onClick={() => changeProvider('mapbox-gl')}
              icon={Box}
              name={<><span className="sm:hidden">Mapbox</span><span className="hidden sm:inline">Mapbox GL</span></>}
              subtitle={t('settings.mapMapboxSubtitle')}
              // Only on ≥sm; on a narrow window there's no room next to the title.
              badge={<span className="hidden sm:inline-flex"><StatusPill tone="warning">{t('settings.mapExperimental')}</StatusPill></span>}
            />
            <ProviderTile
              active={provider === 'maplibre-gl'}
              onClick={() => changeProvider('maplibre-gl')}
              icon={Globe2}
              name={<><span className="sm:hidden">MapLibre</span><span className="hidden sm:inline">MapLibre GL</span></>}
              subtitle={t('settings.mapMapLibreSubtitle')}
            />
          </div>
        </SettingRow>
      </SettingRows>

      {/* Leaflet settings */}
      {provider === 'leaflet' && (
        <EditorField label={t('settings.mapTemplate')} htmlFor={`${fieldId}-tile`} hint={t('settings.mapDefaultHint')}>
          <div className="flex flex-col gap-2">
            <CustomSelect
              value={mapTileUrl}
              onChange={(value: string) => { if (value) setMapTileUrl(value) }}
              placeholder={t('settings.mapTemplatePlaceholder.select')}
              options={MAP_PRESETS.map(p => ({ value: p.url, label: p.name }))}
            />
            <input
              id={`${fieldId}-tile`}
              type="text"
              value={mapTileUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapTileUrl(e.target.value)}
              placeholder="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              className={CODE_INPUT}
            />
          </div>
        </EditorField>
      )}

      {/* Same deal as the Mapbox token: a managed install brings its own key. */}
      {provider === 'leaflet' && !managed && (
        <EditorField
          label={t('settings.mapCartoKey')}
          htmlFor={`${fieldId}-carto`}
          hint={
            <>
              {t('settings.mapCartoKeyHint')}{' '}
              <a href="https://carto.com/basemaps/apikey/" target="_blank" rel="noreferrer" className={link}>
                {t('settings.mapCartoKeyLink')}
              </a>
              {cartoNeedsKey && (
                <span className="mt-1 block font-medium text-warning">{t('settings.mapCartoKeyMissing')}</span>
              )}
            </>
          }
        >
          <input
            id={`${fieldId}-carto`}
            type="text"
            value={cartoKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCartoKey(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            className={CODE_INPUT}
          />
        </EditorField>
      )}

      {/* GL settings */}
      {provider !== 'leaflet' && (
        <>
          {/* The token comes with the instance on a managed install, injected when the
              settings are read. A field here would only let somebody save a worse one. */}
          {provider === 'mapbox-gl' && !managed && (
            <EditorField
              label={t('settings.mapMapboxToken')}
              htmlFor={`${fieldId}-token`}
              hint={
                <>
                  {t('settings.mapMapboxTokenHint')}{' '}
                  <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer" className={link}>
                    {t('settings.mapMapboxTokenLink')}
                  </a>
                </>
              }
            >
              <input
                id={`${fieldId}-token`}
                type="text"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                placeholder="pk.eyJ1Ijoi..."
                className={CODE_INPUT}
              />
            </EditorField>
          )}

          <EditorField
            label={t('settings.mapStyle')}
            htmlFor={`${fieldId}-style`}
            hint={provider === 'maplibre-gl' ? t('settings.mapOpenFreeMapStyleHint') : t('settings.mapStyleHint')}
          >
            <div className="flex flex-col gap-2">
              <StyleDropdown value={mapboxStyle} provider={provider} onChange={setMapboxStyle} />
              <input
                id={`${fieldId}-style`}
                type="text"
                value={mapboxStyle}
                onChange={(e) => setMapboxStyle(e.target.value)}
                placeholder={defaultStyleForProvider(provider)}
                className={CODE_INPUT}
              />
            </div>
          </EditorField>

          {provider === 'mapbox-gl' && (
            <>
              <SettingRows>
                <SettingRow
                  label={t('settings.map3dBuildings')}
                  hint={t('settings.map3dHint')}
                  dimmed={!supports3d}
                  control={
                    <ToggleSwitch
                      on={mapbox3d && supports3d}
                      onToggle={() => { if (supports3d) setMapbox3d(!mapbox3d) }}
                      label={t('settings.map3dBuildings')}
                    />
                  }
                />
                <SettingRow
                  label={
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span>{t('settings.mapHighQuality')}</span>
                      <StatusPill tone="warning">{t('settings.mapExperimental')}</StatusPill>
                    </span>
                  }
                  hint={
                    <>
                      {t('settings.mapHighQualityHint')}{' '}
                      <span className="text-warning">{t('settings.mapHighQualityWarning')}</span>
                    </>
                  }
                  control={<ToggleSwitch on={mapboxQuality} onToggle={() => setMapboxQuality(!mapboxQuality)} label={t('settings.mapHighQuality')} />}
                />
              </SettingRows>

              <div className="rounded-[12px] border border-edge-faint bg-surface-card px-3.5 py-3">
                <SettingsHint>
                  <strong className="font-semibold text-content-secondary">{t('settings.mapTipLabel')}</strong> {t('settings.mapTip')}
                </SettingsHint>
              </div>
            </>
          )}
        </>
      )}

      <div className="relative h-[200px] w-full overflow-hidden rounded-[14px] border border-edge-faint bg-surface-tertiary">
        {provider !== 'leaflet' ? (
          /* A net of its own: the preview is the one place a user flips providers
             live, so it is the likeliest chunk to fail — and a broken preview must
             not take the rest of the settings tab with it. */
          <ErrorBoundary boundaryId="settings:map-preview" resetKeys={[provider]} fallback={<div className="h-full w-full bg-surface-secondary" />}>
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-surface-secondary" />}>
            <GlMapPreview
              provider={provider}
              token={mapboxToken}
              style={mapboxStyle}
              lat={PREVIEW_CENTER[0]}
              lng={PREVIEW_CENTER[1]}
              // Zoom in close so the style's character (3D buildings,
              // satellite texture, label density) is immediately visible.
              zoom={PREVIEW_ZOOM}
              enable3d={provider === 'mapbox-gl' && mapbox3d && supports3d}
              quality={provider === 'mapbox-gl' && mapboxQuality}
            />
          </Suspense>
          </ErrorBoundary>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          React.createElement(MapView as any, {
            places: previewPlaces,
            dayPlaces: [],
            route: null,
            routeSegments: null,
            selectedPlaceId: null,
            onMarkerClick: null,
            onMapClick: null,
            onMapContextMenu: null,
            // With the key on it, or the preview resolves the template as a
            // keyless CARTO one and quietly shows the app default instead of
            // the basemap being configured. The fields hold what the user is
            // editing rather than what useTileUrl already resolved, so the key
            // has to be put back on here.
            tileUrl: withTileApiKey(mapTileUrl, cartoKey),
            fitKey: null,
            dayOrderMap: [],
            leftWidth: 0,
            rightWidth: 0,
            hasInspector: false,
          })
        )}
      </div>

      <div className="flex justify-end">
        <button type="button"
          onClick={saveMapSettings}
          disabled={saving}
          className={SETTINGS_BUTTON_PRIMARY}
          style={fs(13, 'body')}
        >
          {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Save size={14} strokeWidth={2} />}
          {t('settings.saveMap')}
        </button>
      </div>
    </Section>
  )
}
