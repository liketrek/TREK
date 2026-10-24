import type { BookBadgeElement, BookBadgeStyle } from '@trek/shared';
import type { CSSProperties, ReactNode } from 'react';
import { fontStack } from '../bookFonts';
import { BadgeIcon } from './BadgeIcon';
import { badgeIconShare, badgeInk, inkOn } from './badgeLook';
import { hatch, roughBox, seeded } from './sketch';
import { heavy, inkAt, light, mm } from './travelInk';

/**
 * The newer styles of a mark: an inked passport stamp, a luggage tag with its
 * eyelet, and a pill that opens on its icon in a disc. The four styles every
 * mark had before these stay in TravelElements.tsx, so a mark placed then
 * prints as it always has.
 */

/** The words of a mark, the value over or beside the line under it. */
function Words({
  el,
  big,
  small,
  ink,
  stacked,
  start = false,
}: {
  el: BookBadgeElement;
  big: number;
  small: number;
  ink: string;
  stacked: boolean;
  /** Stacked lines aligned to the start rather than centred, as in a tag or a pill. */
  start?: boolean;
}) {
  if (el.showLabel === false) return null;
  // A mark with no value of its own (a flag, a country) carries its name as the value.
  const main = el.text || el.sub;
  const sub = el.text ? el.sub : '';
  const named = !el.text;
  return (
    <span
      style={{
        display: 'flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: stacked ? (start ? 'flex-start' : 'center') : 'baseline',
        gap: mm(small * (stacked ? 0.3 : 0.6)),
        minWidth: 0,
        color: ink,
      }}
    >
      {main && (
        <span
          style={{
            fontSize: mm(el.variant === 'coords' ? big * 0.62 : named ? big * 0.72 : big),
            fontWeight: heavy(el),
            lineHeight: 1,
            letterSpacing: el.variant === 'coords' || named ? '0.08em' : '-0.01em',
            textTransform: named ? 'uppercase' : undefined,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {main}
        </span>
      )}
      {sub && (
        <span
          style={{
            fontSize: mm(small),
            fontWeight: light(el),
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            lineHeight: 1.2,
            opacity: 0.8,
            whiteSpace: 'nowrap',
          }}
        >
          {sub}
        </span>
      )}
    </span>
  );
}

/** Coordinates carry a long value and the place under it: set on two lines, both stay legible. */
const twoLines = (el: BookBadgeElement) => el.variant === 'coords' && !!el.text && !!el.sub;

/** The frame every style shares: the element's box, its face, centred content. */
function Shell({
  el,
  frameStyle,
  style,
  children,
}: {
  el: BookBadgeElement;
  frameStyle: CSSProperties;
  style: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        ...frameStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        fontFamily: fontStack(el.font),
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * A passport stamp: a rounded box ruled twice in the accent, the words in
 * capitals inside it, turned a few degrees and a shade short of solid, the
 * way an inked stamp lands.
 */
function StampMark({ el, frameStyle }: { el: BookBadgeElement; frameStyle: CSSProperties }) {
  const { h } = el.frame;
  const line = Math.max(0.25, h * 0.045);
  const ink = el.autoColor === false ? el.color : el.accent;
  return (
    <Shell
      el={el}
      frameStyle={frameStyle}
      style={{
        flexDirection: 'column',
        gap: mm(h * 0.05),
        border: `${mm(line)} solid ${ink}`,
        outline: `${mm(line * 0.5)} solid ${ink}`,
        outlineOffset: mm(-line * 2.6),
        borderRadius: mm(h * 0.14),
        padding: `${mm(h * 0.14)} ${mm(h * 0.3)}`,
        textTransform: 'uppercase',
        // An inked stamp is a shade short of solid, on top of whatever the element asks.
        opacity: Number(frameStyle.opacity ?? 1) * 0.9,
        transform: `${frameStyle.transform ?? ''} rotate(-4deg)`.trim(),
      }}
    >
      {el.showIcon !== false && <BadgeIcon el={el} height={h * 0.26} ink={ink} />}
      <Words el={el} big={h * 0.3 * el.textScale} small={h * 0.13 * el.textScale} ink={ink} stacked />
    </Shell>
  );
}

/**
 * A luggage tag: filled in the accent, its leading end cut to a point, with an
 * eyelet punched through so the page shows in the hole.
 */
function TagMark({ el, frameStyle }: { el: BookBadgeElement; frameStyle: CSSProperties }) {
  const { w, h } = el.frame;
  const point = Math.min(h * 0.4, w * 0.18);
  const hole = h * 0.11;
  const holeX = point * 0.8;
  const ink = badgeInk(el);
  const lines = twoLines(el);
  const mask = `radial-gradient(circle at ${mm(holeX)} 50%, transparent ${mm(hole)}, black ${mm(hole + 0.05)})`;
  return (
    <Shell
      el={el}
      frameStyle={frameStyle}
      style={{
        gap: mm(h * 0.14),
        background: el.accent,
        clipPath: `polygon(${mm(point)} 0, 100% 0, 100% 100%, ${mm(point)} 100%, 0 50%)`,
        WebkitMaskImage: mask,
        maskImage: mask,
        paddingInlineStart: mm(point + hole * 1.6),
        paddingInlineEnd: mm(h * 0.3),
        justifyContent: 'flex-start',
      }}
    >
      {el.showIcon !== false && <BadgeIcon el={el} height={h * badgeIconShare(el.variant)} ink={ink} />}
      <Words
        el={el}
        big={h * (lines ? 0.34 : 0.38) * el.textScale}
        small={h * 0.16 * el.textScale}
        ink={ink}
        stacked={lines}
        start
      />
    </Shell>
  );
}

/** A pill: a tinted capsule that opens on the mark's icon in a disc of the accent. */
function PillMark({ el, frameStyle }: { el: BookBadgeElement; frameStyle: CSSProperties }) {
  const { h } = el.frame;
  const disc = h * 0.78;
  const pad = (h - disc) / 2;
  const lines = twoLines(el);
  return (
    <Shell
      el={el}
      frameStyle={frameStyle}
      style={{
        justifyContent: 'flex-start',
        gap: mm(h * 0.22),
        padding: mm(pad),
        paddingInlineEnd: mm(h * 0.42),
        borderRadius: mm(h / 2),
        background: inkAt(el.accent, 0.12),
      }}
    >
      {el.showIcon !== false && (
        <span
          style={{
            width: mm(disc),
            height: mm(disc),
            flex: '0 0 auto',
            borderRadius: '50%',
            background: el.accent,
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
          }}
        >
          <BadgeIcon el={el} height={disc * 0.52} ink={inkOn(el.accent)} generic />
        </span>
      )}
      <Words
        el={el}
        big={h * (lines ? 0.34 : 0.4) * el.textScale}
        small={h * 0.17 * el.textScale}
        ink={el.color}
        stacked={lines}
        start
      />
    </Shell>
  );
}

/**
 * A ribbon: a band in the accent across the top with its two ends folded
 * behind it and cut into swallowtails, the words in capitals on the band.
 */
function RibbonMark({ el, frameStyle }: MarkProps) {
  const { w, h } = el.frame;
  const tail = Math.min(h * 0.7, w * 0.16);
  const bandH = h * 0.72;
  const drop = h - bandH;
  const ink = inkOn(el.accent);
  const back = inkAt(el.color, 0.6);
  const end = (x: number, dir: 1 | -1) =>
    `M${x} ${drop} H${x + dir * tail * 1.4} L${x + dir * tail * 0.9} ${drop + bandH / 2} L${x + dir * tail * 1.4} ${h} H${x} Z`;
  return (
    <Shell el={el} frameStyle={frameStyle} style={{ overflow: 'visible', alignItems: 'flex-start' }}>
      <svg
        width={mm(w)}
        height={mm(h)}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        aria-hidden
      >
        <path d={end(tail * 1.4, -1)} fill={back} />
        <path d={end(w - tail * 1.4, 1)} fill={back} />
        <path d={`M${tail * 0.7} ${bandH} L${tail * 1.4} ${bandH} L${tail * 1.4} ${h} Z`} fill={inkAt(el.color, 0.8)} />
        <path
          d={`M${w - tail * 0.7} ${bandH} L${w - tail * 1.4} ${bandH} L${w - tail * 1.4} ${h} Z`}
          fill={inkAt(el.color, 0.8)}
        />
        <rect x={tail * 0.7} y={0} width={w - tail * 1.4} height={bandH} fill={el.accent} />
      </svg>
      <span
        style={{
          position: 'relative',
          height: mm(bandH),
          display: 'flex',
          alignItems: 'center',
          gap: mm(h * 0.14),
          textTransform: 'uppercase',
        }}
      >
        {el.showIcon !== false && <BadgeIcon el={el} height={bandH * 0.5} ink={ink} />}
        <Words el={el} big={bandH * 0.46 * el.textScale} small={bandH * 0.2 * el.textScale} ink={ink} stacked={false} />
      </span>
    </Shell>
  );
}

/** A die-cut sticker: the mark in the accent inside its white cut edge, lifted off the page by a soft shadow. */
function StickerMark({ el, frameStyle }: MarkProps) {
  const { h } = el.frame;
  const edge = h * 0.09;
  const ink = inkOn(el.accent);
  return (
    <Shell
      el={el}
      frameStyle={frameStyle}
      style={{
        gap: mm(h * 0.16),
        padding: `0 ${mm(h * 0.34)}`,
        borderRadius: mm(h * 0.3),
        background: el.accent,
        boxShadow: `0 0 0 ${mm(edge)} ${inkOn(el.color)}, 0 ${mm(edge * 0.8)} ${mm(edge * 2.2)} ${inkAt(el.color, 0.28)}`,
        transform: `${frameStyle.transform ?? ''} rotate(-3deg)`.trim(),
        overflow: 'visible',
      }}
    >
      {el.showIcon !== false && <BadgeIcon el={el} height={h * badgeIconShare(el.variant)} ink={ink} />}
      <Words el={el} big={h * 0.4 * el.textScale} small={h * 0.17 * el.textScale} ink={ink} stacked={false} />
    </Shell>
  );
}

/**
 * An embroidered patch: woven in the accent, a heavy rim round its edge and a
 * line of stitching inside it, the words sewn in the paper's colour.
 */
function PatchMark({ el, frameStyle }: MarkProps) {
  const { h } = el.frame;
  const ink = inkOn(el.accent);
  const rim = h * 0.07;
  return (
    <Shell
      el={el}
      frameStyle={frameStyle}
      style={{
        gap: mm(h * 0.16),
        padding: `0 ${mm(h * 0.4)}`,
        borderRadius: mm(h * 0.34),
        background: `repeating-linear-gradient(45deg, ${inkAt(ink, 0.08)} 0 ${mm(h * 0.02)}, transparent ${mm(h * 0.02)} ${mm(h * 0.055)}), ${el.accent}`,
        boxShadow: `inset 0 0 0 ${mm(rim)} ${inkAt(el.color, 0.35)}, 0 ${mm(rim * 0.4)} ${mm(rim)} ${inkAt(el.color, 0.25)}`,
        outline: `${mm(h * 0.025)} dashed ${inkAt(ink, 0.85)}`,
        outlineOffset: mm(-rim * 1.9),
        overflow: 'visible',
      }}
    >
      {el.showIcon !== false && <BadgeIcon el={el} height={h * badgeIconShare(el.variant) * 0.9} ink={ink} />}
      <Words el={el} big={h * 0.36 * el.textScale} small={h * 0.15 * el.textScale} ink={ink} stacked={false} />
    </Shell>
  );
}

/** A frame drawn by hand: a freehand box traced twice over pale hatching, the words in the element's face. */
function SketchMark({ el, frameStyle }: MarkProps) {
  const { w, h } = el.frame;
  const rand = seeded(`${el.variant}:${el.text}:${el.sub}`);
  const pen = Math.max(0.2, h * 0.03);
  const wob = h * 0.05;
  const hand = { rand, wobble: wob };
  const frame = `${roughBox({ x: pen * 2, y: pen * 2, w: w - pen * 4, h: h - pen * 4 }, hand)} ${roughBox({ x: pen * 3, y: pen * 1.2, w: w - pen * 5, h: h - pen * 3.4 }, hand)}`;
  const shade = hatch({ x: pen * 3, y: pen * 3, w: w - pen * 6, h: h - pen * 6 }, h * 0.12, {
    rand,
    wobble: wob * 0.3,
  });
  return (
    <Shell
      el={el}
      frameStyle={frameStyle}
      style={{ gap: mm(h * 0.14), padding: `0 ${mm(h * 0.3)}`, overflow: 'visible' }}
    >
      <svg
        width={mm(w)}
        height={mm(h)}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        aria-hidden
      >
        <path d={shade} fill="none" stroke={el.accent} strokeWidth={pen * 0.6} strokeLinecap="round" opacity={0.35} />
        <path d={frame} fill="none" stroke={el.color} strokeWidth={pen} strokeLinecap="round" opacity={0.85} />
      </svg>
      {el.showIcon !== false && (
        <span style={{ position: 'relative' }}>
          <BadgeIcon el={el} height={h * badgeIconShare(el.variant)} generic />
        </span>
      )}
      <span style={{ position: 'relative' }}>
        <Words el={el} big={h * 0.42 * el.textScale} small={h * 0.18 * el.textScale} ink={el.color} stacked={false} />
      </span>
    </Shell>
  );
}

interface MarkProps {
  el: BookBadgeElement;
  frameStyle: CSSProperties;
}

const MARKS: Partial<Record<BookBadgeStyle, (props: MarkProps) => ReactNode>> = {
  stamp: StampMark,
  tag: TagMark,
  pill: PillMark,
  ribbon: RibbonMark,
  sticker: StickerMark,
  patch: PatchMark,
  sketch: SketchMark,
};

export function BadgeLookView({ el, frameStyle }: MarkProps) {
  const Mark = MARKS[el.style] ?? PillMark;
  return <Mark el={el} frameStyle={frameStyle} />;
}
