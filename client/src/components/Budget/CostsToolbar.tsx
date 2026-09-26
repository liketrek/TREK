import { Check, Plus, ScanLine } from 'lucide-react'
import { useTranslation } from '../../i18n'
import type { TripMember } from './BudgetPanelMemberChips'

interface CostsToolbarProps {
  /** The trip's span as a formatted range and its length in days; null for a trip without dates. */
  dateMeta: { range: string; days: number } | null
  people: TripMember[]
  me: number
  colorFor: (userId: number) => string
  canEdit: boolean
  /** Whether there is any suggested transfer left to settle. */
  canSettle: boolean
  onSettleAll: () => void
  onAddExpense: () => void
  /** Opens the receipt scan; left out when the AI model reads no images. */
  onScanReceipt?: () => void
}

const BODY_SIZE = 'calc(13px * var(--fs-scale-body, 1))'

/**
 * The bar on top of the Costs tab, in the same shape as the one Transports,
 * Bookings, Lists and Files open with: the tab's name, then what the numbers
 * cover (the trip's days and who travels), and the two actions on the right.
 */
export default function CostsToolbar({ dateMeta, people, me, colorFor, canEdit, canSettle, onSettleAll, onAddExpense, onScanReceipt }: CostsToolbarProps) {
  const { t } = useTranslation()
  const chip = 'inline-flex items-center whitespace-nowrap rounded-full bg-surface-card px-3 py-1.5 font-medium text-content-muted shadow-sm'
  const button = 'inline-flex items-center gap-1.5 rounded-[10px] border-0 px-[14px] py-[9px] font-medium hover:opacity-[0.88]'

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 rounded-[18px] bg-surface-tertiary py-3.5 pl-[22px] pr-4">
      <h2 className="m-0 shrink-0 text-subtitle font-semibold tracking-[-0.01em] text-content">{t('trip.tabs.budget')}</h2>
      <div className="h-[22px] w-px shrink-0 bg-edge-faint" />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5" style={{ fontSize: BODY_SIZE }}>
        {dateMeta && (
          <span className={`${chip} gap-3`}>
            {dateMeta.range}
            {/* One pill in two fields, cut straight through in the bar's colour rather than two rounded halves. */}
            <span aria-hidden className="-my-1.5 w-[3px] self-stretch bg-surface-tertiary" />
            <b className="text-content">{t('costs.daysCount', { count: dateMeta.days })}</b>
          </span>
        )}
        <span className={`${chip} gap-2 pl-1.5`}>
          <span className="inline-flex">
            {people.slice(0, 4).map((p, i) => {
              const ring = { width: 22, height: 22, marginLeft: i ? -8 : 0 }
              return p.avatar_url
                ? <img key={p.id} src={p.avatar_url} alt="" className="block shrink-0 rounded-full border-2 border-surface-card object-cover" style={ring} />
                : (
                  <span key={p.id} className="grid shrink-0 place-items-center rounded-full border-2 border-surface-card font-bold" style={{
                    ...ring, background: colorFor(p.id), fontSize: 'calc(9px * var(--fs-scale-caption, 1))',
                    color: '#fff', // theme-lint-disable: an initial on the member's own colour
                  }}>{(p.id === me ? t('costs.youShort') : p.username.charAt(0)).toUpperCase()}</span>
                )
            })}
          </span>
          <b className="text-content">{t('costs.travelers', { count: people.length })}</b>
        </span>
      </div>
      {canEdit && (
        <div className="ml-auto flex shrink-0 flex-wrap gap-1.5" style={{ fontSize: BODY_SIZE }}>
          <button type="button" onClick={onSettleAll} disabled={!canSettle}
            className={`${button} bg-surface-card text-content disabled:cursor-default disabled:opacity-40`}>
            <Check size={14} strokeWidth={2.5} />
            {t('costs.settleUp')}
          </button>
          {onScanReceipt && (
            <button type="button" onClick={onScanReceipt} className={`${button} bg-surface-card text-content`}>
              <ScanLine size={14} strokeWidth={2.5} />
              {t('costs.scan.button')}
            </button>
          )}
          <button type="button" onClick={onAddExpense} className={`${button} bg-accent text-accent-text`}>
            <Plus size={14} strokeWidth={2.5} />
            {t('costs.addExpense')}
          </button>
        </div>
      )}
    </div>
  )
}
