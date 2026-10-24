import type {
  BookAlignEdge,
  BookAlignTo,
  BookArrangeTo,
  BookCopiedStyle,
  BookDistributeAxis,
  BookDocument,
  BookElement,
  BookSpread,
} from '@trek/shared';
import {
  MAX_SPREAD_ELEMENTS,
  alignElements,
  arrangeElements,
  arrangeWithinGroup,
  bookElementId,
  bookElementStyle,
  bookElementStyled,
  commonGroup,
  distributableCount,
  distributeElements,
  expandToGroups,
  gatherGroups,
  groupElements,
  groupMembers,
  isWholeGroup,
  pastableStyle,
  regroupCopies,
  renameElement,
  renameGroup,
  setElementsHidden,
  tidyGroups,
  ungroupElements,
  withCopies,
  withoutGroup,
} from '@trek/shared';

/**
 * Groups, layers and the editor's productivity actions (journey-studio WP6).
 *
 * The geometry and the group rules are the book engine's own
 * (shared/src/book/book-groups.ts, book-arrange.ts, book-style-copy.ts): the
 * `group`, `align`, `distribute`, `arrange` and `style` operations the
 * assistant sends run the same functions, so a press here and an assistant's
 * change move a page the same way. What lives here is only how the Studio
 * holds them: which page, what is selected, and one undo step per action.
 */

/** The part of the Studio store these actions read and write. */
interface Host {
  doc: BookDocument | null;
  selection: string[];
  enteredGroup: string | null;
  styleClip: BookCopiedStyle | null;
  commit: (fn: (doc: BookDocument) => BookDocument) => void;
  apply: (fn: (doc: BookDocument) => BookDocument) => void;
  refuseFull: () => void;
}

type Set = (partial: Partial<Host> | ((s: Host) => Partial<Host>)) => void;
type Get = () => Host;

export interface StudioLayerActions {
  /**
   * The group the user has stepped into with a double-click, so a click picks
   * one member rather than the whole group. Null outside every group.
   */
  enteredGroup: string | null;
  /** A copied look, for paste style (Ctrl+Alt+C, Ctrl+Alt+V). Kept across pages. */
  styleClip: BookCopiedStyle | null;

  /**
   * What a click on an element selects: its whole group, or the element alone
   * inside the group stepped into. `additive` adds it to the selection, or takes
   * it out when it is all in already.
   */
  pick: (spreadIndex: number, id: string, additive: boolean) => void;
  /** A whole group selected, from its row in the layers panel; `additive` adds it. */
  selectGroup: (spreadIndex: number, groupId: string, additive: boolean) => void;
  /** Step into an element's group and select the element alone (a double-click). */
  enterGroup: (spreadIndex: number, id: string) => void;
  /** Step out of the group again, with the whole group selected (Escape). Answers whether it did. */
  leaveGroup: (spreadIndex: number) => boolean;
  /** Every element on the page that is not hidden (Ctrl+A). */
  selectAll: (spreadIndex: number) => void;

  /** Move the unlocked part of the selection by millimetres, inside an open gesture (arrow keys). */
  nudge: (spreadIndex: number, dx: number, dy: number) => void;
  /** The selection, one group (Ctrl+G). Locked elements stay out of it. */
  group: (spreadIndex: number) => void;
  /** Every group in the selection back to its members (Ctrl+Shift+G). */
  ungroup: (spreadIndex: number) => void;
  /** The selection lined up; locked elements stay where they are. */
  align: (spreadIndex: number, edge: BookAlignEdge, to: BookAlignTo) => void;
  /** The selection spaced evenly, three elements or groups at least. */
  distribute: (spreadIndex: number, axis: BookDistributeAxis) => void;
  /** Elements, or whole groups, moved in the paint order. */
  raise: (spreadIndex: number, ids: string | readonly string[], to: BookArrangeTo | 'up' | 'down') => void;
  /**
   * Elements dragged to another place in the layers list: in front of
   * (`above`) or behind (`below`) the anchor. Dropped onto a member of a group
   * they join that group; dropped beside a group or an ungrouped element they
   * are on their own.
   */
  restack: (
    spreadIndex: number,
    ids: readonly string[],
    anchorId: string,
    where: 'above' | 'below',
    join: boolean
  ) => void;
  setHidden: (spreadIndex: number, ids: readonly string[], hidden: boolean) => void;
  setLocked: (spreadIndex: number, ids: readonly string[], locked: boolean) => void;
  renameLayer: (spreadIndex: number, target: { elementId: string } | { groupId: string }, name: string) => void;
  /** Copy the look of the first selected element. */
  copyStyle: (spreadIndex: number) => void;
  /** Paste the copied look onto the selection, what each kind can take, as one undo step. */
  pasteStyle: (spreadIndex: number) => void;
  /** Copies of the selection beside it, groups copied as new groups, selected. */
  duplicate: (spreadIndex: number, ids: readonly string[]) => void;
}

function onSpread(doc: BookDocument, index: number, fn: (s: BookSpread) => BookSpread): BookDocument {
  const spread = doc.spreads[index];
  if (!spread) return doc;
  const next = fn(spread);
  if (next === spread) return doc;
  const spreads = doc.spreads.slice();
  spreads[index] = next;
  return { ...doc, spreads };
}

const spreadOf = (get: Get, index: number) => get().doc?.spreads[index];

/** The selected elements on a spread that may change: on the page and unlocked. */
function movable(spread: BookSpread, ids: readonly string[]): BookElement[] {
  return spread.elements.filter((e) => ids.includes(e.id) && !e.locked);
}

/** The element `id` selects with a click, given the group stepped into. */
function clickTarget(spread: BookSpread, id: string, entered: string | null): string[] {
  const el = spread.elements.find((e) => e.id === id);
  if (!el) return [];
  return el.group && el.group === entered ? [id] : expandToGroups(spread, [id]);
}

const OFFSET = 4;

/** What a click, a double-click, a row or Ctrl+A selects. */
function selectionActions(
  set: Set,
  get: Get
): Pick<StudioLayerActions, 'pick' | 'selectGroup' | 'enterGroup' | 'leaveGroup' | 'selectAll'> {
  return {
    pick: (spreadIndex, id, additive) => {
      const spread = spreadOf(get, spreadIndex);
      if (!spread) return;
      const { selection, enteredGroup } = get();
      const target = clickTarget(spread, id, enteredGroup);
      const el = spread.elements.find((e) => e.id === id);
      // A click outside the group stepped into steps out of it.
      const entered = el?.group && el.group === enteredGroup ? enteredGroup : null;
      if (additive) {
        const all = target.every((t) => selection.includes(t));
        const next = all
          ? selection.filter((s) => !target.includes(s))
          : [...selection, ...target.filter((t) => !selection.includes(t))];
        set({ selection: next, enteredGroup: entered });
        return;
      }
      // Pressing on what is already selected keeps it, so a multi-selection can be dragged.
      if (target.every((t) => selection.includes(t))) {
        set({ enteredGroup: entered });
        return;
      }
      set({ selection: target, enteredGroup: entered });
    },

    selectGroup: (spreadIndex, groupId, additive) => {
      const spread = spreadOf(get, spreadIndex);
      if (!spread) return;
      const ids = groupMembers(spread, groupId).map((e) => e.id);
      const selection = get().selection;
      set({ selection: additive ? [...selection.filter((s) => !ids.includes(s)), ...ids] : ids, enteredGroup: null });
    },

    enterGroup: (spreadIndex, id) => {
      const el = spreadOf(get, spreadIndex)?.elements.find((e) => e.id === id);
      if (!el?.group) return;
      set({ selection: [id], enteredGroup: el.group });
    },

    leaveGroup: (spreadIndex) => {
      const spread = spreadOf(get, spreadIndex);
      const { enteredGroup } = get();
      if (!spread || !enteredGroup) return false;
      set({ selection: expandToGroups(spread, get().selection), enteredGroup: null });
      return true;
    },

    selectAll: (spreadIndex) => {
      const spread = spreadOf(get, spreadIndex);
      if (!spread) return;
      set({ selection: spread.elements.filter((e) => !e.hidden).map((e) => e.id), enteredGroup: null });
    },
  };
}

/** Moving, grouping, lining up and restacking. */
function arrangeActions(
  set: Set,
  get: Get
): Pick<StudioLayerActions, 'nudge' | 'group' | 'ungroup' | 'align' | 'distribute' | 'raise' | 'restack'> {
  const commitOn = (index: number, fn: (s: BookSpread) => BookSpread) =>
    get().commit((doc) => onSpread(doc, index, fn));
  return {
    nudge: (spreadIndex, dx, dy) => {
      const ids = get().selection;
      get().apply((doc) =>
        onSpread(doc, spreadIndex, (sp) => {
          const moving = new Set(movable(sp, ids).map((e) => e.id));
          if (!moving.size) return sp;
          const round = (v: number) => Math.round(v * 100) / 100;
          const elements = sp.elements.map((e) =>
            moving.has(e.id) ? { ...e, frame: { ...e.frame, x: round(e.frame.x + dx), y: round(e.frame.y + dy) } } : e
          );
          return { ...sp, elements };
        })
      );
    },

    group: (spreadIndex) => {
      const spread = spreadOf(get, spreadIndex);
      if (!spread) return;
      const ids = movable(spread, get().selection).map((e) => e.id);
      if (ids.length < 2 || isWholeGroup(spread, ids)) return;
      const groupId = bookElementId('g');
      commitOn(spreadIndex, (sp) => groupElements(sp, ids, groupId));
      set({ selection: ids, enteredGroup: null });
    },

    ungroup: (spreadIndex) => {
      const spread = spreadOf(get, spreadIndex);
      if (!spread) return;
      const selection = get().selection;
      const groups = new Set(
        spread.elements.filter((e) => selection.includes(e.id) && e.group).map((e) => e.group as string)
      );
      if (!groups.size) return;
      commitOn(spreadIndex, (sp) => [...groups].reduce((acc, g) => ungroupElements(acc, g), sp));
      set({ enteredGroup: null });
    },

    align: (spreadIndex, edge, to) => {
      const spread = spreadOf(get, spreadIndex);
      if (!spread) return;
      const els = movable(spread, get().selection);
      if (!els.length) return;
      const doc = get().doc;
      if (!doc) return;
      commitOn(spreadIndex, (sp) => alignElements(sp, doc.page, els, edge, to));
    },

    distribute: (spreadIndex, axis) => {
      const spread = spreadOf(get, spreadIndex);
      if (!spread) return;
      const els = movable(spread, get().selection);
      if (distributableCount(spread, els) < 3) return;
      commitOn(spreadIndex, (sp) => distributeElements(sp, els, axis));
    },

    raise: (spreadIndex, ids, to) => {
      const list = typeof ids === 'string' ? [ids] : ids;
      const spread = spreadOf(get, spreadIndex);
      if (!spread || !list.length) return;
      const step: BookArrangeTo = to === 'up' ? 'forward' : to === 'down' ? 'backward' : to;
      // A group member moved alone inside its group; anything else takes its whole group along.
      const entered = get().enteredGroup;
      if (entered !== null && commonGroup(spread, list) === entered) {
        commitOn(spreadIndex, (sp) => arrangeWithinGroup(sp, entered, list, step));
        return;
      }
      const chosen = expandToGroups(spread, list);
      commitOn(spreadIndex, (sp) => {
        const next = arrangeElements(sp, chosen, step);
        return next.elements.every((e, i) => e === sp.elements[i]) ? sp : next;
      });
    },

    restack: (spreadIndex, ids, anchorId, where, join) => {
      const spread = spreadOf(get, spreadIndex);
      const anchor = spread?.elements.find((e) => e.id === anchorId);
      if (!spread || !anchor || ids.includes(anchorId)) return;
      commitOn(spreadIndex, (sp) => {
        const moving = sp.elements.filter((e) => ids.includes(e.id));
        const rest = sp.elements.filter((e) => !ids.includes(e.id));
        const at = rest.findIndex((e) => e.id === anchorId) + (where === 'above' ? 1 : 0);
        // A whole group dragged keeps itself together; a member dragged alone joins or leaves.
        const whole = new Set(
          moving
            .filter((e) => e.group && groupMembers(sp, e.group).every((m) => ids.includes(m.id)))
            .map((e) => e.group)
        );
        const placed = moving.map((e) => {
          if (join && anchor.group) return { ...e, group: anchor.group };
          if (!e.group || whole.has(e.group)) return e;
          return withoutGroup(e);
        });
        const elements = [...rest.slice(0, at), ...placed, ...rest.slice(at)];
        return tidyGroups(gatherGroups({ ...sp, elements }));
      });
    },
  };
}

/** The layers panel's toggles and names, the style clipboard and duplicate. */
function panelActions(
  set: Set,
  get: Get
): Pick<StudioLayerActions, 'setHidden' | 'setLocked' | 'renameLayer' | 'copyStyle' | 'pasteStyle' | 'duplicate'> {
  const commitOn = (index: number, fn: (s: BookSpread) => BookSpread) =>
    get().commit((doc) => onSpread(doc, index, fn));
  return {
    setHidden: (spreadIndex, ids, hidden) => {
      commitOn(spreadIndex, (sp) => setElementsHidden(sp, ids, hidden));
      // A hidden element cannot be seen to be selected; it leaves the selection.
      if (hidden) set((s) => ({ selection: s.selection.filter((id) => !ids.includes(id)) }));
    },

    setLocked: (spreadIndex, ids, locked) =>
      commitOn(spreadIndex, (sp) => ({
        ...sp,
        elements: sp.elements.map((e) => (ids.includes(e.id) ? { ...e, locked } : e)),
      })),

    renameLayer: (spreadIndex, target, name) =>
      commitOn(spreadIndex, (sp) =>
        'groupId' in target ? renameGroup(sp, target.groupId, name) : renameElement(sp, target.elementId, name)
      ),

    copyStyle: (spreadIndex) => {
      const spread = spreadOf(get, spreadIndex);
      const el = spread?.elements.find((e) => get().selection.includes(e.id));
      if (el) set({ styleClip: bookElementStyle(el) });
    },

    pasteStyle: (spreadIndex) => {
      const { styleClip, selection, doc } = get();
      const spread = spreadOf(get, spreadIndex);
      if (!styleClip || !spread) return;
      const targets = movable(spread, selection);
      if (!targets.length) return;
      commitOn(spreadIndex, (sp) => {
        let changed = false;
        const elements = sp.elements.map((e) => {
          if (!targets.some((t) => t.id === e.id)) return e;
          const look = pastableStyle(styleClip, e.kind);
          if (!look) return e;
          changed = true;
          // The engine's own restyle: a pasted colour unlinks the theme, a pasted fill replaces a paint.
          return bookElementStyled(e, look, doc?.theme);
        });
        return changed ? { ...sp, elements } : sp;
      });
    },

    duplicate: (spreadIndex, ids) => {
      const spread = spreadOf(get, spreadIndex);
      if (!spread) return;
      const doc = get().doc;
      if (!doc) return;
      const chosen = spread.elements.filter((e) => ids.includes(e.id));
      // The page's own cap: copies that would make the book unsaveable are not made.
      if (!chosen.length) return;
      if (spread.elements.length + chosen.length > MAX_SPREAD_ELEMENTS) {
        get().refuseFull();
        return;
      }
      const copies = chosen.map(
        (e) =>
          ({
            ...e,
            id: bookElementId(e.kind.charAt(0)),
            frame: { ...e.frame, x: e.frame.x + OFFSET, y: e.frame.y + OFFSET },
          }) as BookElement
      );
      const regrouped = regroupCopies(copies, spread, bookElementId);
      commitOn(spreadIndex, (sp) => withCopies(sp, regrouped));
      set({ selection: regrouped.elements.map((e) => e.id), enteredGroup: null });
    },
  };
}

export function studioLayerActions(set: Set, get: Get): StudioLayerActions {
  return {
    enteredGroup: null,
    styleClip: null,
    ...selectionActions(set, get),
    ...arrangeActions(set, get),
    ...panelActions(set, get),
  };
}
