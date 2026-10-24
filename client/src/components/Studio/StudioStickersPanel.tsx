import { BOOK_STICKER_THEMES, type BookPageSetup } from '@trek/shared';
import { bookStickersOf, type BookStickerDef } from '@trek/shared/stickers';
import { useMemo, useState, type DragEvent } from 'react';

import { useStudioStore } from '../../store/studioStore';
import '../../styles/studio-stickers.css';
import { StickerArt } from './StickerView';
import { Shelf } from './StudioPanelHead';
import { StudioSearch } from './StudioSearch';
import {
  STICKER_DRAG_TYPE,
  matchStickers,
  newStickerElement,
  readRecentStickers,
  rememberSticker,
  stickerLabel,
  stickerThemeLabel,
} from './stickerLibrary';

/**
 * The sticker library, as the Stickers tab of the Elements panel:
 * illustrations to put on a page, grouped by theme, searchable in the
 * reader's language, with the ones this viewer placed last on a shelf of
 * their own.
 *
 * A click places a sticker in the middle of the page, a drag places it where
 * it is let go. Either way it arrives selected, so the inspector beside the
 * page is where it is recoloured, flipped and turned.
 */

type Translate = (k: string, params?: Record<string, string | number>) => string;

function StickerTile({ def, t, onPick }: { def: BookStickerDef; t: Translate; onPick: (def: BookStickerDef) => void }) {
  const label = stickerLabel(t, def.id);
  const onDragStart = (e: DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.setData(STICKER_DRAG_TYPE, def.id);
    e.dataTransfer.effectAllowed = 'copy';
  };
  return (
    <button
      type="button"
      className="st-shape-btn st-sticker-btn"
      draggable
      onDragStart={onDragStart}
      onClick={() => onPick(def)}
      title={label}
      aria-label={label}
      style={{ cursor: 'grab' }}
    >
      <StickerArt def={def} />
    </button>
  );
}

function StickerGrid({
  list,
  t,
  onPick,
}: {
  list: readonly BookStickerDef[];
  t: Translate;
  onPick: (def: BookStickerDef) => void;
}) {
  return (
    <div className="st-shape-grid">
      {list.map((def) => (
        <StickerTile key={def.id} def={def} t={t} onPick={onPick} />
      ))}
    </div>
  );
}

export function StudioStickersPanel({ page, t }: { page: BookPageSetup; t: Translate }) {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<BookStickerDef[]>(readRecentStickers);
  const addElement = useStudioStore((s) => s.addElement);
  const active = useStudioStore((s) => s.activeSpread);
  const role = useStudioStore((s) => s.doc?.spreads[s.activeSpread]?.role);
  const single = role !== undefined && role !== 'inner';

  const matches = useMemo(() => matchStickers(query, null, t), [query, t]);
  const browsing = !query.trim();

  const place = (def: BookStickerDef) => {
    addElement(active, newStickerElement(def, page, single));
    setRecent(rememberSticker(def.id));
  };

  return (
    <>
      <StudioSearch
        value={query}
        onChange={setQuery}
        label={t('journey.studio.searchStickers')}
        clearLabel={t('common.clear')}
        count={matches.length}
      />

      <div className="st-panel-scroll">
        {browsing && recent.length > 0 && (
          <Shelf label={t('journey.studio.stickersRecent')}>
            <StickerGrid list={recent} t={t} onPick={place} />
          </Shelf>
        )}

        {/* Browsing, the library by theme; searching, one grid of what matches. */}
        {browsing ? (
          BOOK_STICKER_THEMES.map((id) => (
            <Shelf key={id} label={stickerThemeLabel(t, id)}>
              <StickerGrid list={bookStickersOf(id)} t={t} onPick={place} />
            </Shelf>
          ))
        ) : (
          <Shelf>
            <StickerGrid list={matches} t={t} onPick={place} />
            {!matches.length && <p className="st-hint">{t('journey.studio.noMatches')}</p>}
          </Shelf>
        )}

        <p className="st-hint">{t('journey.studio.stickersHint')}</p>
      </div>
    </>
  );
}
