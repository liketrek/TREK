import React, { useEffect, useRef, useState } from 'react'
import { Eye, LayoutDashboard, Paintbrush, RotateCcw, Smartphone } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useSettingsStore } from '../../../store/settingsStore'
import { useToast } from '../../../components/shared/Toast'
import { applyAppearance } from '../../../theme/applyAppearance'
import { APPEARANCE_SCHEMES, CUSTOM_ACCENT_PRESETS } from '../../../theme/schemes'
import {
  DEFAULT_APPEARANCE,
  normalizeAppearance,
  APPEARANCE_SCALE_MIN,
  APPEARANCE_SCALE_MAX,
  type AppearanceConfig,
} from '@trek/shared'
import MToggle from '../../components/MToggle'
import { MSetCard, MSetEyebrow, MSetSegments, MSetRow } from './MSettingsUi'
import MMobileNavCustomizer from './MMobileNavCustomizer'
import MMobileDashOrder from './MMobileDashOrder'

// ── WCAG contrast helpers (custom-accent legibility hint) ────────────────────
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

const DESKTOP_GROUPS: { id: string; master?: DesktopWidgetKey; keys: DesktopWidgetKey[] }[] = [
  { id: 'belowHero', keys: ['atlas', 'tripsTotal', 'daysTraveled', 'distanceFlown'] },
  { id: 'rightSidebar', master: 'sidebar', keys: ['currency', 'collections', 'timezones', 'upcomingReservations'] },
]
const MOBILE_GROUPS: { id: string; keys: MobileWidgetKey[] }[] = [
  { id: 'belowHero', keys: ['tripsTotal', 'daysTraveled'] },
  { id: 'bottomOfPage', keys: ['currency', 'collections', 'timezones', 'upcomingReservations'] },
]

function SliderRow({ label, sub, value, onChange }: { label: string; sub?: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="py-[6px]">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[0.78125rem] font-bold text-m-ink">{label}</span>
          {sub && <span className="ml-[6px] font-geist text-[0.625rem] text-m-muted">{sub}</span>}
        </div>
        <span className="font-geist text-[0.6875rem] tabular-nums text-m-muted">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={APPEARANCE_SCALE_MIN}
        max={APPEARANCE_SCALE_MAX}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="m-range"
        style={{ '--fill': `${((value - APPEARANCE_SCALE_MIN) / (APPEARANCE_SCALE_MAX - APPEARANCE_SCALE_MIN)) * 100}%` } as React.CSSProperties}
      />
    </div>
  )
}

/**
 * "Appearance" section — full parity with the desktop AppearanceSettingsTab:
 * color mode, scheme + custom accent, readability (transparency, motion,
 * density, text sizes) and the per-device dashboard widget configuration.
 */
export default function MSettingsAppearance() {
  const { settings, updateSetting } = useSettingsStore()
  const { t } = useTranslation()
  const toast = useToast()

  const [cfg, setCfg] = useState<AppearanceConfig>(() => normalizeAppearance(settings.appearance))
  const persistTimer = useRef<number | undefined>(undefined)

  // Re-sync when settings change elsewhere (server reconcile / another tab).
  useEffect(() => {
    setCfg(normalizeAppearance(settings.appearance))
  }, [settings.appearance])

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
        toast.error(e instanceof Error ? e.message : t('common.error')),
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

  const darkMode = settings.dark_mode
  const modeValue = darkMode === true || darkMode === 'dark' ? 'dark' : darkMode === 'auto' ? 'auto' : 'light'

  const accentLight = cfg.accent?.light ?? '#4f46e5'
  const accentDark = cfg.accent?.dark ?? '#6366f1'
  const customRatio = contrastRatio(isDark ? accentDark : accentLight, '#ffffff')

  const widgetToggle = (device: 'desktop' | 'mobile', key: string, on: boolean, disabled = false) => (
    <MSetRow
      key={`${device}-${key}`}
      label={t(`settings.appearance.widget.${key}`)}
      trailing={<MToggle checked={on} disabled={disabled} onChange={(v) => setWidget(device, key, v)} ariaLabel={t(`settings.appearance.widget.${key}`)} />}
    />
  )

  return (
    <>
      <MSetCard title={t('settings.appearance.theme')} icon={Paintbrush}>
        <MSetEyebrow className="mb-[6px]">{t('settings.colorMode')}</MSetEyebrow>
        <MSetSegments
          value={modeValue}
          onChange={setMode}
          options={[
            { value: 'light', label: t('settings.light') },
            { value: 'dark', label: t('settings.dark') },
            { value: 'auto', label: t('settings.auto') },
          ]}
        />

        <MSetEyebrow className="mb-[6px] mt-[14px]">{t('settings.appearance.scheme')}</MSetEyebrow>
        <div className="grid grid-cols-2 gap-[6px]">
          {APPEARANCE_SCHEMES.map((s) => {
            const active = cfg.schemeId === s.id
            const dot = isDark ? s.swatch.dark : s.swatch.light
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => update({ schemeId: s.id })}
                className={`flex items-center gap-2 rounded-xl px-3 py-[9px] text-left text-[0.78125rem] ${
                  active
                    ? 'bg-m-act font-semibold text-m-actfg'
                    : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] font-medium text-m-ink'
                }`}
              >
                <span className="h-4 w-4 flex-none rounded-full" style={{ background: dot }} />
                <span className="min-w-0 flex-1 truncate">{t(`settings.appearance.scheme.${s.id}`)}</span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => update({ schemeId: 'custom', accent: cfg.accent ?? { light: accentLight, dark: accentDark } })}
            className={`flex items-center gap-2 rounded-xl px-3 py-[9px] text-left text-[0.78125rem] ${
              cfg.schemeId === 'custom'
                ? 'bg-m-act font-semibold text-m-actfg'
                : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] font-medium text-m-ink'
            }`}
          >
            <span
              className="h-4 w-4 flex-none rounded-full"
              style={{ background: 'conic-gradient(#ef4444,#f59e0b,#22c55e,#3b82f6,#8b5cf6,#ef4444)' }}
            />
            <span className="min-w-0 flex-1 truncate">{t('settings.appearance.scheme.custom')}</span>
          </button>
        </div>

        {cfg.schemeId === 'custom' && (
          <>
            <MSetEyebrow className="mb-[6px] mt-[14px]">{t('settings.appearance.customAccent')}</MSetEyebrow>
            <div className="mb-3 flex flex-wrap gap-2">
              {CUSTOM_ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => update({ accent: { light: c, dark: c } })}
                  className="h-7 w-7 rounded-full border-2 border-[color:var(--m-rowbr)]"
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-[0.78125rem] font-semibold text-m-ink">
                {t('settings.light')}
                <input
                  type="color"
                  value={isHex(accentLight) ? accentLight : '#4f46e5'}
                  onChange={(e) => update({ accent: { light: e.target.value, dark: accentDark } })}
                  className="h-7 w-9 cursor-pointer border-none bg-transparent"
                />
              </label>
              <label className="flex items-center gap-2 text-[0.78125rem] font-semibold text-m-ink">
                {t('settings.dark')}
                <input
                  type="color"
                  value={isHex(accentDark) ? accentDark : '#6366f1'}
                  onChange={(e) => update({ accent: { light: accentLight, dark: e.target.value } })}
                  className="h-7 w-9 cursor-pointer border-none bg-transparent"
                />
              </label>
              <span
                className={`rounded-full px-2 py-[3px] font-geist text-[0.625rem] font-bold ${
                  customRatio >= 4.5
                    ? 'bg-[color:var(--m-ic)] text-[color:var(--m-st-confirmed)]'
                    : 'bg-[color:var(--m-ic)] text-[color:var(--m-st-pending)]'
                }`}
              >
                {customRatio >= 4.5
                  ? `${t('settings.appearance.contrastOk')} (${customRatio.toFixed(1)}:1)`
                  : `${t('settings.appearance.contrastLow')} (${customRatio.toFixed(1)}:1)`}
              </span>
            </div>
          </>
        )}
      </MSetCard>

      <MSetCard title={t('settings.appearance.mobile')} icon={Smartphone} className="mt-3">
        <MSetEyebrow className="mb-[6px]">{t('settings.appearance.mobileNav')}</MSetEyebrow>
        <MMobileNavCustomizer value={cfg.mobileNav} onChange={(mn) => update({ mobileNav: mn })} />

        <MSetEyebrow className="mb-[6px] mt-[14px]">{t('settings.appearance.dashOrder')}</MSetEyebrow>
        <p className="-mt-[2px] mb-2 font-geist text-[0.625rem] leading-relaxed text-m-muted">{t('settings.appearance.dashOrder.hint')}</p>
        <MMobileDashOrder cfg={cfg} onChange={(order) => update({ dashboard: { ...cfg.dashboard, mobileOrder: order } })} />
      </MSetCard>

      <MSetCard
        title={t('settings.appearance.readability')}
        icon={Eye}
        className="mt-3"
        badge={
          <span className="rounded-full bg-[color:var(--m-ic)] px-2 py-[3px] font-geist text-[0.5625rem] font-bold uppercase tracking-wide text-[color:var(--m-st-pending)]">
            {t('settings.appearance.experimental')}
          </span>
        }
      >
        <div className="-mt-[6px]">
          <MSetRow
            first
            label={t('settings.appearance.transparency')}
            sub={t('settings.appearance.transparencyHint')}
            trailing={<MToggle checked={cfg.transparency} onChange={(v) => update({ transparency: v })} ariaLabel={t('settings.appearance.transparency')} />}
          />
          <MSetRow
            label={t('settings.appearance.reduceMotion')}
            sub={t('settings.appearance.reduceMotionHint')}
            trailing={<MToggle checked={cfg.reduceMotion} onChange={(v) => update({ reduceMotion: v })} ariaLabel={t('settings.appearance.reduceMotion')} />}
          />
        </div>

        <MSetEyebrow className="mb-[6px] mt-2">{t('settings.appearance.density')}</MSetEyebrow>
        <MSetSegments
          value={cfg.density}
          onChange={(v) => update({ density: v as AppearanceConfig['density'] })}
          options={[
            { value: 'comfortable', label: t('settings.appearance.comfortable') },
            { value: 'compact', label: t('settings.appearance.compact') },
          ]}
        />

        <MSetEyebrow className="mb-[2px] mt-[14px]">{t('settings.appearance.textSize')}</MSetEyebrow>
        <SliderRow label={t('settings.appearance.textSizeAll')} value={cfg.fontScale} onChange={(v) => update({ fontScale: v })} />
        <div className="mt-1 border-t border-[color:var(--m-rowbr)] pt-2">
          <SliderRow
            label={t('settings.appearance.size.large')}
            sub={t('settings.appearance.example.large')}
            value={cfg.typeScale.title}
            onChange={(v) => update({ typeScale: { ...cfg.typeScale, title: v } })}
          />
          <SliderRow
            label={t('settings.appearance.size.medium')}
            sub={t('settings.appearance.example.medium')}
            value={cfg.typeScale.subtitle}
            onChange={(v) => update({ typeScale: { ...cfg.typeScale, subtitle: v } })}
          />
          <SliderRow
            label={t('settings.appearance.size.normal')}
            sub={t('settings.appearance.example.normal')}
            value={cfg.typeScale.body}
            onChange={(v) => update({ typeScale: { ...cfg.typeScale, body: v } })}
          />
          <SliderRow
            label={t('settings.appearance.size.small')}
            sub={t('settings.appearance.example.small')}
            value={cfg.typeScale.caption}
            onChange={(v) => update({ typeScale: { ...cfg.typeScale, caption: v } })}
          />
        </div>
      </MSetCard>

      <MSetCard title={t('settings.appearance.dashboardWidgets')} icon={LayoutDashboard} className="mt-3">
        <p className="-mt-1 mb-2 font-geist text-[0.625rem] leading-relaxed text-m-muted">
          {t('settings.appearance.dashboardWidgetsHint')}
        </p>

        <MSetEyebrow className="mb-[2px]">{t('settings.appearance.desktop')}</MSetEyebrow>
        {DESKTOP_GROUPS.map((g) => {
          const masterOn = g.master ? cfg.dashboard.desktop[g.master] : true
          return (
            <div key={g.id} className="mt-2 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-3 py-[2px]">
              {g.master ? (
                <MSetRow
                  first
                  label={t(`settings.appearance.widget.${g.master}`)}
                  sub={t('settings.appearance.sidebarHint')}
                  trailing={<MToggle checked={masterOn} onChange={(v) => setWidget('desktop', g.master as string, v)} ariaLabel={t(`settings.appearance.widget.${g.master}`)} />}
                />
              ) : (
                <MSetEyebrow className="mt-[10px]">{t(`settings.appearance.group.${g.id}`)}</MSetEyebrow>
              )}
              <div className={g.master && !masterOn ? 'pointer-events-none opacity-40' : ''}>
                {g.keys.map((k) => widgetToggle('desktop', k, cfg.dashboard.desktop[k], !!g.master && !masterOn))}
              </div>
            </div>
          )
        })}

        <MSetEyebrow className="mb-[2px] mt-4">{t('settings.appearance.mobile')}</MSetEyebrow>
        {MOBILE_GROUPS.map((g) => (
          <div key={g.id} className="mt-2 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-3 py-[2px]">
            <MSetEyebrow className="mt-[10px]">{t(`settings.appearance.group.${g.id}`)}</MSetEyebrow>
            {g.keys.map((k) => widgetToggle('mobile', k, cfg.dashboard.mobile[k]))}
          </div>
        ))}
      </MSetCard>

      <button
        type="button"
        onClick={() => update({ ...DEFAULT_APPEARANCE })}
        className="mt-3 flex items-center gap-2 px-1 py-[6px] text-[0.78125rem] font-semibold text-m-muted"
      >
        <RotateCcw size={15} />
        {t('settings.appearance.reset')}
      </button>
    </>
  )
}
