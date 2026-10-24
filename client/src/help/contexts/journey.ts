import { defineScreen } from '../defineScreen'

/**
 * Help for the Journey addon: the list of journeys (`/journey`), one open
 * journal (`/journey/:id`) and TREK Studio over it (`/journey/:id/studio`),
 * three screens with their own guides. The step actions that produce the
 * pictures live in `e2e/help/journey.guide.ts`, keyed by the same ids; the
 * guides that read a recorded day need the Dawarich from `e2e/help/media.env`.
 */

const JOURNEY = 'Journey-Journal'
const ENTRIES = { slug: JOURNEY, anchor: 'journal-entries' }
const CREATING = { slug: JOURNEY, anchor: 'creating-a-journey' }
const LONG = { slug: JOURNEY, anchor: 'getting-around-a-long-journal' }
const STUDIO = { slug: JOURNEY, anchor: 'trek-studio' }

export const { context: journeyContext, guides: journeyGuides } = defineScreen({
  id: 'journey',
  route: '/journey',
  icon: 'bookOpen',
  bullets: 3,
  docs: [{ slug: JOURNEY }, { slug: 'Admin-Addons' }],
  guides: [
    ['create-journey', 'plus', 'guide', 3, 3, CREATING, ['continue-writing', 'add-entry'], true],
    ['open-journey', 'bookOpen', 'quick', 1, 1, { slug: JOURNEY, anchor: 'accessing-journey' }, ['continue-writing']],
    ['continue-writing', 'pencil', 'quick', 1, 1, LONG, ['add-entry', 'open-journey']],
  ],
})

export const { context: journalContext, guides: journalGuides } = defineScreen({
  id: 'journey-detail',
  parent: 'journey',
  icon: 'bookOpen',
  bullets: 7,
  docs: [{ slug: JOURNEY }, { slug: 'Dawarich', anchor: 'reviewing-stays-in-a-journal' }, { slug: 'Public-Share-Links' }],
  guides: [
    ['add-entry', 'plus', 'guide', 4, 2, ENTRIES, ['entry-photos', 'entry-draft', 'pros-cons', 'suggestions'], true],
    ['entry-photos', 'image', 'guide', 3, 2, { slug: JOURNEY, anchor: 'photo-order' }, ['add-entry', 'gallery-map'], true],
    ['entry-draft', 'filePen', 'quick', 2, 2, ENTRIES, ['add-entry', 'share-public'], true],
    ['suggestions', 'sparkles', 'guide', 3, 2, CREATING, ['add-entry', 'link-trip'], true],
    ['add-on-day', 'calendar', 'quick', 2, 1, LONG, ['add-entry', 'search-journey']],
    ['pros-cons', 'thumbsUp', 'quick', 2, 1, ENTRIES, ['entry-fields', 'add-entry'], true],
    ['search-journey', 'search', 'quick', 3, 2, LONG, ['add-on-day', 'gallery-map']],
    ['gallery-map', 'gallery', 'quick', 3, 2, { slug: JOURNEY, anchor: 'map-view' }, ['journey-map-layers', 'entry-photos', 'share-public']],
    ['journey-map-layers', 'map', 'guide', 3, 2, { slug: JOURNEY, anchor: 'map-layers' }, ['gallery-map', 'journey-keep-route', 'photo-location']],
    // The four guides of a recorded day: they connect the Dawarich from media.env
    // in their start and take it off again in their cleanup.
    ['journey-keep-route', 'route', 'guide', 3, 2, { slug: JOURNEY, anchor: 'keeping-a-recorded-day' }, ['journey-take-over-day', 'journey-map-layers', 'map-dawarich-trail'], true],
    ['journey-day-stays', 'mapPin', 'guide', 3, 2, { slug: 'Dawarich', anchor: 'reviewing-stays-in-a-journal' }, ['journey-take-over-day', 'journey-auto-prepare']],
    ['journey-take-over-day', 'listChecks', 'guide', 4, 2, { slug: JOURNEY, anchor: 'taking-over-a-day-with-its-stays' }, ['journey-day-stays', 'journey-keep-route', 'entry-draft']],
    ['journey-auto-prepare', 'cloudDownload', 'quick', 3, 2, { slug: JOURNEY, anchor: 'preparing-recorded-days-automatically' }, ['journey-take-over-day', 'journey-day-stays']],
    ['photo-location', 'mapPinned', 'quick', 2, 1, { slug: JOURNEY, anchor: 'map-view' }, ['journey-map-layers', 'entry-photos']],
    ['entry-fields', 'filter', 'quick', 2, 1, { slug: JOURNEY, anchor: 'entry-fields' }, ['pros-cons']],
    ['link-trip', 'link', 'guide', 3, 3, CREATING, ['suggestions']],
    ['journey-status', 'flag', 'quick', 2, 2, { slug: JOURNEY, anchor: 'journey-status' }, ['link-trip', 'archive-journey']],
    ['share-public', 'share', 'guide', 3, 3, { slug: JOURNEY, anchor: 'public-sharing' }, ['contributors', 'gallery-map', 'entry-draft']],
    ['contributors', 'userPlus', 'guide', 3, 2, CREATING, ['share-public']],
    ['studio', 'book', 'quick', 2, 2, STUDIO, ['entry-photos'], true],
    ['archive-journey', 'archive', 'quick', 2, 2, { slug: JOURNEY, anchor: 'journey-status' }, ['link-trip']],
  ],
})

/** TREK Studio, the photo-book designer that opens over a journal (`/journey/:id/studio`). */
export const { context: studioContext, guides: studioGuides } = defineScreen({
  id: 'journey-studio',
  parent: 'journey',
  icon: 'book',
  bullets: 8,
  docs: [STUDIO],
  guides: [
    ['studio-auto-layout', 'sparkles', 'guide', 3, 2, STUDIO, ['studio-pages', 'studio-layouts'], true],
    ['studio-pages', 'book', 'guide', 3, 2, STUDIO, ['studio-layouts', 'studio-spread-file'], true],
    ['studio-layouts', 'layout', 'quick', 2, 1, STUDIO, ['studio-my-layouts', 'studio-auto-layout', 'studio-content'], true],
    ['studio-my-layouts', 'bookmark', 'quick', 2, 1, STUDIO, ['studio-layouts', 'studio-spread-file'], true],
    ['studio-content', 'image', 'guide', 3, 2, STUDIO, ['studio-properties', 'studio-elements'], true],
    ['studio-theme', 'palette', 'guide', 3, 2, STUDIO, ['studio-background', 'studio-text-effects'], true],
    ['studio-elements', 'plus', 'quick', 2, 1, STUDIO, ['studio-stickers', 'studio-travel', 'studio-properties']],
    ['studio-stickers', 'sticker', 'quick', 2, 1, STUDIO, ['studio-elements', 'studio-layers'], true],
    ['studio-travel', 'globe', 'guide', 3, 2, STUDIO, ['studio-elements', 'studio-theme'], true],
    ['studio-text-effects', 'type', 'quick', 2, 1, STUDIO, ['studio-theme', 'studio-properties'], true],
    ['studio-background', 'paintBucket', 'quick', 2, 1, STUDIO, ['studio-theme', 'studio-layouts'], true],
    ['studio-layers', 'layers', 'quick', 2, 2, STUDIO, ['studio-properties', 'studio-stickers'], true],
    ['studio-properties', 'panelRight', 'guide', 3, 2, STUDIO, ['studio-content', 'studio-layers']],
    ['studio-format', 'filter', 'quick', 2, 2, STUDIO, ['studio-export']],
    ['studio-export', 'upload', 'guide', 3, 2, STUDIO, ['studio-format', 'studio-spread-file']],
    ['studio-spread-file', 'fileInput', 'quick', 2, 1, STUDIO, ['studio-export', 'studio-pages']],
  ],
})
