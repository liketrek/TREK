import type { BookTextElement } from '@trek/shared';
import type { BookFontId } from './bookFonts';
import { BOOK_FONTS, BOOK_FONT_ORDER, hasWeight, nearestWeight } from './bookFonts';
import { Choice, Line } from './StudioControls';

/**
 * The typeface buttons and the weight line, shared by the text inspector and
 * the travel inspector so both set type the same way.
 */

/** The weight set the book schema allows, taken from it so there is one list. */
type BookWeight = BookTextElement['weight'];

const WEIGHTS = [400, 500, 600, 700] as const;

/** One button per bundled family, each set in its own face. */
export function FontButtons({
  font,
  weight,
  onPick,
}: {
  font: string;
  weight: BookWeight;
  onPick: (patch: { font: BookFontId; weight: BookWeight }) => void;
}) {
  return (
    <div className="st-fonts">
      {BOOK_FONT_ORDER.map((id) => {
        const face = BOOK_FONTS[id];
        return (
          <button
            type="button"
            key={id}
            className={`st-font ${font === id ? 'is-on' : ''}`}
            style={{ fontFamily: face.stack }}
            onClick={() =>
              onPick({
                font: id,
                // A family that does not ship this weight would render a
                // synthesised bold, a smeared regular in print, so the
                // weight moves to the nearest one it really has.
                weight: nearestWeight(id, weight) as BookWeight,
              })
            }
            title={face.name}
          >
            {face.name}
          </button>
        );
      })}
    </div>
  );
}

/** The four weights, with the ones the family does not ship greyed out. */
export function WeightLine({
  font,
  weight,
  onPick,
  t,
}: {
  font: string;
  weight: BookWeight;
  onPick: (weight: BookWeight) => void;
  t: (k: string) => string;
}) {
  return (
    <Line label={t('journey.studio.weight')}>
      <Choice
        value={weight}
        options={WEIGHTS.map((w) => ({
          value: w,
          label: String(w),
          disabled: !hasWeight(font, w),
          title: hasWeight(font, w) ? undefined : t('journey.studio.weightMissing'),
        }))}
        onPick={onPick}
      />
    </Line>
  );
}
