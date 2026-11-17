import { castIntegerKysely, integerTextEqualsKysely } from '../../dialect/kysely-functions';
import type { Platform } from '@mikro-orm/core';

import type { ExpressionBuilder, ExpressionWrapper, SqlBool, StringReference } from 'kysely';

/**
 * The join condition between a reservation and the stay it is booked against.
 *
 * `reservations.accommodation_id` is TEXT with no foreign key, while
 * `day_accommodations.id` is INTEGER, and the services store the id as
 * `'14.0'` (`legacyBoundIntegerText`). The dialect helper
 * `integerTextEqualsKysely` compares the two so that `'14'`, `'14.0'` and 14
 * match the stay 14 on both engines. Every join and correlation on this pair
 * goes through here, so the comparison has one spelling.
 */
export function accommodationIdMatches<DB, TB extends keyof DB>(
  platform: Platform,
  eb: ExpressionBuilder<DB, TB>,
  reservationAccommodationId: StringReference<DB, TB>,
  stayId: StringReference<DB, TB>,
): ExpressionWrapper<DB, TB, SqlBool> {
  return integerTextEqualsKysely(platform, eb, reservationAccommodationId, stayId);
}

/**
 * A reservation booked against the stay `stayId`, the filter form of
 * {@link accommodationIdMatches}: the TEXT column read as an integer, so the
 * stored `'14.0'` matches 14 on Postgres too. Compared as written (`= 14`),
 * Postgres binds the number as the text `'14'` and finds no row at all, which
 * no error reports.
 */
export function reservationStayIs<DB, TB extends keyof DB>(
  platform: Platform,
  eb: ExpressionBuilder<DB, TB>,
  accommodationId: StringReference<DB, TB>,
  stayId: number,
): ExpressionWrapper<DB, TB, SqlBool> {
  return eb(castIntegerKysely(platform, eb, accommodationId), '=', stayId);
}
