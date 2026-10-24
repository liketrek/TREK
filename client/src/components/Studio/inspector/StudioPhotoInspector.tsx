import type { BookElement, BookPageSetup, BookPhotoElement, BookSpread } from '@trek/shared';
import { tidyGroups, withoutGroup } from '@trek/shared';
import type { ReactNode } from 'react';

import { useStudioStore } from '../../../store/studioStore';
import { PhotoCropExtras, PhotoLookSections } from '../photo/StudioPhotoLook';
import { FRAME_SHAPES, shapeName } from '../shapes';
import { Choice, Line, NumField, Section } from '../StudioControls';
import { EdgeSection } from '../StudioEdgeControls';
import { ShapeGlyph } from '../StudioElementsPanel';
import { FRAME_STYLE_OPTIONS } from '../studioOptions';
import { FocalPad } from './FocalPad';
import { maskInUse } from './inspectorModel';

/**
 * The inspector of a photo: the crop first (how the picture fills its frame,
 * where it is anchored, how far it is zoomed, and the frame filling the page),
 * then where it sits, then its look (the filter, the frame around it, the
 * corner), and folded under those the cut to a shape, the cut edge, the border
 * and shadow, and the two raster effects. Each folded group opens on a photo
 * that uses it.
 */

type Set = (patch: Partial<BookElement>) => void;

const FITS = ['cover', 'contain'] as const;
const FILTERS = ['none', 'bw', 'warm', 'cool', 'fade', 'contrast'] as const;

/**
 * Stretch the picture over the page it is on, or over both pages, bleed
 * included: the commonest layout in any photo book and the hardest to make by
 * hand, since a millimetre short leaves a white hairline on the trimmed page.
 *
 * One commit: the frame, the rotation put back to zero (a turned picture
 * leaves bare corners), the cover crop and the move to the back are one press
 * and come back with one undo. Which page is the one under the frame's centre;
 * a cover has only the one.
 */
function filled(sp: BookSpread, el: BookPhotoElement, page: BookPageSetup, scope: 'page' | 'spread'): BookSpread {
  const bleed = page.bleed;
  const onRight = sp.role === 'inner' && scope === 'page' && el.frame.x + el.frame.w / 2 >= page.pageWidth;
  const frame = {
    x: onRight ? page.pageWidth - bleed : -bleed,
    y: -bleed,
    w: (scope === 'spread' ? 2 : 1) * page.pageWidth + 2 * bleed,
    h: page.pageHeight + 2 * bleed,
  };
  // A picture that is the page is nobody's lockup: it leaves its group, as the assistant's fill takes it out.
  const photo = { ...withoutGroup(el), frame, rotation: 0, fit: 'cover' } as BookElement;
  return tidyGroups({ ...sp, elements: [photo, ...sp.elements.filter((e) => e.id !== el.id)] });
}

export function StudioPhotoInspector({
  el,
  one,
  spreadIndex,
  page,
  set,
  live,
  position,
  t,
}: {
  el: BookPhotoElement;
  /** A single photo is selected, so the page can be filled with it. */
  one: boolean;
  spreadIndex: number;
  page: BookPageSetup;
  set: Set;
  live: Set;
  position: ReactNode;
  t: (k: string, params?: Record<string, string | number>) => string;
}) {
  const commit = useStudioStore((s) => s.commit);
  const role = useStudioStore((s) => s.doc?.spreads[spreadIndex]?.role);
  const fill = (scope: 'page' | 'spread') =>
    commit((d) => ({
      ...d,
      spreads: d.spreads.map((sp, i) => (i === spreadIndex ? filled(sp, el, page, scope) : sp)),
    }));

  return (
    <>
      <Section label={t('journey.studio.crop')}>
        <Choice
          value={el.fit}
          ariaLabel={t('journey.studio.crop')}
          options={FITS.map((f) => ({ value: f, label: t(`journey.studio.fit.${f}`) }))}
          onPick={(fit) => set({ fit })}
        />
        {/*
          An empty frame has no picture to aim at, and asking for one by id
          produced a request for /api/photos/null/thumbnail and a broken image
          under a caption telling you to drag it.
        */}
        {el.photoId != null ? (
          <FocalPad
            photoId={el.photoId}
            x={el.focalX}
            y={el.focalY}
            onDrag={(x, y) => live({ focalX: x, focalY: y })}
            onCommit={(x, y) => set({ focalX: x, focalY: y })}
            hint={t('journey.studio.focalHint')}
          />
        ) : (
          <p className="st-hint st-hint-after">{t('journey.studio.emptyFrame')}</p>
        )}
        <PhotoCropExtras el={el} set={set} live={live} t={t} />
        {one && (
          <div className="st-row st-photo-fill">
            <button type="button" className="st-chip" onClick={() => fill('page')} title={t('journey.studio.fillHint')}>
              {t('journey.studio.fillPage')}
            </button>
            {role === 'inner' && (
              <button
                type="button"
                className="st-chip"
                onClick={() => fill('spread')}
                title={t('journey.studio.fillHint')}
              >
                {t('journey.studio.fillSpread')}
              </button>
            )}
          </div>
        )}
      </Section>

      {position}

      <Section label={t('journey.studio.look')}>
        <Choice
          value={el.filter}
          ariaLabel={t('journey.studio.look')}
          options={FILTERS.map((f) => ({ value: f, label: t(`journey.studio.filter.${f}`) }))}
          onPick={(filter) => set({ filter })}
        />
        <div className="st-section-gap">
          <Line label={t('journey.studio.frameStyle')} wide>
            <Choice
              value={el.frameStyle}
              ariaLabel={t('journey.studio.frameStyle')}
              options={FRAME_STYLE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
              onPick={(frameStyle) => set({ frameStyle })}
            />
          </Line>
        </div>
        {/* A corner radius and a mask are the same idea at different resolutions, so the radius steps
            aside once a shape is cut; it did not, and edited a property the renderer ignored. */}
        {!maskInUse(el) && (
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
        )}
      </Section>

      <Section label={t('journey.studio.mask')} defaultOpen={maskInUse(el)}>
        <div className="st-mini-shapes">
          <button
            type="button"
            className={`st-mini-shape ${el.mask ? '' : 'is-on'}`}
            onClick={() => set({ mask: null })}
            title={t('journey.studio.maskNone')}
            aria-label={t('journey.studio.maskNone')}
            aria-pressed={!el.mask}
          >
            <span className="st-mini-none" />
          </button>
          {FRAME_SHAPES.filter((sh) => sh !== 'rect').map((sh) => (
            <button
              type="button"
              key={sh}
              className={`st-mini-shape ${el.mask === sh ? 'is-on' : ''}`}
              onClick={() => set({ mask: sh })}
              title={shapeName(sh, t)}
              aria-label={shapeName(sh, t)}
              aria-pressed={el.mask === sh}
            >
              <ShapeGlyph shape={sh} />
            </button>
          ))}
        </div>
      </Section>

      <EdgeSection
        edge={el.edge}
        edgeSize={el.edgeSize}
        outline={maskInUse(el) ? (el.mask ?? null) : null}
        onSet={(patch) => set(patch)}
        t={t}
      />

      <PhotoLookSections el={el} set={set} live={live} t={t} />
    </>
  );
}
