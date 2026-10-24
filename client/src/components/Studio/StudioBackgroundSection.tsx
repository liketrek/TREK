import { bookElementId, spreadPaint, withSpreadPaintByHand, type BookPageSetup } from '@trek/shared';
import { Check, CopyCheck, ImageOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useStudioStore } from '../../store/studioStore';
import { photoSrc } from './bookRender';
import {
  backgroundCandidates,
  backgroundPhotoOf,
  backgroundToAll,
  withBackgroundPhoto,
  withoutBackgroundPhoto,
} from './paint/backgroundPhoto';
import { spreadPhotoIds } from './paint/paletteModel';
import { usePaintChannel } from './paint/usePaintChannel';
import { Section } from './StudioControls';
import { StudioPaintPicker } from './StudioPaintPicker';
import type { JourneySource, StudioT } from './StudioSidebar';

/**
 * The page's background, in the inspector when nothing is selected.
 *
 * Until now only the assistant could set it; a person had to lay a shape
 * across the page and remember to send it to the back. Three things, in the
 * order people reach for them: the paint itself, the same background for
 * every page, and a photograph under the whole page.
 */
export function StudioBackgroundSection({
  spreadIndex,
  page,
  source,
  t,
}: {
  spreadIndex: number;
  page: BookPageSetup;
  source: JourneySource;
  t: StudioT;
}) {
  const spread = useStudioStore((s) => s.doc?.spreads[spreadIndex]);
  const commit = useStudioStore((s) => s.commit);
  // A colour picked here is the person's, so the page stops following the theme's paper (as the assistant's does).
  const channel = usePaintChannel((paint) => (doc) => ({
    ...doc,
    spreads: doc.spreads.map((sp, i) => (i === spreadIndex ? withSpreadPaintByHand(sp, paint) : sp)),
  }));

  // "Applied" stands in the button for a moment, so a press that changed pages out of sight is seen to have worked.
  const [applied, setApplied] = useState(false);
  useEffect(() => {
    if (!applied) return;
    const timer = window.setTimeout(() => setApplied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [applied]);

  const current = backgroundPhotoOf(spread, page);
  const candidates = useMemo(() => {
    if (!spread) return [];
    const entry = source.entries.find((e) => e.id === spread.entryId);
    return backgroundCandidates(
      spreadPhotoIds(spread),
      entry?.photoIds ?? [],
      source.photos.map((p) => p.photoId)
    );
  }, [spread, source]);

  if (!spread) return null;

  const setPhoto = (photoId: number) =>
    commit((doc) => ({
      ...doc,
      spreads: doc.spreads.map((sp, i) => {
        if (i !== spreadIndex) return sp;
        return withBackgroundPhoto(sp, page, photoId, () => bookElementId('p')) ?? sp;
      }),
    }));
  const clearPhoto = () =>
    commit((doc) => ({
      ...doc,
      spreads: doc.spreads.map((sp, i) => (i === spreadIndex ? withoutBackgroundPhoto(sp, page) : sp)),
    }));
  const applyToAll = () => {
    commit((doc) => backgroundToAll(doc, spreadIndex));
    setApplied(true);
  };

  return (
    <Section label={t('journey.studio.paint.background')}>
      <StudioPaintPicker
        value={spreadPaint(spread)}
        channel={channel}
        t={t}
        noneLabel={t('journey.studio.paint.paper')}
      />

      <button type="button" className={`st-chip st-paint-apply ${applied ? 'is-done' : ''}`} onClick={applyToAll}>
        {applied ? <Check size={13} strokeWidth={2.4} /> : <CopyCheck size={13} />}
        {applied ? t('journey.studio.paint.appliedAll') : t('journey.studio.paint.applyAll')}
      </button>

      <div className="st-paint-field">
        <span className="st-paint-caption">{t('journey.studio.paint.photoBackground')}</span>
        {candidates.length ? (
          <>
            <div className="st-bgphoto-grid">
              {candidates.map((id) => (
                <button
                  type="button"
                  key={id}
                  className={`st-bgphoto ${current?.photoId === id ? 'is-on' : ''}`}
                  aria-pressed={current?.photoId === id}
                  aria-label={t('journey.studio.paint.photoBackground')}
                  onClick={() => (current?.photoId === id ? clearPhoto() : setPhoto(id))}
                >
                  <img src={photoSrc(id, false)} alt="" loading="lazy" draggable={false} />
                </button>
              ))}
            </div>
            <p className="st-hint st-paint-hint">{t('journey.studio.paint.photoBackgroundHint')}</p>
            {current && (
              <button type="button" className="st-chip is-danger st-paint-apply" onClick={clearPhoto}>
                <ImageOff size={13} />
                {t('journey.studio.paint.removePhotoBackground')}
              </button>
            )}
          </>
        ) : (
          <p className="st-hint st-paint-hint">{t('journey.studio.paint.noPhotos')}</p>
        )}
      </div>
    </Section>
  );
}
