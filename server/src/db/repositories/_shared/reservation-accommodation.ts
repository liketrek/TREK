import { castIntegerKysely } from '../../dialect/kysely-functions';
import type { Platform } from '@mikro-orm/core';

import type { ExpressionBuilder, ExpressionWrapper, SqlBool, StringReference } from 'kysely';

/**
 * The join condition between a reservation and the stay it is booked against.
 *
 * `reservations.accommodation_id` is TEXT with no foreign key, while
 * `day_accommodations.id` is INTEGER, so the comparison is written as
 * `CAST(<reservation ref> AS INTEGER) = <stay ref>`. SQLite coerces a bare
 * text-to-integer comparison and Postgres refuses it (42883), so the cast is
 * needed on both engines. A stored `'14.0'` casts to 14 on both.
 */
export function accommodationIdMatches<DB, TB extends keyof DB>(
  platform: Platform,
  eb: ExpressionBuilder<DB, TB>,
  reservationAccommodationId: StringReference<DB, TB>,
  stayId: StringReference<DB, TB>,
): ExpressionWrapper<DB, TB, SqlBool> {
  return eb(castIntegerKysely(platform, eb, reservationAccommodationId), '=', eb.ref(stayId).$castTo<number>());
}
