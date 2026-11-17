import type { PlaceClientOrigin, PlaceOpeningHours } from '@trek/shared';
import { Clock, Copy, DoorClosed, Mail, Phone, RotateCcw, X } from 'lucide-react';

import { isAllDay, weekdayNames } from '../../../../components/Planner/placeHours';
import { usePlaceHours } from '../../../../components/Planner/usePlaceHours';
import CustomTimePicker from '../../../../components/shared/CustomTimePicker';
import { NO_AUTOFILL } from '../../../../utils/noAutofill';
import { AddFieldButton, AMOUNT_FIELD_CLS, Eyebrow, FORM_PAIR_CLS } from './PlSheetChrome';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const LABEL = 'mb-[5px] mt-3 uppercase';
const BARE_INPUT =
  'min-w-0 flex-1 bg-transparent font-[inherit] text-[0.84375rem] font-medium text-m-ink outline-none placeholder:text-m-faint';
const HEAD_BUTTON = 'grid h-[28px] w-[28px] place-items-center rounded-full text-m-muted active:bg-[color:var(--m-ic)]';
const WEEK = 'overflow-hidden rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]';
const DAY_ROW =
  'grid grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-[6px] border-b border-[color:var(--m-rowbr)] px-[8px] py-[6px] last:border-b-0';
/** A closed or all-day day says so where its two times would be. */
const DAY_STATE = 'flex h-[38px] items-center px-[4px] text-[0.78125rem] font-medium text-m-muted';
/** The two switches after the times: round, as tall as a time field. */
const DAY_BUTTON = 'grid h-[30px] w-[30px] flex-none place-items-center rounded-full text-[0.6875rem] font-bold';
const DAY_BUTTON_OFF = 'bg-[color:var(--m-card)] text-m-muted';
const DAY_BUTTON_ON = 'bg-m-act text-m-actfg';

/**
 * Phone, e-mail and opening hours on the phone (#2472), as on the desktop. The
 * week stays folded behind one row until someone wants it; each day then has
 * its two times, a switch for open around the clock and one for closed. The
 * hours are usePlaceHours', shared with the desktop dialog.
 */
export function PlContactFields({
  phone,
  email,
  openingHours,
  suggestedHours,
  onChange,
  locale,
  t,
}: {
  phone: string;
  email: string;
  openingHours: string;
  suggestedHours?: PlaceOpeningHours | null;
  onChange: (field: 'phone' | 'email' | 'opening_hours', value: string, origin?: PlaceClientOrigin) => void;
  locale: string | undefined;
  t: Translate;
}) {
  const hours = usePlaceHours({
    openingHours,
    suggestedHours,
    onChange: (value, origin) => onChange('opening_hours', value, origin),
  });
  const names = weekdayNames(locale, 'short');
  const longNames = weekdayNames(locale, 'long');

  return (
    <>
      <div className={`${FORM_PAIR_CLS} mt-3`}>
        <div>
          <Eyebrow className="mb-[5px] uppercase">{t('places.formPhone')}</Eyebrow>
          <label className={AMOUNT_FIELD_CLS}>
            <Phone size={14} strokeWidth={2} aria-hidden="true" className="flex-none text-m-faint" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => onChange('phone', e.target.value)}
              maxLength={50}
              placeholder="+49 …"
              aria-label={t('places.formPhone')}
              className={BARE_INPUT}
              {...NO_AUTOFILL}
            />
          </label>
        </div>
        <div>
          <Eyebrow className="mb-[5px] uppercase">{t('places.formEmail')}</Eyebrow>
          <label className={AMOUNT_FIELD_CLS}>
            <Mail size={14} strokeWidth={2} aria-hidden="true" className="flex-none text-m-faint" />
            <input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => onChange('email', e.target.value)}
              maxLength={254}
              placeholder="info@…"
              aria-label={t('places.formEmail')}
              className={BARE_INPUT}
              {...NO_AUTOFILL}
            />
          </label>
        </div>
      </div>

      <div className={`${LABEL} flex items-center`}>
        <Eyebrow className="uppercase">{t('inspector.openingHours')}</Eyebrow>
        {hours.editing && (
          <span className="-my-[6px] ms-auto flex items-center">
            {hours.canTakeOver && (
              <button
                type="button"
                onClick={hours.takeOver}
                aria-label={t('places.hoursFromDetails')}
                className={HEAD_BUTTON}
              >
                <RotateCcw size={13} strokeWidth={2} />
              </button>
            )}
            <button
              type="button"
              onClick={hours.copyFirstToAll}
              aria-label={t('places.hoursCopyFirst', { day: longNames[0] })}
              className={HEAD_BUTTON}
            >
              <Copy size={13} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={hours.clearHours}
              aria-label={t('places.hoursRemove')}
              className={HEAD_BUTTON}
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          </span>
        )}
      </div>
      {hours.editing ? (
        <div className={WEEK}>
          {hours.week.map((day, i) => {
            const allDay = isAllDay(day);
            return (
              <div key={i} className={DAY_ROW}>
                <span className="text-[0.71875rem] font-semibold text-m-ink">{names[i]}</span>
                {day.closed || allDay ? (
                  <span className={DAY_STATE}>{day.closed ? t('places.hoursClosed') : t('places.hoursAllDay')}</span>
                ) : (
                  <div className="flex min-w-0 items-center gap-[3px]">
                    <div className="min-w-0 flex-1">
                      <CustomTimePicker
                        value={day.open ?? ''}
                        onChange={(v) => hours.setDay(i, { open: v || undefined })}
                        aria-label={`${longNames[i]} ${t('places.hoursOpens')}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CustomTimePicker
                        value={day.close ?? ''}
                        onChange={(v) => hours.setDay(i, { close: v || undefined })}
                        aria-label={`${longNames[i]} ${t('places.hoursCloses')}`}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-[3px]">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allDay}
                    aria-label={`${longNames[i]}: ${t('places.hoursAllDay')}`}
                    onClick={() => hours.toggleAllDay(i)}
                    className={`${DAY_BUTTON} ${allDay ? DAY_BUTTON_ON : DAY_BUTTON_OFF}`}
                  >
                    24h
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={day.closed}
                    aria-label={`${longNames[i]}: ${t('places.hoursClosed')}`}
                    onClick={() => hours.toggleClosed(i)}
                    className={`${DAY_BUTTON} ${day.closed ? DAY_BUTTON_ON : DAY_BUTTON_OFF}`}
                  >
                    <DoorClosed size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <AddFieldButton icon={Clock} label={t('places.hoursAdd')} onClick={() => hours.setEditing(true)} />
      )}
    </>
  );
}
