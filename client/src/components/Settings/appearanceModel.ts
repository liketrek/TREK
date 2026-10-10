import type { AppearanceConfig } from '@trek/shared';

/** The appearance editor's pure parts, shared by the desktop tab and the phone section. */

// WCAG contrast helpers, for the custom accent legibility hint.
function channelLum(v: number): number {
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function relLuminance(hex: string): number {
  const c = hex.replace('#', '');
  const full =
    c.length === 3
      ? c
          .split('')
          .map((x) => x + x)
          .join('')
      : c;
  const r = channelLum(Number.parseInt(full.slice(0, 2), 16) / 255);
  const g = channelLum(Number.parseInt(full.slice(2, 4), 16) / 255);
  const b = channelLum(Number.parseInt(full.slice(4, 6), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
export const isHex = (v: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);

type DesktopWidgetKey = keyof AppearanceConfig['dashboard']['desktop'];
type MobileWidgetKey = keyof AppearanceConfig['dashboard']['mobile'];

// Grouped by where the widgets actually sit on the dashboard. The right sidebar
// has a master toggle (off: no sidebar, layout centers); its individual
// widgets only matter while the sidebar is shown.
export const DESKTOP_GROUPS: { id: string; fallback: string; master?: DesktopWidgetKey; keys: DesktopWidgetKey[] }[] = [
  { id: 'belowHero', fallback: 'Below the hero', keys: ['atlas', 'tripsTotal', 'daysTraveled', 'distanceFlown'] },
  {
    id: 'rightSidebar',
    fallback: 'Right sidebar',
    master: 'sidebar',
    keys: ['currency', 'collections', 'timezones', 'upcomingReservations'],
  },
];
export const MOBILE_GROUPS: { id: string; fallback: string; keys: MobileWidgetKey[] }[] = [
  { id: 'belowHero', fallback: 'Below the hero', keys: ['tripsTotal', 'daysTraveled'] },
  {
    id: 'bottomOfPage',
    fallback: 'Bottom of page',
    keys: ['currency', 'collections', 'timezones', 'upcomingReservations'],
  },
];
