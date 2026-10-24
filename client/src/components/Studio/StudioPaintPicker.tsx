import {
  PATTERN_SCALE,
  RADIAL_RADIUS,
  stopAlpha,
  type BookGradientPaint,
  type BookPaint,
  type BookPattern,
  type BookPatternPaint,
} from '@trek/shared';
import { ArrowLeftRight, Ban, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import '../../styles/studio-paint.css';
import { NumField } from './StudioControls';
import type { StudioT } from './StudioSidebar';
import { Swatches } from './StudioSwatches';
import { AngleDial } from './paint/AngleDial';
import { GradientStopBar } from './paint/GradientStopBar';
import { PatternSwatches } from './paint/PatternSwatches';
import { RadialPad } from './paint/RadialPad';
import {
  PATTERN_ANGLE,
  clampRadius,
  clampScale,
  cssPaint,
  gradientAs,
  kindOf,
  normAngle,
  paintAs,
  removeStop,
  reverseStops,
  updateStop,
  type PaintKind,
} from './paint/paintEdit';
import type { PaintChannel } from './paint/usePaintChannel';

/**
 * Paint, picked: none, one colour, a gradient or a pattern.
 *
 * ── How it is laid out ───────────────────────────────────────────────────
 *
 * One row of four tabs says what kind of paint it is, each with a swatch of
 * what choosing it gives, and below it only the controls that kind has. The
 * tab is the question people ask first ("flat or a gradient?"), so it is a
 * row they can read at a glance rather than a menu.
 *
 * Switching kind keeps the colour: a solid becomes a gradient from that
 * colour to a lighter partner, a gradient becomes a pattern in its first
 * colour, and coming back to a kind already visited in this session brings
 * it back as it was left, so trying a pattern costs nothing.
 *
 * Every drag (a stop, the dial, the centre, a slider) writes live and is one
 * undo step when it is let go, through the channel the caller hands in.
 */

const KINDS: readonly PaintKind[] = ['none', 'solid', 'gradient', 'pattern'];
/** A kind's name on its tab. */
function kindLabel(k: Exclude<PaintKind, 'none'>, t: StudioT): string {
  if (k === 'solid') return t('journey.studio.paint.solid');
  return k === 'gradient' ? t('journey.studio.paint.gradient') : t('journey.studio.paint.pattern');
}

export function StudioPaintPicker({
  value,
  channel,
  t,
  noneLabel,
  kinds = KINDS,
}: {
  value: BookPaint | null;
  channel: PaintChannel;
  t: StudioT;
  /** What "no paint" is called here: no fill on a shape, the paper on a page. */
  noneLabel: string;
  /**
   * The kinds offered as tabs; all four by default. With one, the row of tabs
   * is left out: the letters of a text pick gradient or pattern beside their
   * other fills and only need that kind's controls here.
   */
  kinds?: readonly PaintKind[];
}) {
  const kind = kindOf(value);
  // The last paint of each kind shown here, so a kind visited again comes back as it was left.
  const [memory, setMemory] = useState<Partial<Record<PaintKind, BookPaint>>>({});
  const [stop, setStop] = useState(0);

  const write = (paint: BookPaint | null, done = true) => {
    const k = kindOf(paint);
    if (paint && k !== 'none') setMemory((m) => ({ ...m, [k]: paint }));
    if (done) channel.commit(paint);
    else channel.live(paint);
  };

  const choose = (next: PaintKind) => {
    if (next === kind) return;
    const kept = value ? { ...memory, [kind]: value } : memory;
    if (value) setMemory((m) => ({ ...m, [kind]: value }));
    setStop(0);
    write(paintAs(next, value, kept));
  };

  const tabPreview = (k: PaintKind) =>
    k === 'none' ? undefined : cssPaint(k === kind ? value : paintAs(k, value, memory));

  return (
    <div className="st-paint">
      {kinds.length > 1 && (
        <div className="st-paint-tabs" role="tablist" aria-label={t('journey.studio.paint.kind')}>
          {kinds.map((k) => (
            <button
              type="button"
              key={k}
              role="tab"
              aria-selected={k === kind}
              className={`st-paint-tab ${k === kind ? 'is-on' : ''}`}
              onClick={() => choose(k)}
            >
              <span
                className={`st-paint-tab-chip ${k === 'none' ? 'is-none' : ''} ${k === 'pattern' ? 'is-pattern' : ''}`}
                // A pattern's chip keeps its strokes (studio-paint.css) over the ground colour.
                style={k === 'pattern' ? { backgroundColor: tabPreview(k) } : { background: tabPreview(k) }}
                aria-hidden
              >
                {k === 'none' && <Ban size={11} strokeWidth={2.2} />}
              </span>
              <span className="st-paint-tab-label">{k === 'none' ? noneLabel : kindLabel(k, t)}</span>
            </button>
          ))}
        </div>
      )}

      {value?.type === 'solid' && (
        <Swatches
          value={value.color}
          onPick={(color) => write({ ...value, color })}
          alpha={stopAlpha(value)}
          onAlpha={(alpha, done) => write(withAlpha(value, alpha), done)}
        />
      )}

      {(value?.type === 'linear' || value?.type === 'radial') && (
        <GradientControls
          paint={value}
          stop={Math.min(stop, value.stops.length - 1)}
          onStop={setStop}
          write={write}
          t={t}
        />
      )}

      {value?.type === 'pattern' && <PatternControls paint={value} write={write} t={t} />}
    </div>
  );
}

const withAlpha = <T extends { alpha?: number }>(o: T, alpha: number): T => {
  const { alpha: _old, ...rest } = o;
  return (alpha >= 1 ? rest : { ...rest, alpha: Math.round(alpha * 100) / 100 }) as T;
};

type Write = (paint: BookPaint | null, done?: boolean) => void;

function GradientControls({
  paint,
  stop,
  onStop,
  write,
  t,
}: {
  paint: BookGradientPaint;
  stop: number;
  onStop: (i: number) => void;
  write: Write;
  t: StudioT;
}) {
  const current = paint.stops[stop];
  const canRemove = paint.stops.length > 2;
  return (
    <div className="st-paint-body">
      <div className="st-paint-row">
        <div className="st-seg" role="radiogroup" aria-label={t('journey.studio.paint.gradient')}>
          {(['linear', 'radial'] as const).map((type) => (
            <button
              type="button"
              key={type}
              role="radio"
              aria-checked={paint.type === type}
              className={`st-seg-item ${paint.type === type ? 'is-on' : ''}`}
              onClick={() => write(gradientAs(paint, type))}
            >
              {type === 'linear' ? t('journey.studio.paint.linear') : t('journey.studio.paint.radial')}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="st-chip is-icon"
          title={t('journey.studio.paint.reverse')}
          aria-label={t('journey.studio.paint.reverse')}
          onClick={() => write(reverseStops(paint))}
        >
          <ArrowLeftRight size={13} />
        </button>
      </div>

      <GradientStopBar
        paint={paint}
        selected={stop}
        onSelect={onStop}
        onChange={(p, done) => write(p, done)}
        labels={{
          bar: t('journey.studio.paint.addStopHint'),
          stop: (pos) => t('journey.studio.paint.stopAt', { pos }),
        }}
      />

      {current && (
        <div className="st-paint-stop">
          <div className="st-paint-row">
            <span className="st-paint-caption">
              {t('journey.studio.paint.stopAt', { pos: Math.round(current.at * 100) })}
            </span>
            <button
              type="button"
              className="st-chip is-icon is-danger"
              disabled={!canRemove}
              title={t('journey.studio.paint.removeStop')}
              aria-label={t('journey.studio.paint.removeStop')}
              onClick={() => {
                onStop(Math.max(0, stop - 1));
                write(removeStop(paint, stop));
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
          <Swatches
            value={current.color}
            onPick={(color) => write(updateStop(paint, stop, { color }))}
            alpha={stopAlpha(current)}
            onAlpha={(alpha, done) => write(updateStop(paint, stop, { alpha }), done)}
          />
        </div>
      )}

      {paint.type === 'linear' ? (
        <div className="st-paint-row is-dial">
          <AngleDial
            value={paint.angle}
            label={t('journey.studio.paint.angle')}
            onChange={(angle, done) => write({ ...paint, angle }, done)}
          />
          <NumField
            label={t('journey.studio.paint.angle')}
            value={normAngle(paint.angle)}
            min={0}
            max={359}
            step={1}
            unit="°"
            onChange={(angle) => write({ ...paint, angle: normAngle(angle) })}
          />
        </div>
      ) : (
        <div className="st-paint-row is-dial">
          <RadialPad paint={paint} label={t('journey.studio.paint.centre')} onChange={(p, done) => write(p, done)} />
          <Slider
            label={t('journey.studio.paint.radius')}
            value={paint.r}
            min={RADIAL_RADIUS.min}
            max={RADIAL_RADIUS.max}
            shown={`${Math.round(paint.r * 100)}%`}
            onChange={(r, done) => write({ ...paint, r: clampRadius(r) }, done)}
          />
        </div>
      )}
    </div>
  );
}

function PatternControls({ paint, write, t }: { paint: BookPatternPaint; write: Write; t: StudioT }) {
  const pick = (pattern: BookPattern) => write({ ...paint, pattern, angle: PATTERN_ANGLE[pattern] ?? paint.angle });
  return (
    <div className="st-paint-body">
      <PatternSwatches value={paint} onPick={pick} label={(p) => t(`journey.studio.pattern.${p}`)} />

      <div className="st-paint-field">
        <span className="st-paint-caption">{t('journey.studio.paint.ink')}</span>
        <Swatches value={paint.fg} onPick={(fg) => write({ ...paint, fg })} />
      </div>

      <div className="st-paint-field">
        <div className="st-paint-row">
          <span className="st-paint-caption">{t('journey.studio.paint.ground')}</span>
          <button
            type="button"
            role="switch"
            aria-checked={paint.bg === null}
            className={`st-chip is-pick ${paint.bg === null ? 'is-on' : ''}`}
            onClick={() => write({ ...paint, bg: paint.bg === null ? '#ffffff' : null })}
          >
            {t('journey.studio.paint.seeThrough')}
          </button>
        </div>
        {paint.bg !== null && <Swatches value={paint.bg} onPick={(bg) => write({ ...paint, bg })} />}
      </div>

      <div className="st-paint-row is-dial">
        <AngleDial
          value={paint.angle}
          label={t('journey.studio.paint.angle')}
          onChange={(angle, done) => write({ ...paint, angle }, done)}
        />
        <Slider
          label={t('journey.studio.paint.scale')}
          value={paint.scale}
          min={PATTERN_SCALE.min}
          max={PATTERN_SCALE.max}
          shown={`${Math.round(paint.scale * 100)}%`}
          log
          onChange={(scale, done) => write({ ...paint, scale: clampScale(scale) }, done)}
        />
      </div>
    </div>
  );
}

/** A labelled slider with its value beside it; `done` as for the dial. */
function Slider({
  label,
  value,
  min,
  max,
  shown,
  onChange,
  log = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  shown: string;
  onChange: (v: number, done: boolean) => void;
  /** Even steps by ratio rather than by difference: a pattern's scale doubles, it does not add. */
  log?: boolean;
}) {
  const steps = 100;
  const toValue = (raw: string) => {
    const t = Number(raw) / steps;
    return log ? min * (max / min) ** t : min + (max - min) * t;
  };
  const pos = Math.round((log ? Math.log(value / min) / Math.log(max / min) : (value - min) / (max - min)) * steps);
  // What the slider was last moved to: a controlled input may still show the old value when it is let go.
  const moved = useRef(value);
  return (
    <label className="st-paint-slider">
      <span className="st-paint-slider-head">
        <span className="st-paint-caption">{label}</span>
        <span className="st-paint-value">{shown}</span>
      </span>
      <input
        type="range"
        min={0}
        max={steps}
        step={1}
        value={pos}
        onPointerDown={() => {
          moved.current = value;
        }}
        onKeyDown={() => {
          moved.current = value;
        }}
        onChange={(e) => {
          moved.current = toValue(e.target.value);
          onChange(moved.current, false);
        }}
        onPointerUp={() => onChange(moved.current, true)}
        onKeyUp={() => onChange(moved.current, true)}
      />
    </label>
  );
}
