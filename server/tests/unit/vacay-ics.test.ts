import { fetchIcs, parseIcs } from '../../src/nest/vacay/vacay-ics';

import { describe, expect, it } from 'vitest';

describe('Vacay ICS import subset', () => {
  it('imports explicit all-day events and treats DTEND as exclusive', () => {
    expect(
      parseIcs(
        [
          'BEGIN:VCALENDAR',
          'BEGIN:VEVENT',
          'DTSTART;VALUE=DATE:20261224',
          'DTEND;VALUE=DATE:20261226',
          'SUMMARY:Winter\\, holiday',
          'END:VEVENT',
          'END:VCALENDAR',
        ].join('\r\n'),
      ),
    ).toEqual([{ start: '2026-12-24', end: '2026-12-26', title: 'Winter, holiday' }]);
  });

  it('skips timed and recurring events while keeping supported events', () => {
    const parsed = parseIcs(
      [
        'BEGIN:VCALENDAR',
        'BEGIN:VEVENT',
        'DTSTART:20261224T090000Z',
        'DTEND:20261224T100000Z',
        'SUMMARY:Timed',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'DTSTART;VALUE=DATE:20261225',
        'DTEND;VALUE=DATE:20261226',
        'RRULE:FREQ=YEARLY',
        'SUMMARY:Repeat',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'DTSTART;VALUE=DATE:20261231',
        'DTEND;VALUE=DATE:20270101',
        'SUMMARY:Supported',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\n'),
    );
    expect(parsed).toEqual([{ start: '2026-12-31', end: '2027-01-01', title: 'Supported' }]);
  });

  it('unfolds continuation lines and decodes ICS escaped newlines', () => {
    expect(
      parseIcs(
        [
          'BEGIN:VCALENDAR',
          'BEGIN:VEVENT',
          'DTSTART;VALUE=DATE:20260101',
          'DTEND;VALUE=DATE:20260102',
          'SUMMARY:New Year\\ncelebra',
          ' tion',
          'END:VEVENT',
          'END:VCALENDAR',
        ].join('\r\n'),
      )[0].title,
    ).toBe('New Year\ncelebration');
  });

  it('blocks loopback and credential-bearing URLs before fetching', async () => {
    await expect(fetchIcs('http://127.0.0.1/calendar.ics')).rejects.toThrow();
    await expect(fetchIcs('https://user:secret@example.com/calendar.ics')).rejects.toThrow(
      'Enter a public HTTP or HTTPS calendar URL',
    );
  });
});
