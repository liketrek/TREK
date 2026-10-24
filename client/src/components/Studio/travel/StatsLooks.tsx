import type { BookStatsElement } from '@trek/shared';
import { useId, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { fontStack } from '../bookFonts';
import { inkOn } from './badgeLook';
import { chars, fitAll, fitCaption, fitType, gridOf, type Figure } from './statsFit';
import { NoteLook, OdometerLook, SignLook, SketchLook } from './StatsLooksMore';
import { Caption, FigureText, IconDisc, IconDiscOn } from './statsParts';
import { heavy, inkAt, METRIC_ICONS, metricValue, mm } from './travelInk';

/**
 * The newer looks of a journey summary: a poster, a ticket, tiles, a band and
 * a medal. The classic look, icon over figure over caption, stays in
 * TravelElements.tsx untouched, so every summary placed before these existed
 * prints as it always has.
 *
 * They are drawn in the element's two colours: the ink for the words and the
 * accent for what carries them, a disc, a stub, a tile, a ring. Placed from
 * the panel both are linked to the book's theme, so a summary takes the
 * theme's colours and follows them. Everything is sized from the frame and the
 * length of what it prints, never from a fixed point size, so a summary
 * dragged from a corner to a whole page grows its figures with it.
 */

export interface LookProps {
  el: BookStatsElement;
  figures: Figure[];
}

/**
 * The poster: the first figure set as large as the frame allows, over a bar in
 * the accent, with its name and icon above it; the others in a column beside
 * it, each with its own disc, between hairlines. The order of the figures is
 * the order of importance, so the one somebody put first is the page's.
 */
function PosterLook({ el, figures }: LookProps) {
  const { w, h } = el.frame;
  const [hero, ...rest] = figures;
  if (!hero) return null;
  const heroW = rest.length ? w * 0.58 : w;
  const big = fitType(chars(hero), heroW * 0.92, h * 0.5) * el.textScale;
  const row = h / Math.max(1, rest.length);
  const disc = Math.min(row * 0.46, (w - heroW) * 0.16);
  const small = fitAll(rest, (w - heroW) * 0.62, row * 0.36) * el.textScale;
  const hair = `${mm(Math.max(0.18, h * 0.005))} solid ${inkAt(el.color, 0.16)}`;
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: mm(h * 0.045),
          width: mm(heroW),
          minWidth: 0,
          paddingInlineEnd: mm(w * 0.03),
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: mm(big * 0.12) }}>
          {el.showIcons && <IconDisc metric={hero.metric} size={big * 0.32} el={el} solid />}
          <Caption text={hero.label} size={Math.max(1.2, big * 0.13)} el={el} color={el.accent} opacity={1} />
        </span>
        <FigureText f={hero} size={big} el={el} color={el.color} unitColor={el.accent} />
        <span
          style={{
            width: mm(Math.min(heroW * 0.22, h * 0.3)),
            height: mm(Math.max(0.6, h * 0.028)),
            borderRadius: mm(h),
            background: el.accent,
          }}
        />
      </div>
      {rest.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
            borderInlineStart: hair,
            paddingInlineStart: mm(w * 0.045),
          }}
        >
          {rest.map((f, i) => (
            <div
              key={f.metric}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: mm(disc * 0.45),
                minHeight: 0,
                borderTop: i ? hair : undefined,
              }}
            >
              {el.showIcons && <IconDisc metric={f.metric} size={disc} el={el} />}
              <span style={{ display: 'flex', flexDirection: 'column', gap: mm(small * 0.1), minWidth: 0 }}>
                <FigureText f={f} size={small} el={el} color={el.color} unitColor={el.accent} />
                <Caption text={f.label} size={Math.max(1.2, small * 0.3)} el={el} />
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * A ticket: the outline with a notch bitten out either side of the tear, the
 * stub solid in the accent with the first figure on it, and the others as the
 * fields of a boarding pass, name over value, over a barcode drawn from the
 * figures themselves, so two journeys never print the same one.
 */
function TicketLook({ el, figures }: LookProps) {
  const { w, h } = el.frame;
  const id = useId().replace(/:/g, '');
  const [hero, ...rest] = figures;
  if (!hero) return null;
  const stubW = rest.length ? w * 0.34 : w;
  const notch = Math.min(h * 0.075, w * 0.035);
  const radius = Math.min(h * 0.09, w * 0.045);
  const cols = Math.min(3, Math.max(1, rest.length));
  const rows = Math.ceil(rest.length / cols);
  const fieldW = ((w - stubW) * 0.86) / cols;
  const fieldH = (h * 0.56) / Math.max(1, rows);
  const value = fitAll(rest, fieldW * 0.92, fieldH * 0.56) * el.textScale;
  const caption = fitCaption(
    rest.map((f) => f.label),
    fieldW,
    value * 0.3
  );
  const big = fitType(chars(hero), stubW * 0.78, h * 0.36) * el.textScale;
  const onStub = inkOn(el.accent);
  return (
    <>
      <svg
        width={mm(w)}
        height={mm(h)}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden
      >
        <defs>
          <clipPath id={`${id}-ticket`} clipPathUnits="userSpaceOnUse">
            <path d={ticketPath(w, h, rest.length ? stubW : null, notch, radius)} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-ticket)`}>
          <rect x={0} y={0} width={w} height={h} fill={inkAt(el.accent, 0.1)} />
          <rect x={0} y={0} width={stubW} height={h} fill={el.accent} />
        </g>
        {rest.length > 0 && (
          <line
            x1={stubW}
            x2={stubW}
            y1={notch * 1.7}
            y2={h - notch * 1.7}
            stroke={inkAt(el.color, 0.32)}
            strokeWidth={Math.max(0.2, h * 0.008)}
            strokeDasharray={`${h * 0.025} ${h * 0.022}`}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div
        style={{
          position: 'relative',
          width: mm(stubW),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: mm(h * 0.035),
        }}
      >
        {el.showIcons &&
          (() => {
            const Icon = METRIC_ICONS[hero.metric];
            return (
              <Icon
                color={onStub}
                strokeWidth={2}
                style={{ width: mm(big * 0.34), height: mm(big * 0.34), display: 'block', opacity: 0.85 }}
              />
            );
          })()}
        <FigureText f={hero} size={big} el={el} color={onStub} />
        <Caption
          text={hero.label}
          size={fitCaption([hero.label], stubW * 0.8, big * 0.18)}
          el={el}
          color={onStub}
          opacity={0.82}
        />
      </div>
      {rest.length > 0 && (
        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: `0 ${mm(w * 0.045)}`,
            gap: mm(h * 0.07),
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              rowGap: mm(h * 0.06),
              columnGap: mm(w * 0.02),
            }}
          >
            {rest.map((f) => (
              <div key={f.metric} style={{ display: 'flex', flexDirection: 'column', gap: mm(h * 0.02), minWidth: 0 }}>
                <Caption text={f.label} size={caption} el={el} color={el.accent} opacity={1} />
                <FigureText f={f} size={value} el={el} color={el.color} />
              </div>
            ))}
          </div>
          <Barcode figures={figures} color={el.color} width={(w - stubW) * 0.56} height={h * 0.13} />
        </div>
      )}
    </>
  );
}

/**
 * The ticket's outline: a rounded rectangle with a half circle bitten out of
 * the top and the bottom edge where the stub tears off. One path, so the page
 * shows through the notches whatever lies under the ticket.
 */
function ticketPath(w: number, h: number, stubX: number | null, n: number, r: number): string {
  const top = stubX == null ? '' : ` L${stubX - n} 0 A${n} ${n} 0 0 0 ${stubX + n} 0`;
  const bottom = stubX == null ? '' : ` L${stubX + n} ${h} A${n} ${n} 0 0 0 ${stubX - n} ${h}`;
  return [
    `M${r} 0`,
    top,
    ` L${w - r} 0 Q${w} 0 ${w} ${r}`,
    ` L${w} ${h - r} Q${w} ${h} ${w - r} ${h}`,
    bottom,
    ` L${r} ${h} Q0 ${h} 0 ${h - r}`,
    ` L0 ${r} Q0 0 ${r} 0 Z`,
  ].join('');
}

/** Bars whose widths come from the figures' digits: decoration that is still the journey's own. */
function Barcode({
  figures,
  color,
  width,
  height,
}: {
  figures: Figure[];
  color: string;
  width: number;
  height: number;
}) {
  const digits = figures.map((f) => f.value.replace(/\D/g, '')).join('') || '0';
  const bars = Array.from({ length: 30 }, (_, i) => 1 + ((Number(digits[i % digits.length]) + i * 7) % 3));
  const unit = width / bars.reduce((sum, b) => sum + b + 1, 0);
  const starts = bars.reduce<number[]>(
    (acc, b, i) => [...acc, i ? (acc[i - 1] ?? 0) + ((bars[i - 1] ?? 0) + 1) * unit : 0],
    []
  );
  return (
    <svg
      width={mm(width)}
      height={mm(height)}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      style={{ display: 'block', opacity: 0.8 }}
    >
      {bars.map((b, i) => (
        <rect key={i} x={starts[i]} y={0} width={b * unit} height={height} fill={color} />
      ))}
    </svg>
  );
}

/**
 * A tile per figure, rounded and tinted in the accent, the first one solid so
 * the eye lands there; each with its icon in a disc in the corner and the
 * figure set large along the foot.
 */
function TilesLook({ el, figures }: LookProps) {
  const { w, h } = el.frame;
  const { cols, rows } = gridOf(figures.length);
  const gap = Math.min(w, h) * 0.04;
  const tileW = (w - gap * (cols - 1)) / cols;
  const tileH = (h - gap * (rows - 1)) / rows;
  const pad = Math.min(tileW, tileH) * 0.12;
  const size = fitAll(figures, tileW - pad * 2, tileH * 0.34) * el.textScale;
  const caption = fitCaption(
    figures.map((f) => f.label),
    tileW - pad * 2,
    size * 0.24
  );
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: '1fr',
        gap: mm(gap),
        width: '100%',
        height: '100%',
      }}
    >
      {figures.map((f, i) => {
        const solid = i === 0;
        const ink = solid ? inkOn(el.accent) : el.color;
        return (
          <div
            key={f.metric}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: mm(pad),
              borderRadius: mm(Math.min(tileW, tileH) * 0.16),
              background: solid ? el.accent : inkAt(el.accent, 0.12),
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            {el.showIcons ? <IconDiscOn metric={f.metric} size={size * 0.62} el={el} solid={solid} /> : <span />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: mm(size * 0.1), minWidth: 0 }}>
              <FigureText f={f} size={size} el={el} color={ink} unitColor={solid ? ink : el.accent} />
              <Caption text={f.label} size={caption} el={el} color={ink} opacity={solid ? 0.85 : 0.6} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * A band: the figures in one line under a rule in the accent and over a
 * hairline, each in its own column with its icon beside its name, divided by
 * hairlines. The strip a page of photographs can carry along its foot.
 */
function BandLook({ el, figures }: LookProps) {
  const { w, h } = el.frame;
  const cellW = w / Math.max(1, figures.length);
  const size = fitAll(figures, cellW * 0.8, h * 0.42) * el.textScale;
  const caption = fitCaption(
    figures.map((f) => f.label),
    cellW * 0.62,
    size * 0.26
  );
  const hair = `${mm(Math.max(0.18, h * 0.01))} solid ${inkAt(el.color, 0.18)}`;
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        borderTop: `${mm(Math.max(0.6, h * 0.045))} solid ${el.accent}`,
        borderBottom: hair,
        boxSizing: 'border-box',
      }}
    >
      {figures.map((f, i) => (
        <div
          key={f.metric}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: mm(h * 0.06),
            paddingInline: mm(cellW * 0.08),
            borderInlineStart: i ? hair : undefined,
            minWidth: 0,
          }}
        >
          <FigureText f={f} size={size} el={el} color={el.color} unitColor={el.accent} />
          <span style={{ display: 'flex', alignItems: 'center', gap: mm(caption * 0.5), minWidth: 0 }}>
            {el.showIcons && <IconDisc metric={f.metric} size={caption * 2} el={el} />}
            <Caption text={f.label} size={caption} el={el} />
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * A medal per figure: a ring in the accent round a tinted disc, the figure in
 * the middle with its icon above it, and its name running round the lower rim
 * between two dots, the way a medal or a seal is lettered.
 */
function MedalLook({ el, figures }: LookProps) {
  const { w, h } = el.frame;
  const gap = Math.min(w, h) * 0.06;
  const d = Math.min(h, (w - gap * (figures.length - 1)) / Math.max(1, figures.length));
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: mm(gap),
        width: '100%',
        height: '100%',
      }}
    >
      {figures.map((f) => (
        <Medal key={f.metric} f={f} d={d} el={el} />
      ))}
    </div>
  );
}

function Medal({ f, d, el }: { f: Figure; d: number; el: BookStatsElement }) {
  const id = useId().replace(/:/g, '');
  const r = d / 2;
  const ring = d * 0.035;
  const size = fitType(chars(f), d * 0.56, d * 0.26) * el.textScale;
  const rim = r * 0.8;
  const label = f.label.toUpperCase();
  const type = Math.min(d * 0.075, (Math.PI * rim * 0.8) / Math.max(4, label.length * 0.78));
  const Icon = METRIC_ICONS[f.metric];
  return (
    <div style={{ position: 'relative', width: mm(d), height: mm(d), flex: '0 0 auto' }}>
      <svg
        width={mm(d)}
        height={mm(d)}
        viewBox={`0 0 ${d} ${d}`}
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden
      >
        <defs>
          <path id={`${id}-rim`} d={`M ${r - rim} ${r} A ${rim} ${rim} 0 0 0 ${r + rim} ${r}`} />
        </defs>
        <circle cx={r} cy={r} r={r - ring / 2} fill={inkAt(el.accent, 0.1)} stroke={el.accent} strokeWidth={ring} />
        <circle
          cx={r}
          cy={r}
          r={r * 0.68}
          fill="none"
          stroke={el.accent}
          strokeWidth={ring * 0.4}
          strokeDasharray={`${ring * 0.8} ${ring * 1.2}`}
        />
        <text
          fill={el.accent}
          style={{
            fontFamily: fontStack(el.font),
            fontWeight: heavy(el),
            fontSize: `${type}px`,
            letterSpacing: `${type * 0.22}px`,
          }}
        >
          <textPath href={`#${id}-rim`} startOffset="50%" textAnchor="middle" dominantBaseline="middle">
            {label}
          </textPath>
        </text>
        <circle cx={r - rim} cy={r} r={ring * 0.7} fill={el.accent} />
        <circle cx={r + rim} cy={r} r={ring * 0.7} fill={el.accent} />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: mm(d * 0.02),
          paddingBottom: mm(d * 0.08),
        }}
      >
        {el.showIcons && (
          <Icon
            color={el.accent}
            strokeWidth={2}
            style={{ width: mm(d * 0.13), height: mm(d * 0.13), display: 'block' }}
          />
        )}
        <FigureText f={f} size={size} el={el} color={el.color} unitColor={el.accent} />
      </div>
    </div>
  );
}

const LOOKS: Record<string, (props: LookProps) => ReactNode> = {
  poster: PosterLook,
  ticket: TicketLook,
  tiles: TilesLook,
  band: BandLook,
  medal: MedalLook,
  odometer: OdometerLook,
  sign: SignLook,
  note: NoteLook,
  sketch: SketchLook,
};

export function StatsLookView({ el, frameStyle }: { el: BookStatsElement; frameStyle: CSSProperties }) {
  const { t, locale } = useTranslation();
  const figures: Figure[] = el.metrics.map((metric) => ({
    metric,
    ...metricValue(metric, el.values, el.units, locale),
    label: t(`journey.studio.metric.${metric}`),
  }));
  const Look = LOOKS[el.look ?? 'poster'] ?? PosterLook;
  return (
    <div
      style={{
        ...frameStyle,
        display: 'flex',
        alignItems: 'stretch',
        fontFamily: fontStack(el.font),
        color: el.color,
        boxSizing: 'border-box',
      }}
    >
      <Look el={el} figures={figures} />
    </div>
  );
}
