import { defineScreen } from '../defineScreen'

/**
 * Help for the Collections addon (`/collections`): the place library outside
 * of any trip, and with Tours on the whole tours a list keeps. The step
 * actions that produce the pictures live in `e2e/help/collections.guide.ts`,
 * keyed by the same ids.
 */

const COLLECTIONS = 'Collections'
const LISTS = { slug: COLLECTIONS, anchor: 'lists' }
const ADDING = { slug: COLLECTIONS, anchor: 'adding-places' }
const BULK = { slug: COLLECTIONS, anchor: 'filtering-and-bulk-actions' }
const SHARING = { slug: COLLECTIONS, anchor: 'sharing-a-list-fusion' }
const FILES = { slug: COLLECTIONS, anchor: 'sending-a-list-to-someone-else' }
const TOURS = { slug: COLLECTIONS, anchor: 'whole-tours' }

export const { context: collectionsContext, guides: collectionsGuides } = defineScreen({
  id: 'collections',
  route: '/collections',
  icon: 'bookmark',
  bullets: 7,
  docs: [{ slug: COLLECTIONS }, { slug: 'Admin-Categories' }, { slug: 'Admin-Addons' }],
  guides: [
    ['create-list', 'plus', 'guide', 3, 1, LISTS, ['add-place', 'edit-list', 'import-from-trip'], true],
    ['add-place', 'mapPin', 'guide', 3, 2, ADDING, ['import-from-trip', 'place-detail'], true],
    ['import-from-trip', 'download', 'guide', 4, 2, ADDING, ['add-place', 'copy-to-trip'], true],
    ['place-status', 'checkCircle', 'quick', 2, 2, { slug: COLLECTIONS, anchor: 'place-status' }, ['place-detail', 'filter-select'], true],
    ['place-detail', 'panelRight', 'quick', 2, 2, { slug: COLLECTIONS, anchor: 'place-detail' }, ['place-status', 'copy-to-trip', 'labels']],
    ['labels', 'tags', 'guide', 4, 2, { slug: COLLECTIONS, anchor: 'custom-labels' }, ['filter-select', 'place-detail'], true],
    ['filter-select', 'filter', 'guide', 3, 1, BULK, ['move-to-list', 'copy-to-trip', 'labels'], true],
    ['move-to-list', 'folderInput', 'quick', 3, 2, BULK, ['filter-select', 'labels'], true],
    ['copy-to-trip', 'copy', 'guide', 3, 2, BULK, ['filter-select', 'import-from-trip'], true],
    ['share-list', 'userPlus', 'guide', 3, 2, SHARING, ['accept-list-invite', 'export-list'], true],
    ['accept-list-invite', 'mailCheck', 'quick', 2, 2, SHARING, ['share-list'], true],
    ['export-list', 'upload', 'quick', 2, 2, FILES, ['import-file', 'share-list']],
    ['import-file', 'fileInput', 'guide', 3, 2, FILES, ['export-list', 'create-list'], true],
    ['edit-list', 'pencil', 'quick', 2, 1, LISTS, ['create-list'], true],
    ['all-saved', 'library', 'quick', 2, 1, LISTS, ['filter-select']],
    // Last: the two guides that need the Tours addon and a kept tour.
    ['tour-collection-add-to-trip', 'copyPlus', 'guide', 4, 3, TOURS, ['tour-collection-manage', 'copy-to-trip'], true],
    ['tour-collection-manage', 'route', 'quick', 3, 3, TOURS, ['tour-collection-add-to-trip'], true],
  ],
})
