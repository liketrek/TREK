import type { BookElement } from '@trek/shared';
import { isWholeGroup } from '@trek/shared';
import {
  Award,
  ChartColumn,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  GripVertical,
  Group,
  ImageIcon,
  List,
  Lock,
  MapIcon,
  Shapes,
  Sparkles,
  Square,
  Type,
  Ungroup,
  Unlock,
  type LucideIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { useStudioStore } from '../../store/studioStore';
import '../../styles/studio-layers.css';
import { Tooltip } from '../shared/Tooltip';
import { PanelHead } from './StudioPanelHead';
import {
  dropOn,
  layerKeyAction,
  layerLabel,
  layerRows,
  rowIds,
  type LayerDrop,
  type LayerKeyAction,
  type LayerRow,
} from './studioLayerRows';
import { runsRtl } from './studioRoving';
import { useStudioShortcut } from './studioShortcut';

/**
 * The layers of the open page, front to back (journey-studio WP6).
 *
 * One row per element and one per group, its members indented under it. A row
 * selects what it stands for; a member's row selects the member alone, inside
 * its group, the way a double-click on the sheet does. Rows drag to restack:
 * the upper half of a row puts what is dragged in front of it, the lower half
 * behind it, and a member's row takes it into that group. Lock and visibility
 * sit at the end of every row, always shown when they are on so a locked or
 * hidden layer can be told at a glance; a hidden layer is dimmed, not removed,
 * since this panel is the way back to it. Every change is one undo step.
 *
 * The tree is one stop in the Tab order, the row last focused or else the
 * selected one, and its keys are a tree view's (studioLayerRows.ts): the arrows
 * move along it and open or close a group, Enter or Space selects a row (with
 * Shift added), F2 renames it. A hidden or locked layer, which cannot be
 * clicked on the page, is reached this way too.
 */

const KIND_ICONS: Record<string, LucideIcon> = {
  photo: ImageIcon,
  text: Type,
  shape: Square,
  icon: Sparkles,
  map: MapIcon,
  stats: ChartColumn,
  countries: Globe,
  badge: Award,
  list: List,
};

/** How far, in pixels, a press on a row travels before it is a drag rather than a click. */
const DRAG_PX = 4;

interface Drag {
  ids: string[];
  startY: number;
  active: boolean;
  drop: LayerDrop | null;
  /** The row the pointer is over and which half, for the insertion line. */
  overKey: string | null;
  upper: boolean;
}

type T = (k: string, params?: Record<string, string | number>) => string;

export function StudioLayersPanel({ t }: { t: T }) {
  const spreadIndex = useStudioStore((s) => s.activeSpread);
  const spread = useStudioStore((s) => s.doc?.spreads[s.activeSpread]);
  const selection = useStudioStore((s) => s.selection);
  const enteredGroup = useStudioStore((s) => s.enteredGroup);
  const readOnly = useStudioStore((s) => s.readOnly);
  const pick = useStudioStore((s) => s.pick);
  const selectGroup = useStudioStore((s) => s.selectGroup);
  const enterGroup = useStudioStore((s) => s.enterGroup);
  const restack = useStudioStore((s) => s.restack);
  const setHidden = useStudioStore((s) => s.setHidden);
  const setLocked = useStudioStore((s) => s.setLocked);
  const renameLayer = useStudioStore((s) => s.renameLayer);
  const group = useStudioStore((s) => s.group);
  const ungroup = useStudioStore((s) => s.ungroup);
  const keys = useStudioShortcut();

  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [renaming, setRenaming] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  /** The row the keyboard is on, so the tree keeps its place in the Tab order. */
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  /** A drag ends in a click on the row it started from; that click is not a choice. */
  const justDragged = useRef(false);

  if (!spread) return null;
  const rows = layerRows(spread, collapsed);
  const selected = new Set(selection);
  const movable = spread.elements.filter((e) => selected.has(e.id) && !e.locked);
  const canGroup =
    movable.length >= 2 &&
    !isWholeGroup(
      spread,
      movable.map((e) => e.id)
    );
  const canUngroup = spread.elements.some((e) => selected.has(e.id) && e.group);

  const toggleCollapsed = (groupId: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });

  const selectRow = (row: LayerRow, additive: boolean) => {
    if (row.type === 'group') selectGroup(spreadIndex, row.groupId, additive);
    else if (row.inGroup && !additive) enterGroup(spreadIndex, row.el.id);
    else pick(spreadIndex, row.el.id, additive);
  };

  const choose = (row: LayerRow, additive: boolean) => {
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    selectRow(row, additive);
  };

  /** The one row in the Tab order: the one last focused, else the first selected, else the front one. */
  const tabKey =
    rows.find((r) => r.key === focusKey)?.key ??
    rows.find((r) => rowIds(r).every((id) => selected.has(id)))?.key ??
    rows[0]?.key;

  const focusRow = (row: LayerRow | undefined) => {
    if (!row) return;
    setFocusKey(row.key);
    const nodes = list.current?.querySelectorAll<HTMLElement>('[data-layer-key]') ?? [];
    Array.from(nodes)
      .find((n) => n.dataset.layerKey === row.key)
      ?.focus();
  };

  const runKey = (action: LayerKeyAction, row: LayerRow) => {
    if (action.type === 'focus') focusRow(rows[action.index]);
    else if (action.type === 'expand' || action.type === 'collapse') toggleCollapsed(action.groupId);
    else if (action.type === 'rename') {
      if (!readOnly) setRenaming(row.key);
    } else selectRow(row, action.additive);
  };

  const onTreeKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const node = e.target as HTMLElement;
    // The caret, the toggles and the name field keep their own keys.
    const index = rows.findIndex((r) => r.key === node.dataset.layerKey);
    const row = rows[index];
    if (!row) return;
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    const action = layerKeyAction(e.key, index, rows, { collapsed, rtl: runsRtl(node), additive });
    if (!action) return;
    // Taken here, so the page does not also nudge or act on the selection (useStudioKeys.ts).
    e.preventDefault();
    runKey(action, row);
  };

  /** What a drag from this row carries: the selection when the row is in it, else what the row stands for. */
  const dragIds = (row: LayerRow) => {
    const own = rowIds(row);
    return own.every((id) => selected.has(id))
      ? spread.elements.filter((e) => selected.has(e.id)).map((e) => e.id)
      : own;
  };

  const rowAt = (clientY: number): { row: LayerRow; upper: boolean } | null => {
    const nodes = list.current?.querySelectorAll<HTMLElement>('[data-layer-key]') ?? [];
    for (const node of nodes) {
      const r = node.getBoundingClientRect();
      if (clientY < r.top || clientY > r.bottom) continue;
      const row = rows.find((x) => x.key === node.dataset.layerKey);
      if (row) return { row, upper: clientY < r.top + r.height / 2 };
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent, row: LayerRow) => {
    if (e.button !== 0 || readOnly) return;
    if ((e.target as HTMLElement).closest('button, input')) return;
    setDrag({ ids: dragIds(row), startY: e.clientY, active: false, drop: null, overKey: null, upper: true });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    if (!drag.active && Math.abs(e.clientY - drag.startY) < DRAG_PX) return;
    if (!drag.active) {
      try {
        list.current?.setPointerCapture?.(e.pointerId);
      } catch {
        // A pointer that is gone already cannot be captured; the drag still follows the list.
      }
    }
    const at = rowAt(e.clientY);
    const over = at && !rowIds(at.row).some((id) => drag.ids.includes(id)) ? at : null;
    setDrag({
      ...drag,
      active: true,
      drop: over ? dropOn(over.row, over.upper) : null,
      overKey: over?.row.key ?? null,
      upper: over?.upper ?? true,
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag) return;
    try {
      list.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      // Released already, or never taken: a click that did not move.
    }
    justDragged.current = drag.active;
    if (drag.active && drag.drop) restack(spreadIndex, drag.ids, drag.drop.anchorId, drag.drop.where, drag.drop.join);
    setDrag(null);
  };

  const commitName = (row: LayerRow, value: string) => {
    setRenaming(null);
    const current = row.type === 'group' ? (row.name ?? '') : (row.el.name ?? '');
    if (value.trim() === current) return;
    renameLayer(spreadIndex, row.type === 'group' ? { groupId: row.groupId } : { elementId: row.el.id }, value);
  };

  return (
    <>
      <PanelHead label={t('journey.studio.layers')} count={spread.elements.length} />
      <div className="st-panel-scroll st-layers-scroll">
        {rows.length === 0 ? (
          <p className="st-hint">{t('journey.studio.layers.empty')}</p>
        ) : (
          <>
            <p className="st-hint st-layers-hint">{t('journey.studio.layers.hint')}</p>
            <div
              ref={list}
              className={`st-layers ${drag?.active ? 'is-dragging' : ''}`}
              role="tree"
              aria-label={t('journey.studio.layers')}
              onKeyDown={onTreeKey}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => setDrag(null)}
            >
              {rows.map((row) => (
                <LayerRowView
                  key={row.key}
                  row={row}
                  t={t}
                  selected={rowIds(row).every((id) => selected.has(id))}
                  inside={row.type === 'element' && row.inGroup && row.el.group === enteredGroup}
                  collapsed={row.type === 'group' && collapsed.has(row.groupId)}
                  renaming={renaming === row.key}
                  dragged={!!drag?.active && rowIds(row).every((id) => drag.ids.includes(id))}
                  dropAt={drag?.active && drag.overKey === row.key ? (drag.upper ? 'above' : 'below') : null}
                  readOnly={readOnly}
                  tabStop={row.key === tabKey}
                  onFocusRow={() => setFocusKey(row.key)}
                  onPointerDown={(e) => onPointerDown(e, row)}
                  onChoose={(additive) => choose(row, additive)}
                  onToggleCollapsed={() => row.type === 'group' && toggleCollapsed(row.groupId)}
                  onRename={() => !readOnly && setRenaming(row.key)}
                  onCommitName={(v) => commitName(row, v)}
                  onCancelName={() => setRenaming(null)}
                  onLock={(locked) => setLocked(spreadIndex, rowIds(row), locked)}
                  onHide={(hidden) => setHidden(spreadIndex, rowIds(row), hidden)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {!readOnly && rows.length > 0 && (
        <div className="st-layers-foot">
          <Tooltip label={t('journey.studio.layers.groupAction')} shortcut={keys('G')} placement="top">
            <button type="button" className="st-chip" disabled={!canGroup} onClick={() => group(spreadIndex)}>
              <Group size={14} />
              {t('journey.studio.layers.groupAction')}
            </button>
          </Tooltip>
          <Tooltip label={t('journey.studio.layers.ungroup')} shortcut={keys('⇧', 'G')} placement="top">
            <button type="button" className="st-chip" disabled={!canUngroup} onClick={() => ungroup(spreadIndex)}>
              <Ungroup size={14} />
              {t('journey.studio.layers.ungroup')}
            </button>
          </Tooltip>
        </div>
      )}
    </>
  );
}

interface RowProps {
  row: LayerRow;
  t: T;
  selected: boolean;
  inside: boolean;
  collapsed: boolean;
  renaming: boolean;
  dragged: boolean;
  dropAt: 'above' | 'below' | null;
  readOnly: boolean;
  /** The row the Tab key reaches the tree on. */
  tabStop: boolean;
  onFocusRow: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onChoose: (additive: boolean) => void;
  onToggleCollapsed: () => void;
  onRename: () => void;
  onCommitName: (value: string) => void;
  onCancelName: () => void;
  onLock: (locked: boolean) => void;
  onHide: (hidden: boolean) => void;
}

function rowState(row: LayerRow): { locked: boolean; hidden: boolean } {
  const els: BookElement[] = row.type === 'group' ? row.members : [row.el];
  return { locked: els.every((e) => e.locked), hidden: els.every((e) => e.hidden) };
}

/** The row's classes: what it is, whether it is picked, hidden, dragged, or where a drop would land. */
function rowClasses(p: RowProps, hidden: boolean): string {
  const { row } = p;
  return [
    'st-layer',
    row.type === 'group' ? 'is-group' : '',
    row.type === 'element' && row.inGroup ? 'is-member' : '',
    p.selected ? 'is-on' : '',
    p.inside ? 'is-inside' : '',
    hidden ? 'is-hidden' : '',
    p.dragged ? 'is-dragged' : '',
    p.dropAt ? `is-drop-${p.dropAt}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** What the row says it is, and whether that is a name somebody gave it. */
function rowLabel(row: LayerRow, t: T): { label: string; named: boolean } {
  if (row.type === 'group') return { label: row.name || t('journey.studio.layers.group'), named: !!row.name };
  return { label: layerLabel(row.el, t(`journey.studio.kind.${row.el.kind}`)), named: !!row.el.name };
}

function LayerRowView(p: RowProps) {
  const { row, t } = p;
  const { locked, hidden } = rowState(p.row);
  const Icon = row.type === 'group' ? Group : (KIND_ICONS[row.el.kind] ?? Shapes);
  const { label, named } = rowLabel(row, t);

  return (
    <div
      className={rowClasses(p, hidden)}
      data-layer-key={row.key}
      role="treeitem"
      tabIndex={p.tabStop ? 0 : -1}
      aria-level={row.type === 'element' && row.inGroup ? 2 : 1}
      aria-selected={p.selected}
      aria-expanded={row.type === 'group' ? !p.collapsed : undefined}
      onFocus={p.onFocusRow}
      onPointerDown={p.onPointerDown}
      onClick={(e) => p.onChoose(e.shiftKey || e.metaKey || e.ctrlKey)}
    >
      {!p.readOnly && <GripVertical size={12} className="st-layer-grip" aria-hidden />}
      {row.type === 'group' && <RowCaret collapsed={p.collapsed} onToggle={p.onToggleCollapsed} t={t} />}
      <Icon size={13} className="st-layer-icon" aria-hidden />
      <RowName
        label={label}
        named={named}
        renaming={p.renaming}
        t={t}
        onRename={p.onRename}
        onCommit={p.onCommitName}
        onCancel={p.onCancelName}
      />
      {row.type === 'group' && <span className="st-layer-count">{row.members.length}</span>}
      {!p.readOnly && <RowToggles locked={locked} hidden={hidden} t={t} onLock={p.onLock} onHide={p.onHide} />}
    </div>
  );
}

/** A click that does something on its own and must not also select the row. */
const own = (fn: () => void) => (e: React.MouseEvent) => {
  e.stopPropagation();
  fn();
};

function RowCaret({ collapsed, onToggle, t }: { collapsed: boolean; onToggle: () => void; t: T }) {
  return (
    <button
      type="button"
      className={`st-layer-caret ${collapsed ? '' : 'is-open'}`}
      onClick={own(onToggle)}
      aria-label={t(collapsed ? 'journey.studio.layers.expand' : 'journey.studio.layers.collapse')}
    >
      <ChevronRight size={12} />
    </button>
  );
}

function RowName(p: {
  label: string;
  named: boolean;
  renaming: boolean;
  t: T;
  onRename: () => void;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  // Escape hands the focus back to the row, which blurs the field: that blur keeps nothing.
  const cancelled = useRef(false);
  if (!p.renaming) {
    return (
      <span
        className={`st-layer-name ${p.named ? '' : 'is-auto'}`}
        // One line is a must in a tree of rows, so a long name is cut there and read whole here.
        title={p.label}
        onDoubleClick={own(p.onRename)}
      >
        {p.label}
      </span>
    );
  }
  return (
    <input
      className="st-input st-layer-input"
      autoFocus
      defaultValue={p.named ? p.label : ''}
      placeholder={p.label}
      maxLength={60}
      aria-label={p.t('journey.studio.layers.rename')}
      onClick={(e) => e.stopPropagation()}
      onFocus={() => {
        cancelled.current = false;
      }}
      onBlur={(e) => {
        if (!cancelled.current) p.onCommit(e.target.value);
      }}
      onKeyDown={(e) => {
        // Back to the row either way, so the keyboard keeps its place in the tree.
        const row = e.currentTarget.closest<HTMLElement>('[data-layer-key]');
        if (e.key === 'Enter') {
          // Moving the focus blurs the field, which keeps the name.
          if (row) row.focus();
          else e.currentTarget.blur();
          return;
        }
        if (e.key !== 'Escape') return;
        // Escape here leaves the name as it was, and must not close Studio.
        e.stopPropagation();
        e.preventDefault();
        cancelled.current = true;
        p.onCancel();
        row?.focus();
      }}
    />
  );
}

function RowToggles(p: {
  locked: boolean;
  hidden: boolean;
  t: T;
  onLock: (locked: boolean) => void;
  onHide: (hidden: boolean) => void;
}) {
  const lockLabel = p.t(p.locked ? 'journey.studio.unlock' : 'journey.studio.lock');
  const hideLabel = p.t(p.hidden ? 'journey.studio.layers.show' : 'journey.studio.layers.hide');
  return (
    <span className="st-layer-acts">
      <button
        type="button"
        className={`st-act ${p.locked ? 'is-on is-kept' : ''}`}
        onClick={own(() => p.onLock(!p.locked))}
        title={lockLabel}
        aria-label={lockLabel}
        aria-pressed={p.locked}
      >
        {p.locked ? <Lock size={12} /> : <Unlock size={12} />}
      </button>
      <button
        type="button"
        className={`st-act ${p.hidden ? 'is-on is-kept' : ''}`}
        onClick={own(() => p.onHide(!p.hidden))}
        title={hideLabel}
        aria-label={hideLabel}
        aria-pressed={p.hidden}
      >
        {p.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
    </span>
  );
}
