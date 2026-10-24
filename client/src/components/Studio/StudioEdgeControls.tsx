import {
  BOOK_EDGES,
  BOOK_EDGE_SIZE_MAX,
  BOOK_EDGE_SIZE_MIN,
  type BookEdge,
  type BookShapeId,
  bookShapeTakesEdge,
} from '@trek/shared';

import { edgeInUse } from './inspector/inspectorModel';
import { DEFAULT_EDGE_SIZE } from './shapeOutline';
import { edgedPath } from './shapes-edges';
import { NumField, Section } from './StudioControls';

/**
 * The edge of a shape or of a photo's cut: a row of tiles, each the edge drawn
 * on a little card, and how deep it bites.
 *
 * Shown for the shapes an edge is cut along and for photos. On an outline that
 * takes none (a heart, a star) it stays away, unless an edge is already set
 * there, which it then says does nothing and offers to put back.
 */

const CARD = 'M0 0L40 0L40 30L0 30Z';

/** One edge, drawn on a card the size of a tile. Seeded alike, so the torn tile does not change while you look at it. */
function EdgeGlyph({ edge }: { edge: BookEdge }) {
  return (
    <svg viewBox="-2 -2 44 34" aria-hidden>
      <path d={edgedPath(CARD, edge, 5, 3)} fill="currentColor" />
    </svg>
  );
}

export function EdgeSection({
  edge,
  edgeSize,
  outline,
  onSet,
  t,
}: {
  edge: BookEdge | undefined;
  edgeSize: number | undefined;
  /** The shape the edge would be cut along; null for a photo's plain rectangle. */
  outline: BookShapeId | null;
  onSet: (patch: { edge?: BookEdge; edgeSize?: number }) => void;
  t: (k: string) => string;
}) {
  const current = edge ?? 'straight';
  const takes = bookShapeTakesEdge(outline);
  // A heart or a star keeps its drawn line, so there is nothing to offer unless an edge is already set on one.
  if (!takes && current === 'straight') return null;
  return (
    <Section label={t('journey.studio.edgeStyle')} defaultOpen={edgeInUse(edge)}>
      {!takes && <p className="st-hint st-hint-before">{t('journey.studio.edgeUnavailable')}</p>}
      <div className="st-mini-shapes">
        {BOOK_EDGES.map((e) => (
          <button
            type="button"
            key={e}
            className={`st-mini-shape ${current === e ? 'is-on' : ''}`}
            onClick={() => onSet({ edge: e })}
            title={t(`journey.studio.edge.${e}`)}
            aria-label={t(`journey.studio.edge.${e}`)}
            aria-pressed={current === e}
          >
            <EdgeGlyph edge={e} />
          </button>
        ))}
      </div>
      {takes && current !== 'straight' && (
        <div className="st-section-gap">
          <NumField
            label={t('journey.studio.edgeSize')}
            value={edgeSize ?? DEFAULT_EDGE_SIZE}
            min={BOOK_EDGE_SIZE_MIN}
            max={BOOK_EDGE_SIZE_MAX}
            step={0.5}
            unit="mm"
            onChange={(v) => onSet({ edgeSize: v })}
          />
        </div>
      )}
    </Section>
  );
}
