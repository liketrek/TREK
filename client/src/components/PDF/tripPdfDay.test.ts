/**
 * FE-PDFDAY-001 to FE-PDFDAY-012: one day of the trip PDF, built piece by piece.
 * The whole export is covered by TripPDF.test.ts; these pin what each card prints
 * from the data it is given, the trip's full place included.
 */
import { describe, expect, it } from 'vitest';

import type { Accommodation, Assignment, Category, Day, DayNote, Place } from '../../types';
import { dayHeader, noteItem, photoStrip, placeItem, staysBlock, type PdfDayContext } from './tripPdfDay';

const day = { id: 10, day_number: 3, title: 'Kyoto', date: '2026-05-06' } as Day; // a Wednesday

const category = { id: 4, name: 'Temple', icon: 'landmark', color: '#c2410c' } as Category;

/** Monday first, like the stored week; Wednesday has hours, Thursday is closed. */
const week = JSON.stringify([
  { closed: false, open: '08:00', close: '18:00' },
  { closed: false, open: '08:00', close: '18:00' },
  { closed: false, open: '09:00', close: '17:30' },
  { closed: true },
  { closed: false, open: '08:00', close: '18:00' },
  { closed: false, open: '08:00', close: '18:00' },
  { closed: false, open: '08:00', close: '18:00' },
]);

const fullPlace = {
  id: 7,
  name: 'Kiyomizu-dera',
  category_id: 4,
  address: '1 Chome-294 Kiyomizu, Kyoto',
  lat: 34.994856,
  lng: 135.785046,
  rating_avg: 4.64,
  rating_count: 12,
  email: 'info@kiyomizudera.or.jp',
  phone: '+81 75-551-1234',
  website: 'https://www.kiyomizudera.or.jp/en/',
  opening_hours: week,
  reservation_notes: 'Tickets at the west gate',
  tags: [{ name: 'Must see', color: '#16a34a' }],
} as unknown as Place;

function context(over: Partial<PdfDayContext> = {}): PdfDayContext {
  return {
    tr: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key),
    fmtTime: (value) => value ?? '',
    locale: 'en-US',
    tripCurrency: 'JPY',
    categories: [category],
    placesById: new Map([[fullPlace.id, fullPlace]]),
    photoOf: () => null,
    markdown: (text) => `<p>${text}</p>`,
    markdownHtml: (text) => `<p>${text}</p>`,
    ...over,
  };
}

/** The assignment as the API hands it over: a projection of its place, without the rating, e-mail or hours. */
function assignment(over: Record<string, unknown> = {}): Assignment {
  return {
    id: 200,
    day_id: 10,
    order_index: 0,
    notes: 'Go early',
    participants: [
      { user_id: 1, username: 'mia' },
      { user_id: 2, username: 'leo' },
    ],
    place: {
      id: 7,
      name: 'Kiyomizu-dera',
      category_id: 4,
      address: '1 Chome-294 Kiyomizu, Kyoto',
      lat: 34.994856,
      lng: 135.785046,
      place_time: '09:30',
      end_time: '11:00',
      duration_minutes: 90,
      price: 500,
      currency: null,
      description: 'Wooden **stage** over the hill',
      notes: null,
      tags: [{ name: 'Must see', color: '#16a34a' }],
      ...over,
    },
  } as unknown as Assignment;
}

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');
const texts = (doc: Document, selector: string) =>
  [...doc.querySelectorAll(selector)].map((el) => el.textContent?.replace(/\s+/g, ' ').trim());

describe('placeItem', () => {
  it('FE-PDFDAY-001: prints the stop with its number, times, facts, address and coordinates', () => {
    const doc = parse(placeItem(assignment(), 2, day, context()));

    expect(texts(doc, '.tl-marker')).toEqual(['2']);
    expect(texts(doc, '.tl-start')).toEqual(['09:30']);
    expect(texts(doc, '.tl-end')).toEqual(['11:00']);
    expect(texts(doc, '.place-name')).toEqual(['Kiyomizu-dera']);
    expect(texts(doc, '.cat-badge')).toEqual(['Temple']);
    const facts = texts(doc, '.facts .chip');
    expect(facts[0]).toBe('1 h 30 min');
    expect(facts[1]).toMatch(/500/);
    expect(facts.slice(2)).toEqual(['4.6 (12)', 'Must see']);
    expect(texts(doc, '.info-row .info-text')).toEqual(['1 Chome-294 Kiyomizu, Kyoto', '34.99486, 135.78505']);
    expect(doc.querySelector('.coords')).not.toBeNull();
  });

  it('FE-PDFDAY-002: reads the rating, e-mail, hours and reservation note off the trip place', () => {
    const doc = parse(placeItem(assignment(), 1, day, context()));

    // The day is a Wednesday: its hours, not Monday's.
    expect(texts(doc, '.details .detail')).toEqual([
      'inspector.openingHours 09:00 – 17:30',
      '+81 75-551-1234',
      'kiyomizudera.or.jp',
      'info@kiyomizudera.or.jp',
      'inspector.participants: mia, leo',
    ]);
    expect(texts(doc, '.place-note')).toEqual(['Tickets at the west gate', 'Go early']);
    expect(doc.querySelector('.place-text')?.innerHTML).toBe('<p>Wooden **stage** over the hill</p>');
  });

  it('FE-PDFDAY-003: a day the place is closed says so', () => {
    const thursday = { ...day, date: '2026-05-07' } as Day;
    const doc = parse(placeItem(assignment(), 1, thursday, context()));

    expect(texts(doc, '.details .detail')[0]).toBe('inspector.openingHours inspector.closed');
  });

  it('FE-PDFDAY-004: a place with neither photo nor extras prints its category tile and nothing empty', () => {
    const bare = {
      id: 201,
      day_id: 10,
      order_index: 0,
      place: { id: 99, name: 'Corner shop', category_id: 4, lat: null, lng: null },
    } as unknown as Assignment;
    const doc = parse(placeItem(bare, 1, { ...day, date: null } as Day, context()));

    expect(doc.querySelector('.place-thumb-fallback')).not.toBeNull();
    expect(doc.querySelector('.place-card')?.getAttribute('style')).toBe('--cat:#c2410c');
    for (const empty of ['.facts', '.info-row', '.details', '.place-note', '.place-text', '.tl-start', '.tl-end']) {
      expect(doc.querySelector(empty)).toBeNull();
    }
  });

  it('FE-PDFDAY-005: the photo the export picked prints, and a hostile name and tag colour stay inert', () => {
    const hostile = assignment({
      name: '<img src=x onerror=alert(1)>',
      tags: [{ name: 'x', color: 'red;background:url(x)' }],
    });
    const html = placeItem(hostile, 1, day, context({ photoOf: () => 'data:image/jpeg;base64,AAA' }));
    const doc = parse(html);

    expect(doc.querySelector('img.place-thumb')?.getAttribute('src')).toBe('data:image/jpeg;base64,AAA');
    expect(doc.querySelectorAll('img')).toHaveLength(1);
    expect(texts(doc, '.place-name')).toEqual(['<img src=x onerror=alert(1)>']);
    expect(doc.querySelector('.chip-tag')?.getAttribute('style')).toBe('--tag:#6b6b75');
  });
});

describe('noteItem', () => {
  it('FE-PDFDAY-006: a coloured note carries its colour as the edge, an unknown colour none', () => {
    const note = {
      id: 1,
      day_id: 10,
      text: 'Buy <tickets>',
      time: '08:00',
      icon: 'Ticket',
      color: '#2563eb',
    } as DayNote;
    const tinted = parse(noteItem(note, context()));
    expect(tinted.querySelector('.note-card')?.className).toBe('note-card note-tinted');
    expect(tinted.querySelector('.note-card')?.getAttribute('style')).toBe('--note:#2563eb');
    expect(texts(tinted, '.note-text')).toEqual(['Buy <tickets>']);
    // The note's time field is its free second line, kept in the card, not a clock.
    expect(texts(tinted, '.note-time')).toEqual(['08:00']);
    expect(tinted.querySelector('.tl-start')).toBeNull();

    const plain = parse(noteItem({ ...note, color: 'not-a-colour', time: null } as DayNote, context()));
    expect(plain.querySelector('.note-card')?.className).toBe('note-card');
    expect(plain.querySelector('.note-time')).toBeNull();
  });
});

describe('staysBlock', () => {
  const stay = {
    id: 1,
    start_day_id: 10,
    end_day_id: 12,
    place_name: 'Hotel Gion',
    place_address: 'Gion 1',
    check_in: '15:00',
    check_out: '10:00',
    confirmation: 'HX-42',
    notes: 'Late arrival',
    place_image: null,
  } as unknown as Accommodation;

  it('FE-PDFDAY-007: the arrival day gets the full card with time, address, notes and code', () => {
    const doc = parse(staysBlock([stay], day, context()));

    expect(doc.querySelector('.day-accommodations')?.className).toBe('day-accommodations single');
    expect(texts(doc, '.stay-kicker')).toEqual(['reservations.meta.checkIn 15:00']);
    expect(texts(doc, '.stay-name')).toEqual(['Hotel Gion']);
    expect(texts(doc, '.stay-line')).toEqual(['Gion 1', 'Late arrival']);
    expect(texts(doc, '.code-chip')).toEqual(['HX-42']);
  });

  it('FE-PDFDAY-008: a night in between is one quiet line, the leaving day the check-out', () => {
    const middle = parse(staysBlock([stay], { ...day, id: 11 } as Day, context()));
    expect(middle.querySelector('.stay-quiet')).not.toBeNull();
    expect(texts(middle, '.stay-kicker')).toEqual(['reservations.meta.linkAccommodation']);
    expect(middle.querySelector('.stay-line')).toBeNull();

    const leaving = parse(staysBlock([stay], { ...day, id: 12 } as Day, context()));
    expect(texts(leaving, '.stay-kicker')).toEqual(['reservations.meta.checkOut 10:00']);
    expect(leaving.querySelector('.code-chip')).toBeNull();
  });

  it('FE-PDFDAY-009: no stay prints nothing, two drop the single-column class', () => {
    expect(staysBlock([], day, context())).toBe('');
    const doc = parse(staysBlock([stay, { ...stay, id: 2, place_name: 'Ryokan' } as Accommodation], day, context()));
    expect(doc.querySelector('.day-accommodations')?.className).toBe('day-accommodations');
  });
});

describe('dayHeader', () => {
  it('FE-PDFDAY-010: the number, date and title, with only the figures the day has', () => {
    const doc = parse(dayHeader(day, { stops: 4, distance: '12 km', cost: '¥3,000' }, context()));

    expect(texts(doc, '.day-tag-lbl')).toEqual(['pdf.day']);
    expect(texts(doc, '.day-tag-num')).toEqual(['3']);
    expect(texts(doc, '.day-date')[0]).toMatch(/May/);
    expect(texts(doc, '.day-title')).toEqual(['Kyoto']);
    expect(texts(doc, '.meta-pill, .day-cost')).toEqual(['4', '12 km', '¥3,000']);

    const untitled = parse(
      dayHeader({ ...day, title: null, date: null } as Day, { stops: 0, distance: null, cost: null }, context())
    );
    expect(texts(untitled, '.day-title')).toEqual(['dayplan.dayN:{"n":3}']);
    expect(untitled.querySelector('.day-date')).toBeNull();
    expect(untitled.querySelector('.day-meta')).toBeNull();
  });
});

describe('photoStrip', () => {
  it('FE-PDFDAY-011: up to three photos, each named on its label; none prints nothing', () => {
    expect(photoStrip([])).toBe('');
    const doc = parse(
      photoStrip([
        { url: 'https://a.example/1.jpg', caption: 'Gate <one>' },
        { url: 'https://a.example/2.jpg', caption: 'Stage' },
      ])
    );

    expect(doc.querySelector('.day-strip')?.className).toBe('day-strip day-strip-2');
    expect(texts(doc, '.glass-label')).toEqual(['Gate <one>', 'Stage']);
    expect([...doc.querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual([
      'https://a.example/1.jpg',
      'https://a.example/2.jpg',
    ]);
  });
});
