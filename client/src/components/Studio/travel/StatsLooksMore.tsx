import { ArrowUpRight } from 'lucide-react';
import { inkOn } from './badgeLook';
import { hatch, roughBox, roughCircle, roughLine, seeded } from './sketch';
import { fitAll, fitCaption, fitType, gridOf, type Figure } from './statsFit';
import type { LookProps } from './StatsLooks';
import { Caption, FigureText } from './statsParts';
import { heavy, inkAt, light, METRIC_ICONS, mm } from './travelInk';

/**
 * The summary looks drawn after real things: the drums of an odometer, a road
 * sign, a note written on ruled paper, and a pencil sketch. Each is the same
 * figures as the other looks, in the element's ink and accent, sized from the
 * frame; StatsLooks.tsx picks the look.
 */

/**
 * An odometer: each figure on its own row of drums in a dark housing, the
 * digits printed on pale drums shaded where they turn away, padded with the
 * zeros a counter shows, the last drum in the accent the way the tenths are.
 */
export function OdometerLook({ el, figures }: LookProps) {
  const { w, h } = el.frame;
  const { cols, rows } = gridOf(figures.length);
  const cellW = w / cols;
  const cellH = h / rows;
  const paper = inkOn(el.color);
  const drumsOf = (f: Figure) => {
    const digits = f.value.replace(/\D/g, '');
    return digits.padStart(Math.max(4, digits.length), '0').split('');
  };
  const most = Math.max(...figures.map((f) => drumsOf(f).length));
  const drumW = Math.min((cellW * 0.82) / (most + 0.6), cellH * 0.34);
  const drumH = drumW * 1.45;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        width: '100%',
        height: '100%',
        borderRadius: mm(Math.min(w, h) * 0.06),
        background: `linear-gradient(180deg, ${inkAt(el.color, 0.88)}, ${el.color})`,
        boxShadow: `inset 0 0 0 ${mm(Math.min(w, h) * 0.012)} ${inkAt(paper, 0.12)}`,
        padding: mm(Math.min(w, h) * 0.04),
        boxSizing: 'border-box',
      }}
    >
      {figures.map((f) => {
        const drums = drumsOf(f);
        const lead = drums.length - f.value.replace(/\D/g, '').length;
        return (
          <div
            key={f.metric}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: mm(drumH * 0.22),
              minWidth: 0,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: mm(drumW * 0.08) }}>
              {drums.map((d, i) => {
                const last = i === drums.length - 1 && drums.length > 1;
                const face = last ? el.accent : paper;
                return (
                  <span
                    key={i}
                    style={{
                      width: mm(drumW),
                      height: mm(drumH),
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: mm(drumW * 0.12),
                      background: `linear-gradient(180deg, ${inkAt(el.color, 0.45)} 0%, ${face} 26%, ${face} 74%, ${inkAt(el.color, 0.45)} 100%)`,
                      color: last ? inkOn(el.accent) : el.color,
                      opacity: i < lead ? 0.55 : 1,
                      fontSize: mm(drumH * 0.66),
                      fontWeight: heavy(el),
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1,
                    }}
                  >
                    {d}
                  </span>
                );
              })}
              {f.unit && (
                <span
                  style={{
                    marginInlineStart: mm(drumW * 0.25),
                    color: paper,
                    fontSize: mm(drumH * 0.4),
                    fontWeight: light(el),
                  }}
                >
                  {f.unit}
                </span>
              )}
            </span>
            <Caption
              text={f.label}
              size={fitCaption([f.label], cellW * 0.8, drumH * 0.26)}
              el={el}
              color={paper}
              opacity={0.75}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * A road sign: a panel in the accent with a rule inset round its edge, an
 * arrow in its corner, and the figures listed the way a sign lists places,
 * the name on the left and the figure on the right, between hairlines.
 */
export function SignLook({ el, figures }: LookProps) {
  const { w, h } = el.frame;
  const ink = inkOn(el.accent);
  const inset = Math.min(w, h) * 0.035;
  const rowH = (h - inset * 4) / Math.max(1, figures.length);
  const value = fitAll(figures, w * 0.36, rowH * 0.62) * el.textScale;
  const label = fitCaption(
    figures.map((f) => f.label),
    w * 0.42,
    value * 0.62
  );
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: mm(inset * 1.6),
        background: el.accent,
        padding: mm(inset * 2),
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxShadow: `inset 0 0 0 ${mm(inset * 0.6)} ${el.accent}, inset 0 0 0 ${mm(inset * 0.9)} ${ink}`,
        color: ink,
      }}
    >
      <ArrowUpRight
        color={ink}
        strokeWidth={2.6}
        style={{
          position: 'absolute',
          top: mm(inset * 1.6),
          insetInlineEnd: mm(inset * 1.6),
          width: mm(rowH * 0.5),
          height: mm(rowH * 0.5),
          opacity: 0.9,
        }}
      />
      {figures.map((f, i) => (
        <div
          key={f.metric}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: mm(w * 0.04),
            paddingInlineEnd: mm(i === 0 ? rowH * 0.6 : 0),
            borderTop: i ? `${mm(Math.max(0.2, inset * 0.18))} solid ${inkAt(ink, 0.45)}` : undefined,
            minHeight: 0,
          }}
        >
          <span
            style={{
              fontSize: mm(label),
              fontWeight: heavy(el),
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {f.label}
          </span>
          <FigureText f={f} size={value} el={el} color={ink} />
        </div>
      ))}
    </div>
  );
}

/**
 * A note: a sheet of ruled paper with a margin in the accent, two strips of
 * tape holding it a degree or two off square, and the figures written on the
 * lines in the element's face, a script one when it comes from the panel.
 */
export function NoteLook({ el, figures }: LookProps) {
  const { w, h } = el.frame;
  const paper = inkOn(el.color);
  const line = h / (figures.length + 2);
  const size =
    fitAll(
      figures.map((f) => ({ ...f, value: `${f.value} ${f.label}` })),
      w * 0.74,
      line * 0.72
    ) * el.textScale;
  const tapeW = w * 0.22;
  const rule = Math.max(0.15, h * 0.004);
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transform: 'rotate(-1.6deg)',
        background: `repeating-linear-gradient(180deg, transparent 0 ${mm(line - rule)}, ${inkAt(el.accent, 0.28)} ${mm(line - rule)} ${mm(line)}), ${paper}`,
        backgroundPosition: `0 ${mm(line * 0.62)}`,
        boxShadow: `0 ${mm(h * 0.015)} ${mm(h * 0.05)} ${inkAt(el.color, 0.22)}`,
        display: 'flex',
        flexDirection: 'column',
        paddingInlineStart: mm(w * 0.16),
        paddingTop: mm(line * 1.05),
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          insetInlineStart: mm(w * 0.11),
          width: mm(rule * 1.6),
          background: inkAt(el.accent, 0.55),
        }}
      />
      {[-1, 1].map((side) => (
        <span
          key={side}
          style={{
            position: 'absolute',
            top: mm(-line * 0.25),
            insetInlineStart: side < 0 ? mm(w * 0.04) : undefined,
            insetInlineEnd: side > 0 ? mm(w * 0.04) : undefined,
            width: mm(tapeW),
            height: mm(line * 0.62),
            background: inkAt(el.accent, 0.32),
            transform: `rotate(${side * 7}deg)`,
          }}
        />
      ))}
      {figures.map((f) => (
        <span
          key={f.metric}
          style={{
            height: mm(line),
            display: 'flex',
            alignItems: 'flex-end',
            gap: mm(size * 0.3),
            paddingBottom: mm(line * 0.12),
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: mm(size), fontWeight: heavy(el), color: el.accent, lineHeight: 1 }}>
            {f.value}
            {f.unit && ` ${f.unit}`}
          </span>
          <span style={{ fontSize: mm(size * 0.78), fontWeight: light(el), color: el.color, lineHeight: 1 }}>
            {f.label}
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * A pencil sketch: a frame drawn freehand twice over, each figure ringed by a
 * loop in the accent with hatching behind its icon, and its name underlined
 * with a quick stroke. Seeded from the element, so it draws the same each time.
 */
export function SketchLook({ el, figures }: LookProps) {
  const { w, h } = el.frame;
  const rand = seeded(`${el.id}:${figures.map((f) => f.value).join()}`);
  const { cols, rows } = gridOf(figures.length);
  const cellW = w / cols;
  const cellH = h / rows;
  const pen = Math.max(0.2, Math.min(w, h) * 0.008);
  const wob = Math.min(w, h) * 0.012;
  const ringR = Math.min(cellW * 0.3, cellH * 0.28);
  const size = fitAll(figures, ringR * 1.5, ringR * 0.6) * el.textScale;
  const frame = `${roughBox({ x: pen * 3, y: pen * 3, w: w - pen * 6, h: h - pen * 6 }, { rand, wobble: wob })} ${roughBox({ x: pen * 4, y: pen * 2, w: w - pen * 7, h: h - pen * 5 }, { rand, wobble: wob })}`;
  const marks = figures.map((f, i) => {
    const cx = (i % cols) * cellW + cellW / 2;
    const cy = Math.floor(i / cols) * cellH + cellH * 0.4;
    const r = ringR;
    const icon = size * 0.5;
    return {
      f,
      ring: roughCircle(cx, cy, r, { rand, wobble: wob * 0.9 }),
      shade: hatch({ x: cx - r * 0.95, y: cy - r * 1.05, w: icon * 1.2, h: icon * 1.2 }, icon * 0.22, {
        rand,
        wobble: wob * 0.3,
      }),
      under: roughLine(cx - r * 0.7, cy + r * 1.22, cx + r * 0.7, cy + r * 1.18, { rand, wobble: wob * 0.6 }),
      at: { x: cx, y: cy, r },
    };
  });
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        width={mm(w)}
        height={mm(h)}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        aria-hidden
      >
        <path d={frame} fill="none" stroke={el.color} strokeWidth={pen} strokeLinecap="round" opacity={0.8} />
        {marks.map((m) => (
          <g key={m.f.metric}>
            <path
              d={m.shade}
              fill="none"
              stroke={el.accent}
              strokeWidth={pen * 0.7}
              strokeLinecap="round"
              opacity={0.5}
            />
            <path
              d={m.ring}
              fill="none"
              stroke={el.accent}
              strokeWidth={pen * 1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d={m.under} fill="none" stroke={el.color} strokeWidth={pen} strokeLinecap="round" opacity={0.7} />
          </g>
        ))}
      </svg>
      {marks.map(({ f, at }) => {
        const Icon = METRIC_ICONS[f.metric];
        const box = { position: 'absolute', insetInlineStart: mm(at.x - at.r * 1.4), width: mm(at.r * 2.8) } as const;
        return (
          <div key={f.metric}>
            <div
              style={{
                ...box,
                top: mm(at.y - at.r * 0.8),
                height: mm(at.r * 1.6),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: mm(at.r * 0.04),
              }}
            >
              {el.showIcons && (
                <Icon
                  color={el.color}
                  strokeWidth={1.6}
                  style={{ width: mm(size * 0.4), height: mm(size * 0.4), display: 'block' }}
                />
              )}
              <FigureText f={f} size={size} el={el} color={el.color} unitColor={el.accent} />
            </div>
            <span
              style={{
                ...box,
                top: mm(at.y + at.r * 1.3),
                textAlign: 'center',
                fontSize: mm(fitType(f.label.length, at.r * 2.4, size * 0.4)),
                fontWeight: light(el),
                color: el.color,
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              {f.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
