// FE-COMP-JOURNEYPDF-001 to FE-COMP-JOURNEYPDF-012
//
// JourneyBookPDF.tsx exports an async function
// `downloadJourneyBookPDF(journey, { t, locale })` that renders a PDF preview in
// an srcdoc iframe overlay (Safari-safe pattern). Tests verify the overlay DOM
// structure, the HTML content and that the book follows the app language.

import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock `marked` so we don't need the real markdown parser
vi.mock('marked', () => ({
  marked: {
    parse: (str: string) => `<p>${str}</p>`,
  },
}));

import { downloadJourneyBookPDF } from './JourneyBookPDF';
import type { JourneyDetail } from '../../store/journeyStore';

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildJourney(overrides: Partial<JourneyDetail> = {}): JourneyDetail {
  return {
    id: 1,
    user_id: 1,
    title: 'Iceland Ring Road',
    subtitle: 'Two weeks around the island',
    status: 'active',
    cover_image: null,
    cover_gradient: null,
    created_at: Date.now(),
    updated_at: Date.now(),
    entries: [
      {
        id: 10,
        journey_id: 1,
        author_id: 1,
        type: 'entry',
        title: 'Golden Circle',
        story: 'An incredible day of geysers and waterfalls.',
        entry_date: '2026-07-01',
        entry_time: '09:00',
        location_name: 'Thingvellir',
        location_lat: 64.255,
        location_lng: -21.13,
        mood: 'excited',
        weather: 'sunny',
        tags: [],
        pros_cons: { pros: ['Amazing views'], cons: ['Crowded'] },
        visibility: 'private',
        sort_order: 0,
        created_at: Date.now(),
        updated_at: Date.now(),
        source_trip_id: null,
        source_place_id: null,
        source_trip_name: null,
        photos: [
          {
            id: 100,
            entry_id: 10,
            provider: 'local',
            file_path: 'journey/geyser.jpg',
            thumbnail_path: null,
            asset_id: null,
            owner_id: null,
            shared: 0,
            caption: 'Strokkur erupting',
            sort_order: 0,
            created_at: Date.now(),
          },
        ],
      },
    ],
    trips: [],
    contributors: [],
    stats: { entries: 1, photos: 1, cities: 1 },
    ...overrides,
  } as unknown as JourneyDetail;
}

// ── Helpers to inspect the overlay ───────────────────────────────────────────

function getOverlay(): HTMLElement | null {
  return document.getElementById('journey-pdf-overlay');
}

function getIframe(): HTMLIFrameElement | null {
  return getOverlay()?.querySelector('iframe') ?? null;
}

// Echoes the key (plus any params) so the assertions read as "this string comes
// from i18n" instead of pinning English copy.
function t(key: string, params?: Record<string, string | number>): string {
  if (!params) return key;
  return `${key}(${Object.entries(params).map(([k, v]) => `${k}=${v}`).join(',')})`;
}

const longDate = (d: string, locale: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString(locale, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

// ── Setup ────────────────────────────────────────────────────────────────────

afterEach(() => {
  document.getElementById('journey-pdf-overlay')?.remove();
  vi.restoreAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('downloadJourneyBookPDF', () => {
  it('FE-COMP-JOURNEYPDF-001: appends overlay to document body', async () => {
    await downloadJourneyBookPDF(buildJourney());
    expect(getOverlay()).not.toBeNull();
    expect(document.body.contains(getOverlay())).toBe(true);
  });

  it('FE-COMP-JOURNEYPDF-002: overlay contains an iframe with srcdoc HTML', async () => {
    await downloadJourneyBookPDF(buildJourney());
    const iframe = getIframe();
    expect(iframe).not.toBeNull();
    const html = iframe!.srcdoc;
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('FE-COMP-JOURNEYPDF-003: overlay has close and save buttons', async () => {
    await downloadJourneyBookPDF(buildJourney());
    const overlay = getOverlay()!;
    expect(overlay.querySelector('#journey-pdf-close')).not.toBeNull();
    expect(overlay.querySelector('#journey-pdf-save')).not.toBeNull();
  });

  it('FE-COMP-JOURNEYPDF-004: HTML contains the journey title', async () => {
    await downloadJourneyBookPDF(buildJourney());
    const html = getIframe()!.srcdoc;
    expect(html).toContain('Iceland Ring Road');
  });

  it('FE-COMP-JOURNEYPDF-005: HTML contains entry content', async () => {
    await downloadJourneyBookPDF(buildJourney());
    const html = getIframe()!.srcdoc;
    expect(html).toContain('Golden Circle');
    // Story text is rendered via markdown
    expect(html).toContain('An incredible day of geysers and waterfalls.');
    // Pros/cons verdict cards are included
    expect(html).toContain('Amazing views');
    expect(html).toContain('Crowded');
  });

  it('FE-COMP-JOURNEYPDF-006: handles empty entries gracefully', async () => {
    const journey = buildJourney({ entries: [] });
    await downloadJourneyBookPDF(journey);
    expect(getOverlay()).not.toBeNull();
    const html = getIframe()!.srcdoc;
    expect(html).toContain('Iceland Ring Road');
    // No entry pages, but cover and closing page are still present. Without a
    // translator the chrome falls back to the raw keys instead of throwing.
    expect(html).toContain('journey.pdf.journeyBook');
    expect(html).toContain('journey.pdf.theEnd');
  });

  it('FE-COMP-JOURNEYPDF-007: sanitises HTML injected via an entry story and keeps the iframe script-free', async () => {
    const journey = buildJourney();
    journey.entries[0].story = 'Hello <script>alert(1)</script> <img src=x onerror="alert(2)"> world';
    await downloadJourneyBookPDF(journey);
    const iframe = getIframe()!;
    const html = iframe.srcdoc;

    // The script tag, image beacon and event handler are stripped from the story.
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('alert(2)');
    // Benign prose survives.
    expect(html).toContain('Hello');
    expect(html).toContain('world');
  });

  it('FE-COMP-JOURNEYPDF-008: renders cover, day header and closing page through i18n', async () => {
    await downloadJourneyBookPDF(buildJourney(), { t, locale: 'de-DE' });
    const html = getIframe()!.srcdoc;

    expect(html).toContain('<html lang="de">');
    expect(html).toContain('journey.pdf.journeyBook');
    expect(html).toContain('journey.stats.days');
    expect(html).toContain('journey.stats.entries');
    expect(html).toContain('journey.stats.photos');
    expect(html).toContain('journey.pdf.madeWith');
    expect(html).toContain('journey.pdf.theEnd');
    // Day header is the parameterised key plus a date in the picked locale —
    // the hardcoded 'en' formatting would not produce this string.
    expect(html).toContain('journey.detail.day(number=1)');
    expect(html).toContain(longDate('2026-07-01', 'de-DE'));
    // Pros/cons headings too.
    expect(html).toContain('journey.verdict.lovedIt');
    expect(html).toContain('journey.verdict.couldBeBetter');
  });

  it('FE-COMP-JOURNEYPDF-009: translates the preview bar above the book', async () => {
    await downloadJourneyBookPDF(buildJourney(), { t, locale: 'de-DE' });
    const overlay = getOverlay()!;

    // cover + one entry page + closing page
    expect(overlay.textContent).toContain('3 journey.pdf.pages');
    expect(overlay.querySelector('#journey-pdf-save')!.textContent).toBe('journey.pdf.saveAsPdf');
    expect(overlay.querySelector('#journey-pdf-close')!.textContent).toBe('common.close');
  });

  it('FE-COMP-JOURNEYPDF-010: prints mood and weather next to the entry', async () => {
    const journey = buildJourney();
    journey.entries[0].mood = 'good';
    journey.entries[0].weather = 'rainy';
    await downloadJourneyBookPDF(journey, { t, locale: 'en-US' });
    const html = getIframe()!.srcdoc;

    expect(html).toContain('journey.mood.good');
    expect(html).toContain('journey.weather.rainy');
    // Icons come along as inline SVG inside the chips.
    expect(html).toContain('class="entry-chips"');
    expect(html).toContain('<svg');
  });

  it('FE-COMP-JOURNEYPDF-011: skips chips for values the app does not know', async () => {
    // The fixture carries mood 'excited', which is not one of the four moods.
    await downloadJourneyBookPDF(buildJourney(), { t, locale: 'en-US' });
    const html = getIframe()!.srcdoc;
    // Scoped to the chip row: the page elsewhere is free to carry whatever the
    // fixture happens to leave undefined, and that is not what this asserts.
    const chips = html.match(/<div class="entry-chips">[\s\S]*?<\/div>/)?.[0] ?? '';

    expect(chips).not.toBe('');
    expect(chips).not.toContain('undefined');
    expect(chips).not.toContain('journey.mood.');
    // The known weather value still gets its chip.
    expect(chips).toContain('journey.weather.sunny');
  });

  it('FE-COMP-JOURNEYPDF-012: leaves out the chip row when an entry has neither', async () => {
    const journey = buildJourney();
    journey.entries[0].mood = null;
    journey.entries[0].weather = null;
    await downloadJourneyBookPDF(journey, { t, locale: 'en-US' });

    expect(getIframe()!.srcdoc).not.toContain('class="entry-chips"');
  });
});
