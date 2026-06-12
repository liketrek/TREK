import { currencyDecimals } from '../../utils/formatters'
import { SYMBOLS, SPLIT_COLORS } from './BudgetPanel.constants'

export function widgetTheme(dark: boolean) {
  if (dark) return {
    bg: 'linear-gradient(180deg, #17171d 0%, #0d0d12 100%)',
    border: 'rgba(255,255,255,0.07)',
    text: '#ffffff',
    sub: 'rgba(255,255,255,0.6)',
    faint: 'rgba(255,255,255,0.4)',
    track: 'rgba(255,255,255,0.04)',
    divider: 'rgba(255,255,255,0.07)',
    iconBg: 'rgba(255,255,255,0.08)',
    iconBorder: 'rgba(255,255,255,0.12)',
    iconColor: 'rgba(255,255,255,0.9)',
    centerBg: '#17171d',
    flowBg: 'rgba(255,255,255,0.05)',
    flowBorder: 'rgba(255,255,255,0.07)',
    flowHoverBg: 'rgba(255,255,255,0.08)',
    flowHoverBorder: 'rgba(255,255,255,0.12)',
    rowHover: 'rgba(255,255,255,0.03)',
    shadow: '0 20px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
    donutShadow: 'drop-shadow(0 0 20px rgba(0,0,0,0.3))',
  }
  return {
    bg: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
    border: 'rgba(15,23,42,0.08)',
    text: '#111827',
    sub: 'rgba(17,24,39,0.6)',
    faint: 'rgba(17,24,39,0.4)',
    track: 'rgba(15,23,42,0.05)',
    divider: 'rgba(15,23,42,0.08)',
    iconBg: 'rgba(15,23,42,0.05)',
    iconBorder: 'rgba(15,23,42,0.1)',
    iconColor: 'rgba(17,24,39,0.75)',
    centerBg: '#ffffff',
    flowBg: 'rgba(15,23,42,0.03)',
    flowBorder: 'rgba(15,23,42,0.08)',
    flowHoverBg: 'rgba(15,23,42,0.06)',
    flowHoverBorder: 'rgba(15,23,42,0.14)',
    rowHover: 'rgba(15,23,42,0.04)',
    shadow: '0 12px 32px rgba(15,23,42,0.08), 0 2px 6px rgba(0,0,0,0.04)',
    donutShadow: 'drop-shadow(0 4px 18px rgba(15,23,42,0.12))',
  }
}

export function hexLighten(hex: string, amount: number): string {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m || m.length !== 3) return hex
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount))
  const [r, g, b] = m.map(x => parseInt(x, 16))
  return `#${[mix(r), mix(g), mix(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

export const fmtNum = (v: number | null | undefined, locale: string, cur: string) => {
  if (v == null || isNaN(v)) return '-'
  const d = currencyDecimals(cur)
  return Number(v).toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d }) + ' ' + (SYMBOLS[cur] || cur)
}

type NumOrNull = number | null | undefined

export const calcPP = (p: NumOrNull, n: NumOrNull) => (n! > 0 ? (p as number) / (n as number) : null)
export const calcPD = (p: NumOrNull, d: NumOrNull) => (d! > 0 ? (p as number) / (d as number) : null)
export const calcPPD = (p: NumOrNull, n: NumOrNull, d: NumOrNull) => (n! > 0 && d! > 0 ? (p as number) / ((n as number) * (d as number)) : null)

export function splitColorFor(userId: number, order: number) {
  return SPLIT_COLORS[order % SPLIT_COLORS.length]
}

export function colorForUserId(userId: number) {
  return SPLIT_COLORS[((userId | 0) - 1 + SPLIT_COLORS.length * 1000) % SPLIT_COLORS.length]
}
