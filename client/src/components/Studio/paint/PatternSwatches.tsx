import { BOOK_PATTERNS, type BookPattern, type BookPatternPaint } from '@trek/shared';
import { useMemo } from 'react';
import { PATTERN_ANGLE } from './paintEdit';
import { patternGeometry } from './patterns';

/**
 * The twelve repeats, each drawn as a tile in the paint's own colours.
 *
 * Drawn by the same generator the page uses, at a smaller scale, so a tile
 * is a true preview of what choosing it does rather than an icon of it, and
 * a repeat that looks wrong in the tile looks wrong on the page too.
 */

const TILE = 24;

function PatternTile({ pattern, fg, bg }: { pattern: BookPattern; fg: string; bg: string | null }) {
  const geo = useMemo(
    () =>
      patternGeometry({ pattern, scale: 0.42, angle: PATTERN_ANGLE[pattern] ?? 0 }, { x: 0, y: 0, w: TILE, h: TILE }),
    [pattern]
  );
  return (
    <svg viewBox={`0 0 ${TILE} ${TILE}`} className="st-pattern-tile-art" aria-hidden>
      {bg && <rect width={TILE} height={TILE} fill={bg} />}
      <g transform={geo.transform}>
        {geo.layers.map((layer, i) => (
          <path key={i} d={layer.d} fill={fg} fillOpacity={layer.opacity < 1 ? layer.opacity : undefined} />
        ))}
      </g>
    </svg>
  );
}

export function PatternSwatches({
  value,
  onPick,
  label,
}: {
  value: BookPatternPaint;
  onPick: (pattern: BookPattern) => void;
  label: (pattern: BookPattern) => string;
}) {
  return (
    <div className="st-pattern-grid" role="radiogroup">
      {BOOK_PATTERNS.map((pattern) => (
        <button
          type="button"
          key={pattern}
          role="radio"
          aria-checked={value.pattern === pattern}
          aria-label={label(pattern)}
          title={label(pattern)}
          className={`st-pattern-tile ${value.pattern === pattern ? 'is-on' : ''} ${value.bg ? '' : 'is-clear'}`}
          onClick={() => onPick(pattern)}
        >
          <PatternTile pattern={pattern} fg={value.fg} bg={value.bg} />
        </button>
      ))}
    </div>
  );
}
