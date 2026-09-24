import DayImpactList, { type ImpactListSkin } from '../../components/shared/DayImpactList'
import type { ImpactLine } from '../../utils/dayImpactLines'

const DANGER_TINT = 'bg-[color:color-mix(in_srgb,var(--m-st-danger)_9%,transparent)]'

/** The mobile tokens for the same rows: an inset card with hairlines between rows. */
const PHONE: ImpactListSkin = {
  list: 'mt-3 overflow-hidden rounded-[13px] border border-[color:var(--m-inbr)] bg-[color:var(--m-inner)]',
  row: 'flex items-start gap-[10px] px-[11px] py-[8px]',
  divider: 'border-t border-[color:var(--m-rowbr)]',
  chip: 'flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full',
  dayChip: 'rounded-full bg-[color:var(--m-ic)] px-[8px] py-[1px] text-[0.6875rem] font-semibold text-m-ink',
  iconSize: 13,
  text: 'text-[0.78125rem] font-semibold leading-snug text-pretty',
  hint: 'mt-[1px] text-[0.6875rem] leading-snug text-m-muted text-pretty',
  chipTone: {
    neutral: 'bg-[color:var(--m-ic)] text-m-muted',
    muted: 'bg-[color:var(--m-ic)] text-m-faint',
    warning: 'bg-[color:color-mix(in_srgb,var(--m-st-pending)_14%,transparent)] text-[color:var(--m-st-pending)]',
    danger: 'bg-[color:color-mix(in_srgb,var(--m-st-danger)_14%,transparent)] text-[color:var(--m-st-danger)]',
  },
  textTone: {
    neutral: 'text-m-ink',
    muted: 'text-m-muted',
    warning: 'text-m-ink',
    danger: 'text-[color:var(--m-st-danger)]',
  },
  rowTone: { neutral: '', muted: '', warning: '', danger: DANGER_TINT },
  plain: 'mt-3 flex items-center gap-[8px] rounded-[13px] border border-[color:var(--m-inbr)] bg-[color:var(--m-inner)] px-[11px] py-[10px] text-[0.75rem] text-m-muted',
  plainIcon: 'flex-none text-m-faint',
}

/** The phone's day impact list: DayImpactList drawn in the mobile tokens. */
export default function MDayImpactList({ lines, days, label }: { lines: ImpactLine[]; days?: string[]; label?: string }) {
  return <DayImpactList lines={lines} days={days} label={label} skin={PHONE} />
}
