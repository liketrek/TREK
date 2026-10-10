import { CheckCircle2, Circle, MessageCircle, PackageCheck, Wallet } from 'lucide-react'
import { fs, NEUTRAL_TINT } from '../../components/shared/DialogShell'
import { CountPill } from '../../components/Planner/bookings/bookingParts'
import { TripMemberAvatar } from '../../components/Trips/TripMemberAvatar'
import { convertBooked, convertedLine } from '../../hooks/useExchangeRates'
import { useTranslation } from '../../i18n'
import { avatarSrc } from '../../utils/avatarSrc'
import { currencyDecimals } from '../../utils/formatters'
import { EmptySection, SectionTitle } from './SharedChrome'
import { groupInOrder } from './sharedTripModel'

const CARD = 'overflow-hidden rounded-2xl border border-edge-faint bg-surface-card shadow-sm'
const CARD_HEAD = 'flex items-center gap-2 border-b border-edge-faint px-4 py-3'

/** A thin bar for a share of a whole: packed of all, or a category of the total. */
function Meter({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-surface-tertiary ${className}`}>
      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }} />
    </div>
  )
}

// ── Packing ────────────────────────────────────────────────────────────────

interface PackingItem { id: number; name: string; category?: string | null; checked?: number | boolean | null; quantity?: number | null }

export function SharedPackingView({ items }: { items: PackingItem[] }) {
  const { t } = useTranslation()
  if (items.length === 0) return <EmptySection icon={<PackageCheck size={22} />} text={t('shared.emptyPacking')} />
  const packed = items.filter(i => i.checked).length
  const groups = groupInOrder(items, i => i.category || t('shared.other'))
  return (
    <div className="flex flex-col gap-4">
      <div className={`${CARD} px-5 py-4`}>
        <SectionTitle icon={<PackageCheck size={16} strokeWidth={2} />} title={t('shared.tabPacking')}>
          <span className="ms-auto font-medium text-content-muted" style={fs(12.5, 'body')}>
            {t('packing.progress', { packed, total: items.length, percent: Math.round((packed / items.length) * 100) })}
          </span>
        </SectionTitle>
        <Meter value={packed / items.length} />
      </div>
      <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map(([category, list]) => {
          const done = list.filter(i => i.checked).length
          return (
            <section key={category} className={CARD}>
              <div className={CARD_HEAD} style={{ background: NEUTRAL_TINT }}>
                <h3 className="min-w-0 flex-1 truncate font-bold text-content" style={fs(13.5, 'body')}>{category}</h3>
                <CountPill>{done}/{list.length}</CountPill>
              </div>
              <ul className="flex flex-col py-1.5">
                {list.map(item => (
                  <li key={item.id} className="flex items-center gap-2.5 px-4 py-1.5">
                    {item.checked
                      ? <CheckCircle2 size={17} strokeWidth={2} className="flex-none text-success" aria-hidden />
                      : <Circle size={17} strokeWidth={2} className="flex-none text-content-faint" aria-hidden />}
                    <span className={`min-w-0 flex-1 ${item.checked ? 'text-content-faint line-through' : 'text-content'}`} style={fs(13, 'body')}>{item.name}</span>
                    {(item.quantity ?? 1) > 1 && <span className="font-geist font-semibold tabular-nums text-content-faint" style={fs(11)}>×{item.quantity}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

// ── Costs ──────────────────────────────────────────────────────────────────

interface Expense { id: number; name: string; category?: string | null; total_price?: number | string | null; currency?: string | null; exchange_rate?: number | null }

interface CostsProps {
  items: Expense[]
  /** The currency the owner reads Costs in. */
  base: string
  tripCurrency: string
  convert: (amount: number, from: string | null | undefined) => number
}

/**
 * The Costs tab. Pre-rework rows store currency = NULL ("the trip's own
 * currency"). Each expense is read the way CostsPanel reads it (#2525): at the
 * rate frozen when it was entered, into the trip currency, then into the
 * owner's display base. Reading it at today's rate alone made the shared page
 * disagree with the trip's own Costs tab.
 */
export function SharedCostsView({ items, base, tripCurrency, convert }: CostsProps) {
  const { t, locale } = useTranslation()
  if (items.length === 0) return <EmptySection icon={<Wallet size={22} />} text={t('shared.emptyCosts')} />
  const amountOf = (i: Expense) => Number.parseFloat(String(i.total_price ?? '')) || 0
  const valueOf = (i: Expense) => convertBooked(amountOf(i), i.currency, i.exchange_rate, tripCurrency, convert)
  // In the reader's own number format with the currency's code: a public page has
  // no idea where its reader is, and "$" alone does not say which dollar.
  // Whole cents: a converted amount otherwise printed a third decimal.
  const money = (v: number) => `${v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${base}`
  // What was entered, beside a row shown converted, as the Costs list prints it.
  const enteredOf = (i: Expense): string | null => {
    const entered = convertedLine(amountOf(i), i.currency, i.exchange_rate, tripCurrency, base, valueOf(i))?.entered
    if (!entered) return null
    const d = currencyDecimals(entered.currency)
    return `${entered.amount.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d })} ${entered.currency}`
  }
  const sumOf = (list: Expense[]) => list.reduce((s, i) => s + valueOf(i), 0)
  const total = sumOf(items)
  const groups = groupInOrder(items, i => i.category || t('shared.other'))
  return (
    <div className="flex flex-col gap-4">
      <div className={`${CARD} grid gap-5 p-5 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]`}>
        <div>
          <SectionTitle icon={<Wallet size={16} strokeWidth={2} />} title={t('shared.totalBudget')}><CountPill>{items.length}</CountPill></SectionTitle>
          <div className="font-geist font-bold tabular-nums tracking-tight text-content" style={{ fontSize: 'calc(32px * var(--fs-scale-title, 1))' }}>{money(total)}</div>
        </div>
        <ul className="flex flex-col justify-center gap-2.5">
          {groups.map(([category, list]) => {
            const sum = sumOf(list)
            return (
              <li key={category}>
                <div className="mb-1 flex items-baseline gap-2" style={fs(12.5, 'body')}>
                  <span className="min-w-0 flex-1 truncate font-semibold text-content-secondary">{category}</span>
                  <span className="font-geist font-semibold tabular-nums text-content">{money(sum)}</span>
                </div>
                <Meter value={total > 0 ? sum / total : 0} />
              </li>
            )
          })}
        </ul>
      </div>
      <div className="grid items-start gap-3 md:grid-cols-2">
        {groups.map(([category, list]) => (
          <section key={category} className={CARD}>
            <div className={CARD_HEAD} style={{ background: NEUTRAL_TINT }}>
              <h3 className="min-w-0 flex-1 truncate font-bold text-content" style={fs(13.5, 'body')}>{category}</h3>
              <span className="font-geist font-bold tabular-nums text-content-secondary" style={fs(12.5, 'body')}>{money(sumOf(list))}</span>
            </div>
            <ul className="flex flex-col divide-y divide-[color:var(--border-faint)]">
              {list.map(item => {
                const entered = item.total_price ? enteredOf(item) : null
                return (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-content" style={fs(13, 'body')}>{item.name}</div>
                      {entered && <div className="font-geist tabular-nums text-content-faint" style={fs(11)}>{entered}</div>}
                    </div>
                    {!!item.total_price && <span className="font-geist font-semibold tabular-nums text-content" style={fs(13, 'body')}>{money(valueOf(item))}</span>}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

// ── Chat ───────────────────────────────────────────────────────────────────

interface ChatMessage { id: number; username?: string | null; avatar?: string | null; text: string; created_at: string }

export function SharedChatView({ messages }: { messages: ChatMessage[] }) {
  const { t, locale } = useTranslation()
  if (messages.length === 0) return <EmptySection icon={<MessageCircle size={22} />} text={t('shared.emptyChat')} />
  return (
    <section className={CARD}>
      <div className={CARD_HEAD} style={{ background: NEUTRAL_TINT }}>
        <MessageCircle size={15} strokeWidth={2} className="text-content-muted" aria-hidden />
        <h3 className="font-bold text-content" style={fs(13.5, 'body')}>{t('shared.tabChat')}</h3>
        <CountPill>{messages.length}</CountPill>
      </div>
      <div className="flex flex-col gap-3 px-4 py-4">
        {messages.map((msg, i) => {
          const prev = i > 0 ? messages[i - 1] : null
          const showDate = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString()
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="my-2 flex justify-center">
                  <span className="rounded-full bg-surface-tertiary px-3 py-1 font-semibold text-content-muted" style={fs(11)}>
                    {new Date(msg.created_at).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )}
              <div className="flex items-end gap-2.5">
                <TripMemberAvatar username={msg.username || '?'} avatarUrl={msg.avatar ? avatarSrc(msg.avatar) : null} size={30} />
                <div className="min-w-0 max-w-[85%] rounded-2xl rounded-es-md bg-surface-secondary px-3.5 py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-content" style={fs(12, 'body')}>{msg.username}</span>
                    <span className="text-content-faint" style={fs(10.5)}>
                      {new Date(msg.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="mt-0.5 whitespace-pre-wrap text-content-secondary [overflow-wrap:anywhere]" style={{ ...fs(13, 'body'), lineHeight: 1.5 }}>{msg.text}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
