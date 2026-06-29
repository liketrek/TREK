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

const DESKTOP_WIDGETS: { key: DesktopWidgetKey; fallback: string }[] = [
  { key: 'sidebar', fallback: 'Right sidebar' },
  { key: 'currency', fallback: 'Currency' },
  { key: 'timezones', fallback: 'Timezones' },
  { key: 'upcomingReservations', fallback: 'Upcoming reservations' },
  { key: 'atlas', fallback: 'Atlas / countries' },
  { key: 'tripsTotal', fallback: 'Trips total' },
  { key: 'daysTraveled', fallback: 'Days traveled' },
  { key: 'distanceFlown', fallback: 'Distance flown' },
]
const MOBILE_WIDGETS: { key: MobileWidgetKey; fallback: string }[] = [
  { key: 'tripsTotal', fallback: 'Trips total' },
  { key: 'daysTraveled', fallback: 'Days traveled' },
  { key: 'currency', fallback: 'Currency' },
  { key: 'timezones', fallback: 'Timezones' },
  { key: 'upcomingReservations', fallback: 'Upcoming reservations' },
]

// shared segmented-button style (matches DisplaySettingsTab)
function segStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
    padding: '10px 14px', borderRadius: 10, cursor: 'pointer', flex: '1 1 0', minWidth: 0,
    fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
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
  const [advancedType, setAdvancedType] = useState(false)
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
                  {opt.label}
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
                    borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
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
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
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
      <Section title={tr('settings.appearance.readability', 'Readability')} icon={Eye}>
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
        </div>

        {/* Text size (global) */}
        <SliderRow
          label={tr('settings.appearance.textSize', 'Text size')}
          value={cfg.fontScale}
          onChange={(v) => update({ fontScale: v })}
        />
        <button
          onClick={() => setAdvancedType((v) => !v)}
          className="text-xs font-medium text-content-muted hover:text-content"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {advancedType ? tr('settings.appearance.hideAdvanced', 'Hide advanced') : tr('settings.appearance.advancedTextSizes', 'Advanced text sizes')}
        </button>
        {advancedType && (
          <div className="space-y-3 pl-1">
            <SliderRow label={tr('settings.appearance.tier.title', 'Titles')} value={cfg.typeScale.title} onChange={(v) => update({ typeScale: { ...cfg.typeScale, title: v } })} />
            <SliderRow label={tr('settings.appearance.tier.subtitle', 'Subtitles')} value={cfg.typeScale.subtitle} onChange={(v) => update({ typeScale: { ...cfg.typeScale, subtitle: v } })} />
            <SliderRow label={tr('settings.appearance.tier.body', 'Body')} value={cfg.typeScale.body} onChange={(v) => update({ typeScale: { ...cfg.typeScale, body: v } })} />
            <SliderRow label={tr('settings.appearance.tier.caption', 'Captions')} value={cfg.typeScale.caption} onChange={(v) => update({ typeScale: { ...cfg.typeScale, caption: v } })} />
          </div>
        )}
      </Section>

      {/* ── Dashboard widgets ───────────────────────────────────── */}
      <Section title={tr('settings.appearance.dashboardWidgets', 'Dashboard widgets')} icon={LayoutDashboard}>
        <p className="text-xs text-content-faint -mt-1">
          {tr('settings.appearance.dashboardWidgetsHint', 'Show or hide dashboard widgets independently on desktop and mobile.')}
        </p>
        <div>
          <div className="text-sm font-medium mb-2 text-content-secondary">{tr('settings.appearance.desktop', 'Desktop')}</div>
          {DESKTOP_WIDGETS.map((w) => (
            <ToggleRow
              key={w.key}
              label={tr(`settings.appearance.widget.${w.key}`, w.fallback)}
              on={cfg.dashboard.desktop[w.key]}
              onToggle={() => setWidget('desktop', w.key, !cfg.dashboard.desktop[w.key])}
            />
          ))}
        </div>
        <div>
          <div className="text-sm font-medium mb-2 text-content-secondary">{tr('settings.appearance.mobile', 'Mobile')}</div>
          {MOBILE_WIDGETS.map((w) => (
            <ToggleRow
              key={w.key}
              label={tr(`settings.appearance.widget.${w.key}`, w.fallback)}
              on={cfg.dashboard.mobile[w.key]}
              onToggle={() => setWidget('mobile', w.key, !cfg.dashboard.mobile[w.key])}
            />
          ))}
        </div>
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
        style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
      />
    </div>
  )
}
