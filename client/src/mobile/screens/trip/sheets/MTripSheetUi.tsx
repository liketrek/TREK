import { ReactNode } from 'react'
import { X } from 'lucide-react'
import MIconBtn from '../../../components/MIconBtn'
import { formatTime } from '../../../../utils/formatters'

/** Shared scaffolding of the trip inspection sheets (glass floating cards). */

/** Inner row/card surface used inside glass sheets. */
export const INNER_CLS = 'border border-[color:var(--m-inbr)] bg-[color:var(--m-inner)]'

/** Eyebrow section label: Geist 10px/700 letter-spacing .09em, faint. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`font-geist text-[0.625rem] font-bold tracking-[.09em] text-m-faint ${className}`}>
      {children}
    </div>
  )
}

interface TileHeaderProps {
  icon: ReactNode
  title: ReactNode
  sub?: ReactNode
  onClose: () => void
  closeLabel: string
}

/** Sheet header: 40px icon tile + title/sub + 34px round close. */
export function TileHeader({ icon, title, sub, onClose, closeLabel }: TileHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[13px] bg-[color:var(--m-ic)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[6px] text-[1.0625rem] font-bold leading-tight">{title}</div>
        {sub && <div className="truncate font-geist text-[0.71875rem] text-m-muted">{sub}</div>}
      </div>
      <MIconBtn variant="neutral" size={34} onClick={onClose} ariaLabel={closeLabel}>
        <X size={15} strokeWidth={2.2} />
      </MIconBtn>
    </div>
  )
}

interface StatBoxProps {
  value: ReactNode
  label: ReactNode
  blurred?: boolean
  onClick?: () => void
}

/** Small stat box (check-in / times / code): value 700 tabular over a faint Geist label. */
export function StatBox({ value, label, blurred = false, onClick }: StatBoxProps) {
  return (
    <div
      onClick={onClick}
      className="min-w-0 flex-1 rounded-[10px] bg-[color:var(--m-ic)] px-[9px] py-[7px] text-center"
    >
      <div
        className={`truncate text-[0.8125rem] font-bold tabular-nums leading-tight ${blurred ? 'blur-[4px] select-none' : ''}`}
      >
        {value}
      </div>
      <div className="truncate font-geist text-[0.5625rem] text-m-faint">{label}</div>
    </div>
  )
}

interface ActionCircleProps {
  onClick?: () => void
  label: string
  primary?: boolean
  danger?: boolean
  className?: string
  children: ReactNode
}

/** 38px round action button of the inspector footer rows. */
export function ActionCircle({ onClick, label, primary = false, danger = false, className = '', children }: ActionCircleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full ${
        primary
          ? 'bg-m-act text-m-actfg'
          : `border border-[color:var(--m-gbr)] bg-[color:var(--m-ic)] ${danger ? 'text-[color:var(--m-st-danger)]' : 'text-m-ink'}`
      } ${className}`}
    >
      {children}
    </button>
  )
}

/** Formats a stored time — plain "HH:MM" or a full ISO timestamp — for display. */
export function displayTime(value: string | null | undefined, locale: string, timeFormat: string): string {
  if (!value) return ''
  if (value.includes('T')) {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h' })
    }
  }
  return formatTime(value, locale, timeFormat)
}
