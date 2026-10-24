import type { BookLineElement } from '@trek/shared';
import type { CSSProperties } from 'react';
import { useMemo } from 'react';

import { type LineGeometry, lineGeometry } from './lineRender';

/** The paths of a line's geometry in one colour: the body stroked, the heads and the ornament filled. */
export function LinePaths({ g, color, width }: { g: LineGeometry; color: string; width: number }) {
  const stroke = { fill: 'none', stroke: color, strokeWidth: width, strokeLinejoin: 'round' as const };
  return (
    <>
      {g.body.map((d, i) => (
        <path key={`b${i}`} d={d} {...stroke} strokeLinecap={g.cap} strokeDasharray={g.dash} />
      ))}
      {g.strokes.map((d, i) => (
        <path key={`s${i}`} d={d} {...stroke} strokeLinecap="round" />
      ))}
      {g.fills.map((d, i) => (
        <path key={`f${i}`} d={d} fill={color} />
      ))}
    </>
  );
}

/**
 * A line element, drawn: its body stroked, its heads and ornament filled, all
 * in the millimetres of its own frame (one SVG unit is one millimetre, as for
 * the shapes). Overflow stays visible so a head on a thin frame is not cut.
 */
export function LineView({ el, frameStyle }: { el: BookLineElement; frameStyle: CSSProperties }) {
  const { w, h } = el.frame;
  const g = useMemo(() => lineGeometry(el, w, h, el.id), [el, w, h]);
  return (
    <div style={frameStyle}>
      <svg
        width={`${w}mm`}
        height={`${h}mm`}
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block', overflow: 'visible' }}
        aria-hidden
      >
        <LinePaths g={g} color={el.stroke} width={el.strokeWidth} />
      </svg>
    </div>
  );
}
