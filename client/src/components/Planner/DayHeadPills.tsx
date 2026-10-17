import { Car, Hotel, Ticket } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../i18n';
import type { Accommodation, Reservation } from '../../types';
import { fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';
import { SoftPill } from './planParts';

/** The second line of a day head: its stays, its hire cars and a plugin's name for the day. */
export function DayHeadPills({
  dayId,
  stays,
  rentals,
  pendingStays,
  reservations,
  label,
  onPlaceClick,
  onOpenBooking,
  onOpenRental,
}: {
  dayId: number;
  stays: Accommodation[];
  rentals: Reservation[];
  pendingStays: Set<number>;
  reservations: Reservation[];
  label?: string | null;
  onPlaceClick: (placeId: number) => void;
  onOpenBooking?: (reservation: Reservation) => void;
  onOpenRental: (reservation: Reservation) => void;
}): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div className="flex min-w-0 flex-nowrap items-center gap-1" style={{ gridColumn: '2 / 4' }}>
      {stays.map((acc) => {
        const isCheckIn = acc.start_day_id === dayId;
        const isCheckOut = acc.end_day_id === dayId;
        const accName = acc.place_name || acc.reservation_title || '';
        // The state is said in words as well as colour: check-in green,
        // check-out red, a stay in between quiet.
        const state = isCheckOut && !isCheckIn ? t('day.checkOut') : isCheckIn ? t('day.checkIn') : null;
        const iconTone = isCheckOut && !isCheckIn ? 'text-danger' : isCheckIn ? 'text-success' : 'text-content-faint';
        // Not confirmed yet: a dashed ring says so at a glance, the tooltip in words (#2281).
        const pending = pendingStays.has(acc.id);
        const named = state ? `${state}: ${accName}` : accName;
        const tip = pending ? `${named} (${t('reservations.pending')})` : named;
        // The name opens the place, as before; a stay with a booking gets a
        // second target in the same pill that opens the booking (#2363).
        const stayBooking = onOpenBooking
          ? reservations.find((r) => r.accommodation_id != null && Number(r.accommodation_id) === acc.id)
          : undefined;
        return (
          <span
            key={acc.id}
            className={`inline-flex min-w-0 max-w-max flex-[1_1_0%] items-stretch overflow-hidden rounded-full ${pending ? 'border border-dashed border-warning bg-warning-soft' : 'bg-surface-card shadow-sm'}`}
          >
            <Tooltip label={tip}>
              <button
                type="button"
                data-dp="day-pill"
                data-pending={pending || undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  if (acc.place_id) onPlaceClick(acc.place_id);
                }}
                className={`inline-flex min-w-0 items-center gap-1 py-[2px] font-geist font-normal text-content-secondary hover:text-content ${stayBooking ? 'pe-1.5 ps-2' : 'px-2'}`}
                style={{ ...fs(10.5), cursor: acc.place_id ? 'pointer' : 'default' }}
              >
                <Hotel size={11} strokeWidth={2} className={`flex-none ${iconTone}`} />
                <span className="truncate">{accName}</span>
              </button>
            </Tooltip>
            {stayBooking && onOpenBooking && (
              <Tooltip label={t('day.openStayBooking')}>
                <button
                  type="button"
                  data-dp="day-pill-booking"
                  aria-label={t('day.openStayBooking')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBooking(stayBooking);
                  }}
                  className="flex flex-none items-center border-s border-edge-faint pe-2 ps-1.5 text-content-faint hover:text-content"
                >
                  <Ticket size={11} strokeWidth={2} />
                </button>
              </Tooltip>
            )}
          </span>
        );
      })}
      {/* Active rental car badges */}
      {rentals.map((r) => (
        <button
          type="button"
          data-dp="day-pill"
          key={`rental-${r.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenRental(r);
          }}
          className="inline-flex min-w-0 max-w-max flex-[1_1_0%] items-center gap-1 rounded-full bg-surface-card px-2 py-[2px] font-geist font-normal text-content-secondary shadow-sm hover:text-content"
          style={fs(10.5)}
        >
          <Car size={11} strokeWidth={2} className="flex-none text-content-faint" />
          <span className="truncate">{r.title}</span>
        </button>
      ))}
      {/* A plugin's name for this day (which leg of the trip it belongs to). */}
      {label && <SoftPill>{label}</SoftPill>}
    </div>
  );
}
