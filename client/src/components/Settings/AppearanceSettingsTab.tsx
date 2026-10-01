import React, { useEffect, useRef, useState, type ReactNode } from 'react'
import { Paintbrush, Eye, LayoutDashboard, Sun, Moon, Monitor, RotateCcw } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import { useToast } from '../shared/Toast'
import { DialogSection, fs } from '../shared/DialogShell'
import { Segmented } from '../shared/dialogParts'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'
import { SETTINGS_BUTTON, SettingRow, SettingRows, StatusPill } from './settingsKit'
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
  const r = channelLum(Number.parseInt(full.slice(0, 2), 16) / 255)
  const g = channelLum(Number.parseInt(full.slice(2, 4), 16) / 255)
  const b = channelLum(Number.parseInt(full.slice(4, 6), 16) / 255)
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

/** A tile of the scheme grid: a colour dot and a name, raised and outlined while chosen. */
const SWATCH = 'flex min-w-0 items-center gap-2 rounded-[12px] border bg-surface-card px-3 py-2.5 text-left font-medium text-content transition-colors'
const swatchLook = (active: boolean) => active
  ? 'border-[color:var(--text-primary)] shadow-sm'
  : 'border-edge hover:border-content-faint'

/** The round colour sample in a swatch tile. */
const DOT = 'h-4 w-4 flex-none rounded-full shadow-[inset_0_0_0_1px_var(--border-faint)]'

export default function AppearanceSettingsTab(): React.ReactElement {
  const { settings, updateSetting } = useSettingsStore()
  const { t } = useTranslation()
  const toast = useToast()
  const tr = (key: string, fallback: string) => t(key) || fallback

  const [cfg, setCfg] = useState<AppearanceConfig>(() => normalizeAppearance(settings.appearance))
  const persistTimer = useRef<number | undefined>(undefined)
  // What the pending timer would have written, so leaving the tab inside the
  // debounce window still saves instead of silently dropping the change.
  const pendingWrite = useRef<AppearanceConfig | null>(null)

  // Re-sync when settings change elsewhere (e.g. server reconcile / another tab).
  useEffect(() => {
    setCfg(normalizeAppearance(settings.appearance))
  }, [settings.appearance])

  // Flush any pending persist on unmount.
  useEffect(() => () => {
    if (!persistTimer.current) return
    window.clearTimeout(persistTimer.current)
    // The component is gone, so a failure has nowhere to be shown.
    if (pendingWrite.current) updateSetting('appearance', pendingWrite.current).catch(() => {})
  }, [updateSetting])

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
    pendingWrite.current = next
    persistTimer.current = window.setTimeout(() => {
      pendingWrite.current = null
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
  const customRatio = contrastRatio(isDark ? accentDark : accentLight, '#ffffff')

  // The stored mode, read the way the old boolean values meant it.
  const cur = settings.dark_mode
  const mode = cur === true ? 'dark' : cur === false ? 'light' : String(cur ?? '')

  return (
    <>
      {/* ── Theme ───────────────────────────────────────────────── */}
      <Section title={tr('settings.appearance.theme', 'Theme')} icon={Paintbrush}>
        <SettingRows>
          {/* Color mode */}
          <SettingRow
            label={tr('settings.colorMode', 'Color mode')}
            control={
              <Segmented
                label={tr('settings.colorMode', 'Color mode')}
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'light', label: tr('settings.light', 'Light'), icon: <Sun size={14} strokeWidth={2} /> },
                  { value: 'dark', label: tr('settings.dark', 'Dark'), icon: <Moon size={14} strokeWidth={2} /> },
                  {
                    value: 'auto',
                    icon: <Monitor size={14} strokeWidth={2} />,
                    label: (
                      <>
                        <span className="hidden sm:inline">{tr('settings.auto', 'Auto')}</span>
                        <span className="sm:hidden">Auto</span>
                      </>
                    ),
                  },
                ]}
              />
            }
          />

          {/* Color scheme swatches */}
          <SettingRow label={tr('settings.appearance.scheme', 'Color scheme')} stacked>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {APPEARANCE_SCHEMES.map((s) => {
                const active = cfg.schemeId === s.id
                const dot = isDark ? s.swatch.dark : s.swatch.light
                return (
                  <button type="button" key={s.id} aria-pressed={active}
                    onClick={() => update({ schemeId: s.id })}
                    className={`${SWATCH} ${swatchLook(active)}`} style={fs(12.5, 'body')}>
                    <span className={DOT} style={{ background: dot }} />
                    <span className="min-w-0 truncate">{tr(`settings.appearance.scheme.${s.id}`, schemeFallback(s.id))}</span>
                  </button>
                )
              })}
              {/* Custom */}
              <button type="button" aria-pressed={cfg.schemeId === 'custom'}
                onClick={() => update({ schemeId: 'custom', accent: cfg.accent ?? { light: accentLight, dark: accentDark } })}
                className={`${SWATCH} ${swatchLook(cfg.schemeId === 'custom')}`} style={fs(12.5, 'body')}>
                <span className={DOT} style={{ background: 'conic-gradient(#ef4444,#f59e0b,#22c55e,#3b82f6,#8b5cf6,#ef4444)' }} /> {/* theme-lint-disable: the rainbow that stands for "any colour" */}
                <span className="min-w-0 truncate">{tr('settings.appearance.scheme.custom', 'Custom')}</span>
              </button>
            </div>
          </SettingRow>

          {/* Custom accent picker */}
          {cfg.schemeId === 'custom' && (
            <SettingRow label={tr('settings.appearance.customAccent', 'Custom accent')} stacked>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {CUSTOM_ACCENT_PRESETS.map((c) => {
                    const picked = accentLight === c && accentDark === c
                    return (
                      <button type="button" key={c} aria-label={c}
                        onClick={() => update({ accent: { light: c, dark: c } })}
                        className={`h-7 w-7 flex-none rounded-full ring-offset-2 ring-offset-[color:var(--bg-card)] transition-shadow ${picked ? 'ring-2 ring-[color:var(--text-primary)]' : 'shadow-[inset_0_0_0_1px_var(--border-faint)] hover:ring-2 hover:ring-edge'}`}
                        style={{ background: c }} />
                    )
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <ColorField label={tr('settings.light', 'Light')} value={isHex(accentLight) ? accentLight : '#4f46e5'}
                    onChange={(v) => update({ accent: { light: v, dark: accentDark } })} />
                  <ColorField label={tr('settings.dark', 'Dark')} value={isHex(accentDark) ? accentDark : '#6366f1'}
                    onChange={(v) => update({ accent: { light: accentLight, dark: v } })} />
                  <StatusPill tone={customRatio >= 4.5 ? 'success' : 'warning'}>
                    {customRatio >= 4.5
                      ? `${tr('settings.appearance.contrastOk', 'Good contrast')} (${customRatio.toFixed(1)}:1)`
                      : `${tr('settings.appearance.contrastLow', 'Low contrast')} (${customRatio.toFixed(1)}:1)`}
                  </StatusPill>
                </div>
              </div>
            </SettingRow>
          )}
        </SettingRows>
      </Section>

      {/* ── Readability ─────────────────────────────────────────── */}
      <Section
        title={tr('settings.appearance.readability', 'Readability')}
        icon={Eye}
        badge={<StatusPill tone="warning">{tr('settings.appearance.experimental', 'Experimental')}</StatusPill>}
      >
        <SettingRows>
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
          <SettingRow
            label={tr('settings.appearance.density', 'Density')}
            hint={tr('settings.appearance.densityHint', 'Compact tightens spacing and padding for a denser layout that fits more on screen.')}
            control={
              <Segmented
                label={tr('settings.appearance.density', 'Density')}
                value={cfg.density}
                onChange={(value) => update({ density: value })}
                options={[
                  { value: 'comfortable', label: tr('settings.appearance.comfortable', 'Comfortable') },
                  { value: 'compact', label: tr('settings.appearance.compact', 'Compact') },
                ]}
              />
            }
          />

          {/* Text size — global, plus an always-visible row per size class with a
              live sample and an example of what each size affects. */}
          <SettingRow label={tr('settings.appearance.textSize', 'Text size')} stacked>
            <SliderRow
              label={tr('settings.appearance.textSizeAll', 'Everything')}
              value={cfg.fontScale}
              onChange={(v) => update({ fontScale: v })}
            />
            <div className="mt-4 flex flex-col gap-3 rounded-[12px] border border-edge-faint bg-surface-secondary p-3">
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
          </SettingRow>
        </SettingRows>
      </Section>

      {/* ── Dashboard widgets ───────────────────────────────────── */}
      <Section
        title={tr('settings.appearance.dashboardWidgets', 'Dashboard widgets')}
        icon={LayoutDashboard}
        hint={tr('settings.appearance.dashboardWidgetsHint', 'Choose which widgets appear on the dashboard — independently for desktop and mobile.')}
      >
        <DialogSection label={tr('settings.appearance.desktop', 'Desktop')}>
          <div className="flex flex-col gap-3">
            {DESKTOP_GROUPS.map((g) => {
              const masterOn = g.master ? cfg.dashboard.desktop[g.master] : true
              const rows = g.keys.map((k) => (
                <ToggleRow
                  key={k}
                  label={tr(`settings.appearance.widget.${k}`, WIDGET_LABELS[k])}
                  on={cfg.dashboard.desktop[k]}
                  onToggle={() => setWidget('desktop', k, !cfg.dashboard.desktop[k])}
                />
              ))
              if (!g.master) {
                return <WidgetGroup key={g.id} caption={tr(`settings.appearance.group.${g.id}`, g.fallback)}>{rows}</WidgetGroup>
              }
              return (
                <SettingRows key={g.id}>
                  <SettingRow
                    label={tr(`settings.appearance.widget.${g.master}`, WIDGET_LABELS[g.master])}
                    hint={tr('settings.appearance.sidebarHint', 'The whole right column. Turn off and the dashboard centers.')}
                    control={<ToggleSwitch on={masterOn} onToggle={() => setWidget('desktop', g.master as string, !masterOn)}
                      label={tr(`settings.appearance.widget.${g.master}`, WIDGET_LABELS[g.master])} />}
                  >
                    {/* Its widgets only matter while the column is shown: dimmed, not hidden, while it is off. */}
                    <SettingRows className={`bg-surface-secondary transition-opacity ${masterOn ? '' : 'pointer-events-none opacity-40'}`}>
                      {rows}
                    </SettingRows>
                  </SettingRow>
                </SettingRows>
              )
            })}
          </div>
        </DialogSection>

        <DialogSection label={tr('settings.appearance.mobile', 'Mobile')}>
          <div className="flex flex-col gap-3">
            {MOBILE_GROUPS.map((g) => (
              <WidgetGroup key={g.id} caption={tr(`settings.appearance.group.${g.id}`, g.fallback)}>
                {g.keys.map((k) => (
                  <ToggleRow
                    key={k}
                    label={tr(`settings.appearance.widget.${k}`, WIDGET_LABELS[k])}
                    on={cfg.dashboard.mobile[k]}
                    onToggle={() => setWidget('mobile', k, !cfg.dashboard.mobile[k])}
                  />
                ))}
              </WidgetGroup>
            ))}
          </div>
        </DialogSection>
      </Section>

      <div className="mb-6 flex justify-end">
        <button type="button" onClick={resetAll} className={SETTINGS_BUTTON} style={fs(13, 'body')}>
          <RotateCcw size={14} strokeWidth={2} />
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
  return <SettingRow label={label} hint={hint} control={<ToggleSwitch on={on} onToggle={onToggle} label={label} />} />
}

/** Where a set of widgets sits on the dashboard: a caption over its box of switches. */
function WidgetGroup({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 px-0.5 font-medium text-content-muted" style={fs(12, 'body')}>{caption}</div>
      <SettingRows>{children}</SettingRows>
    </div>
  )
}

/** A colour input with its name, in the box look of the fields. */
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-[10px] border border-edge bg-surface-input py-1 pl-3 pr-1 font-medium text-content-secondary" style={fs(12.5, 'body')}>
      {label}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="h-7 w-9 cursor-pointer rounded-[7px] border-0 bg-transparent p-0" />
    </label>
  )
}

const fill = (value: number) => ({ '--fill': `${((value - APPEARANCE_SCALE_MIN) / (APPEARANCE_SCALE_MAX - APPEARANCE_SCALE_MIN)) * 100}%` } as React.CSSProperties)

/** A percentage in the corner of a slider. */
function Percent({ value }: { value: number }) {
  return <span className="flex-none font-geist font-semibold tabular-nums text-content-muted" style={fs(11.5)}>{Math.round(value * 100)}%</span>
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="font-medium text-content-secondary" style={fs(12.5, 'body')}>{label}</span>
        <Percent value={value} />
      </div>
      <input
        type="range"
        min={APPEARANCE_SCALE_MIN}
        max={APPEARANCE_SCALE_MAX}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="trek-range"
        style={fill(value)}
      />
    </div>
  )
}

function SizeRow({ sampleClass, name, example, sample, value, onChange }: { sampleClass: string; name: string; example: string; sample: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className={`${sampleClass} truncate leading-tight text-content`}>{sample}</div>
          <div className="mt-0.5 truncate text-content-faint" style={fs(11.5)}>
            <span className="font-medium text-content-muted">{name}</span> · {example}
          </div>
        </div>
        <Percent value={value} />
      </div>
      <input
        type="range"
        min={APPEARANCE_SCALE_MIN}
        max={APPEARANCE_SCALE_MAX}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="trek-range"
        style={fill(value)}
      />
    </div>
  )
}
