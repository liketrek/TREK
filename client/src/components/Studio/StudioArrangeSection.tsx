import type { BookAlignEdge, BookAlignTo, BookSpread } from '@trek/shared';
import { distributableCount, isWholeGroup } from '@trek/shared';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  ArrowDown,
  ArrowUp,
  ChevronsDown,
  ChevronsUp,
  Group,
  Layers,
  Paintbrush,
  Pipette,
  Ungroup,
  type LucideIcon,
} from 'lucide-react';

import { useStudioStore } from '../../store/studioStore';
import '../../styles/studio-panels.css';
import { Tooltip } from '../shared/Tooltip';
import { Choice, Line, Section } from './StudioControls';
import { useStudioShortcut } from './studioShortcut';

/**
 * Arrange: where the selection sits among the other things on the page.
 *
 * Lining it up and spacing it out, what it lines up against, what lies in
 * front of what, grouping, and the style clipboard, in one group at the foot
 * of the inspector. These were two groups, Align and Arrange, one under the
 * other and both about the selection's place among its neighbours, so the
 * stacking buttons were a fold away from the alignment they are used with.
 *
 * Every line puts its row under its label, across the whole width of the
 * panel: the six edges and the two spacings are eight buttons, more than fit
 * beside a label. Each row is two sets, the edges and the spacings, the stack
 * and the grouping, and a set that no longer fits moves to the next line
 * whole, so a narrow panel shows two even rows rather than a ragged one.
 *
 * The align row lines a multi-selection up within its own box by default, and
 * a single element (or one whole group) against its page, since there is
 * nothing else for it to line up with. Groups move as one box throughout
 * (shared/src/book/book-arrange.ts). The Layers button opens the rail's
 * Layers panel, the whole stack of the page beside the selection. Every press
 * is one undo step.
 */

const ALIGN: { edge: BookAlignEdge; icon: LucideIcon; labelKey: string }[] = [
  { edge: 'left', icon: AlignStartVertical, labelKey: 'journey.studio.layers.alignLeft' },
  { edge: 'center', icon: AlignCenterVertical, labelKey: 'journey.studio.layers.alignCenter' },
  { edge: 'right', icon: AlignEndVertical, labelKey: 'journey.studio.layers.alignRight' },
  { edge: 'top', icon: AlignStartHorizontal, labelKey: 'journey.studio.layers.alignTop' },
  { edge: 'middle', icon: AlignCenterHorizontal, labelKey: 'journey.studio.layers.alignMiddle' },
  { edge: 'bottom', icon: AlignEndHorizontal, labelKey: 'journey.studio.layers.alignBottom' },
];

const STACK: { to: 'front' | 'up' | 'down' | 'back'; icon: LucideIcon; labelKey: string }[] = [
  { to: 'front', icon: ChevronsUp, labelKey: 'journey.studio.toFront' },
  { to: 'up', icon: ArrowUp, labelKey: 'journey.studio.forward' },
  { to: 'down', icon: ArrowDown, labelKey: 'journey.studio.backward' },
  { to: 'back', icon: ChevronsDown, labelKey: 'journey.studio.toBack' },
];

/** How many things move as one in a selection: a group counts once. */
function unitCount(spread: BookSpread, ids: string[]): number {
  return distributableCount(
    spread,
    spread.elements.filter((e) => ids.includes(e.id))
  );
}

function IconButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  shortcut,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  shortcut?: readonly string[];
}) {
  return (
    <Tooltip label={label} shortcut={shortcut}>
      <button type="button" className="st-chip is-icon" onClick={onClick} disabled={disabled} aria-label={label}>
        <Icon size={14} />
      </button>
    </Tooltip>
  );
}

export function StudioArrangeSection({
  spreadIndex,
  t,
  onShowLayers,
}: {
  spreadIndex: number;
  t: (k: string) => string;
  /** Opens the Layers panel in the rail; without it the button is left out. */
  onShowLayers?: () => void;
}) {
  const spread = useStudioStore((s) => s.doc?.spreads[spreadIndex]);
  const selection = useStudioStore((s) => s.selection);
  const hasStyle = useStudioStore((s) => s.styleClip !== null);
  const align = useStudioStore((s) => s.align);
  const distribute = useStudioStore((s) => s.distribute);
  const raise = useStudioStore((s) => s.raise);
  const group = useStudioStore((s) => s.group);
  const ungroup = useStudioStore((s) => s.ungroup);
  const copyStyle = useStudioStore((s) => s.copyStyle);
  const pasteStyle = useStudioStore((s) => s.pasteStyle);
  const keys = useStudioShortcut();
  const chosenTo = useStudioStore((s) => s.alignTo);
  const setChosenTo = useStudioStore((s) => s.setAlignTo);

  if (!spread || !selection.length) return null;
  const sel = spread.elements.filter((e) => selection.includes(e.id));
  const movable = sel.filter((e) => !e.locked).map((e) => e.id);
  const units = unitCount(spread, movable);
  // One thing has nothing to line up with but its page.
  const to: BookAlignTo = units < 2 ? (chosenTo === 'safe' ? 'safe' : 'page') : (chosenTo ?? 'selection');
  const grouped = sel.some((e) => e.group);
  const canGroup = movable.length >= 2 && !isWholeGroup(spread, movable);
  const asGroup = selection.length > 1 && isWholeGroup(spread, selection);

  return (
    // Open for a multi-selection, where lining up is what comes next; folded for one element.
    <Section key={units > 1 ? 'many' : 'one'} label={t('journey.studio.arrange')} defaultOpen={units > 1}>
      <div className="st-arrange">
        <Line label={t('journey.studio.layers.align')} wide>
          <div className="st-row st-arrange-row">
            <span className="st-arrange-set">
              {ALIGN.map((a) => (
                <IconButton
                  key={a.edge}
                  label={t(a.labelKey)}
                  icon={a.icon}
                  disabled={!movable.length}
                  onClick={() => align(spreadIndex, a.edge, to)}
                />
              ))}
            </span>
            <span className="st-arrange-set">
              <IconButton
                label={t('journey.studio.layers.distributeH')}
                icon={AlignHorizontalDistributeCenter}
                disabled={units < 3}
                onClick={() => distribute(spreadIndex, 'horizontal')}
              />
              <IconButton
                label={t('journey.studio.layers.distributeV')}
                icon={AlignVerticalDistributeCenter}
                disabled={units < 3}
                onClick={() => distribute(spreadIndex, 'vertical')}
              />
            </span>
          </div>
        </Line>
        <Line label={t('journey.studio.layers.alignTo')} wide>
          <Choice<BookAlignTo>
            value={to}
            ariaLabel={t('journey.studio.layers.alignTo')}
            options={[
              { value: 'selection' as const, label: t('journey.studio.layers.toSelection'), disabled: units < 2 },
              { value: 'page' as const, label: t('journey.studio.layers.toPage') },
              { value: 'safe' as const, label: t('journey.studio.layers.toSafe') },
            ]}
            onPick={setChosenTo}
          />
        </Line>
        <Line label={t('journey.studio.order')} wide>
          <div className="st-row st-arrange-row">
            <span className="st-arrange-set">
              {STACK.map((s) => (
                <IconButton
                  key={s.to}
                  label={t(s.labelKey)}
                  icon={s.icon}
                  onClick={() => raise(spreadIndex, selection, s.to)}
                />
              ))}
            </span>
            <span className="st-arrange-set">
              {(canGroup || !grouped) && (
                <IconButton
                  label={t('journey.studio.layers.groupAction')}
                  icon={Group}
                  disabled={!canGroup}
                  shortcut={keys('G')}
                  onClick={() => group(spreadIndex)}
                />
              )}
              {grouped && (
                <IconButton
                  label={t('journey.studio.layers.ungroup')}
                  icon={Ungroup}
                  shortcut={keys('⇧', 'G')}
                  onClick={() => ungroup(spreadIndex)}
                />
              )}
              {onShowLayers && (
                <IconButton label={t('journey.studio.showLayers')} icon={Layers} onClick={onShowLayers} />
              )}
            </span>
          </div>
        </Line>
        <Line label={t('journey.studio.style')} wide>
          <div className="st-row">
            <IconButton
              label={t('journey.studio.layers.copyStyle')}
              icon={Pipette}
              shortcut={keys('alt', 'C')}
              onClick={() => copyStyle(spreadIndex)}
            />
            <IconButton
              label={t('journey.studio.layers.pasteStyle')}
              icon={Paintbrush}
              disabled={!hasStyle || !movable.length}
              shortcut={keys('alt', 'V')}
              onClick={() => pasteStyle(spreadIndex)}
            />
          </div>
        </Line>
      </div>
      {asGroup && <p className="st-hint st-arrange-hint">{t('journey.studio.layers.groupHint')}</p>}
    </Section>
  );
}
