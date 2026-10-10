import { hasPlaceHours, parsePlaceHours, placeEmailField, placeOpeningHoursField } from './place-hours';
import { placeCreateRequestSchema, placeUpdateRequestSchema } from './place.schema';

import { describe, expect, it } from 'vitest';

const WEEK =
  '[{"closed":false,"open":"09:00","close":"17:00"},{"closed":false},{"closed":false},{"closed":false},{"closed":false},{"closed":true},{"closed":true}]';

describe('place hours and e-mail (#2472)', () => {
  it('parses seven days and refuses anything else', () => {
    expect(parsePlaceHours(WEEK)).toHaveLength(7);
    expect(parsePlaceHours('[]')).toBeNull();
    expect(parsePlaceHours('{nope')).toBeNull();
    expect(parsePlaceHours('[{"closed":false,"open":"25:00"},{},{},{},{},{},{}]')).toBeNull();
    expect(parsePlaceHours('')).toBeNull();
    expect(parsePlaceHours(null)).toBeNull();
  });

  it('tells a week that says something from an empty one', () => {
    expect(hasPlaceHours(parsePlaceHours(WEEK))).toBe(true);
    expect(hasPlaceHours(Array.from({ length: 7 }, () => ({ closed: false })))).toBe(false);
    expect(hasPlaceHours(null)).toBe(false);
  });

  it('validates both fields on the request bodies, empty meaning clear', () => {
    expect(placeOpeningHoursField.safeParse(WEEK).success).toBe(true);
    expect(placeOpeningHoursField.safeParse('').success).toBe(true);
    expect(placeOpeningHoursField.safeParse('[1,2]').success).toBe(false);
    expect(placeEmailField.safeParse('a@b.co').success).toBe(true);
    expect(placeEmailField.safeParse('').success).toBe(true);
    expect(placeEmailField.safeParse('nope').success).toBe(false);
    for (const bad of ['@b.co', 'a@@b.co', 'a@b@c.co', 'a@bco', 'a@.co', 'a@b.', 'a b@c.co']) {
      expect(placeEmailField.safeParse(bad).success).toBe(false);
    }
    expect(placeEmailField.safeParse('  a.b@mail.example.org ').success).toBe(true);
    expect(placeCreateRequestSchema.safeParse({ name: 'X', email: 'nope' }).success).toBe(false);
    expect(placeUpdateRequestSchema.safeParse({ opening_hours: WEEK, email: null }).success).toBe(true);
  });
});
