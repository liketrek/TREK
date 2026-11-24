import { parsePlaceHours, visitTimes } from '@trek/shared';

import type { Accommodation, Assignment, Category, Day, DayNote, Place, Reservation } from '../../types';
import { getDisplayTimeForDay, getSpanPhase } from '../../utils/dayMerge';
import { getFlightLegs, getTrainLegs, usesStationRoute } from '../../utils/flightLegs';
import { formatMoney, splitReservationDateTime } from '../../utils/formatters';
import type { TimingPlan } from '../Planner/timing/ItineraryTiming';
import { pdfTimingChip } from './pdfTiming';
import type { TransportLegDetail } from '../Planner/transportDetailModel';
import { escHtml, hexColour, safeImg, shortDate, websiteHost } from './tripPdfHtml';
import { bookingIcon, bookingTint, categoryIcon, glyph, noteIcon } from './tripPdfIcons';

/*
 * One day of the trip PDF: its header, where the night is spent, and the day's plan
 * as a timeline, times on the left, a rail in the day's colour, and a card for every
 * stop, booking and note.
 */

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** A booking as the day merge hands it over, a leg of a multi-leg booking included. */
export type PdfBooking = Reservation & { __leg?: TransportLegDetail & { total?: number } };

/** What the day's markup needs from the export around it. */
export interface PdfDayContext {
  tr: Translate;
  fmtTime: (value?: string | null) => string;
  locale: string | undefined;
  tripCurrency: string;
  categories: readonly Category[];
  /** The trip's full places by id: an assignment carries only a projection of its place. */
  placesById: ReadonlyMap<number, Place>;
  /** The picture to print for a place, already shrunk where it could be; null for none. */
  photoOf: (place: Assignment['place']) => string | null;
  /** A place's description or notes as sanitized markdown. */
  markdown: (text: string) => string;
}

const NEUTRAL = '#6b6b75';

function metadataOf(r: PdfBooking): Record<string, unknown> {
  if (!r.metadata) return {};
  try {
    const parsed: unknown = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const text = (value: unknown): string => (typeof value === 'string' || typeof value === 'number' ? String(value) : '');

/** "1 h 30 min", or null for no duration at all. */
function durationLabel(minutes: number | null | undefined): string | null {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) return null;
  const whole = Math.round(minutes);
  const h = Math.floor(whole / 60);
  const m = whole % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function timeColumn(start: string, end: string): string {
  return `<div class="tl-time">${start ? `<span class="tl-start">${escHtml(start)}</span>` : ''}${
    end ? `<span class="tl-end">${escHtml(end)}</span>` : ''
  }</div>`;
}

function item(kind: string, time: string, marker: string, body: string, style = ''): string {
  return `<li class="tl-item tl-${kind}"${style ? ` style="${style}"` : ''}>${time}<div class="tl-rail"><span class="tl-marker">${marker}</span></div><div class="tl-body">${body}</div></li>`;
}

// ── Bookings ──────────────────────────────────────────────────────────────

/** "Departure", "Pick-up" and the like, for a booking that spans days; null on its single day. */
function spanLabel(r: PdfBooking, phase: string, tr: Translate): string | null {
  if (phase === 'single') return null;
  // Each key spelled out, so the key check can follow every branch to its string.
  const start = phase === 'start';
  const end = phase === 'end';
  if (r.type === 'flight') return tr(`reservations.span.${start ? 'departure' : end ? 'arrival' : 'inTransit'}`);
  if (r.type === 'car') return tr(`reservations.span.${start ? 'pickup' : end ? 'return' : 'active'}`);
  // Parking reuses span.pickup for its end day: you drop the car off and collect it
  // again later, so the rental car's wording carries over without a second key.
  if (r.type === 'parking') return tr(`reservations.span.${start ? 'dropOff' : end ? 'pickup' : 'ongoing'}`);
  return tr(`reservations.span.${start ? 'start' : end ? 'end' : 'ongoing'}`);
}

function stopsOf(r: PdfBooking, label: 'code' | 'name'): string[] {
  return (r.endpoints || [])
    .slice()
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
    .map((e) => (label === 'code' ? e.code || e.name : e.name) || '')
    .filter(Boolean);
}

/** One line under a booking's title: the way it goes, its facts as badges and its own booking code. */
interface BookingLine {
  route: string;
  facts: string[];
  code: string;
  /** A table's party size, printed with the people icon so it needs no word. */
  people?: string;
}

/**
 * The lines under a booking's title. A multi-leg flight or train gets one per leg, each
 * with its own number and booking code, since that is the code the gate asks for
 * (#1943); a leg row prints its own leg; everything else gets one line or none.
 */
function bookingLines(r: PdfBooking, tr: Translate): BookingLine[] {
  const meta = metadataOf(r);
  const route = (from?: string | null, to?: string | null) =>
    from || to ? [from, to].filter(Boolean).join(' → ') : '';
  const seat = (value: unknown) => (text(value) ? `${tr('reservations.meta.seat')} ${text(value)}` : '');
  const platform = (value: unknown) => (text(value) ? `${tr('reservations.meta.platform')} ${text(value)}` : '');
  const line = (way: string, facts: unknown[], code: unknown = ''): BookingLine => ({
    route: way,
    facts: facts.map(text).filter(Boolean),
    code: text(code),
  });
  const filled = (lines: BookingLine[]) => lines.filter((l) => l.route || l.facts.length || l.code);

  if (r.__leg) {
    const l = r.__leg;
    const source = (usesStationRoute(r.type) ? getTrainLegs(r) : getFlightLegs(r))[l.index];
    return filled([
      line(
        route(l.from, l.to),
        [l.airline, l.flight_number, l.train_number, platform(l.platform), seat(l.seat)],
        source?.confirmation_number
      ),
    ]);
  }
  if (r.type === 'flight') {
    const legs = getFlightLegs(r);
    if (legs.length > 1) {
      return filled(
        legs.map((l) => line(route(l.from, l.to), [l.airline, l.flight_number, seat(l.seat)], l.confirmation_number))
      );
    }
    const stops = stopsOf(r, 'code');
    const way = stops.length >= 2 ? stops.join(' → ') : route(text(meta.departure_airport), text(meta.arrival_airport));
    return filled([line(way, [meta.airline, meta.flight_number, seat(meta.seat)])]);
  }
  if (r.type === 'train') {
    const legs = getTrainLegs(r);
    if (legs.length > 1) {
      return filled(
        legs.map((l) =>
          line(route(l.from, l.to), [l.train_number, platform(l.platform), seat(l.seat)], l.confirmation_number)
        )
      );
    }
    const stops = stopsOf(r, 'code');
    return filled([
      line(stops.length >= 2 ? stops.join(' → ') : '', [meta.train_number, platform(meta.platform), seat(meta.seat)]),
    ]);
  }
  if (r.type === 'car') {
    // A rental with stops is a drive, and the printout is what people take into the car
    // (#1797). Consecutive repeats collapse, and a chain of one place is no route: the
    // ordinary rental is picked up and returned at the same desk.
    const stops = stopsOf(r, 'name').filter((name, i, all) => name !== all[i - 1]);
    return new Set(stops).size >= 2 ? [line(stops.join(' → '), [])] : [];
  }
  if (r.type === 'restaurant') return text(meta.party_size) ? [{ ...line('', []), people: text(meta.party_size) }] : [];
  if (r.type === 'event') return filled([line('', [meta.venue])]);
  if (r.type === 'tour') return filled([line('', [meta.operator])]);
  return [];
}

function bookingLineHtml(l: BookingLine): string {
  return `<div class="note-line">${l.route ? `<span class="route">${escHtml(l.route)}</span>` : ''}${
    l.people ? `<span class="chip">${glyph('people', 9)}${escHtml(l.people)}</span>` : ''
  }${l.facts
    .map((fact) => `<span class="chip">${escHtml(fact)}</span>`)
    .join('')}${l.code ? `<span class="code-chip">${glyph('key', 9)}${escHtml(l.code)}</span>` : ''}</div>`;
}

/** A booking's lines on their own, for the booking list of the overview. */
export function bookingLinesHtml(r: PdfBooking, tr: Translate): string {
  return bookingLines(r, tr).map(bookingLineHtml).join('');
}

/** A booking on the day's timeline. Sets `flags.transportNote` when it prints a note. */
export function bookingItem(r: PdfBooking, day: Day, ctx: PdfDayContext, flags: { transportNote: boolean }): string {
  const { tr, fmtTime } = ctx;
  const phase = getSpanPhase(r, day.id);
  const span = spanLabel(r, phase, tr);
  // Start and end the way the day plan draws them (#1310). The landing time only on a
  // booking that begins and ends this day: across a span the arrival belongs to the
  // arrival day, which shows it as its own time.
  const start = fmtTime(splitReservationDateTime(getDisplayTimeForDay(r, day.id)).time);
  const end = phase === 'single' ? fmtTime(splitReservationDateTime(r.reservation_end_time).time) : '';
  const note = typeof r.notes === 'string' ? r.notes.trim() : '';
  if (note) flags.transportNote = true;
  const meta = metadataOf(r);
  const location = r.location || text(meta.location);
  const status =
    r.status === 'confirmed' ? tr('reservations.confirmed') : r.status === 'pending' ? tr('reservations.pending') : '';
  const tint = hexColour(bookingTint(r.type), NEUTRAL);

  const extras = [
    r.confirmation_number
      ? `<span class="code-chip note-code">${glyph('key', 9)}${escHtml(r.confirmation_number)}</span>`
      : '',
    status ? `<span class="chip">${escHtml(status)}</span>` : '',
  ].filter(Boolean);

  const card = `<div class="note-card booking-card">
    <span class="note-icon">${bookingIcon(r.type)}</span>
    <div class="note-body">
      ${span ? `<div class="note-kicker">${escHtml(span)}</div>` : ''}
      <div class="note-text">${escHtml(r.title)}</div>
      ${bookingLines(r, tr).map(bookingLineHtml).join('')}
      ${location ? `<div class="note-time">${escHtml(location)}</div>` : ''}
      ${extras.length ? `<div class="note-extra">${extras.join('')}</div>` : ''}
      ${note ? `<div class="note-time transport-note">${escHtml(note)}</div>` : ''}
    </div>
  </div>`;
  return item('booking', timeColumn(start, end), bookingIcon(r.type, 11), card, `--kind:${tint}`);
}

// ── Notes ─────────────────────────────────────────────────────────────────

/**
 * A day note. A coloured note carries its colour as the rule along its edge and its
 * icon (#1629), not as a fill: a tint costs ink and reads as grey on a mono printer.
 */
export function noteItem(note: DayNote): string {
  const colour = note.color ? hexColour(note.color, '') : '';
  // A note's `time` is the free line the day plan prints under its text, not a clock,
  // so it stays in the card and the time column stays empty.
  const subtitle = typeof note.time === 'string' ? note.time.trim() : '';
  const card = `<div class="note-card${colour ? ' note-tinted' : ''}"${colour ? ` style="--note:${colour}"` : ''}>
    <span class="note-icon">${noteIcon(note.icon)}</span>
    <div class="note-body"><div class="note-text">${escHtml(note.text)}</div>${
      subtitle ? `<div class="note-time">${escHtml(subtitle)}</div>` : ''
    }</div>
  </div>`;
  return item('note', timeColumn('', ''), '', card);
}

// ── Places ────────────────────────────────────────────────────────────────

/** The day's opening hours of a place, Monday first like the stored week; null when unknown. */
function hoursOnDay(place: Partial<Place>, day: Day, ctx: PdfDayContext): string | null {
  const week = parsePlaceHours(place.opening_hours);
  if (!week || !day.date) return null;
  const weekday = (new Date(day.date + 'T00:00:00Z').getUTCDay() + 6) % 7;
  const hours = week[weekday];
  if (!hours) return null;
  if (hours.closed) return ctx.tr('inspector.closed');
  if (!hours.open && !hours.close) return null;
  return [ctx.fmtTime(hours.open), ctx.fmtTime(hours.close)].filter(Boolean).join(' – ');
}

function placeFacts(place: Assignment['place'] & Partial<Place>, stay: number | null | undefined, ctx: PdfDayContext): string[] {
  const facts: string[] = [];
  const duration = durationLabel(stay ?? place.duration_minutes);
  if (duration) facts.push(`<span class="chip">${glyph('duration', 9)}${escHtml(duration)}</span>`);
  const price = Number(place.price);
  if (Number.isFinite(price) && price > 0) {
    facts.push(
      `<span class="chip chip-green">${glyph('price', 9)}${escHtml(formatMoney(price, place.currency || ctx.tripCurrency, ctx.locale || 'en'))}</span>`
    );
  }
  if (typeof place.rating_avg === 'number' && place.rating_avg > 0) {
    const count = place.rating_count ? ` (${place.rating_count})` : '';
    facts.push(`<span class="chip chip-rating">${glyph('star', 9)}${place.rating_avg.toFixed(1)}${count}</span>`);
  }
  for (const tag of place.tags || []) {
    if (!tag.name) continue;
    facts.push(
      `<span class="chip chip-tag" style="--tag:${hexColour(tag.color, NEUTRAL)}">${escHtml(tag.name)}</span>`
    );
  }
  return facts;
}

function placeDetails(
  place: Assignment['place'] & Partial<Place>,
  assignment: Assignment,
  day: Day,
  ctx: PdfDayContext
): string[] {
  const details: string[] = [];
  const hours = hoursOnDay(place, day, ctx);
  if (hours)
    details.push(
      `<span class="detail">${glyph('hours', 9)}${escHtml(ctx.tr('inspector.openingHours'))} ${escHtml(hours)}</span>`
    );
  if (place.phone) details.push(`<span class="detail">${glyph('phone', 9)}${escHtml(place.phone)}</span>`);
  if (place.website)
    details.push(`<span class="detail">${glyph('web', 9)}${escHtml(websiteHost(place.website))}</span>`);
  if (place.email) details.push(`<span class="detail">${glyph('mail', 9)}${escHtml(place.email)}</span>`);
  const people = (assignment.participants || []).map((p) => p.username).filter(Boolean);
  if (people.length) {
    details.push(
      `<span class="detail">${glyph('people', 9)}${escHtml(ctx.tr('inspector.participants'))}: ${escHtml(people.join(', '))}</span>`
    );
  }
  return details;
}

/** A planned place on the day's timeline, numbered like the stops on the map. */
export function placeItem(assignment: Assignment, number: number, day: Day, ctx: PdfDayContext, timing?: TimingPlan): string {
  // The assignment carries a projection of its place; the rating, the e-mail, the
  // hours and the reservation note are only on the trip's own place.
  const place: Assignment['place'] & Partial<Place> = {
    ...ctx.placesById.get(assignment.place.id),
    ...assignment.place,
  };
  const category = ctx.categories.find((c) => c.id === place.category_id);
  const catColour = hexColour(category?.color, NEUTRAL);
  const photo = ctx.photoOf(assignment.place);
  const media = photo
    ? `<img class="place-thumb" src="${escHtml(photo)}" alt="" />`
    : `<div class="place-thumb-fallback">${categoryIcon(category?.icon)}</div>`;
  const facts = placeFacts(place, assignment.stay_minutes, ctx);
  const timingChip = pdfTimingChip(timing, assignment.id, { clock: ctx.fmtTime, translate: ctx.tr, escape: escHtml });
  if (timingChip) facts.unshift(timingChip);
  const details = placeDetails(place, assignment, day, ctx);
  const hasPosition = place.lat != null && place.lng != null;
  const notes = [place.notes, place.reservation_notes, assignment.notes].filter(
    (value): value is string => typeof value === 'string' && value.trim() !== ''
  );

  const card = `<div class="place-card" style="--cat:${catColour}">
    ${media}
    <div class="place-info">
      <div class="place-name-row">
        <span class="place-name">${escHtml(place.name)}</span>
        ${category ? `<span class="cat-badge">${escHtml(category.name)}</span>` : ''}
      </div>
      ${facts.length ? `<div class="facts">${facts.join('')}</div>` : ''}
      ${place.address ? `<div class="info-row">${glyph('pin')}<span class="info-text">${escHtml(place.address)}</span></div>` : ''}
      ${
        hasPosition
          ? `<div class="info-row coords">${glyph('coords')}<span class="info-text muted">${Number(place.lat).toFixed(5)}, ${Number(place.lng).toFixed(5)}</span></div>`
          : ''
      }
      ${place.description ? `<div class="place-text">${ctx.markdown(place.description)}</div>` : ''}
      ${notes.map((note) => `<div class="place-note">${ctx.markdown(note)}</div>`).join('')}
      ${details.length ? `<div class="details">${details.join('')}</div>` : ''}
    </div>
  </div>`;
  const { start, end } = visitTimes({ ...assignment, place });
  return item('place', timeColumn(ctx.fmtTime(start), ctx.fmtTime(end)), String(number), card);
}

// ── Stays ─────────────────────────────────────────────────────────────────

/**
 * Where the day's night is spent. The day of arrival and the day of leaving get the
 * full card with the time, the address and the booking code; the nights in between a
 * quiet line, since the same hotel on every page is the plan's least news.
 */
export function staysBlock(stays: readonly Accommodation[], day: Day, ctx: PdfDayContext): string {
  if (!stays.length) return '';
  const cards = stays.map((stay) => {
    const isCheckIn = day.id === stay.start_day_id;
    const isCheckOut = day.id === stay.end_day_id;
    const name = stay.place_name || stay.reservation_title || '';
    const photo = safeImg(stay.place_image);
    const media = `<span class="stay-media">${photo ? `<img src="${escHtml(photo)}" alt="" />` : glyph(isCheckOut ? 'checkOut' : isCheckIn ? 'checkIn' : 'bed', 16)}</span>`;
    if (!isCheckIn && !isCheckOut) {
      return `<div class="day-accommodation stay-quiet">${media}<div class="stay-main">
        <div class="stay-kicker">${escHtml(ctx.tr('reservations.meta.linkAccommodation'))}</div>
        <div class="stay-name">${escHtml(name)}</div>
      </div></div>`;
    }
    const label = ctx.tr(isCheckIn ? 'reservations.meta.checkIn' : 'reservations.meta.checkOut');
    const time = ctx.fmtTime(isCheckIn ? stay.check_in : stay.check_out);
    const extras = [
      isCheckIn && stay.confirmation
        ? `<span class="code-chip">${glyph('key', 9)}${escHtml(stay.confirmation)}</span>`
        : '',
    ].filter(Boolean);
    return `<div class="day-accommodation">${media}<div class="stay-main">
      <div class="stay-kicker">${escHtml(label)}${time ? ` <span class="num">${escHtml(time)}</span>` : ''}</div>
      <div class="stay-name">${escHtml(name)}</div>
      ${stay.place_address ? `<div class="stay-line">${escHtml(stay.place_address)}</div>` : ''}
      ${stay.notes ? `<div class="stay-line">${escHtml(stay.notes)}</div>` : ''}
      ${extras.length ? `<div class="stay-extra">${extras.join('')}</div>` : ''}
    </div></div>`;
  });
  return `<div class="day-accommodations${stays.length === 1 ? ' single' : ''}">${cards.join('')}</div>`;
}

// ── Header ────────────────────────────────────────────────────────────────

interface DayHeaderFacts {
  stops: number;
  distance: string | null;
  cost: string | null;
}

/** The day's header: its number in the day's colour, the date, the title and its figures. */
export function dayHeader(day: Day, facts: DayHeaderFacts, ctx: PdfDayContext): string {
  const n = day.day_number ?? 0;
  const pills = [
    facts.stops > 0 ? `<span class="meta-pill">${glyph('pin', 9)}${facts.stops}</span>` : '',
    facts.distance ? `<span class="meta-pill">${glyph('route', 9)}${escHtml(facts.distance)}</span>` : '',
    facts.cost ? `<span class="day-cost">${glyph('price', 9)}${facts.cost}</span>` : '',
  ].filter(Boolean);
  return `<div class="day-head">
    <span class="day-tag"><span class="day-tag-lbl">${escHtml(ctx.tr('pdf.day'))}</span><span class="day-tag-num">${n}</span></span>
    <div class="day-head-main">
      ${day.date ? `<div class="day-date">${escHtml(shortDate(day.date, ctx.locale))}</div>` : ''}
      <div class="day-title">${escHtml(day.title || ctx.tr('dayplan.dayN', { n }))}</div>
    </div>
    ${pills.length ? `<div class="day-meta">${pills.join('')}</div>` : ''}
  </div>`;
}

// ── Photo strip ───────────────────────────────────────────────────────────

interface StripPhoto {
  url: string;
  caption: string;
}

/**
 * The strip that opens a day: up to three of its photographed stops side by side, the
 * first one widest, each named on a frosted label. Nothing for a day without photos.
 */
export function photoStrip(photos: readonly StripPhoto[]): string {
  if (!photos.length) return '';
  return `<div class="day-strip day-strip-${photos.length}">${photos
    .map(
      (p) =>
        `<figure class="day-strip-photo"><img src="${escHtml(p.url)}" alt="" /><figcaption class="glass-label">${escHtml(p.caption)}</figcaption></figure>`
    )
    .join('')}</div>`;
}
