import type { AppearanceSchemeId } from '@trek/shared'

/**
 * Color-scheme registry for the appearance picker. The actual token values live
 * in CSS ([data-scheme] blocks in index.css) — this only carries the metadata
 * the settings UI needs: a representative accent swatch per mode for the picker
 * dot. Labels come from i18n (settings.appearance.scheme.<id>).
 */
export interface SchemeSwatch {
  id: Exclude<AppearanceSchemeId, 'custom'>
  /** Representative accent color shown in the picker, per color mode. */
  swatch: { light: string; dark: string }
}

export const APPEARANCE_SCHEMES: SchemeSwatch[] = [
  { id: 'default', swatch: { light: '#111827', dark: '#e4e4e7' } },
  { id: 'highContrast', swatch: { light: '#1d4ed8', dark: '#60a5fa' } },
  { id: 'indigo', swatch: { light: '#4f46e5', dark: '#6366f1' } },
  { id: 'teal', swatch: { light: '#0d9488', dark: '#14b8a6' } },
  { id: 'rose', swatch: { light: '#e11d48', dark: '#f43f5e' } },
  { id: 'amber', swatch: { light: '#d97706', dark: '#f59e0b' } },
  { id: 'violet', swatch: { light: '#7c3aed', dark: '#8b5cf6' } },
]

/** Sensible starting points when a user first opens the custom-accent picker. */
export const CUSTOM_ACCENT_PRESETS: string[] = [
  '#4f46e5', '#0d9488', '#e11d48', '#d97706', '#7c3aed',
  '#2563eb', '#db2777', '#059669', '#ea580c', '#0891b2',
]
