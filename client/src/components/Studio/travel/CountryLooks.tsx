import type { BookCountriesElement } from '@trek/shared';
import { useId, type CSSProperties, type ReactNode } from 'react';
import { fontStack } from '../bookFonts';
import { FlagCloth, Label, OutlinePath, Pin, SketchCountry, Visa, type CountryArt } from './CountryLooksMore';
import { FlagMark } from './FlagMark';
import { heavy, inkAt, light, mm } from './travelInk';

/**
 * The newer looks of a country: a passport stamp and a postcard here, an entry
 * stamp, the flag in cloth, a map pin, a luggage label and a sketch in
 * CountryLooksMore.tsx. The classic
 * look, the name over its silhouette, stays in TravelElements.tsx, so every
 * country placed before these existed prints as it always has.
 *
 * The panel places one country per element; an element that holds several, as
 * the old lists did, draws one stamp or card for each, side by side.
 */

interface Country {
  code: string;
  name: string;
}

/**
 * A passport stamp: two rings, the name running round the top, the country
 * code round the bottom between two stars, and the outline in the middle. Set
 * a few degrees off square and a shade short of solid, the way an inked stamp
 * lands on a page.
 */
function Stamp({ el, c, size }: { el: BookCountriesElement; c: Country; size: number }) {
  const id = useId().replace(/:/g, '');
  const r = size / 2;
  const ring = Math.max(0.25, size * 0.025);
  const textR = r * 0.74;
  const type = Math.max(1.2, size * 0.125 * el.textScale);
  const top = `M ${r - textR} ${r} A ${textR} ${textR} 0 0 1 ${r + textR} ${r}`;
  const bottom = `M ${r - textR * 0.9} ${r} A ${textR * 0.9} ${textR * 0.9} 0 0 0 ${r + textR * 0.9} ${r}`;
  const name = c.name.toUpperCase();
  return (
    <svg
      width={mm(size)}
      height={mm(size)}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', transform: 'rotate(-7deg)', opacity: 0.9 }}
    >
      <defs>
        <path id={`${id}-top`} d={top} />
        <path id={`${id}-bottom`} d={bottom} />
      </defs>
      <circle cx={r} cy={r} r={r - ring} fill="none" stroke={el.accent} strokeWidth={ring} />
      <circle cx={r} cy={r} r={r * 0.86} fill="none" stroke={el.accent} strokeWidth={ring * 0.45} />
      <circle cx={r} cy={r} r={r * 0.5} fill="none" stroke={el.accent} strokeWidth={ring * 0.45} />
      {el.showOutline && <OutlinePath code={c.code} box={r * 0.66} x={r} y={r} fill={el.accent} />}
      {el.showName && (
        <text
          fill={el.accent}
          style={{
            fontFamily: fontStack(el.font),
            fontWeight: heavy(el),
            fontSize: `${type}px`,
            letterSpacing: `${type * 0.18}px`,
          }}
        >
          <textPath
            href={`#${id}-top`}
            startOffset="50%"
            textAnchor="middle"
            lengthAdjust="spacingAndGlyphs"
            textLength={name.length * type * 0.85 > Math.PI * textR * 0.9 ? Math.PI * textR * 0.9 : undefined}
          >
            {name}
          </textPath>
        </text>
      )}
      <text
        fill={el.accent}
        style={{
          fontFamily: fontStack(el.font),
          fontWeight: light(el),
          fontSize: `${type * 0.8}px`,
          letterSpacing: `${type * 0.3}px`,
        }}
      >
        <textPath href={`#${id}-bottom`} startOffset="50%" textAnchor="middle" dominantBaseline="hanging">
          {`★ ${c.code.toUpperCase()} ★`}
        </textPath>
      </text>
    </svg>
  );
}

/**
 * A postcard: an airmail border of diagonal stripes in the accent and the
 * ink, the country's outline large on the card, a postage stamp in the corner
 * with the flag or the code on it, a postmark struck across it, and the name
 * along the foot.
 */
function Postcard({ el, c, w, h }: { el: BookCountriesElement; c: Country; w: number; h: number }) {
  const id = useId().replace(/:/g, '');
  const edge = Math.min(w, h) * 0.055;
  const radius = Math.min(w, h) * 0.04;
  const stripe = edge * 0.9;
  const stampW = w * 0.2;
  const stampH = stampW * 1.18;
  const stampX = w - edge * 2 - stampW;
  const stampY = edge * 2;
  const type = Math.max(1.2, Math.min(h * 0.11, (w * 0.6) / Math.max(4, c.name.length * 0.78)) * el.textScale);
  const outlineBox = Math.min(w * 0.5, h * 0.6);
  const wave = (y: number) => {
    const x0 = stampX - stampW * 0.7;
    const seg = stampW * 0.35;
    return `M${x0} ${y} q${seg / 2} ${-edge * 0.5} ${seg} 0 t${seg} 0 t${seg} 0 t${seg} 0`;
  };
  return (
    <div style={{ position: 'relative', width: mm(w), height: mm(h) }}>
      <svg
        width={mm(w)}
        height={mm(h)}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden
      >
        <defs>
          <pattern
            id={`${id}-air`}
            patternUnits="userSpaceOnUse"
            width={stripe * 4}
            height={stripe * 4}
            patternTransform="rotate(45)"
          >
            <rect x={0} y={0} width={stripe} height={stripe * 4} fill={el.accent} />
            <rect x={stripe * 2} y={0} width={stripe} height={stripe * 4} fill={el.color} />
          </pattern>
        </defs>
        <rect x={0} y={0} width={w} height={h} rx={radius} fill={inkAt(el.accent, 0.08)} />
        <path
          fillRule="evenodd"
          fill={`url(#${id}-air)`}
          d={`M${radius} 0 H${w - radius} Q${w} 0 ${w} ${radius} V${h - radius} Q${w} ${h} ${w - radius} ${h} H${radius} Q0 ${h} 0 ${h - radius} V${radius} Q0 0 ${radius} 0 Z M${edge} ${edge} V${h - edge} H${w - edge} V${edge} Z`}
        />
        {el.showOutline && (
          <OutlinePath code={c.code} box={outlineBox} x={edge + w * 0.32} y={h * 0.46} fill={el.accent} />
        )}
        <rect
          x={stampX}
          y={stampY}
          width={stampW}
          height={stampH}
          fill="none"
          stroke={el.accent}
          strokeWidth={edge * 0.18}
          strokeDasharray={`${edge * 0.22} ${edge * 0.22}`}
        />
        <rect
          x={stampX + edge * 0.35}
          y={stampY + edge * 0.35}
          width={stampW - edge * 0.7}
          height={stampH - edge * 0.7}
          fill={inkAt(el.accent, 0.14)}
        />
        <circle
          cx={stampX}
          cy={stampY + stampH * 0.75}
          r={stampW * 0.42}
          fill="none"
          stroke={inkAt(el.color, 0.45)}
          strokeWidth={edge * 0.12}
        />
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={wave(stampY + stampH * 0.58 + i * edge * 0.8)}
            fill="none"
            stroke={inkAt(el.color, 0.45)}
            strokeWidth={edge * 0.12}
          />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          insetInlineStart: mm(stampX + edge * 0.35),
          top: mm(stampY + edge * 0.35),
          width: mm(stampW - edge * 0.7),
          height: mm(stampH - edge * 0.7),
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {el.showFlag ? (
          <FlagMark code={c.code} size={(stampW - edge * 0.7) * 0.5} />
        ) : (
          <span
            style={{ fontSize: mm(stampW * 0.3), fontWeight: heavy(el), color: el.accent, letterSpacing: '0.04em' }}
          >
            {c.code.toUpperCase()}
          </span>
        )}
      </div>
      {el.showName && (
        <span
          style={{
            position: 'absolute',
            insetInlineStart: mm(edge * 2.2),
            bottom: mm(edge * 1.9),
            maxWidth: mm(w * 0.62),
            fontSize: mm(type),
            fontWeight: heavy(el),
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: el.color,
          }}
        >
          {c.name}
        </span>
      )}
    </div>
  );
}

/** The looks drawn in CountryLooksMore.tsx, by name. */
const MORE: Record<string, (props: CountryArt) => ReactNode> = {
  visa: Visa,
  flag: FlagCloth,
  pin: Pin,
  label: Label,
  sketch: SketchCountry,
};

export function CountryLookView({ el, frameStyle }: { el: BookCountriesElement; frameStyle: CSSProperties }) {
  const countries: Country[] = el.codes.map((code, i) => ({ code, name: el.names[i] || code.toUpperCase() }));
  const n = Math.max(1, countries.length);
  const gap = Math.min(el.frame.w, el.frame.h) * 0.05;
  const cellW = (el.frame.w - gap * (n - 1)) / n;
  const cellH = el.frame.h;
  return (
    <div
      style={{
        ...frameStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: mm(gap),
        fontFamily: fontStack(el.font),
        color: el.color,
      }}
    >
      {countries.map((c, i) => {
        const key = `${c.code}-${i}`;
        if (el.look === 'stamp') return <Stamp key={key} el={el} c={c} size={Math.min(cellW, cellH)} />;
        if (el.look === 'postcard') return <Postcard key={key} el={el} c={c} w={cellW} h={cellH} />;
        const Look = MORE[el.look ?? 'visa'] ?? Visa;
        return <Look key={key} el={el} code={c.code} name={c.name} w={cellW} h={cellH} />;
      })}
    </div>
  );
}
