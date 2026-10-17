import { useTranslation } from '../../../i18n'
import { Tooltip } from '../../shared/Tooltip'
import { DialogHeader, PILL, type DialogHeaderProps } from '../../shared/DialogShell'
import { typeInfo } from './bookingsModel'
import { TypeTile, toneColor, toneTint, type StatusTone } from './bookingParts'

export interface BookingDialogHeaderProps extends Omit<DialogHeaderProps, 'tile' | 'tint'> {
  tone: StatusTone
  /** The booking type, drawn as the raised tile on the left. */
  type: string
}

/** The head band of a booking dialog, tinted by the status like the card the booking sits on. */
export function BookingDialogHeader({ tone, type, ...rest }: BookingDialogHeaderProps) {
  return <DialogHeader {...rest} tile={<TypeTile type={type} size={46} raised />} tint={toneTint(tone)} />
}

/** Confirmed or pending with its dot. With onToggle it switches to the other. */
export function StatusPill({ status, onToggle }: { status: 'confirmed' | 'pending'; onToggle?: () => void }) {
  const { t } = useTranslation()
  const content = (
    <>
      <span className="h-2 w-2 flex-none rounded-full" style={{ background: toneColor(status) }} />
      {status === 'confirmed' ? t('reservations.confirmed') : t('reservations.pending')}
    </>
  )
  if (!onToggle) return <span className={PILL}>{content}</span>
  const label = t('reservations.status.switchTo', { status: status === 'confirmed' ? t('reservations.pending') : t('reservations.confirmed') })
  return (
    <Tooltip label={label}>
      <button type="button" onClick={onToggle} aria-label={label} className={`${PILL} hover:opacity-80`}>
        {content}
      </button>
    </Tooltip>
  )
}

export function TypePill({ type }: { type: string }) {
  const { t } = useTranslation()
  const info = typeInfo(type)
  return <span className={PILL}><info.Icon size={13} strokeWidth={2.2} style={{ color: info.color }} />{t(info.chipKey)}</span>
}
