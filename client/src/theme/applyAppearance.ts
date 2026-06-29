import { normalizeAppearance, type AppearanceConfig } from '@trek/shared'

/**
 * The ONE place that writes appearance state to the DOM.
 *
 * Components never compute colors from the config — they only read CSS tokens.
 * This writer toggles the `.dark` class (the single source of truth that 8+
 * components observe), sets the `data-*` appearance attributes, and writes the
 * handful of inline CSS variables that can't live in a static stylesheet
 * (custom accent + type scales). It is idempotent and safe to call on every
 * settings change.
 *
 * With DEFAULT_APPEARANCE every branch below is a no-op (default scheme sets no
 * attribute, transparency stays on, all scales are 1), so the rendered result is
 * byte-identical to TREK before this feature existed.
 *
 * Keep the snapshot shape and the apply logic in sync with the pre-paint boot
 * script at client/public/theme-boot.js — that script mirrors this to kill FOUC.
 */

export type DarkModeSetting = boolean | string // 'light' | 'dark' | 'auto' | boolean

export const APPEARANCE_SNAPSHOT_KEY = 'trek_appearance'

export interface ApplyAppearanceInput {
  darkMode: DarkModeSetting
  /** Raw appearance value from settings (may be partial/missing — normalized here). */
  appearance?: unknown
  /** Public /shared and /public pages force the neutral default look. */
  isSharedPage?: boolean
}

interface AppearanceSnapshot {
  v: 1
  darkMode: DarkModeSetting
  scheme: AppearanceConfig['schemeId']
  noTransparency: boolean
  density: AppearanceConfig['density']
  reduceMotion: boolean
  accent: AppearanceConfig['accent']
  accentText: { light: string; dark: string } | null
  typeScale: AppearanceConfig['typeScale']
  fontScale: number
}

function resolveDark(darkMode: DarkModeSetting, isSharedPage: boolean): boolean {
  if (isSharedPage) return false
  if (darkMode === 'auto') {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return darkMode === true || darkMode === 'dark'
}

/**
 * Pick a legible text color (near-black or white) for a custom accent fill,
 * using WCAG relative luminance. Keeps user-picked accents readable.
 */
function accentTextFor(hex: string): string {
  const c = hex.replace('#', '')
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c
  const toLin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
  const r = toLin(parseInt(full.slice(0, 2), 16) / 255)
  const g = toLin(parseInt(full.slice(2, 4), 16) / 255)
  const b = toLin(parseInt(full.slice(4, 6), 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.45 ? '#111827' : '#ffffff'
}

function setScaleVar(root: HTMLElement, name: string, value: number): void {
  if (value === 1) root.style.removeProperty(name)
  else root.style.setProperty(name, String(value))
}

function writeSnapshot(snap: AppearanceSnapshot): void {
  try {
    localStorage.setItem(APPEARANCE_SNAPSHOT_KEY, JSON.stringify(snap))
  } catch {
    /* private mode / quota — non-fatal, we just lose the FOUC optimisation */
  }
}

/** Clear the per-device snapshot (call on logout so the next user on a shared
 *  browser doesn't get a flash of the previous user's theme). */
export function clearAppearanceSnapshot(): void {
  try {
    localStorage.removeItem(APPEARANCE_SNAPSHOT_KEY)
  } catch {
    /* non-fatal */
  }
}

export function applyAppearance(input: ApplyAppearanceInput): AppearanceConfig {
  const cfg = normalizeAppearance(input.appearance)
  const isShared = !!input.isSharedPage
  // Public pages render the neutral default regardless of the viewer's account.
  const eff: AppearanceConfig = isShared
    ? { ...cfg, schemeId: 'default', accent: null, transparency: true }
    : cfg

  const dark = resolveDark(input.darkMode, isShared)
  const root = document.documentElement

  root.classList.toggle('dark', dark)

  // data-scheme — only for non-default schemes (default keeps the monochrome accent).
  if (eff.schemeId === 'default') root.removeAttribute('data-scheme')
  else root.setAttribute('data-scheme', eff.schemeId)

  // transparency-off marker
  if (eff.transparency) root.removeAttribute('data-no-transparency')
  else root.setAttribute('data-no-transparency', '')

  // density — only 'compact' deviates from today.
  if (eff.density === 'compact') root.setAttribute('data-density', 'compact')
  else root.removeAttribute('data-density')

  // user reduce-motion override (layered over the OS prefers-reduced-motion rule)
  if (eff.reduceMotion) root.setAttribute('data-reduce-motion', '')
  else root.removeAttribute('data-reduce-motion')

  // custom accent inline vars (+ auto-derived legible text) — only for 'custom'.
  const accentText =
    eff.schemeId === 'custom' && eff.accent
      ? { light: accentTextFor(eff.accent.light), dark: accentTextFor(eff.accent.dark) }
      : null
  if (eff.schemeId === 'custom' && eff.accent && accentText) {
    root.style.setProperty('--accent-custom-light', eff.accent.light)
    root.style.setProperty('--accent-custom-dark', eff.accent.dark)
    root.style.setProperty('--accent-custom-text-light', accentText.light)
    root.style.setProperty('--accent-custom-text-dark', accentText.dark)
  } else {
    root.style.removeProperty('--accent-custom-light')
    root.style.removeProperty('--accent-custom-dark')
    root.style.removeProperty('--accent-custom-text-light')
    root.style.removeProperty('--accent-custom-text-dark')
  }

  // Text scaling: each size-class var = global fontScale × its per-class factor.
  // Inline px content (mapped by size) and the text-title/subtitle/body/caption
  // utilities consume these; rem-based text additionally follows root font-size.
  setScaleVar(root, '--fs-scale-title', eff.fontScale * eff.typeScale.title)
  setScaleVar(root, '--fs-scale-subtitle', eff.fontScale * eff.typeScale.subtitle)
  setScaleVar(root, '--fs-scale-body', eff.fontScale * eff.typeScale.body)
  setScaleVar(root, '--fs-scale-caption', eff.fontScale * eff.typeScale.caption)

  // root font-size scales rem-based text (navbar, menus, non-migrated text).
  if (eff.fontScale === 1) root.style.removeProperty('font-size')
  else root.style.fontSize = `${eff.fontScale * 100}%`

  // theme-color meta — unchanged from before (dark #09090b / light #ffffff).
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#09090b' : '#ffffff')

  writeSnapshot({
    v: 1,
    darkMode: input.darkMode,
    scheme: eff.schemeId,
    noTransparency: !eff.transparency,
    density: eff.density,
    reduceMotion: eff.reduceMotion,
    accent: eff.accent,
    accentText,
    typeScale: eff.typeScale,
    fontScale: eff.fontScale,
  })

  return cfg
}
