import geist400 from '@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff2?url';
import geist500 from '@fontsource/geist-sans/files/geist-sans-latin-500-normal.woff2?url';
import geist600 from '@fontsource/geist-sans/files/geist-sans-latin-600-normal.woff2?url';

import { PDF_MARKDOWN_CSS } from './pdfMarkdown';

/*
 * The trip PDF's stylesheet. A print document has a fixed palette rather than the
 * reader's scheme, so its colours are declared once, as the custom properties at the
 * top, and every rule below names them. The type follows the app: Poppins for words,
 * Geist for figures, times and the small capitals.
 *
 * Every switch of the preview is one class on <body> (pdfPreview.ts), so turning one
 * over is instant and needs no rebuild:
 *   pdf-flow                days run on instead of each starting a page
 *   pdf-large-text          larger type and darker greys
 *   pdf-no-transport-notes  the notes of flights, trains and rentals left out
 *   pdf-no-photos           no photos on the places and stays
 *   pdf-no-overview         no route map, day overview or booking list
 *   pdf-no-coords           no coordinates under the addresses
 *   pdf-no-details          no contact lines, opening hours or companions
 */
export function tripPdfCss(): string {
  return `
  @font-face { font-family: 'Poppins'; font-style: normal; font-weight: 400; src: url('/fonts/Poppins-Regular.ttf') format('truetype'); }
  @font-face { font-family: 'Poppins'; font-style: italic; font-weight: 400; src: url('/fonts/Poppins-Italic.ttf') format('truetype'); }
  @font-face { font-family: 'Poppins'; font-style: normal; font-weight: 500; src: url('/fonts/Poppins-Medium.ttf') format('truetype'); }
  @font-face { font-family: 'Poppins'; font-style: normal; font-weight: 600; src: url('/fonts/Poppins-SemiBold.ttf') format('truetype'); }
  @font-face { font-family: 'Poppins'; font-style: normal; font-weight: 700; src: url('/fonts/Poppins-Bold.ttf') format('truetype'); }
  @font-face { font-family: 'Geist PDF'; font-weight: 400; src: url('${geist400}') format('woff2'); }
  @font-face { font-family: 'Geist PDF'; font-weight: 500; src: url('${geist500}') format('woff2'); }
  @font-face { font-family: 'Geist PDF'; font-weight: 600; src: url('${geist600}') format('woff2'); }

  :root {
    --ink: #17171c;
    --ink-2: #3e3e47;
    --ink-3: #6a6a74;
    --ink-4: #9a9aa4;
    --hair: #e7e5e0;
    --paper: #ffffff;
    --wash: #f6f5f2;
    --wash-2: #eeede8;
    --night: #141418;
    --shade: rgba(10, 10, 14, 0.82);
    --shade-mid: rgba(10, 10, 14, 0.35);
    --shade-none: rgba(10, 10, 14, 0);
    --glass: rgba(255, 255, 255, 0.13);
    --glass-edge: rgba(255, 255, 255, 0.22);
    --glass-dark: rgba(14, 14, 18, 0.42);
    --on-night: rgba(255, 255, 255, 0.78);
    --on-night-2: rgba(255, 255, 255, 0.56);
    --gold: #b7791f;
    --day: var(--ink);
    --t: 1;
    --sans: 'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif;
    --num: 'Geist PDF', 'Poppins', system-ui, sans-serif;
    --gutter: 14mm;
  }
  body.pdf-large-text {
    --t: 1.3;
    --ink-2: #2b2b33;
    --ink-3: #4b4b55;
    --ink-4: #62626c;
  }

  @page { size: A4; margin: 12mm 0 14mm; }
  @page :first { margin: 0; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--paper); }
  body {
    font-family: var(--sans); color: var(--ink);
    font-size: calc(9.5px * var(--t)); line-height: 1.5;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  img { display: block; }
  svg { flex-shrink: 0; }
  .num { font-family: var(--num); font-variant-numeric: tabular-nums; }
  .eyebrow {
    font-family: var(--num); font-size: calc(7.5px * var(--t)); font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-3);
  }
  .page-break { break-before: page; }


  /* ── Cover ───────────────────────────────────────────────── */
  .cover {
    position: relative; height: 297mm; overflow: hidden;
    background: var(--night); color: var(--paper); break-after: page;
  }
  .cover-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
  .cover-plain .cover-bg {
    background: radial-gradient(120% 80% at 85% 10%, var(--ink-2) 0%, var(--night) 60%);
  }
  .cover-shade {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, var(--shade-mid) 0%, var(--shade-none) 24%, var(--shade-none) 40%, var(--shade) 100%);
  }
  .cover-top {
    position: absolute; inset-block-start: 14mm; inset-inline: var(--gutter);
    display: flex; align-items: center; justify-content: space-between;
  }
  .cover-top img { height: 22px; }
  .cover-top .eyebrow { color: var(--on-night); }
  .cover-body { position: absolute; inset-inline: var(--gutter); inset-block-end: 16mm; }
  .cover-dates { font-family: var(--num); font-size: 11px; font-weight: 500; letter-spacing: 0.04em; color: var(--on-night); }
  .cover-title { font-size: 46px; font-weight: 700; line-height: 1.04; letter-spacing: -0.02em; margin: 6px 0 10px; }
  .cover-desc { max-width: 135mm; font-size: 12px; line-height: 1.6; color: var(--on-night); }
  .cover-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(30mm, 1fr)); gap: 8px; margin-block-start: 10mm; }
  .cover-stat {
    background: var(--glass); border: 1px solid var(--glass-edge); border-radius: 16px;
    padding: 12px 14px 11px; -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
  }
  .cover-stat-num { font-family: var(--num); font-size: 20px; font-weight: 600; line-height: 1.1; font-variant-numeric: tabular-nums; }
  .cover-stat-lbl {
    font-family: var(--num); font-size: 7.5px; font-weight: 500; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--on-night-2); margin-block-start: 5px;
  }

  /* ── Overview: route map, the days at a glance, bookings and stays ─────── */
  .overview { padding: 2mm var(--gutter) 0; }
  .pdf-no-overview .overview { display: none; }
  .sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-block-end: 4mm; }
  .sec-title { font-size: calc(17px * var(--t)); font-weight: 600; letter-spacing: -0.01em; }
  .sec-block { break-inside: avoid; margin-block-end: 9mm; }
  .trip-map { margin-block-end: 9mm; }
  .trip-map-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-block-end: 4mm; }
  .trip-map-title { font-size: calc(17px * var(--t)); font-weight: 600; letter-spacing: -0.01em; }
  .trip-map-total {
    font-family: var(--num); font-size: calc(9px * var(--t)); font-weight: 600; color: var(--ink-2);
    background: var(--wash); border-radius: 99px; padding: 4px 10px;
  }
  .trip-map-note { font-size: 9px; font-weight: 600; color: var(--gold); margin: -2mm 0 3mm; }
  .trip-map-svg { width: 100%; height: auto; border-radius: 16px; border: 1px solid var(--hair); display: block; overflow: hidden; }
  .trip-map-legend { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px 14px; margin-block-start: 4mm; }
  .trip-map-leg { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: calc(8.5px * var(--t)); color: var(--ink-2); }
  .trip-map-leg-name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .trip-map-dot { width: 8px; height: 8px; border-radius: 50%; }
  .trip-map-leg-dist { font-family: var(--num); color: var(--ink-4); white-space: nowrap; }
  .trip-map-credit { font-size: 7px; color: var(--ink-4); margin-block-start: 3mm; }

  .glance { width: 100%; border-collapse: collapse; font-size: calc(8.5px * var(--t)); }
  .glance th {
    font-family: var(--num); font-size: calc(7px * var(--t)); font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--ink-4); text-align: start; padding: 0 6px 6px;
    border-block-end: 1px solid var(--hair);
  }
  .glance td { padding: 6px; border-block-end: 1px solid var(--wash-2); vertical-align: top; color: var(--ink-2); }
  .glance tr { break-inside: avoid; }
  .glance-day { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 18px; padding: 0 5px; border-radius: 6px; background: var(--day); color: var(--paper); font-family: var(--num); font-weight: 600; font-size: calc(8px * var(--t)); }
  .glance-title { color: var(--ink); font-weight: 500; }
  .glance .num, .glance-end { text-align: end; white-space: nowrap; }
  .glance .glance-stops { text-align: center; }
  .glance th.glance-stops svg { display: inline-block; vertical-align: -1px; }

  .ledger { display: grid; gap: 5px; }
  .ledger-row {
    display: grid; grid-template-columns: 26px 1fr auto; gap: 10px; align-items: center;
    padding: 7px 10px; border: 1px solid var(--hair); border-radius: 12px; break-inside: avoid;
  }
  .ledger-icon {
    width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
    background: color-mix(in srgb, var(--kind) 14%, var(--paper)); color: var(--kind);
  }
  .ledger-title { font-weight: 600; font-size: calc(9.5px * var(--t)); }
  .ledger-sub { font-size: calc(8px * var(--t)); color: var(--ink-3); }
  .ledger-when { font-family: var(--num); font-size: calc(8px * var(--t)); color: var(--ink-3); text-align: end; white-space: nowrap; }

  /* ── Day ─────────────────────────────────────────────────── */
  /* A real <table>, so the browser repeats the <thead> day header on every page an
     overflowing day spills onto (#1471); CSS table-header-group on a <div> is not
     repeated by Chromium's print engine. */
  .day-section { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .day-break { break-before: page; }
  /* The first day always opens a page of its own, after the cover or the overview. */
  .day-first { break-before: page; }
  .pdf-flow .day-break { break-before: auto; }
  .pdf-flow .day-section + .day-section { margin-block-start: 8mm; }
  /* Hold a flowing day together where it fits, so a header is never stranded at the
     foot of a sheet with its content on the next one (#1471). */
  .pdf-flow .day-section { break-inside: avoid; page-break-inside: avoid; }
  /* The gap under the header sits inside the repeated cell: a block-start padding on the
     body is only painted on its first fragment (#1531). */
  .day-header > tr > td { padding: 0 var(--gutter) 5mm; }
  .day-head {
    display: flex; align-items: center; gap: 12px; padding-block: 3mm 3.5mm;
    border-block-end: 1px solid var(--hair); position: relative;
  }
  .day-head::after {
    content: ''; position: absolute; inset-inline-start: 0; inset-block-end: -1px;
    width: 26mm; height: 2px; border-radius: 2px; background: var(--day);
  }
  .day-tag {
    width: 42px; height: 42px; border-radius: 13px; background: var(--day); color: var(--paper);
    display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .day-tag-lbl { font-family: var(--num); font-size: 6.5px; font-weight: 600; letter-spacing: 0.14em; opacity: 0.85; }
  .day-tag-num { font-family: var(--num); font-size: 17px; font-weight: 600; line-height: 1; }
  .day-head-main { flex: 1; min-width: 0; }
  .day-date { font-family: var(--num); font-size: calc(8px * var(--t)); font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-3); }
  .day-title { font-size: calc(17px * var(--t)); font-weight: 600; line-height: 1.25; letter-spacing: -0.01em; }
  .day-meta { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 5px; max-width: 70mm; }
  .meta-pill, .day-cost {
    display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
    font-family: var(--num); font-size: calc(8px * var(--t)); font-weight: 600; color: var(--ink-2);
    background: var(--wash); border-radius: 99px; padding: 4px 9px;
  }
  .meta-pill svg, .day-cost svg { color: var(--ink-4); }
  .day-body { padding: 0 var(--gutter) 4mm; }
  .day-intro {
    margin-block-end: 4mm; padding: 9px 12px; border-radius: 12px; background: var(--wash);
    font-size: calc(9px * var(--t)); color: var(--ink-2); white-space: pre-line;
  }

  /* ── Photo strip ─────────────────────────────────────────── */
  .day-strip { display: grid; gap: 4px; height: 48mm; margin-block-end: 5mm; border-radius: 16px; overflow: hidden; }
  .day-strip-1 { grid-template-columns: 1fr; }
  .day-strip-2 { grid-template-columns: 3fr 2fr; }
  .day-strip-3 { grid-template-columns: 2fr 1fr 1fr; }
  .day-strip-photo { position: relative; min-width: 0; overflow: hidden; background: var(--wash-2); }
  .day-strip-photo img { width: 100%; height: 100%; object-fit: cover; }
  .glass-label {
    position: absolute; inset-inline-start: 8px; inset-block-end: 8px; max-width: calc(100% - 16px);
    padding: 4px 10px; border-radius: 99px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    font-size: calc(8px * var(--t)); font-weight: 500; color: var(--paper);
    background: var(--glass-dark); border: 1px solid var(--glass-edge);
    -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  }
  .pdf-no-photos .day-strip { display: none; }

  /* ── Stays ───────────────────────────────────────────────── */
  .day-accommodations { display: grid; grid-template-columns: repeat(auto-fit, minmax(80mm, 1fr)); gap: 6px; margin-block-end: 5mm; }
  .day-accommodation {
    display: flex; gap: 10px; align-items: center; padding: 8px 10px;
    border: 1px solid var(--hair); border-radius: 14px; break-inside: avoid;
  }
  .day-accommodation.stay-quiet { padding: 6px 10px; background: var(--wash); border-color: transparent; }
  .stay-media {
    width: 40px; height: 40px; border-radius: 11px; overflow: hidden; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: color-mix(in srgb, var(--day) 12%, var(--paper)); color: var(--day);
  }
  .stay-quiet .stay-media { width: 26px; height: 26px; border-radius: 8px; }
  .stay-media img { width: 100%; height: 100%; object-fit: cover; }
  .pdf-no-photos .stay-media img { display: none; }
  .stay-main { flex: 1; min-width: 0; }
  .stay-kicker { font-family: var(--num); font-size: calc(7.5px * var(--t)); font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--day); }
  .stay-name { font-size: calc(10.5px * var(--t)); font-weight: 600; line-height: 1.35; }
  .stay-quiet .stay-name { font-size: calc(9px * var(--t)); font-weight: 500; }
  .stay-line { font-size: calc(8.5px * var(--t)); color: var(--ink-3); }
  .stay-extra { display: flex; flex-wrap: wrap; gap: 4px; margin-block-start: 4px; }

  /* ── Timeline ────────────────────────────────────────────── */
  .timeline { list-style: none; }
  .tl-item { display: grid; grid-template-columns: 13mm 22px minmax(0, 1fr); column-gap: 8px; break-inside: avoid; }
  .tl-time { text-align: end; padding-block-start: 11px; font-family: var(--num); font-variant-numeric: tabular-nums; }
  .tl-start { display: block; font-size: calc(9.5px * var(--t)); font-weight: 600; color: var(--ink); }
  .tl-end { display: block; font-size: calc(8px * var(--t)); color: var(--ink-4); }
  .tl-rail { position: relative; display: flex; justify-content: center; }
  .tl-rail::before {
    content: ''; position: absolute; inset-block: 0; inset-inline-start: calc(50% - 0.75px); width: 1.5px;
    background: color-mix(in srgb, var(--day) 26%, var(--paper));
  }
  .tl-item:first-child .tl-rail::before { inset-block-start: 14px; }
  .tl-item:last-child .tl-rail::before { inset-block-end: auto; height: 14px; }
  .tl-item:only-child .tl-rail::before { display: none; }
  .tl-marker {
    position: relative; margin-block-start: 8px; width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--paper); border: 1.5px solid var(--day); color: var(--day);
    font-family: var(--num); font-size: calc(8.5px * var(--t)); font-weight: 600;
  }
  .tl-place .tl-marker { background: var(--day); color: var(--paper); }
  .tl-booking .tl-marker { border-color: var(--kind); color: var(--kind); }
  .tl-note .tl-marker { width: 10px; height: 10px; margin-block-start: 13px; background: var(--wash-2); border-color: var(--wash-2); }
  .tl-body { padding-block: 3px 7px; min-width: 0; }
  .empty-day { padding: 10mm 0; text-align: center; color: var(--ink-4); font-size: calc(9px * var(--t)); }

  /* ── Place ───────────────────────────────────────────────── */
  .place-card {
    display: flex; gap: 11px; padding: 10px; border: 1px solid var(--hair); border-radius: 14px;
    background: var(--paper); break-inside: avoid;
  }
  .place-thumb, .place-thumb-fallback { width: 74px; height: 74px; border-radius: 11px; flex-shrink: 0; }
  .place-thumb { object-fit: cover; }
  .place-thumb-fallback {
    display: flex; align-items: center; justify-content: center;
    background: color-mix(in srgb, var(--cat) 14%, var(--paper)); color: var(--cat);
  }
  .pdf-no-photos .place-thumb, .pdf-no-photos .place-thumb-fallback { display: none; }
  .place-info { flex: 1; min-width: 0; }
  .place-name-row { display: flex; align-items: flex-start; gap: 8px; }
  .place-name { flex: 1; font-size: calc(12px * var(--t)); font-weight: 600; line-height: 1.3; letter-spacing: -0.005em; }
  .cat-badge {
    display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; flex-shrink: 0;
    font-family: var(--num); font-size: calc(7.5px * var(--t)); font-weight: 600;
    border-radius: 99px; padding: 3px 8px;
    background: color-mix(in srgb, var(--cat) 13%, var(--paper));
    color: color-mix(in srgb, var(--cat) 78%, var(--ink));
  }
  .facts { display: flex; flex-wrap: wrap; gap: 4px; margin-block-start: 5px; }
  .chip {
    display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
    font-family: var(--num); font-size: calc(8px * var(--t)); font-weight: 500; color: var(--ink-2);
    background: var(--wash); border-radius: 99px; padding: 2px 8px;
  }
  .chip svg { color: var(--ink-4); }
  .chip-rating { color: var(--gold); }
  .chip-rating svg { color: var(--gold); fill: var(--gold); }
  .chip-tag { background: color-mix(in srgb, var(--tag) 12%, var(--paper)); color: color-mix(in srgb, var(--tag) 75%, var(--ink)); }
  .chip-tag::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--tag); }
  .code-chip {
    display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
    font-family: var(--num); font-size: calc(8px * var(--t)); font-weight: 600; letter-spacing: 0.04em;
    color: var(--ink); background: var(--wash-2); border-radius: 6px; padding: 2px 7px;
  }
  .code-chip svg { color: var(--ink-3); }
  .info-row { display: flex; align-items: flex-start; gap: 5px; margin-block-start: 4px; }
  .info-row svg { color: var(--ink-4); margin-block-start: 1px; }
  .info-text { font-size: calc(8.5px * var(--t)); color: var(--ink-2); line-height: 1.5; min-width: 0; }
  .info-text.muted { color: var(--ink-3); }
  .info-spacer { display: none; }
  .coords { font-family: var(--num); color: var(--ink-4); font-size: calc(8px * var(--t)); }
  .pdf-no-coords .coords { display: none; }
  .place-text { margin-block-start: 5px; font-size: calc(9px * var(--t)); color: var(--ink-2); line-height: 1.55; }
  .place-text .info-row { margin: 0; }
  .place-text .info-text { font-size: inherit; color: inherit; }
  .place-note {
    margin-block-start: 6px; padding: 6px 9px; border-radius: 9px; background: var(--wash);
    font-size: calc(8.5px * var(--t)); color: var(--ink-2);
  }
  .place-note .info-row { margin: 0; }
  .place-note .info-text { color: inherit; }
  .details { display: flex; flex-wrap: wrap; gap: 3px 12px; margin-block-start: 6px; }
  .detail { display: inline-flex; align-items: center; gap: 4px; font-size: calc(8px * var(--t)); color: var(--ink-3); }
  .detail svg { color: var(--ink-4); }
  .pdf-no-details .details { display: none; }
  ${PDF_MARKDOWN_CSS}

  /* ── Bookings and notes ──────────────────────────────────── */
  .note-card {
    display: flex; gap: 10px; align-items: flex-start; padding: 9px 11px; border-radius: 14px;
    break-inside: avoid; background: var(--wash);
  }
  .booking-card {
    background: color-mix(in srgb, var(--kind) 6%, var(--paper));
    border: 1px solid color-mix(in srgb, var(--kind) 20%, var(--paper));
  }
  .note-icon {
    width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; color: var(--ink-3); background: var(--paper);
  }
  .booking-card .note-icon { background: var(--kind); color: var(--paper); }
  .note-tinted { border-inline-start: 3px solid var(--note); }
  .note-tinted .note-icon { color: var(--note); }
  .note-body { flex: 1; min-width: 0; }
  .note-kicker { font-family: var(--num); font-size: calc(7.5px * var(--t)); font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--kind, var(--ink-3)); }
  .note-text { font-size: calc(9.5px * var(--t)); color: var(--ink); line-height: 1.5; }
  .booking-card .note-text { font-size: calc(11px * var(--t)); font-weight: 600; line-height: 1.35; }
  .note-time { font-size: calc(8.5px * var(--t)); color: var(--ink-3); margin-block-start: 2px; white-space: pre-line; }
  .note-line { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-block-start: 4px; }
  .note-line .route { font-family: var(--num); font-size: calc(9px * var(--t)); font-weight: 600; color: var(--ink); margin-inline-end: 2px; }
  .booking-card .chip { background: var(--paper); }
  .note-extra { display: flex; flex-wrap: wrap; gap: 4px; margin-block-start: 5px; }
  .transport-note { font-style: italic; white-space: pre-line; }
  .pdf-no-transport-notes .transport-note { display: none; }

  /* ── Plugin sections ─────────────────────────────────────── */
  .plugin-sections { padding: 2mm var(--gutter) 4mm; }
  .plugin-section { margin-block-end: 6mm; break-inside: avoid; }
  .plugin-section-title { font-size: calc(13px * var(--t)); font-weight: 600; margin-block-end: 2mm; padding-block-end: 2mm; border-block-end: 1px solid var(--hair); }
  .plugin-section-text { font-size: calc(9.5px * var(--t)); color: var(--ink-2); line-height: 1.55; margin-block-end: 5px; }
  .plugin-section-table { width: 100%; border-collapse: collapse; margin-block-start: 6px; }
  .plugin-section-table th { font-family: var(--num); font-size: calc(7.5px * var(--t)); font-weight: 600; color: var(--ink-4); text-transform: uppercase; letter-spacing: 0.1em; text-align: start; padding: 4px 8px; border-block-end: 1px solid var(--hair); }
  .plugin-section-table td { font-size: calc(9px * var(--t)); color: var(--ink-2); padding: 4px 8px; border-block-end: 1px solid var(--wash-2); }

  .doc-end { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8mm 0 4mm; color: var(--ink-4); font-size: 7.5px; letter-spacing: 0.06em; }
  .doc-end img { height: 10px; opacity: 0.55; }
`;
}
