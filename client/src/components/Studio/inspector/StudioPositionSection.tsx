import type { BookElement } from '@trek/shared';
import { RotateCcw, RotateCw } from 'lucide-react';

import { NumField, Section, Switch } from '../StudioControls';
import { turned } from '../stickerLibrary';
import { positionInUse } from './inspectorModel';

/**
 * Where the selected element sits, how big it is, how it is turned and how
 * strongly it shows: one group, the same for every kind.
 *
 * Folded unless the element is turned or faded, or is a sticker: everything in
 * here can be done by dragging, which is how it is actually done, and the
 * numbers are for the one time in ten you need the same margin on two pages.
 * The turn buttons tip the element a step at a time, which a sticker or a
 * photo set at an angle wants more often than a typed figure. A sticker's
 * mirror is here as well, since it is how the drawing lies on the page.
 *
 * With several selected the group keeps the angle, the opacity, the turn and,
 * when they are all stickers, the mirror, and each writes to every one of
 * them. Only the frame's numbers go: one x for four elements would stack them
 * on top of each other. The sticker inspector used to carry its own turn,
 * angle and opacity beside these, so a sticker had two of each.
 */

/** A quarter of a right angle and a little: what the turn buttons tip an element by. */
const TURN_STEP = 15;

export function StudioPositionSection({
  el,
  sel,
  set,
  t,
}: {
  /** The first of the selection, whose figures the group shows. */
  el: BookElement;
  /** The whole selection, `el` among it. */
  sel: readonly BookElement[];
  set: (patch: Partial<BookElement>) => void;
  t: (k: string) => string;
}) {
  const { frame } = el;
  const one = sel.length <= 1;
  const turnLeft = t('journey.studio.stickerTurnLeft');
  const turnRight = t('journey.studio.stickerTurnRight');
  const mirror = el.kind === 'sticker' && sel.every((e) => e.kind === 'sticker');
  return (
    <Section label={t('journey.studio.position')} defaultOpen={sel.some((e) => positionInUse(e))}>
      {one && (
        <div className="st-grid2">
          <NumField label="X" value={frame.x} unit="mm" onChange={(v) => set({ frame: { ...frame, x: v } })} />
          <NumField label="Y" value={frame.y} unit="mm" onChange={(v) => set({ frame: { ...frame, y: v } })} />
          <NumField
            label={t('journey.studio.width')}
            value={frame.w}
            min={4}
            unit="mm"
            onChange={(v) => set({ frame: { ...frame, w: v } })}
          />
          <NumField
            label={t('journey.studio.height')}
            value={frame.h}
            min={4}
            unit="mm"
            onChange={(v) => set({ frame: { ...frame, h: v } })}
          />
        </div>
      )}
      <div className={`st-grid2 ${one ? 'st-position-row' : ''}`}>
        <NumField
          label={t('journey.studio.rotation')}
          value={el.rotation}
          min={-180}
          max={180}
          step={1}
          unit="°"
          onChange={(v) => set({ rotation: v })}
        />
        <NumField
          label={t('journey.studio.opacity')}
          value={Math.round(el.opacity * 100)}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => set({ opacity: Math.min(1, Math.max(0, v / 100)) })}
        />
      </div>
      <div className="st-row st-position-row">
        <button
          type="button"
          className="st-chip is-icon"
          onClick={() => set({ rotation: turned(el.rotation, -TURN_STEP) })}
          title={turnLeft}
          aria-label={turnLeft}
        >
          <RotateCcw size={14} />
        </button>
        <button
          type="button"
          className="st-chip is-icon"
          onClick={() => set({ rotation: turned(el.rotation, TURN_STEP) })}
          title={turnRight}
          aria-label={turnRight}
        >
          <RotateCw size={14} />
        </button>
      </div>
      {mirror && (
        <Switch label={t('journey.studio.stickerFlip')} on={el.flipX} onToggle={() => set({ flipX: !el.flipX })} />
      )}
    </Section>
  );
}
