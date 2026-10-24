import type { BOOK_GROUP_OP_SCHEMAS } from './book-group-ops.schema';
import {
  groupElements,
  groupMembers,
  renameElement,
  renameGroup,
  setElementsHidden,
  ungroupElements,
} from './book-groups';
import { failOp, pageElement, unlockedElement } from './book-ops-core';
import type { BookSpread } from './book.schema';

import type { z } from 'zod';

/**
 * What `group`, `ungroup`, `name` and `hide` do to a page, for `applyBookOps`.
 *
 * Grouping moves the members next to each other in the paint order, so a
 * locked element refuses it like any other change. Ungrouping, naming and
 * hiding move nothing on the page and take locked elements too, as the
 * Studio's layers panel does: a locked background can still be hidden to get
 * at what is behind it.
 */

type GroupOp = z.infer<(typeof BOOK_GROUP_OP_SCHEMAS)[number]>;

interface GroupOpEnv {
  newId: (prefix: string) => string;
  opIndex: number;
}

const BOOK_GROUP_OP_NAMES: ReadonlySet<string> = new Set(['group', 'ungroup', 'name', 'hide']);

export function isGroupOp(op: { op: string }): op is GroupOp {
  return BOOK_GROUP_OP_NAMES.has(op.op);
}

function existingGroup(spread: BookSpread, groupId: string, opIndex: number): void {
  if (!groupMembers(spread, groupId).length) {
    throw failOp('group_not_found', `no group ${groupId} on this page`, opIndex);
  }
}

export function applyGroupOp(spread: BookSpread, op: GroupOp, env: GroupOpEnv): BookSpread {
  switch (op.op) {
    case 'group': {
      const ids = [...new Set(op.elementIds)];
      for (const id of ids) unlockedElement(pageElement(spread, id, env.opIndex), env.opIndex);
      if (ids.length < 2) throw failOp('not_enough_elements', 'a group needs two different elements', env.opIndex);
      return groupElements(spread, ids, env.newId('g'), op.name);
    }
    case 'ungroup':
      existingGroup(spread, op.groupId, env.opIndex);
      return ungroupElements(spread, op.groupId);
    case 'name':
      if (op.groupId !== undefined) {
        existingGroup(spread, op.groupId, env.opIndex);
        return renameGroup(spread, op.groupId, op.name);
      }
      pageElement(spread, op.elementId ?? '', env.opIndex);
      return renameElement(spread, op.elementId ?? '', op.name);
    case 'hide': {
      const ids = [...new Set(op.elementIds)];
      for (const id of ids) pageElement(spread, id, env.opIndex);
      return setElementsHidden(spread, ids, op.hidden);
    }
  }
}
