import type { CSSProperties, ReactNode } from 'react';
import { useId } from 'react';

import type { BookTextElement } from '@trek/shared';
import { bookDrawnLines, bookTextCurvePath, bookTextIsDrawn, bookTextPaintFill } from '@trek/shared';

import { fontStack } from './bookFonts';
import { photoSrc } from './bookRender';
import { paintParts, type PaintParts } from './paint/paintParts';
import {
  caseStyle,
  curveAnchor,
  isHollow,
  letterFill,
  lineAnchor,
  lineCentres,
  outlineStrokeMm,
  photoCover,
  ptToMm,
  svgId,
  withAlpha,
} from './textEffects';

/**
 * A text with effects, drawn.
 *
 * ── Two ways of drawing, both vector in print ──────────────────────────────
 *
 * A text that still wraps (an outline, a shadow, a band, a case, a vertical
 * place) stays HTML type, drawn as a stack of identical layers: the shadow, a
 * copy offset behind; the band, a span background behind the words; the
 * outline, a copy stroked twice its width under the fill, so the line grows
 * outward and never thins the letter; then the fill. Every layer lays its
 * words out the same way, so they land on each other exactly, and none of them
 * is a blur, a filter or a `background-clip`, which print as pixels or wait
 * for nothing.
 *
 * A text on a curve or filled with a photograph is SVG: the curve is
 * `textPath` on a path computed in millimetres (book-text-curve.ts in shared),
 * the photo an `<image>` clipped to the letters, which the print view waits
 * for like any other picture. Such a text is set line by line as written.
 *
 * Every id is this instance's own: a page drawn twice on one sheet (page mode)
 * must not have its second copy clip to the first copy's letters.
 */

const JUSTIFY = { top: 'flex-start', middle: 'center', bottom: 'flex-end' } as const;

/** The type itself, the same on every layer of an HTML text. */
function typeStyle(el: BookTextElement): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: JUSTIFY[el.vAlign ?? 'top'],
    fontSize: `${el.size}pt`,
    fontFamily: fontStack(el.font),
    fontWeight: el.weight,
    fontStyle: el.italic ? 'italic' : undefined,
    lineHeight: el.leading,
    letterSpacing: `${el.tracking}em`,
    textAlign: el.align,
    whiteSpace: 'pre-wrap',
    hyphens: 'auto',
    ...caseStyle(el),
  };
}

/** The words of one layer, padded as the band pads them so every layer breaks its lines alike. */
function Words({ el, band }: { el: BookTextElement; band?: string }) {
  const hl = el.highlight;
  const style: CSSProperties | undefined = hl
    ? {
        padding: `${hl.padY}mm ${hl.padX}mm`,
        borderRadius: hl.radius ? `${hl.radius}mm` : undefined,
        background: band,
        boxDecorationBreak: 'clone',
        WebkitBoxDecorationBreak: 'clone',
      }
    : undefined;
  return (
    <div>
      <span style={style}>{el.text}</span>
    </div>
  );
}

function LayeredText({ el, frameStyle }: { el: BookTextElement; frameStyle: CSSProperties }) {
  const type = typeStyle(el);
  const { outline, shadow, highlight } = el;
  const hollow = isHollow(el);
  const stroke = outline ? `${outlineStrokeMm(el)}mm` : undefined;
  const reaches = !!(outline || shadow || highlight);
  const layers: ReactNode[] = [];
  if (shadow) {
    const ink = withAlpha(shadow.color, shadow.alpha);
    layers.push(
      <div
        key="shadow"
        aria-hidden
        style={{
          ...type,
          transform: `translate(${shadow.dx}mm, ${shadow.dy}mm)`,
          color: hollow ? 'transparent' : ink,
          WebkitTextStroke: stroke ? `${stroke} ${ink}` : undefined,
        }}
      >
        <Words el={el} band={highlight ? ink : undefined} />
      </div>
    );
  }
  if (highlight) {
    layers.push(
      <div key="band" aria-hidden style={{ ...type, color: 'transparent' }}>
        <Words el={el} band={withAlpha(highlight.color, highlight.alpha)} />
      </div>
    );
  }
  if (outline) {
    layers.push(
      <div
        key="outline"
        aria-hidden
        style={{
          ...type,
          color: hollow ? 'transparent' : outline.color,
          WebkitTextStroke: `${stroke} ${outline.color}`,
        }}
      >
        <Words el={el} />
      </div>
    );
  }
  layers.push(
    <div key="fill" style={{ ...type, color: letterFill(el) ?? el.color }}>
      <Words el={el} />
    </div>
  );
  return <div style={{ ...frameStyle, overflow: reaches ? 'visible' : 'hidden' }}>{layers}</div>;
}

interface GlyphPaint {
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}

/** A gradient or pattern in the letters, laid out over the frame as a shape's paint is over its box. */
function lettersPaint(el: BookTextElement, id: string): PaintParts | null {
  const paint = bookTextPaintFill(el);
  return paint ? paintParts(paint, { x: 0, y: 0, w: el.frame.w, h: el.frame.h }, id) : null;
}

/** What the letters are filled with: the paint's fill, else their own colour. */
function lettersFill(el: BookTextElement, paint: PaintParts | null): string {
  if (paint) return paint.fill;
  return letterFill(el) ?? el.color;
}

/** A pattern's ground and its marks, clipped to the letters. */
function PatternLetters({ parts, w, h, clipId }: { parts: PaintParts; w: number; h: number; clipId: string }) {
  const pattern = parts.pattern;
  if (!pattern) return null;
  return (
    <g clipPath={`url(#${clipId})`}>
      {parts.fill !== 'none' && <rect width={w} height={h} fill={parts.fill} />}
      <g transform={pattern.transform}>
        {pattern.layers.map((layer, i) => (
          <path key={i} d={layer.d} fill={pattern.ink} fillOpacity={layer.opacity < 1 ? layer.opacity : undefined} />
        ))}
      </g>
    </g>
  );
}

function DrawnText({ el, frameStyle, big }: { el: BookTextElement; frameStyle: CSSProperties; big: boolean }) {
  const reactId = useId();
  const pathId = svgId('tp-', reactId);
  const clipId = svgId('tc-', reactId);
  const paintId = svgId('tf-', reactId);
  const { w, h } = el.frame;
  const fontMm = ptToMm(el.size);
  const lines = bookDrawnLines(el);
  const curve = el.curve ? bookTextCurvePath(el.curve, w, h, fontMm) : null;
  const photo = el.fillPaint?.type === 'photo' ? el.fillPaint : null;
  const letterPaint = lettersPaint(el, paintId);
  const pattern = letterPaint ? letterPaint.pattern : null;
  const hollow = isHollow(el);
  const { outline, shadow } = el;

  const textProps = {
    fontFamily: fontStack(el.font),
    fontSize: fontMm,
    fontWeight: el.weight,
    fontStyle: el.italic ? 'italic' : undefined,
    style: { letterSpacing: `${el.tracking}em`, fontVariantCaps: caseStyle(el).fontVariantCaps },
  };

  const glyphs = (paint: GlyphPaint | null, key: string) => {
    const painted = paint ? { ...paint, strokeLinejoin: 'round' as const } : {};
    if (curve) {
      const at = curveAnchor(el.align);
      return (
        <text key={key} {...textProps} {...painted}>
          <textPath href={`#${pathId}`} startOffset={at.offset} textAnchor={at.anchor}>
            {lines[0]}
          </textPath>
        </text>
      );
    }
    const at = lineAnchor(el.align, w);
    const ys = lineCentres(lines.length, fontMm, el.leading, h, el.vAlign);
    return (
      <text key={key} {...textProps} {...painted} textAnchor={at.anchor} dominantBaseline="central">
        {lines.map((line, i) => (
          <tspan key={i} x={at.x} y={ys[i]}>
            {line || ' '}
          </tspan>
        ))}
      </text>
    );
  };

  const stroke = outlineStrokeMm(el);
  const layers: ReactNode[] = [];
  if (shadow) {
    const ink = withAlpha(shadow.color, shadow.alpha);
    layers.push(
      <g key="shadow" transform={`translate(${shadow.dx} ${shadow.dy})`} aria-hidden>
        {glyphs(
          { fill: hollow ? 'none' : ink, stroke: stroke ? ink : undefined, strokeWidth: stroke || undefined },
          'g'
        )}
      </g>
    );
  }
  if (outline) {
    layers.push(
      glyphs({ fill: hollow ? 'none' : outline.color, stroke: outline.color, strokeWidth: stroke }, 'outline')
    );
  }
  if (photo) {
    const cover = photoCover(w, h, photo);
    layers.push(<image key="photo" href={photoSrc(photo.photoId, big)} {...cover} clipPath={`url(#${clipId})`} />);
  } else if (pattern && letterPaint) {
    layers.push(<PatternLetters key="pattern" parts={letterPaint} w={w} h={h} clipId={clipId} />);
  } else {
    layers.push(glyphs({ fill: lettersFill(el, letterPaint) }, 'fill'));
  }

  return (
    <div style={frameStyle}>
      <svg
        width={`${w}mm`}
        height={`${h}mm`}
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block', overflow: 'visible' }}
        role="img"
        aria-label={el.text}
      >
        <defs>
          {curve && <path id={pathId} d={curve.d} fill="none" />}
          {letterPaint?.defs}
          {(photo || pattern) && (
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              {glyphs(null, 'clip')}
            </clipPath>
          )}
        </defs>
        {layers}
      </svg>
    </div>
  );
}

/** A text element that has effects; SpreadView keeps drawing the plain ones itself. */
export function TextEffectsView({
  el,
  frameStyle,
  big,
}: {
  el: BookTextElement;
  frameStyle: CSSProperties;
  big: boolean;
}) {
  if (bookTextIsDrawn(el)) return <DrawnText el={el} frameStyle={frameStyle} big={big} />;
  return <LayeredText el={el} frameStyle={frameStyle} />;
}
