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

export interface CoverInput {
  title: string;
  description: string | null;
  range: string | null;
  /** The cover photo, already checked to be one the document may load. */
  image: string | null;
  /** The light TREK logo, absolute. */
  logo: string | null;
  stats: readonly CoverStat[];
  tr: Translate;
}

/** The cover: the trip's photo left bright, the title, the dates and its figures. */
export function coverHtml({ title, description, range, image, logo, stats, tr }: CoverInput): string {
  return `<section class="cover${image ? '' : ' cover-plain'}">
  <div class="cover-bg"${image ? ` style="background-image:url('${escHtml(cssUrl(image))}')"` : ''}></div>
  <div class="cover-shade"></div>
  <div class="cover-top">
    ${logo ? `<img src="${escHtml(logo)}" alt="TREK" />` : '<span></span>'}
    <span class="eyebrow">${escHtml(tr('pdf.travelPlan'))}</span>
  </div>
  <div class="cover-body">
    ${range ? `<div class="cover-dates">${escHtml(range)}</div>` : ''}
    <h1 class="cover-title">${escHtml(title)}</h1>
    ${description ? `<p class="cover-desc">${escHtml(description)}</p>` : ''}
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
      <td class="num">${escHtml(r.date)}</td>
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
