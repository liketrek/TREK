import type { BookWeight } from '@trek/shared';
import '../../styles/studio-paint.css';
import { BOOK_FONTS, nearestWeight, type BookFontId } from './bookFonts';
import { Line } from './StudioControls';

/**
 * The weight line, shared by the text inspector and the travel inspector so
 * both set type the same way. The typeface itself is picked in
 * StudioFontPicker.tsx, the italic's title comes from fontPicker.ts.
 */

type T = (key: string) => string;

/** The weights a family ships, lightest first; Poppins' for a family this build does not know. */
const weightsOf = (font: string) => (BOOK_FONTS[font as BookFontId] ?? BOOK_FONTS.sans).weights;

/**
 * A slider over the weights the family really has, and only those.
 *
 * Nine chips from 100 to 900 with most of them greyed out read as a broken
 * control for a family with two weights, and as a wall for one with nine.
 * The slider steps through what exists, says the weight by its name and its
 * number, and a family with a single weight shows that weight and nothing to
 * drag.
 */
export function WeightLine({
  font,
  weight,
  onPick,
  t,
}: {
  font: string;
  weight: number;
  onPick: (weight: BookWeight) => void;
  t: T;
}) {
  const weights = weightsOf(font);
  const drawn = nearestWeight(font, weight);
  const at = Math.max(0, weights.indexOf(drawn as BookWeight));
  const word = `${t(`journey.studio.weight.${drawn}`)} ${drawn}`;
  return (
    <Line label={t('journey.studio.weight')}>
      <div className="st-field st-weight">
        {weights.length > 1 ? (
          <span className="st-paint-slider st-weight-slider">
            <input
              type="range"
              min={0}
              max={weights.length - 1}
              step={1}
              value={at}
              aria-label={t('journey.studio.weight')}
              aria-valuetext={word}
              onChange={(e) => {
                const next = weights[Number(e.target.value)];
                if (next !== undefined) onPick(next);
              }}
            />
          </span>
        ) : (
          <span className="st-weight-only">{t('journey.studio.weightOnly')}</span>
        )}
        <span className="st-weight-value">{word}</span>
      </div>
    </Line>
  );
}
