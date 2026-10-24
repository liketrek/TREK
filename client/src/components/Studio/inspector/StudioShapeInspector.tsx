import type { BookElement, BookShapeElement, BookShapeId, BookTheme } from '@trek/shared';
import type { ReactNode } from 'react';

import { SHAPE_GROUPS, shapeName } from '../shapes';
import { NumField, Section } from '../StudioControls';
import { EdgeSection } from '../StudioEdgeControls';
import { ShapeGlyph } from '../StudioElementsPanel';
import { StudioShapeFill, StudioShapeOutline } from '../StudioShapePaint';

/**
 * The inspector of a shape: which shape it is and its corner first, then where
 * it sits, then its fill, and folded under that its outline and its cut edge,
 * each open on a shape that has one.
 */
export function StudioShapeInspector({
  el,
  spreadIndex,
  selection,
  theme,
  set,
  position,
  t,
}: {
  el: BookShapeElement;
  spreadIndex: number;
  selection: readonly string[];
  theme: BookTheme | undefined;
  set: (patch: Partial<BookElement>) => void;
  position: ReactNode;
  t: (k: string) => string;
}) {
  return (
    <>
      <Section label={t('journey.studio.shape')}>
        {/* Every shape, not just the two the element started as: swapping a placed shape keeps its position,
            size and colour, which deleting and re-adding would not. */}
        <div className="st-mini-shapes">
          {SHAPE_GROUPS.flatMap((g) => g.shapes).map((sh: BookShapeId) => (
            <button
              type="button"
              key={sh}
              className={`st-mini-shape ${el.shape === sh ? 'is-on' : ''}`}
              onClick={() => set({ shape: sh })}
              title={shapeName(sh, t)}
              aria-label={shapeName(sh, t)}
              aria-pressed={el.shape === sh}
            >
              <ShapeGlyph shape={sh} />
            </button>
          ))}
        </div>
        <div className="st-section-gap">
          <NumField
            label={t('journey.studio.radius')}
            value={el.radius}
            min={0}
            max={60}
            step={0.5}
            unit="mm"
            onChange={(v) => set({ radius: v })}
          />
        </div>
      </Section>

      {position}

      <StudioShapeFill el={el} spreadIndex={spreadIndex} selection={selection} theme={theme} set={set} t={t} />
      <StudioShapeOutline el={el} theme={theme} set={set} t={t} />
      <EdgeSection edge={el.edge} edgeSize={el.edgeSize} outline={el.shape} onSet={(patch) => set(patch)} t={t} />
    </>
  );
}
