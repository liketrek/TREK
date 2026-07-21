/**
 * Booking (non-transport reservation) accents — hotel / restaurant / event /
 * tour / other, from the desktop ReservationsPanel TYPE_OPTIONS. Grouping,
 * metadata parsing and endpoint ordering are shared with the transports tab
 * (see transportsModel: groupTransports splits off `transit`, which never
 * matches a booking type, so its `confirmed` / `pending` split fits bookings).
 */
export const BOOKING_TYPE_COLOR: Record<string, string> = {
  hotel: '#8b5cf6',
  restaurant: '#ef4444',
  event: '#f59e0b',
  tour: '#10b981',
  parking: '#2563eb',
  other: '#6b7280',
}
