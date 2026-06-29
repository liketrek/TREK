import type { Dispatch, SetStateAction } from 'react'
import { Wallet, Info, ChevronDown, ChevronRight, TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react'
import type { BudgetItem } from '../../types'
import { currencyDecimals } from '../../utils/formatters'
import { SYMBOLS } from './BudgetPanel.constants'
import { hexLighten, widgetTheme } from './BudgetPanel.helpers'
import RingAvatar from './BudgetPanelRingAvatar'
import PerPersonInline from './BudgetPanelPerPersonInline'
import type { SettlementData, PieSegment } from './useBudgetPanel'

interface BudgetSummaryProps {
  theme: ReturnType<typeof widgetTheme>
  currency: string
  locale: string
  grandTotal: number
  hasMultipleMembers: boolean
  budgetItems: BudgetItem[]
  settlement: SettlementData | null
  settlementOpen: boolean
  setSettlementOpen: Dispatch<SetStateAction<boolean>>
  pieSegments: PieSegment[]
  isDark: boolean
  tripId: number
  t: (key: string) => string
  fmt: (v: number | null | undefined, cur: string) => string
}

export default function BudgetSummary({ theme, currency, locale, grandTotal, hasMultipleMembers, budgetItems,
  settlement, settlementOpen, setSettlementOpen, pieSegments, isDark, tripId, t, fmt }: BudgetSummaryProps) {
  return (
        <div className="w-full md:w-[320px]" style={{ flexShrink: 0, position: 'sticky', top: 16, alignSelf: 'flex-start' }}>

          <div style={{
            background: theme.bg,
            borderRadius: 20, padding: 20, color: theme.text, marginBottom: 16,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.shadow,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: theme.iconBg,
                border: `1px solid ${theme.iconBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: theme.iconColor, flexShrink: 0,
              }}>
                <Wallet size={20} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: theme.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{t('budget.totalBudget')}</div>
              </div>
            </div>

            {(() => {
              const decimals = currencyDecimals(currency)
              const full = Number(grandTotal).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
              const sep = (0.1).toLocaleString(locale).replace(/\d/g, '')
              const [integerPart, decimalPart] = decimals > 0 ? full.split(sep) : [full, '']
              return (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  <span style={{ fontSize: 'calc(38px * var(--fs-scale-title, 1))', fontWeight: 700 }}>{integerPart}</span>
                  {decimalPart && <span style={{ fontSize: 'calc(22px * var(--fs-scale-title, 1))', fontWeight: 500, color: theme.sub }}>{sep}{decimalPart}</span>}
                  <span style={{ fontSize: 'calc(22px * var(--fs-scale-title, 1))', fontWeight: 500, color: theme.sub, marginLeft: 2 }}>{SYMBOLS[currency] || currency}</span>
                </div>
              )
            })()}
            <div style={{ color: theme.faint, fontSize: 'calc(12px * var(--fs-scale-body, 1))', marginTop: 8, fontWeight: 500, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{currency}</span>
            </div>

            {hasMultipleMembers && (budgetItems || []).some(i => (i.members?.length ?? 0) > 0) && (
              <PerPersonInline tripId={tripId} budgetItems={budgetItems} currency={currency} locale={locale} grandTotal={grandTotal} theme={theme} />
            )}

            {/* Settlement dropdown inside the total card */}
            {hasMultipleMembers && settlement && settlement.flows.length > 0 && (
              <div style={{ marginTop: 16, borderTop: `1px solid ${theme.divider}`, paddingTop: 12 }}>
                <button onClick={() => setSettlementOpen(v => !v)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                  color: theme.sub, fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, letterSpacing: 0.5,
                }}>
                  {settlementOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  {t('budget.settlement')}
                  <span style={{ position: 'relative', display: 'inline-flex', marginLeft: 2 }}>
                    <span style={{ display: 'flex', cursor: 'help' }}
                      onMouseEnter={e => { const tip = e.currentTarget.nextElementSibling as HTMLElement; if (tip) tip.style.display = 'block' }}
                      onMouseLeave={e => { const tip = e.currentTarget.nextElementSibling as HTMLElement; if (tip) tip.style.display = 'none' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <Info size={11} strokeWidth={2} />
                    </span>
                    <div style={{
                      display: 'none', position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                      marginTop: 6, width: 220, padding: '10px 12px', borderRadius: 10, zIndex: 100,
                      background: 'var(--bg-card)', border: '1px solid var(--border-faint)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 400, color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left',
                    }}>
                      {t('budget.settlementInfo')}
                    </div>
                  </span>
                </button>

                {settlementOpen && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {settlement.flows.map((flow, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 14px', borderRadius: 14,
                        background: theme.flowBg,
                        border: `1px solid ${theme.flowBorder}`,
                        transition: 'all 0.2s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = theme.flowHoverBg; e.currentTarget.style.borderColor = theme.flowHoverBorder }}
                        onMouseLeave={e => { e.currentTarget.style.background = theme.flowBg; e.currentTarget.style.borderColor = theme.flowBorder }}
                      >
                        <RingAvatar userId={flow.from.user_id} username={flow.from.username} avatarUrl={flow.from.avatar_url} size={32} innerBg={theme.centerBg} textColor={theme.text} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 700, color: '#ef4444', letterSpacing: '-0.01em' }}>
                            {fmt(flow.amount, currency)}
                          </span>
                          <div style={{ width: '100%', height: 2, borderRadius: 2, background: 'linear-gradient(90deg, rgba(239,68,68,0.1), rgba(239,68,68,0.55), rgba(239,68,68,0.3))', position: 'relative' }}>
                            <div style={{ position: 'absolute', right: -1, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderLeft: '6px solid rgba(239,68,68,0.55)', borderTop: '4px solid transparent', borderBottom: '4px solid transparent' }} />
                          </div>
                        </div>
                        <RingAvatar userId={flow.to.user_id} username={flow.to.username} avatarUrl={flow.to.avatar_url} size={32} innerBg={theme.centerBg} textColor={theme.text} />
                      </div>
                    ))}

                    {settlement.balances.filter(b => Math.abs(b.balance) > 0.01).length > 0 && (
                      <div style={{ marginTop: 8, borderTop: `1px solid ${theme.divider}`, paddingTop: 12 }}>
                        <div style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700, color: theme.faint, textTransform: 'uppercase', letterSpacing: '0.11em', marginBottom: 10 }}>
                          {t('budget.netBalances')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {settlement.balances.filter(b => Math.abs(b.balance) > 0.01).map(b => {
                            const positive = b.balance > 0
                            const Trend = positive ? TrendingUp : TrendingDown
                            return (
                              <div key={b.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                                <RingAvatar userId={b.user_id} username={b.username} avatarUrl={b.avatar_url} size={26} innerBg={theme.centerBg} textColor={theme.text} />
                                <span style={{ flex: 1, fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: theme.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {b.username}
                                </span>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  padding: '4px 10px', borderRadius: 8,
                                  fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 700, letterSpacing: '-0.01em',
                                  background: positive ? 'rgba(16,185,129,0.13)' : 'rgba(239,68,68,0.13)',
                                  color: positive ? '#10b981' : '#ef4444',
                                }}>
                                  <Trend size={11} strokeWidth={3} />
                                  {positive ? '+' : ''}{fmt(b.balance, currency)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {pieSegments.length > 0 && (() => {
            const decimals = currencyDecimals(currency)
            const total = pieSegments.reduce((s, x) => s + x.value, 0)
            const totalFmt = Number(total).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
            const decimalSep = (0.1).toLocaleString(locale).replace(/\d/g, '')
            const [totalInt, totalDec] = decimals > 0 ? totalFmt.split(decimalSep) : [totalFmt, '']
            const R = 80
            const CIRC = 2 * Math.PI * R
            let dashOffset = 0
            return (
              <div style={{
                background: theme.bg,
                borderRadius: 20, padding: 20, color: theme.text, marginBottom: 16,
                border: `1px solid ${theme.border}`,
                boxShadow: theme.shadow,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: theme.iconBg,
                    border: `1px solid ${theme.iconBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: theme.iconColor, flexShrink: 0,
                  }}>
                    <PieChartIcon size={18} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: theme.faint, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 600 }}>{t('budget.byCategory')}</div>
                  </div>
                </div>

                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', margin: '4px 0 16px' }}>
                  <svg width={200} height={200} viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)', filter: theme.donutShadow }}>
                    <defs>
                      {pieSegments.map((seg, i) => {
                        const c2 = hexLighten(seg.color, 0.2)
                        return (
                          <linearGradient key={`grad-${i}`} id={`cat-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={seg.color} />
                            <stop offset="100%" stopColor={c2} />
                          </linearGradient>
                        )
                      })}
                    </defs>
                    <circle cx={100} cy={100} r={R} fill="none" stroke={theme.track} strokeWidth={22} />
                    {pieSegments.map((seg, i) => {
                      const segLen = total > 0 ? (seg.value / total) * CIRC : 0
                      const circle = (
                        <circle key={i}
                          cx={100} cy={100} r={R}
                          fill="none" strokeLinecap="round" strokeWidth={22}
                          stroke={`url(#cat-grad-${i})`}
                          strokeDasharray={`${segLen} ${CIRC}`}
                          strokeDashoffset={-dashOffset}
                        />
                      )
                      dashOffset += segLen
                      return circle
                    })}
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pointerEvents: 'none' }}>
                    <div style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', color: theme.faint, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>{t('budget.total')}</div>
                    <div style={{ fontSize: 'calc(22px * var(--fs-scale-title, 1))', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      <span>{totalInt}</span>
                      {totalDec && <span style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, color: theme.sub }}>{decimalSep}{totalDec}</span>}
                    </div>
                    <div style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', color: theme.faint, fontWeight: 500, marginTop: 2 }}>{currency}</div>
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${theme.divider}`, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {pieSegments.map((seg, i) => {
                    const pct = total > 0 ? (seg.value / total) * 100 : 0
                    const pctLabel = pct.toFixed(1).replace('.', decimalSep) + '%'
                    const c2 = hexLighten(seg.color, 0.2)
                    const chipColor = isDark ? hexLighten(seg.color, 0.35) : seg.color
                    return (
                      <div key={seg.name} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 8px', borderRadius: 12,
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = theme.rowHover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                          background: `linear-gradient(135deg, ${seg.color}, ${c2})`,
                          boxShadow: `0 0 12px ${seg.color}80`,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 'calc(13.5px * var(--fs-scale-body, 1))', fontWeight: 500, letterSpacing: '-0.01em', color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seg.name}</div>
                          <div style={{ fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', color: theme.sub, fontWeight: 500, marginTop: 1 }}>{fmt(seg.value, currency)}</div>
                        </div>
                        <span style={{
                          flexShrink: 0,
                          padding: '4px 9px', borderRadius: 7,
                          fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 700, letterSpacing: '-0.01em',
                          background: `${seg.color}26`,
                          border: `1px solid ${seg.color}40`,
                          color: chipColor,
                        }}>{pctLabel}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

        </div>
  )
}
