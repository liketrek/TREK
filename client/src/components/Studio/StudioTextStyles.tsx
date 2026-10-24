import { useMemo } from 'react';

import type { BookLockup, BookLockupWords, BookPageSetup } from '@trek/shared';
import { MAX_SPREAD_ELEMENTS, addBookLockup, bookElementId } from '@trek/shared';

import { useElementSize } from '../../hooks/useElementSize';
import { useStudioStore } from '../../store/studioStore';
import '../../styles/studio-text.css';
import { ElementView } from './SpreadView';
import { Shelf } from './StudioPanelHead';
import { firstFillPhoto } from './textEffects';
import {
  SHELF_GROUPS,
  type ShelfSource,
  placeLockup,
  previewLockup,
  shelfLockups,
  shelfWords,
} from './textStylesModel';

/**
 * The Text styles shelf: the 24 lockups, each drawn with the book's own title
 * the way it will print, placed with one click and selected together so the
 * set moves as one.
 *
 * The tiles are the page renderer at a small scale, as the travel previews are,
 * so a tile can never promise a look the page does not draw.
 */

/** CSS defines 1in as 96px and 25.4mm, so this factor is exact. */
const PX_PER_MM = 96 / 25.4;

function LockupTile({
  lockup,
  words,
  photoId,
  label,
  onPick,
}: {
  lockup: BookLockup;
  words: BookLockupWords;
  photoId: number | null;
  label: string;
  onPick: (lockup: BookLockup) => void;
}) {
  const { ref, width, height } = useElementSize<HTMLButtonElement>();
  const elements = useMemo(() => previewLockup(lockup, words, photoId), [lockup, words, photoId]);
  const drawnW = 100 * PX_PER_MM;
  const drawnH = lockup.height * PX_PER_MM;
  const scale = width > 0 ? Math.min((width * 0.84) / drawnW, (height * 0.78) / drawnH) : 0;
  const dx = (width - drawnW * scale) / 2;
  const dy = (height - drawnH * scale) / 2;
  return (
    <button
      type="button"
      ref={ref}
      className="st-lockup"
      title={label}
      aria-label={label}
      onClick={() => onPick(lockup)}
    >
      {scale > 0 && (
        <span
          dir="ltr"
          aria-hidden
          className="st-lockup-art"
          style={{
            width: '100mm',
            height: `${lockup.height}mm`,
            transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
          }}
        >
          {elements.map((el) => (
            <ElementView key={el.id} el={el} big={false} />
          ))}
        </span>
      )}
    </button>
  );
}

export function StudioTextStyles({
  page,
  source,
  t,
}: {
  page: BookPageSetup;
  source: ShelfSource;
  t: (k: string) => string;
}) {
  const title = useStudioStore((s) => s.doc?.title ?? '');
  const active = useStudioStore((s) => s.activeSpread);
  const spread = useStudioStore((s) => s.doc?.spreads[s.activeSpread]);
  const commit = useStudioStore((s) => s.commit);
  const select = useStudioStore((s) => s.select);
  const words = useMemo(() => shelfWords(title, source, t), [title, source, t]);
  const photoId = firstFillPhoto(spread, source.photos);

  const place = (lockup: BookLockup) => {
    const els = placeLockup(lockup, { page, spread, words, gallery: source.photos, newId: bookElementId });
    // The page's own cap, as a duplicate keeps it: a set that would make the book unsaveable is not placed.
    if (!els.length || !spread) return;
    if (spread.elements.length + els.length > MAX_SPREAD_ELEMENTS) {
      useStudioStore.getState().refuseFull();
      return;
    }
    commit((d) => ({
      ...d,
      spreads: d.spreads.map((sp, i) => (i === active ? addBookLockup(sp, els, bookElementId('g')) : sp)),
    }));
    // One group, selected, so the set moves, turns and resizes as one straight away.
    select(els.map((e) => e.id));
  };

  return (
    <>
      {SHELF_GROUPS.map((group) => (
        <Shelf key={group.id} label={t(`journey.studio.lockupGroup.${group.id}`)}>
          <div className="st-lockups">
            {shelfLockups(group.lockups).map((lockup) => (
              <LockupTile
                key={lockup.id}
                lockup={lockup}
                words={words}
                photoId={photoId}
                label={t(`journey.studio.lockup.${lockup.id}`)}
                onPick={place}
              />
            ))}
          </div>
        </Shelf>
      ))}
      <p className="st-hint st-fx-hint">{t('journey.studio.textStylesHint')}</p>
    </>
  );
}
