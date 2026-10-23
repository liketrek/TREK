import type { CardView } from '../cardTypes';
import { isRunnable } from './checklistModel';
import { PackingChangeBody, PackingChangeFacts, PackingChangeRun, PackingListBlock } from './PackingListCard';
import { TodoChangeBody, TodoChangeLine, TodoChangeRun, TodoListBlock } from './TodoListCard';

/**
 * How the kinds of the packing lists and to-dos draw in the chat. An answer
 * draws its list in a card of its own; a change of one row states its facts
 * on its line and joins a run of such changes as one checklist; any other
 * change draws its groups, bags or people under its line. This file only maps
 * each kind to its view: the components live in sibling files, since a file
 * that exports anything besides components breaks fast refresh, and
 * lint:warnings holds react-refresh/only-export-components at zero for a new
 * file.
 */
export const PACKING_VIEWS = {
  packingList: {
    Block: PackingListBlock,
    Facts: PackingChangeFacts,
    Body: PackingChangeBody,
    Run: PackingChangeRun,
    runnable: isRunnable,
  },
  todoList: {
    Block: TodoListBlock,
    Facts: TodoChangeLine,
    Body: TodoChangeBody,
    Run: TodoChangeRun,
    runnable: isRunnable,
  },
} satisfies { [K in 'packingList' | 'todoList']: CardView<K> };
