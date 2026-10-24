import { defineScreen } from '../defineScreen'

/**
 * Help for the Files tab of a trip: getting documents in, giving them a note
 * and links into the plan, finding them again, reading them on the spot and
 * getting them back out of the trash, and keeping them in step with a
 * document store.
 * A screen under `trip`; the step actions live in `e2e/help/trip-files.guide.ts`.
 */

const FILES = 'Documents-and-Files'
const LINKING = { slug: FILES, anchor: 'linking-files-to-places-reservations-or-assignments' }

export const { context: tripFilesContext, guides: tripFilesGuides } = defineScreen({
  id: 'trip-files',
  parent: 'trip',
  route: '/trips/:id?tab=dateien',
  icon: 'folder',
  bullets: 6,
  docs: [{ slug: FILES }, { slug: 'Document-Sync' }],
  guides: [
    ['files-upload', 'upload', 'guide', 4, 3, { slug: FILES, anchor: 'uploading' }, ['files-link', 'files-trash'], true],
    ['files-link', 'link', 'guide', 5, 3, LINKING, ['files-upload', 'place-files', 'link-booking'], true],
    ['files-star', 'star', 'quick', 3, 2, { slug: FILES, anchor: 'starring' }, ['files-filter', 'files-preview'], true],
    ['files-filter', 'filter', 'quick', 4, 2, { slug: FILES, anchor: 'browsing-and-filtering' }, ['files-star', 'files-preview']],
    ['files-preview', 'eye', 'guide', 5, 3, { slug: FILES, anchor: 'previewing-files' }, ['files-filter', 'files-upload']],
    ['files-trash', 'trash', 'guide', 5, 3, { slug: FILES, anchor: 'trash' }, ['files-upload', 'files-star'], true],
    // Last: the two guides of this screen that need a document store on the
    // network; a missing one fails these pictures and none of the others.
    ['files-sync', 'repeat', 'guide', 6, 4, { slug: 'Document-Sync', anchor: 'binding-a-trip' }, ['files-sync-settings', 'files-upload', 'document-providers'], true],
    ['files-sync-settings', 'sliders', 'guide', 5, 4, { slug: 'Document-Sync', anchor: 'the-binding-card' }, ['files-sync', 'files-trash']],
  ],
})
