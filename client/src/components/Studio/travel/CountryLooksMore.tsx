import type { BookCountriesElement } from '@trek/shared';
import { useId } from 'react';
import { fontStack } from '../bookFonts';
import { COUNTRY_SHAPES } from '../countryShapes';
import { inkOn } from './badgeLook';
import { FlagMark } from './FlagMark';
import { hatch, roughLine, seeded } from './sketch';
import { heavy, inkAt, light, mm } from './travelInk';

/**
 * The country looks drawn after real things: an entry stamp, the flag in
 * cloth, a map pin, an old luggage label and a pencil sketch. CountryLooks.tsx
 * picks the look; each draws one country in the element's ink and accent.
 */

export interface CountryArt {
  el: BookCountriesElement;
  code: string;
  name: string;
  w: number;
  h: number;
}

/** A country's outline fitted into a box, centred, keeping its proportions. */
export function OutlinePath({
  code,
  box,
  x,
  y,
  fill,
  stroke,
  strokeWidth,
}: {
  code: string;
  box: number;
  x: number;
  y: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  const shape = COUNTRY_SHAPES[code.toUpperCase()];
  if (!shape) return null;
  const scale = box / Math.max(shape.w, shape.h);
  const ox = x - (shape.w * scale) / 2;
  const oy = y - (shape.h * scale) / 2;
  return (
    <path
      d={shape.d}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth ? strokeWidth / scale : undefined}
      strokeLinejoin="round"
      transform={`translate(${ox} ${oy}) scale(${scale})`}
    />
  );
}

/** The name as an element sets it: heavy, tracked capitals, cut short rather than spilling. */
function Name({
  el,
  name,
  size,
  color,
  spacing = '0.14em',
}: {
  el: BookCountriesElement;
  name: string;
  size: number;
  color: string;
  spacing?: string;
}) {
  if (!el.showName) return null;
  return (
    <span
      style={{
        fontSize: mm(size),
        fontWeight: heavy(el),
        letterSpacing: spacing,
        textTransform: 'uppercase',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        color,
      }}
    >
      {name}
    </span>
  );
}

const nameSize = (name: string, width: number, cap: number) =>
  Math.max(1.2, Math.min(cap, width / Math.max(4, name.length * 0.82)));

/**
 * An entry stamp: a box with its corners cut, ruled twice in the accent, a
 * row of stars over the name and the code under it, set a few degrees off
 * square and a shade short of solid the way it lands in a passport.
 */
export function Visa({ el, code, name, w, h }: CountryArt) {
  const c = Math.min(w, h) * 0.16;
  const line = Math.max(0.25, Math.min(w, h) * 0.03);
  const cut = (i: number) => {
    const o = i * line * 2.2;
    return `M${c + o} ${o} H${w - c - o} L${w - o} ${c + o} V${h - c - o} L${w - c - o} ${h - o} H${c + o} L${o} ${h - c - o} V${c + o} Z`;
  };
  const type = nameSize(name, w * 0.74, h * 0.2) * el.textScale;
  return (
    <div
      style={{
        position: 'relative',
        width: mm(w),
        height: mm(h),
        transform: 'rotate(3deg)',
        opacity: 0.92,
        color: el.accent,
      }}
    >
      <svg
        width={mm(w)}
        height={mm(h)}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        aria-hidden
      >
        <path d={cut(0.5)} fill="none" stroke={el.accent} strokeWidth={line} />
        <path d={cut(1.4)} fill="none" stroke={el.accent} strokeWidth={line * 0.45} />
        {el.showOutline && (
          <OutlinePath
            code={code}
            box={Math.min(w, h) * 0.5}
            x={w * 0.84 - c * 0.4}
            y={h * 0.5}
            fill={inkAt(el.accent, 0.16)}
          />
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: mm(h * 0.06),
        }}
      >
        <span style={{ fontSize: mm(type * 0.5), letterSpacing: '0.3em' }}>★ ★ ★</span>
        <Name el={el} name={name} size={type} color={el.accent} />
        <span style={{ fontSize: mm(type * 0.42), fontWeight: light(el), letterSpacing: '0.4em' }}>
          {code.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

/**
 * The flag in cloth: the flag drawn by flags.ts with light and shade laid
 * over it in folds, so it reads as fabric hanging from its pole, and the name
 * under it.
 */
export function FlagCloth({ el, code, name, w, h }: CountryArt) {
  const flagH = h * 0.62;
  const flagW = Math.min(w * 0.82, flagH * 1.5);
  const type = nameSize(name, w * 0.86, h * 0.14) * el.textScale;
  const fold = (a: number) => inkAt(el.color, a);
  const sheen = inkAt(inkOn(el.color), 0.32);
  return (
    <div
      style={{
        width: mm(w),
        height: mm(h),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: mm(h * 0.07),
      }}
    >
      <span style={{ display: 'flex', alignItems: 'stretch' }}>
        <span
          style={{
            width: mm(flagH * 0.035),
            borderRadius: mm(flagH),
            background: el.color,
            marginInlineEnd: mm(flagH * 0.01),
          }}
        />
        <span
          style={{
            position: 'relative',
            width: mm(flagW),
            height: mm(flagH),
            overflow: 'hidden',
            borderRadius: `0 ${mm(flagH * 0.04)} ${mm(flagH * 0.04)} 0`,
            boxShadow: `0 ${mm(flagH * 0.04)} ${mm(flagH * 0.1)} ${inkAt(el.color, 0.25)}`,
            transform: 'perspective(60mm) rotateY(-8deg)',
            transformOrigin: 'left center',
          }}
        >
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'stretch' }}>
            <FlagStretch code={code} w={flagW} h={flagH} />
          </span>
          <span
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, ${fold(0.18)} 0%, ${sheen} 14%, ${fold(0.05)} 30%, ${fold(0.22)} 46%, ${sheen} 62%, ${fold(0.08)} 78%, ${fold(0.24)} 100%)`,
              mixBlendMode: 'soft-light',
            }}
          />
        </span>
      </span>
      <Name el={el} name={name} size={type} color={el.color} />
    </div>
  );
}

/** The flag filling its cloth: flags.ts draws it at its own ratio, so it is scaled to cover. */
function FlagStretch({ code, w, h }: { code: string; w: number; h: number }) {
  return (
    <span style={{ width: mm(w), height: mm(h), display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <span style={{ transform: `scale(${Math.max(1, w / h / 1.5)})` }}>
        <FlagMark code={code} size={h} />
      </span>
    </span>
  );
}

/**
 * A map pin: the teardrop in the accent standing on its shadow, the flag in
 * a disc in its head, and the name under it.
 */
export function Pin({ el, code, name, w, h }: CountryArt) {
  const pinH = h * 0.7;
  const r = pinH * 0.36;
  const cx = w / 2;
  const cy = r * 1.05;
  const tip = pinH;
  const type = nameSize(name, w * 0.9, h * 0.14) * el.textScale;
  const id = useId().replace(/:/g, '');
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
          <radialGradient id={`${id}-shine`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={inkOn(el.accent)} stopOpacity={0.35} />
            <stop offset="60%" stopColor={inkOn(el.accent)} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={cx} cy={tip + r * 0.12} rx={r * 0.6} ry={r * 0.16} fill={inkAt(el.color, 0.22)} />
        <path
          d={`M${cx} ${tip} C${cx - r * 0.35} ${cy + r * 1.1} ${cx - r} ${cy + r * 0.6} ${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy} C${cx + r} ${cy + r * 0.6} ${cx + r * 0.35} ${cy + r * 1.1} ${cx} ${tip} Z`}
          fill={el.accent}
        />
        <path
          d={`M${cx} ${tip} C${cx - r * 0.35} ${cy + r * 1.1} ${cx - r} ${cy + r * 0.6} ${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy} C${cx + r} ${cy + r * 0.6} ${cx + r * 0.35} ${cy + r * 1.1} ${cx} ${tip} Z`}
          fill={`url(#${id}-shine)`}
        />
        <circle cx={cx} cy={cy} r={r * 0.66} fill={inkOn(el.accent)} />
      </svg>
      <span
        style={{
          position: 'absolute',
          insetInlineStart: mm(cx - r * 0.56),
          top: mm(cy - r * 0.56),
          width: mm(r * 1.12),
          height: mm(r * 1.12),
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {el.showFlag ? (
          <FlagMark code={code} size={r * 1.12} />
        ) : (
          <OutlineBadge code={code} size={r * 1.0} fill={el.accent} />
        )}
      </span>
      <span
        style={{
          position: 'absolute',
          insetInlineStart: 0,
          insetInlineEnd: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Name el={el} name={name} size={type} color={el.color} />
      </span>
    </div>
  );
}

function OutlineBadge({ code, size, fill }: { code: string; size: number; fill: string }) {
  return (
    <svg width={mm(size)} height={mm(size)} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <OutlinePath code={code} box={size * 0.86} x={size / 2} y={size / 2} fill={fill} />
    </svg>
  );
}

/**
 * An old luggage label: an oval ruled twice, tinted inside, the outline in
 * the middle under a sweep of stars, and the name on a ribbon across it with
 * its ends folded back.
 */
export function Label({ el, code, name, w, h }: CountryArt) {
  const rx = w / 2;
  const ry = h * 0.42;
  const cx = w / 2;
  const cy = h / 2;
  const line = Math.max(0.25, Math.min(w, h) * 0.022);
  const bandH = h * 0.22;
  const bandW = w * 0.92;
  const bx = cx - bandW / 2;
  const by = cy + ry * 0.18;
  const fold = bandH * 0.5;
  const type = nameSize(name, bandW * 0.78, bandH * 0.56) * el.textScale;
  const ink = inkOn(el.accent);
  return (
    <div style={{ position: 'relative', width: mm(w), height: mm(h) }}>
      <svg
        width={mm(w)}
        height={mm(h)}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        aria-hidden
      >
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx - line}
          ry={ry}
          fill={inkAt(el.accent, 0.12)}
          stroke={el.accent}
          strokeWidth={line}
        />
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx - line * 3.2}
          ry={ry - line * 2.2}
          fill="none"
          stroke={el.accent}
          strokeWidth={line * 0.45}
        />
        {el.showOutline && (
          <OutlinePath code={code} box={Math.min(w * 0.36, ry * 1.1)} x={cx} y={cy - ry * 0.28} fill={el.accent} />
        )}
        <path
          d={`M${bx - fold} ${by + fold * 0.5} H${bx + fold} V${by + bandH + fold * 0.5} H${bx - fold} L${bx - fold * 0.4} ${by + bandH / 2 + fold * 0.5} Z`}
          fill={inkAt(el.color, 0.55)}
        />
        <path
          d={`M${bx + bandW + fold} ${by + fold * 0.5} H${bx + bandW - fold} V${by + bandH + fold * 0.5} H${bx + bandW + fold} L${bx + bandW + fold * 0.4} ${by + bandH / 2 + fold * 0.5} Z`}
          fill={inkAt(el.color, 0.55)}
        />
        <rect x={bx} y={by} width={bandW} height={bandH} fill={el.accent} />
      </svg>
      <span
        style={{
          position: 'absolute',
          insetInlineStart: mm(bx),
          top: mm(by),
          width: mm(bandW),
          height: mm(bandH),
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Name el={el} name={name} size={type} color={ink} spacing="0.2em" />
      </span>
    </div>
  );
}

/**
 * The country drawn by hand: its outline traced twice in pencil, slightly
 * apart, hatched inside in the accent, and its name written under it in the
 * element's face, a script one when it comes from the panel.
 */
export function SketchCountry({ el, code, name, w, h }: CountryArt) {
  const id = useId().replace(/:/g, '');
  const rand = seeded(`${code}:${name}`);
  const box = Math.min(w * 0.86, h * 0.68);
  const cx = w / 2;
  const cy = h * 0.4;
  const pen = Math.max(0.2, box * 0.012);
  const shade = hatch({ x: cx - box / 2, y: cy - box / 2, w: box, h: box }, box * 0.045, { rand, wobble: box * 0.008 });
  const type = nameSize(name, w * 0.9, h * 0.16) * el.textScale;
  const under = roughLine(w * 0.2, h * 0.93, w * 0.8, h * 0.91, { rand, wobble: h * 0.012 });
  return (
    <div style={{ position: 'relative', width: mm(w), height: mm(h) }}>
      <svg
        width={mm(w)}
        height={mm(h)}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        aria-hidden
      >
        <defs>
          <clipPath id={`${id}-land`}>
            <OutlinePath code={code} box={box} x={cx} y={cy} fill={el.accent} />
          </clipPath>
        </defs>
        <path
          d={shade}
          fill="none"
          stroke={el.accent}
          strokeWidth={pen * 0.8}
          strokeLinecap="round"
          opacity={0.75}
          clipPath={`url(#${id}-land)`}
        />
        {el.showOutline && (
          <>
            <OutlinePath code={code} box={box} x={cx} y={cy} fill="none" stroke={el.color} strokeWidth={pen} />
            <g transform={`translate(${pen * 0.9} ${-pen * 0.6})`} opacity={0.55}>
              <OutlinePath
                code={code}
                box={box * 1.01}
                x={cx}
                y={cy}
                fill="none"
                stroke={el.color}
                strokeWidth={pen * 0.7}
              />
            </g>
          </>
        )}
        <path d={under} fill="none" stroke={el.accent} strokeWidth={pen * 1.4} strokeLinecap="round" />
      </svg>
      {el.showName && (
        <span
          style={{
            position: 'absolute',
            insetInlineStart: 0,
            insetInlineEnd: 0,
            bottom: mm(h * 0.1),
            textAlign: 'center',
            fontFamily: fontStack(el.font),
            fontSize: mm(type),
            fontWeight: heavy(el),
            color: el.color,
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          {name}
        </span>
      )}
    </div>
  );
}
