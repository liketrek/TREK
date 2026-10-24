import { defineScreen } from '../defineScreen'

/**
 * Help for the Lists tab of a trip: the packing list (lists of items, who
 * brings what, what it weighs and which bag it is in) and the to-do list
 * (tasks with a list, a priority, a due date and someone's name on them).
 * The drags in arrange-packing-list are stills with an arrow: a browser drag
 * leaves the dragged row out of a recording, so a loop shows only a line jumping.
 * A screen under `trip`; the step actions live in `e2e/help/trip-lists.guide.ts`.
 */

const PACKING = 'Packing-Lists'
const TODOS = 'Todos-and-Tasks'
const TEMPLATES = 'Packing-Templates'

export const { context: tripListsContext, guides: tripListsGuides } = defineScreen({
  id: 'trip-lists',
  parent: 'trip',
  route: '/trips/:id?tab=listen',
  icon: 'listChecks',
  bullets: 6,
  docs: [{ slug: PACKING }, { slug: TODOS }, { slug: TEMPLATES }],
  guides: [
    ['packing-categories', 'tags', 'guide', 5, 3, { slug: PACKING, anchor: 'categories' }, ['arrange-packing-list', 'check-off-packing', 'apply-packing-template'], true],
    ['arrange-packing-list', 'arrowUpDown', 'quick', 3, 2, { slug: PACKING, anchor: 'filters' }, ['packing-categories', 'check-off-packing'], true],
    ['check-off-packing', 'checkCircle', 'guide', 5, 4, { slug: PACKING, anchor: 'progress-bar' }, ['count-packed-pieces', 'packing-categories', 'share-packing-item'], true],
    ['count-packed-pieces', 'packagePlus', 'quick', 4, 3, { slug: PACKING, anchor: 'items' }, ['check-off-packing', 'packing-bags']],
    ['apply-packing-template', 'library', 'guide', 4, 3, { slug: TEMPLATES, anchor: 'applying-a-template' }, ['packing-templates', 'import-packing-list'], true],
    ['import-packing-list', 'fileInput', 'quick', 4, 2, { slug: PACKING, anchor: 'importing-a-list' }, ['export-packing-list', 'apply-packing-template'], true],
    ['export-packing-list', 'upload', 'quick', 4, 2, { slug: PACKING, anchor: 'printing-and-exporting' }, ['import-packing-list', 'apply-packing-template'], true],
    ['share-packing-item', 'users', 'guide', 5, 3, { slug: PACKING, anchor: 'the-three-tiers' }, ['packing-categories', 'add-member']],
    ['packing-bags', 'archive', 'tour', 6, 4, { slug: PACKING, anchor: 'bag-tracking' }, ['toggle-addon', 'count-packed-pieces', 'import-packing-list'], true],
    ['create-todo', 'plus', 'guide', 6, 3, { slug: TODOS, anchor: 'adding-tasks' }, ['todo-filters'], true],
    ['todo-filters', 'filter', 'guide', 5, 2, { slug: TODOS, anchor: 'sidebar-filters' }, ['create-todo']],
  ],
})
