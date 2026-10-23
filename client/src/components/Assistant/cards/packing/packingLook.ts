import { ListTodo, Luggage } from 'lucide-react';

import type { EntityLook, PackLook } from '../cardTypes';

/**
 * What the packing lists and to-dos bring to the chat's pure look: the names
 * of their tools and reading steps, where an applied change of theirs opens
 * (the Lists tab, on its packing or to-do list), and how their answers group:
 * cards of one list and grouping fold into one, a tour's list or a template
 * stands on its own. A look stays pure, icons and literals only: the chat's
 * main chunk reads every look, so whatever a look imports ships with it.
 */

const OPEN_PACKING: EntityLook['open'] = () => ({ kind: 'tab', tab: 'listen', sub: 'packing' });
const OPEN_TODOS: EntityLook['open'] = () => ({ kind: 'tab', tab: 'listen', sub: 'todo' });

export const PACKING_LOOK = {
  verbs: {},
  tools: {
    bulk_import_packing: { labelKey: 'assistant.tool.bulk_import_packing' },
    apply_packing_template: { labelKey: 'assistant.tool.apply_packing_template' },
    set_packing_item_sharing: { labelKey: 'assistant.tool.set_packing_item_sharing' },
    set_packing_category_assignees: { labelKey: 'assistant.tool.set_packing_category_assignees' },
    reorder_packing_items: { labelKey: 'assistant.tool.reorder_packing_items' },
    create_packing_bag: { labelKey: 'assistant.tool.create_packing_bag' },
    update_packing_bag: { labelKey: 'assistant.tool.update_packing_bag' },
    delete_packing_bag: { labelKey: 'assistant.tool.delete_packing_bag' },
    set_bag_members: { labelKey: 'assistant.tool.set_bag_members' },
    save_packing_template: { labelKey: 'assistant.tool.save_packing_template' },
    delete_packing_template: { labelKey: 'assistant.tool.delete_packing_template' },
    set_todo_category_assignees: { labelKey: 'assistant.tool.set_todo_category_assignees' },
    reorder_todos: { labelKey: 'assistant.tool.reorder_todos' },
    link_tour_packing: { labelKey: 'assistant.tool.link_tour_packing' },
    unlink_tour_packing: { labelKey: 'assistant.tool.unlink_tour_packing' },
  },
  steps: {
    list_packing_items: { stepKey: 'assistant.step.packingItems' },
    list_packing_bags: { stepKey: 'assistant.step.packingBags' },
    get_packing_category_assignees: { stepKey: 'assistant.step.packingAssignees' },
    list_packing_templates: { stepKey: 'assistant.step.packingTemplates' },
    get_todo_category_assignees: { stepKey: 'assistant.step.todoAssignees' },
    get_tour_packing: { stepKey: 'assistant.step.tourPacking' },
  },
  entities: {
    packing: { Icon: Luggage, openLabelKey: 'tours.packing.open', open: OPEN_PACKING },
    packing_bag: { Icon: Luggage, openLabelKey: 'tours.packing.open', open: OPEN_PACKING },
    todo: { Icon: ListTodo, openLabelKey: 'assistant.card.todo.open', open: OPEN_TODOS },
  },
  cards: {
    packingList: {
      entity: (card) =>
        card.groupBy === 'bag' && card.groups.every((group) => group.items.length === 0) ? 'packing_bag' : 'packing',
      group: (card) =>
        card.source.type === 'trip' ? `packingList:trip:${card.groupBy}` : `packingList:${card.source.type}`,
    },
    todoList: { entity: () => 'todo' },
  },
} satisfies PackLook<'packingList' | 'todoList'>;
