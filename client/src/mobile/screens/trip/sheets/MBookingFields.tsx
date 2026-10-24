import { Check, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { SPLIT_COLORS } from '../../../../components/Budget/BudgetPanel.constants';
import { BookingCodeInput } from '../../../../components/shared/BookingCode';
import CustomSelect from '../../../../components/shared/CustomSelect';
import CustomTimePicker from '../../../../components/shared/CustomTimePicker';
import GuestBadge from '../../../../components/shared/GuestBadge';
import type { TripMember } from '../../../../types';
import { Eyebrow, FIELD_AREA_CLS, FIELD_CLS } from './PlSheetChrome';

/**
 * The fields the booking and transport sheets share: booking code with the
 * status toggle, notes, the traveler picker and the card of one stop on a
 * multi-leg route.
 */

// Traveler picker row: same surface as the cost-split rows (bg on --m-ic).
const TRAVELER_ROW_CLS =
  'flex w-full items-center gap-[9px] rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[9px] text-start';

type BookingStatus = 'pending' | 'confirmed';

/** The sheet's own translate function, so these fields read the same strings as the rest of it. */
type Translate = (key: string, params?: Record<string, string | number>) => string;

interface MBookingCodeStatusProps {
  t: Translate;
  code: string;
  onCodeChange: (code: string) => void;
  status: string;
  onStatusChange: (status: BookingStatus) => void;
}

/** Booking code and the pending / confirmed toggle, side by side. */
export function MBookingCodeStatus({ t, code, onCodeChange, status, onStatusChange }: MBookingCodeStatusProps) {
  return (
    <div className="mt-3 flex gap-2">
      <div className="min-w-0 flex-1">
        <Eyebrow className="mb-[5px] uppercase">{t('reservations.confirmationCode')}</Eyebrow>
        <BookingCodeInput
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder={t('reservations.confirmationPlaceholder')}
          className={FIELD_CLS}
        />
      </div>
      <div className="min-w-0 flex-1">
        <Eyebrow className="mb-[5px] uppercase">{t('reservations.status')}</Eyebrow>
        <div className="flex rounded-full bg-[color:var(--m-ic)] p-[3px]">
          {(['pending', 'confirmed'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onStatusChange(s)}
              className={`flex-1 rounded-full py-[7px] text-[0.71875rem] font-semibold ${
                status === s ? 'bg-m-act text-m-actfg' : 'text-m-muted'
              }`}
            >
              {t(`reservations.${s}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The notes label and its two-row textarea. */
export function MBookingNotes({
  t,
  value,
  onChange,
}: {
  t: Translate;
  value: string;
  onChange: (notes: string) => void;
}) {
  return (
    <>
      <Eyebrow className="mb-[5px] mt-3 uppercase">{t('reservations.notes')}</Eyebrow>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={t('reservations.notesPlaceholder')}
        className={FIELD_AREA_CLS}
      />
    </>
  );
}

function TravelerAvatar({ m, idx, dim }: { m: TripMember; idx: number; dim: boolean }) {
  return m.avatar_url ? (
    <img
      src={m.avatar_url}
      alt=""
      style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, opacity: dim ? 0.45 : 1 }}
    />
  ) : (
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: SPLIT_COLORS[idx % SPLIT_COLORS.length].gradient,
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        fontSize: 8.8,
        fontWeight: 700,
        flexShrink: 0,
        opacity: dim ? 0.45 : 1,
      }}
    >
      {(m.username || '?').charAt(0).toUpperCase()}
    </span>
  );
}

interface MBookingTravelersProps {
  t: Translate;
  tripMembers: TripMember[];
  selectedIds: Set<number>;
  onToggle: (memberId: number) => void;
}

/** The trip members and guests on this booking, one toggle row each. */
export function MBookingTravelers({ t, tripMembers, selectedIds, onToggle }: MBookingTravelersProps) {
  return (
    <>
      <Eyebrow className="mb-[6px] mt-3 uppercase">{t('reservations.travelers.label')}</Eyebrow>
      {tripMembers.length === 0 ? (
        <div className="text-[0.71875rem] text-m-faint">{t('reservations.travelers.none')}</div>
      ) : (
        <div className="flex flex-col gap-[6px]">
          {tripMembers.map((m, idx) => {
            const on = selectedIds.has(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onToggle(m.id)}
                className={`${TRAVELER_ROW_CLS} ${on ? '' : 'opacity-60'}`}
              >
                <TravelerAvatar m={m} idx={idx} dim={!on} />
                <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-m-ink">{m.username}</span>
                {m.is_guest && <GuestBadge size="xs" />}
                {on && <Check size={15} strokeWidth={2.4} className="flex-none text-m-act" />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

interface RouteStopTimes {
  arrDayId: string | number;
  arrTime: string;
  depDayId: string | number;
  depTime: string;
}

interface MRouteStopCardProps {
  t: Translate;
  roleLabel: string;
  /** The airport or station picker beside the role label. */
  picker: ReactNode;
  isFirst: boolean;
  isLast: boolean;
  /** Drops this stop; offered on the stops between origin and destination. */
  onRemove: () => void;
  times: RouteStopTimes;
  onTimesChange: (patch: Partial<RouteStopTimes>) => void;
  dayOptions: { value: string | number; label: string; badge?: string }[];
  /** Fields of the leg that leaves this stop, under its departure row. */
  children?: ReactNode;
}

/**
 * One stop on a multi-leg route: its role and picker, the arrival day and
 * time unless it is the origin, and the departure day and time with the
 * leg's own fields unless it is the destination.
 */
export function MRouteStopCard({
  t,
  roleLabel,
  picker,
  isFirst,
  isLast,
  onRemove,
  times,
  onTimesChange,
  dayOptions,
  children,
}: MRouteStopCardProps) {
  return (
    <div className="rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[11px]">
      <div className="mb-[8px] flex items-center gap-2">
        <span className="flex-none font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">
          {roleLabel}
        </span>
        <div className="min-w-0 flex-1">{picker}</div>
        {!isFirst && !isLast && (
          <button type="button" onClick={onRemove} aria-label={t('common.delete')} className="flex-none text-m-faint">
            <Trash2 size={14} strokeWidth={2} />
          </button>
        )}
      </div>
      {!isFirst && (
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <Eyebrow className="mb-[5px] uppercase">{t('reservations.arrivalDate')}</Eyebrow>
            <CustomSelect
              value={times.arrDayId}
              onChange={(v) => onTimesChange({ arrDayId: v })}
              placeholder={t('dayplan.dayN', { n: '?' })}
              options={dayOptions}
              size="sm"
            />
          </div>
          <div className="min-w-0 flex-1">
            <Eyebrow className="mb-[5px] uppercase">{t('reservations.arrivalTime')}</Eyebrow>
            <CustomTimePicker value={times.arrTime} onChange={(v) => onTimesChange({ arrTime: v })} />
          </div>
        </div>
      )}
      {!isLast && (
        <>
          <div className={`flex gap-2 ${!isFirst ? 'mt-2' : ''}`}>
            <div className="min-w-0 flex-1">
              <Eyebrow className="mb-[5px] uppercase">{t('reservations.departureDate')}</Eyebrow>
              <CustomSelect
                value={times.depDayId}
                onChange={(v) => onTimesChange({ depDayId: v })}
                placeholder={t('dayplan.dayN', { n: '?' })}
                options={dayOptions}
                size="sm"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Eyebrow className="mb-[5px] uppercase">{t('reservations.departureTime')}</Eyebrow>
              <CustomTimePicker value={times.depTime} onChange={(v) => onTimesChange({ depTime: v })} />
            </div>
          </div>
          {children}
        </>
      )}
    </div>
  );
}
