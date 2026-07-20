import React, { useEffect, useRef, useState } from 'react'
import { Paintbrush, Eye, LayoutDashboard, Sun, Moon, Monitor, RotateCcw } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import { useToast } from '../shared/Toast'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'
import { applyAppearance } from '../../theme/applyAppearance'
import { APPEARANCE_SCHEMES, CUSTOM_ACCENT_PRESETS } from '../../theme/schemes'
import {
  DEFAULT_APPEARANCE,
  normalizeAppearance,
  APPEARANCE_SCALE_MIN,
  APPEARANCE_SCALE_MAX,
  type AppearanceConfig,
} from '@trek/shared'

// ── WCAG contrast helpers (for the custom-accent legibility hint) ────────────
function channelLum(v: number): number {
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
function relLuminance(hex: string): number {
  const c = hex.replace('#', '')
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c
  const r = channelLum(parseInt(full.slice(0, 2), 16) / 255)
  const g = channelLum(parseInt(full.slice(2, 4), 16) / 255)
  const b = channelLum(parseInt(full.slice(4, 6), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a)
  const lb = relLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}
const isHex = (v: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)

type DesktopWidgetKey = keyof AppearanceConfig['dashboard']['desktop']
type MobileWidgetKey = keyof AppearanceConfig['dashboard']['mobile']

const WIDGET_LABELS: Record<string, string> = {
  sidebar: 'Right sidebar',
  currency: 'Currency',
  collections: 'Collections',
  timezones: 'Timezones',
  upcomingReservations: 'Upcoming reservations',
  atlas: 'Atlas / countries',
  tripsTotal: 'Trips total',
  daysTraveled: 'Days traveled',
  distanceFlown: 'Distance flown',
}
// Grouped by where the widgets actually sit on the dashboard. The right sidebar
// has a master toggle (off → no sidebar, layout centers); its individual
// widgets only matter while the sidebar is shown.
const DESKTOP_GROUPS: { id: string; fallback: string; master?: DesktopWidgetKey; keys: DesktopWidgetKey[] }[] = [
  { id: 'belowHero', fallback: 'Below the hero', keys: ['atlas', 'tripsTotal', 'daysTraveled', 'distanceFlown'] },
  { id: 'rightSidebar', fallback: 'Right sidebar', master: 'sidebar', keys: ['currency', 'collections', 'timezones', 'upcomingReservations'] },
]
const MOBILE_GROUPS: { id: string; fallback: string; keys: MobileWidgetKey[] }[] = [
  { id: 'belowHero', fallback: 'Below the hero', keys: ['tripsTotal', 'daysTraveled'] },
  { id: 'bottomOfPage', fallback: 'Bottom of page', keys: ['currency', 'collections', 'timezones', 'upcomingReservations'] },
]

// shared segmented-button style (matches DisplaySettingsTab)
function segStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
    padding: '10px 14px', borderRadius: 10, cursor: 'pointer', flex: '1 1 0', minWidth: 0,
    fontFamily: 'inherit', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500,
    border: active ? '2px solid var(--text-primary)' : '2px solid var(--border-primary)',
    background: active ? 'var(--bg-hover)' : 'var(--bg-card)',
    color: 'var(--text-primary)', transition: 'all 0.15s',
  }
}

export default function AppearanceSettingsTab(): React.ReactElement {
  const { settings, updateSetting } = useSettingsStore()
  const { t } = useTranslation()
  const toast = useToast()
  const tr = (key: string, fallback: string) => t(key) || fallback

  const [cfg, setCfg] = useState<AppearanceConfig>(() => normalizeAppearance(settings.appearance))
  const persistTimer = useRef<number | undefined>(undefined)

  // Re-sync when settings change elsewhere (e.g. server reconcile / another tab).
  useEffect(() => {
    setCfg(normalizeAppearance(settings.appearance))
  }, [settings.appearance])

  // Flush any pending persist on unmount.
  useEffect(() => () => {
    if (persistTimer.current) window.clearTimeout(persistTimer.current)
  }, [])

  const isDark =
    settings.dark_mode === true ||
    settings.dark_mode === 'dark' ||
    (settings.dark_mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Live preview now (DOM), persist after a short debounce (API).
  const update = (patch: Partial<AppearanceConfig>) => {
    const next = { ...cfg, ...patch }
    setCfg(next)
    applyAppearance({ darkMode: settings.dark_mode, appearance: next, isSharedPage: false })
    if (persistTimer.current) window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(() => {
      updateSetting('appearance', next).catch((e: unknown) =>
        toast.error(e instanceof Error ? e.message : t('common.error'))
      )
    }, 350)
  }

  const setMode = async (mode: string) => {
    try {
      await updateSetting('dark_mode', mode)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t('common.error'))
    }
  }

  const setWidget = (device: 'desktop' | 'mobile', key: string, on: boolean) => {
    update({
      dashboard: {
        ...cfg.dashboard,
        [device]: { ...cfg.dashboard[device], [key]: on },
      },
    })
  }

  const resetAll = () => update({ ...DEFAULT_APPEARANCE })

  const accentLight = cfg.accent?.light ?? '#4f46e5'
  const accentDark = cfg.accent?.dark ?? '#6366f1'
  const customRatio = contrastRatio(isDark ? accentDark : accentLight, isDark ? '#ffffff' : '#ffffff')

  return (
    <>
      {/* ── Theme ───────────────────────────────────────────────── */}
      <Section title={tr('settings.appearance.theme', 'Theme')} icon={Paintbrush}>
        {/* Color mode */}
        <div>
          <label className="block text-sm font-medium mb-2 text-content-secondary">
            {tr('settings.colorMode', 'Color mode')}
          </label>
          <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
            {[
              { value: 'light', label: tr('settings.light', 'Light'), icon: Sun },
              { value: 'dark', label: tr('settings.dark', 'Dark'), icon: Moon },
              { value: 'auto', label: tr('settings.auto', 'Auto'), icon: Monitor },
            ].map((opt) => {
              const cur = settings.dark_mode
              const active =
                cur === opt.value ||
                (opt.value === 'light' && cur === false) ||
                (opt.value === 'dark' && cur === true)
              return (
                <button key={opt.value} onClick={() => setMode(opt.value)} style={segStyle(active)}>
                  <span className="hidden sm:inline-flex"><opt.icon size={16} /></span>
                  {opt.value === 'auto' ? (
                    <>
                      <span className="hidden sm:inline">{opt.label}</span>
                      <span className="sm:hidden">Auto</span>
                    </>
                  ) : opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Color scheme swatches */}
        <div>
          <label className="block text-sm font-medium mb-2 text-content-secondary">
            {tr('settings.appearance.scheme', 'Color scheme')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {APPEARANCE_SCHEMES.map((s) => {
              const active = cfg.schemeId === s.id
              const dot = isDark ? s.swatch.dark : s.swatch.light
              return (
                <button
                  key={s.id}
                  onClick={() => update({ schemeId: s.id })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                    borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500,
                    border: active ? '2px solid var(--text-primary)' : '2px solid var(--border-primary)',
                    background: active ? 'var(--bg-hover)' : 'var(--bg-card)', color: 'var(--text-primary)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: dot, flexShrink: 0, boxShadow: 'inset 0 0 0 1px var(--border-faint)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tr(`settings.appearance.scheme.${s.id}`, schemeFallback(s.id))}
                  </span>
                </button>
              )
            })}
            {/* Custom */}
            <button
              onClick={() => update({ schemeId: 'custom', accent: cfg.accent ?? { light: accentLight, dark: accentDark } })}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500,
                border: cfg.schemeId === 'custom' ? '2px solid var(--text-primary)' : '2px solid var(--border-primary)',
                background: cfg.schemeId === 'custom' ? 'var(--bg-hover)' : 'var(--bg-card)', color: 'var(--text-primary)',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, background: 'conic-gradient(#ef4444,#f59e0b,#22c55e,#3b82f6,#8b5cf6,#ef4444)' }} />
              {tr('settings.appearance.scheme.custom', 'Custom')}
            </button>
          </div>
        </div>

        {/* Custom accent picker */}
        {cfg.schemeId === 'custom' && (
          <div>
            <label className="block text-sm font-medium mb-2 text-content-secondary">
              {tr('settings.appearance.customAccent', 'Custom accent')}
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {CUSTOM_ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  aria-label={c}
                  onClick={() => update({ accent: { light: c, dark: c } })}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: '2px solid var(--border-primary)' }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 text-sm text-content-secondary">
                {tr('settings.light', 'Light')}
                <input type="color" value={isHex(accentLight) ? accentLight : '#4f46e5'}
                  onChange={(e) => update({ accent: { light: e.target.value, dark: accentDark } })}
                  style={{ width: 36, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
              </label>
              <label className="flex items-center gap-2 text-sm text-content-secondary">
                {tr('settings.dark', 'Dark')}
                <input type="color" value={isHex(accentDark) ? accentDark : '#6366f1'}
                  onChange={(e) => update({ accent: { light: accentLight, dark: e.target.value } })}
                  style={{ width: 36, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
              </label>
              <span
                className="text-xs font-medium px-2 py-1 rounded-md"
                style={{ background: customRatio >= 4.5 ? 'var(--success-soft)' : 'var(--warning-soft)', color: customRatio >= 4.5 ? 'var(--success)' : 'var(--warning)' }}
              >
                {customRatio >= 4.5
                  ? `${tr('settings.appearance.contrastOk', 'Good contrast')} (${customRatio.toFixed(1)}:1)`
                  : `${tr('settings.appearance.contrastLow', 'Low contrast')} (${customRatio.toFixed(1)}:1)`}
              </span>
            </div>
          </div>
        )}
      </Section>

      {/* ── Readability ─────────────────────────────────────────── */}
      <Section
        title={tr('settings.appearance.readability', 'Readability')}
        icon={Eye}
        badge={
          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-warning-soft text-warning">
            {tr('settings.appearance.experimental', 'Experimental')}
          </span>
        }
      >
        <ToggleRow
          label={tr('settings.appearance.transparency', 'Transparency')}
          hint={tr('settings.appearance.transparencyHint', 'Glassy translucent surfaces. Turn off for solid, higher-contrast backgrounds.')}
          on={cfg.transparency}
          onToggle={() => update({ transparency: !cfg.transparency })}
        />
        <ToggleRow
          label={tr('settings.appearance.reduceMotion', 'Reduce motion')}
          hint={tr('settings.appearance.reduceMotionHint', 'Minimize animations and transitions.')}
          on={cfg.reduceMotion}
          onToggle={() => update({ reduceMotion: !cfg.reduceMotion })}
        />

        {/* Density */}
        <div>
          <label className="block text-sm font-medium mb-2 text-content-secondary">
            {tr('settings.appearance.density', 'Density')}
          </label>
          <div className="flex gap-3">
            {[
              { value: 'comfortable', label: tr('settings.appearance.comfortable', 'Comfortable') },
              { value: 'compact', label: tr('settings.appearance.compact', 'Compact') },
            ].map((opt) => (
              <button key={opt.value} onClick={() => update({ density: opt.value as AppearanceConfig['density'] })} style={segStyle(cfg.density === opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-content-faint mt-2">
            {tr('settings.appearance.densityHint', 'Compact tightens spacing and padding for a denser layout that fits more on screen.')}
          </p>
        </div>

        {/* Text size — global, plus an always-visible row per size class with a
            live sample and an example of what each size affects. */}
        <div>
          <label className="block text-sm font-medium mb-2 text-content-secondary">
            {tr('settings.appearance.textSize', 'Text size')}
          </label>
          <SliderRow
            label={tr('settings.appearance.textSizeAll', 'Everything')}
            value={cfg.fontScale}
            onChange={(v) => update({ fontScale: v })}
          />
          <div className="space-y-4 mt-4 pt-4 border-t border-edge-secondary">
            <SizeRow
              sampleClass="text-title font-bold"
              name={tr('settings.appearance.size.large', 'Large')}
              example={tr('settings.appearance.example.large', 'Headings, big numbers')}
              sample={tr('settings.appearance.preview.large', 'Large heading')}
              value={cfg.typeScale.title}
              onChange={(v) => update({ typeScale: { ...cfg.typeScale, title: v } })}
            />
            <SizeRow
              sampleClass="text-subtitle font-semibold"
              name={tr('settings.appearance.size.medium', 'Medium')}
              example={tr('settings.appearance.example.medium', 'Sub-headings')}
              sample={tr('settings.appearance.preview.medium', 'Medium subtitle')}
              value={cfg.typeScale.subtitle}
              onChange={(v) => update({ typeScale: { ...cfg.typeScale, subtitle: v } })}
            />
            <SizeRow
              sampleClass="text-body"
              name={tr('settings.appearance.size.normal', 'Normal')}
              example={tr('settings.appearance.example.normal', 'Place names, descriptions')}
              sample={tr('settings.appearance.preview.normal', 'Normal body text')}
              value={cfg.typeScale.body}
              onChange={(v) => update({ typeScale: { ...cfg.typeScale, body: v } })}
            />
            <SizeRow
              sampleClass="text-caption"
              name={tr('settings.appearance.size.small', 'Small')}
              example={tr('settings.appearance.example.small', 'Addresses, labels')}
              sample={tr('settings.appearance.preview.small', 'Small caption / address')}
              value={cfg.typeScale.caption}
              onChange={(v) => update({ typeScale: { ...cfg.typeScale, caption: v } })}
            />
          </div>
        </div>
      </Section>

      {/* ── Dashboard widgets ───────────────────────────────────── */}
      <Section title={tr('settings.appearance.dashboardWidgets', 'Dashboard widgets')} icon={LayoutDashboard}>
        <p className="text-xs text-content-faint -mt-1">
          {tr('settings.appearance.dashboardWidgetsHint', 'Choose which widgets appear on the dashboard — independently for desktop and mobile.')}
        </p>

        <div className="text-sm font-semibold text-content">{tr('settings.appearance.desktop', 'Desktop')}</div>
        {DESKTOP_GROUPS.map((g) => {
          const masterOn = g.master ? cfg.dashboard.desktop[g.master] : true
          return (
            <div key={g.id} className="rounded-lg border border-edge-secondary px-3 py-2">
              {g.master ? (
                <ToggleRow
                  label={tr(`settings.appearance.widget.${g.master}`, WIDGET_LABELS[g.master])}
                  hint={tr('settings.appearance.sidebarHint', 'The whole right column. Turn off and the dashboard centers.')}
                  on={masterOn}
                  onToggle={() => setWidget('desktop', g.master as string, !masterOn)}
                />
              ) : (
                <div className="text-[11px] font-semibold uppercase tracking-wide text-content-faint mb-1">
                  {tr(`settings.appearance.group.${g.id}`, g.fallback)}
                </div>
              )}
              <div
                className={g.master ? 'mt-1 pl-3 border-l-2 border-edge-secondary' : ''}
                style={g.master && !masterOn ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
              >
                {g.keys.map((k) => (
                  <ToggleRow
                    key={k}
                    label={tr(`settings.appearance.widget.${k}`, WIDGET_LABELS[k])}
                    on={cfg.dashboard.desktop[k]}
                    onToggle={() => setWidget('desktop', k, !cfg.dashboard.desktop[k])}
                  />
                ))}
              </div>
            </div>
          )
        })}

        <div className="text-sm font-semibold text-content mt-3">{tr('settings.appearance.mobile', 'Mobile')}</div>
        {MOBILE_GROUPS.map((g) => (
          <div key={g.id} className="rounded-lg border border-edge-secondary px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-content-faint mb-1">
              {tr(`settings.appearance.group.${g.id}`, g.fallback)}
            </div>
            {g.keys.map((k) => (
              <ToggleRow
                key={k}
                label={tr(`settings.appearance.widget.${k}`, WIDGET_LABELS[k])}
                on={cfg.dashboard.mobile[k]}
                onToggle={() => setWidget('mobile', k, !cfg.dashboard.mobile[k])}
              />
            ))}
          </div>
        ))}
      </Section>

      <div className="flex justify-end mb-6">
        <button
          onClick={resetAll}
          className="flex items-center gap-2 text-sm font-medium text-content-muted hover:text-content"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}
        >
          <RotateCcw size={15} />
          {tr('settings.appearance.reset', 'Reset to defaults')}
        </button>
      </div>
    </>
  )
}

function schemeFallback(id: string): string {
  const map: Record<string, string> = {
    default: 'Default',
    highContrast: 'High contrast',
    indigo: 'Indigo',
    teal: 'Teal',
    rose: 'Rose',
    amber: 'Amber',
    violet: 'Violet',
  }
  return map[id] || id
}

function ToggleRow({ label, hint, on, onToggle }: { label: string; hint?: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <div>
        <div className="text-sm font-medium text-content-secondary">{label}</div>
        {hint && <div className="text-xs text-content-faint mt-0.5">{hint}</div>}
      </div>
      <ToggleSwitch on={on} onToggle={onToggle} label={label} />
    </div>
  )
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-content-secondary">{label}</span>
        <span className="text-xs text-content-muted tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={APPEARANCE_SCALE_MIN}
        max={APPEARANCE_SCALE_MAX}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="trek-range"
        style={{ '--fill': `${((value - APPEARANCE_SCALE_MIN) / (APPEARANCE_SCALE_MAX - APPEARANCE_SCALE_MIN)) * 100}%` } as React.CSSProperties}
      />
    </div>
  )
}

function SizeRow({ sampleClass, name, example, sample, value, onChange }: { sampleClass: string; name: string; example: string; sample: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-1.5">
        <div className="min-w-0 flex-1">
          <div className={`${sampleClass} text-content leading-tight truncate`}>{sample}</div>
          <div className="text-xs text-content-faint mt-0.5">
            <span className="font-medium text-content-muted">{name}</span> · {example}
          </div>
        </div>
        <span className="text-xs text-content-muted tabular-nums shrink-0">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={APPEARANCE_SCALE_MIN}
        max={APPEARANCE_SCALE_MAX}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="trek-range"
        style={{ '--fill': `${((value - APPEARANCE_SCALE_MIN) / (APPEARANCE_SCALE_MAX - APPEARANCE_SCALE_MIN)) * 100}%` } as React.CSSProperties}
      />
    </div>
  )
}
