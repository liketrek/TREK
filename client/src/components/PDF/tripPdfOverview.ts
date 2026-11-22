import type { ShadeStop } from './pdfImages';
import { cssUrl, escHtml } from './tripPdfHtml';
import { glyph } from './tripPdfIcons';

/*
 * The trip PDF's first pages: the cover, then the overview with the route map, every
 * day at a glance and the list of bookings and stays with their codes.
 */

type Translate = (key: string, params?: Record<string, string | number>) => string;

export interface CoverStat {
  value: string;
  label: string;
}

/** One day of the route as the cover draws it: its colour and its roads, `[lat, lng]`. */
interface CoverRouteDay {
  colour: string;
  lines: readonly (readonly [number, number])[][];
}

interface CoverInput {
  title: string;
  description: string | null;
  range: string | null;
  /** The cover photo, already checked to be one the document may load. */
  image: string | null;
  /** Whether the shade is already painted into `image`, so none is laid over it. */
  baked?: boolean;
  /** The light TREK logo, absolute. */
  logo: string | null;
  stats: readonly CoverStat[];
  /** The routed days, drawn as the trip's shape; empty when nothing was routed. */
  route: readonly CoverRouteDay[];
  /** Every day's colour in trip order, for the band under the title. */
  ribbon: readonly string[];
  /** The first and the last day's short date, under the band's ends. */
  ribbonEnds: readonly [string, string] | null;
  tr: Translate;
}

/**
 * The shade over the cover photo, top to bottom: a little at the top for the logo, clear
 * through the middle, dark at the foot for the title and the figures. Painted into the
 * photo when the export could bake it, laid over it as a gradient when not.
 */
export const COVER_SHADE: readonly ShadeStop[] = [
  [0, 0.35],
  [0.22, 0],
  [0.36, 0],
  [0.92, 0.82],
];

/** The cover shade as a CSS gradient, for a photo the export could not bake. */
export function coverShadeCss(): string {
  return `linear-gradient(180deg, ${COVER_SHADE.map(([at, alpha]) => `rgba(10, 10, 14, ${alpha}) ${at * 100}%`).join(', ')})`;
}

const ROUTE_W = 240;
const ROUTE_H = 170;
const ROUTE_PAD = 14;
/** Points drawn at most: a road trip routes to tens of thousands, the shape needs far fewer. */
const ROUTE_MAX_POINTS = 1600;

type LatLng = readonly [number, number];

/**
 * The trip's roads as one small drawing, each day in its colour on a soft glow, with a
 * ring where the trip starts and a dot where it ends. Projected flat with the longitude
 * scaled to the middle latitude, which is true enough at the size of a trip. Empty when
 * there is no shape to draw.
 */
export function coverRouteSvg(days: readonly CoverRouteDay[]): string {
  const lines = days.flatMap((d) => d.lines.filter((l) => l.length > 1).map((l) => ({ colour: d.colour, points: l })));
  const points = lines.flatMap((l) => l.points);
  if (!lines.length) return '';
  const lats = points.map((p) => p[0]);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const k = Math.cos((midLat * Math.PI) / 180);
  const xs = points.map((p) => p[1] * k);
  const ys = points.map((p) => -p[0]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  const scale = Math.min(
    w > 0 ? (ROUTE_W - 2 * ROUTE_PAD) / w : Infinity,
    h > 0 ? (ROUTE_H - 2 * ROUTE_PAD) / h : Infinity
  );
  if (!Number.isFinite(scale)) return '';
  const offX = (ROUTE_W - w * scale) / 2;
  const offY = (ROUTE_H - h * scale) / 2;
  const x = (p: LatLng) => (offX + (p[1] * k - minX) * scale).toFixed(1);
  const y = (p: LatLng) => (offY + (-p[0] - minY) * scale).toFixed(1);
  const step = Math.max(1, Math.ceil(points.length / ROUTE_MAX_POINTS));
  const path = (line: readonly LatLng[]) =>
    line
      .filter((_, i) => i % step === 0 || i === line.length - 1)
      .map((p, i) => `${i ? 'L' : 'M'}${x(p)} ${y(p)}`)
      .join('');
  const drawn = lines.map((l) => ({ colour: l.colour, d: path(l.points) }));
  const first = lines[0];
  const last = lines[lines.length - 1];
  const start = first.points[0];
  const end = last.points[last.points.length - 1];
  return `<svg class="cover-route-svg" viewBox="0 0 ${ROUTE_W} ${ROUTE_H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <g class="cover-route-glow" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round">${drawn
      .map((l) => `<path d="${l.d}"/>`)
      .join('')}</g>
    <g fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${drawn
      .map((l) => `<path d="${l.d}" stroke="${l.colour}"/>`)
      .join('')}</g>
    <circle class="cover-route-start" cx="${x(start)}" cy="${y(start)}" r="4.2" stroke="${first.colour}" stroke-width="2.2"/>
    <circle class="cover-route-end" cx="${x(end)}" cy="${y(end)}" r="4.2" fill="${last.colour}" stroke-width="1.6"/>
  </svg>`;
}

/** The cover: the trip's photo left bright, the title, the dates and its figures. */
export function coverHtml({
  title,
  description,
  range,
  image,
  baked = false,
  logo,
  stats,
  route,
  ribbon,
  ribbonEnds,
  tr,
}: CoverInput): string {
  const routeSvg = coverRouteSvg(route);
  const routeCard = routeSvg
    ? `<div class="cover-route"><div class="cover-route-lbl">${escHtml(tr('pdf.mapTitle'))}</div>${routeSvg}</div>`
    : '';
  const ends = ribbonEnds
    ? `<div class="cover-ribbon-ends"><span>${escHtml(ribbonEnds[0])}</span><span>${escHtml(ribbonEnds[1])}</span></div>`
    : '';
  const band =
    ribbon.length > 1
      ? `<div class="cover-ribbon">${ribbon.map((c) => `<span style="background:${c}"></span>`).join('')}</div>${ends}`
      : '';
  return `<section class="cover${image ? '' : ' cover-plain'}">
  <div class="cover-bg"${image ? ` style="background-image:url('${escHtml(cssUrl(image))}')"` : ''}></div>
  ${baked ? '' : '<div class="cover-shade"></div>'}
  <div class="cover-top">
    ${logo ? `<img src="${escHtml(logo)}" alt="TREK" />` : '<span></span>'}
    <span class="eyebrow">${escHtml(tr('pdf.travelPlan'))}</span>
  </div>
  <div class="cover-body">
    <div class="cover-main">
      <div class="cover-head">
        ${range ? `<div class="cover-dates">${escHtml(range)}</div>` : ''}
        <h1 class="cover-title">${escHtml(title)}</h1>
        ${description ? `<p class="cover-desc">${escHtml(description)}</p>` : ''}
      </div>
      ${routeCard}
    </div>
    ${band}
    <div class="cover-stats">${stats
      .map(
        (s) =>
          `<div class="cover-stat"><div class="cover-stat-num">${escHtml(s.value)}</div><div class="cover-stat-lbl">${escHtml(s.label)}</div></div>`
      )
      .join('')}</div>
  </div>
</section>`;
}

export interface GlanceRow {
  number: number;
  colour: string;
  date: string;
  title: string;
  stops: number;
  stay: string;
  cost: string | null;
}

/** Every day in one table: its colour, date and title, where the night is spent and what it costs. */
export function glanceHtml(rows: readonly GlanceRow[], tr: Translate): string {
  if (!rows.length) return '';
  const withCost = rows.some((r) => r.cost);
  return `<div class="sec-block">
  <div class="sec-head"><span class="sec-title">${escHtml(tr('pdf.atAGlance'))}</span></div>
  <table class="glance">
    <thead><tr>
      <th>${escHtml(tr('pdf.day'))}</th>
      <th>${escHtml(tr('common.date'))}</th>
      <th>${escHtml(tr('pdf.plan'))}</th>
      <th>${escHtml(tr('pdf.stay'))}</th>
      <th class="glance-stops">${glyph('pin', 9)}</th>
      ${withCost ? `<th class="glance-end">${escHtml(tr('pdf.costLabel'))}</th>` : ''}
    </tr></thead>
    <tbody>${rows
      .map(
        (r) => `<tr style="--day:${r.colour}">
      <td><span class="glance-day">${r.number}</span></td>
      <td class="num glance-date">${escHtml(r.date)}</td>
      <td class="glance-title">${escHtml(r.title)}</td>
      <td>${escHtml(r.stay)}</td>
      <td class="num glance-stops">${r.stops || ''}</td>
      ${withCost ? `<td class="num">${r.cost ?? ''}</td>` : ''}
    </tr>`
      )
      .join('')}</tbody>
  </table>
</div>`;
}

export interface LedgerRow {
  /** The type's icon, already markup. */
  icon: string;
  /** The type's tint, a checked hex colour. */
  tint: string;
  title: string;
  /** Markup under the title: the route, the address or the booking's facts. */
  sub: string;
  when: string;
  code: string | null;
}

/** The trip's bookings and stays in date order, each with the code to show at the desk. */
export function ledgerHtml(rows: readonly LedgerRow[], tr: Translate): string {
  if (!rows.length) return '';
  return `<div class="sec-block ledger-block">
  <div class="sec-head"><span class="sec-title">${escHtml(tr('pdf.bookings'))}</span></div>
  <div class="ledger">${rows
    .map(
      (r) => `<div class="ledger-row" style="--kind:${r.tint}">
      <span class="ledger-icon">${r.icon}</span>
      <div><div class="ledger-title">${escHtml(r.title)}</div>${r.sub ? `<div class="ledger-sub">${r.sub}</div>` : ''}</div>
      <div class="ledger-when">${escHtml(r.when)}${r.code ? `<div><span class="code-chip">${glyph('key', 9)}${escHtml(r.code)}</span></div>` : ''}</div>
    </div>`
    )
    .join('')}</div>
</div>`;
}
