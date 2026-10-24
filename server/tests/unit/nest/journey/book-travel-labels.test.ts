/**
 * The words the book engine prints on travel elements (JBLBL-*): read from
 * the locale tables of TREK's languages, English for a language TREK has no
 * table for, with the locale dates and country names are written in.
 */
import { bookLanguage, loadBookWords } from '../../../../src/nest/journey/book-travel-labels';

import { describe, expect, it } from 'vitest';

describe('the book words', () => {
  it('JBLBL-001: a language TREK knows is kept; anything else is English', () => {
    expect(bookLanguage('fr')).toBe('fr');
    expect(bookLanguage('zh-TW')).toBe('zh-TW');
    expect(bookLanguage('xx')).toBe('en');
    expect(bookLanguage(7)).toBe('en');
    expect(bookLanguage(undefined)).toBe('en');
  });

  it('JBLBL-002: the words come from the locale table, in the locale the book formats in', async () => {
    const french = await loadBookWords('fr');
    expect(french.locale).toBe('fr-FR');
    expect(french.labels).toMatchObject({
      day: 'JOUR {day}',
      stations: 'Étapes',
      summary: 'Résumé',
      countries: 'Pays',
    });
    const english = await loadBookWords('xx');
    expect(english).toEqual({
      locale: 'en-US',
      labels: {
        day: 'DAY {day}',
        stations: 'Stations',
        summary: 'Summary',
        countries: 'Countries',
        distance: 'Distance',
        pros: 'Pros',
        cons: 'Cons',
      },
    });
  });
});
