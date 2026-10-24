import type { BookDecoratedTemplate, BookPageSetup, BookSpread, BookTemplate, JourneyStats } from '@trek/shared';
import {
  applyBookTemplate as applyTemplate,
  BOOK_COVER_TEMPLATES as COVER_TEMPLATES,
  layoutAroundLocks,
  BOOK_TEMPLATES as TEMPLATES,
} from '@trek/shared';
import { memo, useDeferredValue, useMemo, useState } from 'react';

import { useElementSize } from '../../../hooks/useElementSize';
import { useStudioStore } from '../../../store/studioStore';
import '../../../styles/studio-templates.css';
import { SpreadThumb } from '../SpreadThumb';
import { Choice } from '../StudioControls';
import { PanelHead } from '../StudioPanelHead';
import { StudioSavedLayouts } from '../StudioSavedLayouts';
import {
  ARCHETYPE_FILTERS,
  emptyFrames,
  layTemplate,
  pageKind,
  previewIds,
  studioTemplateWords,
  templatesForSpread,
  templateTravel,
  type ArchetypeFilter,
  type TemplateContext,
  type TemplateSource,
} from './templatesModel';

/**
 * The Templates section of the rail: the decorated templates first, then the
 * book's own layouts and the built-in wireframes.
 *
 * A decorated template is a whole designed page, and its card is that page as
 * the click will lay it: this page's photos and words poured into it, in the
 * book's theme, drawn by the page renderer at a small scale. Covers are drawn
 * two to a row so the set can be compared at a glance; a double spread takes
 * the full width. A row of style chips narrows the set to one archetype.
 */

/** The smallest a preview is drawn, and the button's border and padding the row's width still includes. */
const MIN_PREVIEW_W = 96;
const THUMB_CHROME = (2 + 3) * 2;
/** The gap between two cover cards in a row, as studio-templates.css sets it. */
const PAIR_GAP = 8;

type Translate = (k: string, params?: Record<string, string | number>) => string;

/** How wide a card draws its page, from the measured row: the full row, or half of it for a cover. */
function previewWidths(row: number, single: boolean): { full: number; card: number } {
  const full = Math.max(MIN_PREVIEW_W, row - THUMB_CHROME);
  return { full, card: single ? Math.max(MIN_PREVIEW_W / 2, (row - PAIR_GAP) / 2 - THUMB_CHROME) : full };
}

interface DecoratedCardProps {
  tpl: BookDecoratedTemplate;
  spread: BookSpread;
  page: BookPageSetup;
  ctx: TemplateContext;
  width: number;
  pxPerMm: number;
  label: string;
  onPick: (tpl: BookDecoratedTemplate) => void;
}

/** One decorated template, drawn as the page it makes of the page that is open. */
const DecoratedCard = memo(function DecoratedCard({
  tpl,
  spread,
  page,
  ctx,
  width,
  pxPerMm,
  label,
  onPick,
}: DecoratedCardProps) {
  const preview = useMemo(
    () => layTemplate(spread, tpl, page, ctx, previewIds(`tpl-${tpl.id}`)),
    [spread, tpl, page, ctx]
  );
  return (
    <button type="button" className="st-thumb st-tpl-card" title={label} aria-label={label} onClick={() => onPick(tpl)}>
      <span aria-hidden className="st-tpl-art">
        <SpreadThumb
          spread={preview}
          page={page}
          width={width}
          pxPerMm={pxPerMm}
          fold={tpl.kind === 'inner'}
          className="st-thumb-sheet"
        />
      </span>
      <span className="st-thumb-label st-tpl-label">{label}</span>
    </button>
  );
});

/** The built-in layouts, drawn as the frames they lay out: the wireframes Studio has always had. */
function BuiltInLayouts({
  spread,
  page,
  pxPerMm,
  width,
  t,
  onPick,
}: {
  spread: BookSpread;
  page: BookPageSetup;
  pxPerMm: number;
  width: number;
  t: Translate;
  onPick: (tpl: BookTemplate) => void;
}) {
  const single = spread.role !== 'inner';
  // A cover card is one page wide, not two: scaled as a spread it would draw at half size.
  const scale = width / (page.pageWidth * (single ? 1 : 2) * pxPerMm);
  const templates = single ? COVER_TEMPLATES : TEMPLATES;
  return (
    <div className={`st-thumbs st-tpl-grid ${single ? 'is-pages' : 'is-spreads'}`}>
      {templates.map((tpl) => (
        <button type="button" key={tpl.id} className="st-thumb" onClick={() => onPick(tpl)}>
          {/* A page is laid out from its top left in either reading direction. */}
          <div dir="ltr" className="st-thumb-sheet" style={{ width, height: page.pageHeight * pxPerMm * scale }}>
            {tpl.build(page).map((slot, i) => (
              <span
                key={i}
                className={`st-tpl-slot is-${slot.kind}`}
                style={{
                  insetInlineStart: slot.frame.x * pxPerMm * scale,
                  top: slot.frame.y * pxPerMm * scale,
                  width: slot.frame.w * pxPerMm * scale,
                  height: Math.max(2, slot.frame.h * pxPerMm * scale),
                }}
              />
            ))}
            {!single && <span className="st-tpl-fold" style={{ insetInlineStart: page.pageWidth * pxPerMm * scale }} />}
          </div>
          <span className="st-thumb-label">{t(tpl.labelKey)}</span>
        </button>
      ))}
    </div>
  );
}

export function StudioTemplatesPanel({
  page,
  pxPerMm,
  t,
  locale,
  source,
  stats,
  path,
  onOpenContent,
}: {
  page: BookPageSetup;
  pxPerMm: number;
  t: Translate;
  locale: string;
  source: TemplateSource;
  stats: JourneyStats | null;
  path: [number, number][][];
  /** Opens the panel of the journey's photos, for frames a layout left empty. */
  onOpenContent: () => void;
}) {
  const doc = useStudioStore((s) => s.doc);
  const active = useStudioStore((s) => s.activeSpread);
  const commit = useStudioStore((s) => s.commit);
  const select = useStudioStore((s) => s.select);
  const [filter, setFilter] = useState<ArchetypeFilter>('all');
  const list = useElementSize<HTMLDivElement>();
  // The cards redraw from the page as it is; deferred, so typing on the page never waits on them.
  const spread = useDeferredValue(doc?.spreads[active]);
  const theme = doc?.theme;
  const title = doc?.title ?? '';

  const ctx = useMemo<TemplateContext | null>(() => {
    if (!spread) return null;
    const words = studioTemplateWords(title, spread, source, locale);
    return { theme, words, travel: templateTravel(stats, path, locale, t), locale };
  }, [spread, theme, title, source, stats, path, locale, t]);

  if (!doc || !spread || !ctx) return null;
  const single = spread.role !== 'inner';
  const templates = templatesForSpread(spread, filter);
  const { card: cardWidth } = previewWidths(list.width, single);

  /**
   * One undo step: the page laid out, nothing selected, and the photos at hand
   * when frames are left empty. It works on the page as it is now, not as the
   * deferred cards last drew it: a click right after moving to another page
   * lays nothing when the layout is for the other kind of page.
   */
  const lay = (make: (sp: BookSpread) => BookSpread | null) => {
    const done: { page: BookSpread | null } = { page: null };
    commit((d) => {
      const now = d.spreads[active];
      const next = now ? make(now) : null;
      done.page = next;
      return next ? { ...d, spreads: d.spreads.map((sp, i) => (i === active ? next : sp)) } : d;
    });
    if (!done.page) return;
    select([]);
    if (emptyFrames(done.page) > 0) onOpenContent();
  };
  const pickDecorated = (tpl: BookDecoratedTemplate) =>
    lay((sp) =>
      pageKind(sp) === tpl.kind
        ? layTemplate(sp, tpl, page, { ...ctx, words: studioTemplateWords(title, sp, source, locale) })
        : null
    );
  // A built-in layout arranges what is not locked, as the assistant's does; a decorated one keeps locks itself.
  const pickBuiltIn = (tpl: BookTemplate) =>
    lay((sp) =>
      pageKind(sp) === (tpl.role ?? 'inner') ? layoutAroundLocks(sp, (free) => applyTemplate(free, tpl, page)) : null
    );

  return (
    <>
      <PanelHead label={t('journey.studio.templates')} count={templates.length} />
      <div className="st-panel-scroll">
        <div className="st-section st-tpl-section">
          <div className="st-section-label">{t('studio.templates.decorated')}</div>
          <Choice<ArchetypeFilter>
            value={filter}
            ariaLabel={t('studio.templates.style')}
            onPick={setFilter}
            options={ARCHETYPE_FILTERS.map((a) => ({
              value: a,
              label: a === 'all' ? t('studio.templates.all') : t(`studio.templates.archetype.${a}`),
            }))}
          />
          <div className={`st-tpl-grid ${single ? 'is-pages' : 'is-spreads'}`} ref={list.ref}>
            {templates.map((tpl) => (
              <DecoratedCard
                key={tpl.id}
                tpl={tpl}
                spread={spread}
                page={page}
                ctx={ctx}
                width={cardWidth}
                pxPerMm={pxPerMm}
                label={t(tpl.labelKey)}
                onPick={pickDecorated}
              />
            ))}
          </div>
          <p className="st-hint">{t('studio.templates.hint')}</p>
        </div>
        <StudioSavedLayouts page={page} width={cardWidth} pxPerMm={pxPerMm} t={t} />
        <div className="st-section">
          <div className="st-section-label">{t('journey.studio.builtInLayouts')}</div>
          <BuiltInLayouts spread={spread} page={page} pxPerMm={pxPerMm} width={cardWidth} t={t} onPick={pickBuiltIn} />
        </div>
      </div>
    </>
  );
}
