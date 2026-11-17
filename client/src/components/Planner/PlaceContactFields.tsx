import { useId } from 'react'
import { Copy, DoorClosed, Mail, Phone, RotateCcw, X } from 'lucide-react'
import type { PlaceClientOrigin, PlaceOpeningHours } from '@trek/shared'
import CustomTimePicker from '../shared/CustomTimePicker'
import { Tooltip } from '../shared/Tooltip'
import { DialogSection, fs } from '../shared/DialogShell'
import { AddRowButton, EditorField, GRID_2, INPUT } from '../shared/dialogParts'
import { isAllDay, weekdayNames } from './placeHours'
import { usePlaceHours } from './usePlaceHours'
import { useTranslation } from '../../i18n'
import { NO_AUTOFILL } from '../../utils/noAutofill'

/** A closed or all-day row says so in place of the two times, in a box of their height. */
const DAY_STATE = 'flex h-[38px] min-w-0 items-center rounded-[10px] border border-edge-faint bg-surface-tertiary px-3.5 font-medium text-content-muted'
/** The two switches after the times: square, as tall as a time field. */
const DAY_BUTTON = 'grid h-[38px] w-[38px] flex-none place-items-center rounded-[10px] border font-semibold transition-colors'
const DAY_BUTTON_OFF = 'border-edge bg-surface-input text-content-faint hover:border-content-faint hover:text-content'
const DAY_BUTTON_ON = 'border-transparent bg-accent text-accent-text shadow-sm'

interface Props {
  /** Anchor for the "add by hand" jump from an empty search. */
  id?: string
  phone: string
  email: string
  /** The stored hours text (JSON), empty when the place has none of its own. */
  openingHours: string
  /** `origin` is set when the hours were taken over from the details lookup rather than typed. */
  onChange: (field: 'phone' | 'email' | 'opening_hours', value: string, origin?: PlaceClientOrigin) => void
  /**
   * The hours the place details column looked up, as a week. A place without
   * hours of its own takes them over on its own; one that has some gets a
   * button to take them over instead.
   */
  suggestedHours?: PlaceOpeningHours | null
}

/**
 * Phone, e-mail and opening hours, by hand (#2472). The search fills phone and
 * website when it knows them; everything it does not know, or a place nobody
 * has listed at all, the traveller can add here. The hours stay folded away
 * behind one row until somebody wants them, so a place without any does not
 * carry a seven-row grid.
 */
export function PlaceContactFields({ id: anchorId, phone, email, openingHours, onChange, suggestedHours }: Props) {
  const { t, locale } = useTranslation()
  const id = useId()
  const hours = usePlaceHours({ openingHours, suggestedHours, onChange: (value, origin) => onChange('opening_hours', value, origin) })
  const { week, editing } = hours
  const names = weekdayNames(locale, 'short')
  const longNames = weekdayNames(locale, 'long')

  return (
    <div id={anchorId} className="flex flex-col gap-4">
      <div className={GRID_2}>
        <EditorField label={t('places.formPhone')} htmlFor={`${id}-phone`}>
          <div className="relative">
            <Phone size={13} strokeWidth={2} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-content-faint" />
            <input id={`${id}-phone`} type="tel" value={phone} onChange={e => onChange('phone', e.target.value)}
              maxLength={50} placeholder="+49 …" className={`${INPUT} ps-8`} {...NO_AUTOFILL} />
          </div>
        </EditorField>
        <EditorField label={t('places.formEmail')} htmlFor={`${id}-email`}>
          <div className="relative">
            <Mail size={13} strokeWidth={2} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-content-faint" />
            <input id={`${id}-email`} type="email" value={email} onChange={e => onChange('email', e.target.value)}
              maxLength={254} placeholder="info@…" className={`${INPUT} ps-8`} {...NO_AUTOFILL} />
          </div>
        </EditorField>
      </div>

      <DialogSection
        label={t('inspector.openingHours')}
        action={editing ? (
          <div className="flex items-center gap-1">
            {hours.canTakeOver && (
              <Tooltip label={t('places.hoursFromDetails')}>
                <button type="button" onClick={hours.takeOver} aria-label={t('places.hoursFromDetails')}
                  className="grid h-7 w-7 place-items-center rounded-full text-content-faint hover:bg-surface-hover hover:text-content">
                  <RotateCcw size={13} strokeWidth={2} />
                </button>
              </Tooltip>
            )}
            <Tooltip label={t('places.hoursCopyFirst', { day: longNames[0] })}>
              <button type="button" onClick={hours.copyFirstToAll} aria-label={t('places.hoursCopyFirst', { day: longNames[0] })}
                className="grid h-7 w-7 place-items-center rounded-full text-content-faint hover:bg-surface-hover hover:text-content">
                <Copy size={13} strokeWidth={2} />
              </button>
            </Tooltip>
            <Tooltip label={t('places.hoursRemove')}>
              <button type="button" onClick={hours.clearHours} aria-label={t('places.hoursRemove')}
                className="grid h-7 w-7 place-items-center rounded-full text-content-faint hover:bg-surface-hover hover:text-danger">
                <X size={14} strokeWidth={2.2} />
              </button>
            </Tooltip>
          </div>
        ) : undefined}
      >
        {editing ? (
          <div className="flex flex-col divide-y divide-edge-faint overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card">
            {week.map((day, i) => (
              <div key={i} className="grid min-h-[46px] grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-1.5">
                <span className="font-semibold text-content-secondary" style={fs(12.5, 'body')} title={longNames[i]}>{names[i]}</span>
                {day.closed || isAllDay(day) ? (
                  <span className={DAY_STATE} style={fs(12.5, 'body')}>
                    {day.closed ? t('places.hoursClosed') : t('places.hoursAllDay')}
                  </span>
                ) : (
                  <div className='flex min-w-0 items-center gap-1.5'>
                    <div className='min-w-0 flex-1'>
                      <CustomTimePicker value={day.open ?? ''} onChange={v => hours.setDay(i, { open: v || undefined })}
                        aria-label={`${longNames[i]} ${t('places.hoursOpens')}`} />
                    </div>
                    <span className='flex-none text-content-faint'>–</span>
                    <div className='min-w-0 flex-1'>
                      <CustomTimePicker value={day.close ?? ''} onChange={v => hours.setDay(i, { close: v || undefined })}
                        aria-label={`${longNames[i]} ${t('places.hoursCloses')}`} />
                    </div>
                  </div>
                )}
                <div className='flex items-center gap-1.5'>
                  <Tooltip label={t('places.hoursAllDay')}>
                    <button type='button' role='switch' aria-checked={isAllDay(day)} aria-label={`${longNames[i]}: ${t('places.hoursAllDay')}`}
                      onClick={() => hours.toggleAllDay(i)}
                      className={`${DAY_BUTTON} ${isAllDay(day) ? DAY_BUTTON_ON : DAY_BUTTON_OFF}`}
                      style={fs(11.5, 'body')}>
                      24h
                    </button>
                  </Tooltip>
                  <Tooltip label={t('places.hoursClosed')}>
                    <button type='button' role='switch' aria-checked={day.closed} aria-label={`${longNames[i]}: ${t('places.hoursClosed')}`}
                      onClick={() => hours.toggleClosed(i)}
                      className={`${DAY_BUTTON} ${day.closed ? DAY_BUTTON_ON : DAY_BUTTON_OFF}`}>
                      <DoorClosed size={15} strokeWidth={2} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AddRowButton raised onClick={() => hours.setEditing(true)}>{t('places.hoursAdd')}</AddRowButton>
        )}
      </DialogSection>
    </div>
  )
}
