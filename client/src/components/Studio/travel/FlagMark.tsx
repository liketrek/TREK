import { COUNTRY_SHAPES } from '../countryShapes';
import { FLAG_H, FLAG_W, flagBands, flagDisc, flagSpec } from '../flags';
import { round2 } from './travelInk';

/**
 * A flag, drawn.
 *
 * The first version set a regional-indicator pair and let the platform draw it.
 * That is the standard trick and it is wrong for most of the people who will
 * use this: Chrome on Windows ships no flag glyphs, so it renders the two
 * letters, and "DE" printed in a photo book is not a flag.
 *
 * So flags are constructed from `flags.ts` — exact for the stripe, cross and
 * disc constructions listed there, and absent for anything with an emblem
 * rather than approximated. A country with no construction falls back to its
 * silhouette, which is correct for all 198 of them.
 */
export function FlagMark({ code, size }: { code: string; size: number }) {
  const spec = flagSpec(code);
  const height = size;
  const width = (height * FLAG_W) / FLAG_H;

  if (spec) {
    const disc = flagDisc(spec);
    return (
      <svg
        width={`${round2(width)}mm`}
        height={`${round2(height)}mm`}
        viewBox={`0 0 ${FLAG_W} ${FLAG_H}`}
        style={{ display: 'block', flex: '0 0 auto', borderRadius: `${round2(height * 0.08)}mm` }}
        aria-label={code.toUpperCase()}
      >
        {flagBands(spec).map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} />
        ))}
        {disc && <circle cx={disc.cx} cy={disc.cy} r={disc.r} fill={disc.fill} />}
        {/* A hairline keeps a white-edged flag off a white page. */}
        <rect x="0" y="0" width={FLAG_W} height={FLAG_H} fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="0.5" />
      </svg>
    );
  }

  const shape = COUNTRY_SHAPES[code.toUpperCase()];
  if (!shape) {
    // Neither a construction nor an outline: the code, set as a mark rather
    // than as two stray capitals.
    return (
      <span
        style={{
          fontSize: `${round2(size * 0.62)}mm`,
          fontWeight: 700,
          letterSpacing: '0.08em',
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        {code.toUpperCase()}
      </span>
    );
  }
  return (
    <svg
      width={`${round2((height * shape.w) / shape.h)}mm`}
      height={`${round2(height)}mm`}
      viewBox={`0 0 ${shape.w} ${shape.h}`}
      style={{ display: 'block', flex: '0 0 auto' }}
      aria-label={code.toUpperCase()}
    >
      <path d={shape.d} fill="currentColor" />
    </svg>
  );
}
