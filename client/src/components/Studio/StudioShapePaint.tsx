import {
  shapePaint,
  withShapePaint,
  withThemeLinks,
  type BookElement,
  type BookShapeElement,
  type BookTheme,
} from '@trek/shared';
import { shapeOutlineInUse } from './inspector/inspectorModel';
import { usePaintChannel } from './paint/usePaintChannel';
import { Choice, Line, NumField, Section } from './StudioControls';
import { STROKE_STYLE_OPTIONS } from './studioOptions';
import { StudioPaintPicker } from './StudioPaintPicker';
import type { StudioT } from './StudioSidebar';
import { Swatches } from './StudioSwatches';
import { StudioThemeLink } from './theme/StudioThemeLink';

/** The outline a shape is given when its fill goes and it has none, so it never turns invisible. */
const OUTLINE = '#141414';

type SetShape = (patch: Partial<BookShapeElement>) => void;

/**
 * A shape's fill, as a paint: none, one colour, a gradient or a pattern.
 *
 * The fill goes to every selected shape at once, the way the rest of the
 * inspector's properties do. Taking the fill away from a shape with no
 * outline gives it one, as the old fill switch did: a shape with neither is
 * a shape nobody can see or find again.
 */
export function StudioShapeFill({
  el,
  spreadIndex,
  selection,
  theme,
  set,
  t,
}: {
  el: BookShapeElement;
  spreadIndex: number;
  selection: readonly string[];
  /** The book's theme, for the theme colours under the paint; none without one. */
  theme?: BookTheme;
  /** The inspector's write, for linking the fill to the theme. */
  set: SetShape;
  t: StudioT;
}) {
  const channel = usePaintChannel((paint) => (doc) => ({
    ...doc,
    spreads: doc.spreads.map((sp, i) =>
      i !== spreadIndex
        ? sp
        : {
            ...sp,
            elements: sp.elements.map((e): BookElement => {
              if (e.kind !== 'shape' || !selection.includes(e.id)) return e;
              // A paint picked by hand stops the fill following the theme.
              const painted = withThemeLinks(withShapePaint(e, paint), { paint }, doc.theme);
              return paint === null && !e.stroke
                ? { ...painted, stroke: OUTLINE, strokeWidth: e.strokeWidth || 0.5 }
                : painted;
            }),
          }
    ),
  }));

  return (
    <Section label={t('journey.studio.fill')}>
      <StudioPaintPicker value={shapePaint(el)} channel={channel} t={t} noneLabel={t('journey.studio.paint.none')} />
      <StudioThemeLink
        theme={theme}
        token={el.token}
        t={t}
        onLink={(token, fill) => set({ fill, token, paint: undefined })}
        onUnlink={() => set({ token: undefined })}
      />
    </Section>
  );
}

/**
 * A shape's outline: its colour, the stroke it is drawn in and how wide.
 *
 * Folded until the shape has one, since most shapes are a fill and nothing
 * else. Every way of asking for an outline brings one: a colour, a width or a
 * dash on a shape that had none draws it rather than doing nothing.
 */
export function StudioShapeOutline({
  el,
  theme,
  set,
  t,
}: {
  el: BookShapeElement;
  theme?: BookTheme;
  set: SetShape;
  t: StudioT;
}) {
  const width = el.strokeWidth || 0.5;
  return (
    <Section label={t('journey.studio.stroke')} defaultOpen={shapeOutlineInUse(el)}>
      <Swatches value={el.stroke ?? OUTLINE} onPick={(stroke) => set({ stroke, strokeWidth: width })} />
      <StudioThemeLink
        theme={theme}
        token={el.strokeToken}
        t={t}
        onLink={(strokeToken, stroke) => set({ stroke, strokeToken, strokeWidth: width })}
        onUnlink={() => set({ strokeToken: undefined })}
      />
      <div className="st-section-gap">
        <Line label={t('journey.studio.strokeStyle')}>
          <Choice
            value={el.strokeStyle}
            ariaLabel={t('journey.studio.strokeStyle')}
            options={STROKE_STYLE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            onPick={(strokeStyle) =>
              set({
                strokeStyle,
                // A stroke style with no stroke is invisible, so asking for dashes turns the outline on.
                ...(el.stroke ? {} : { stroke: el.fill ?? OUTLINE, strokeWidth: width }),
              })
            }
          />
        </Line>
      </div>
      <div className="st-section-gap">
        <NumField
          label={t('journey.studio.strokeWidth')}
          value={el.strokeWidth}
          min={0}
          max={20}
          step={0.1}
          unit="mm"
          onChange={(v) => set({ strokeWidth: v, ...(v > 0 && !el.stroke ? { stroke: OUTLINE } : {}) })}
        />
      </div>
    </Section>
  );
}
