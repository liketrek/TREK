import { BOOK_FONT_CATEGORIES, bookFontsUsed, type BookFontCategory } from '@trek/shared';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useStudioStore } from '../../store/studioStore';
import '../../styles/studio-fonts.css';
import { BOOK_FONTS, nearestWeight, type BookFontId } from './bookFonts';
import { matchFonts, pickFont, weightSpan, type FontPick, type FontT } from './fontPicker';

/**
 * The typeface picker, shared by the text inspector and the travel inspector.
 *
 * Thirty four families do not fit as a wall of buttons the way seven did, and
 * a plain list of names says nothing about how a face looks, which is the only
 * thing anyone is choosing between. So the current family sits on one line,
 * set in itself, and opens a list grouped the way people look for type
 * (a sans, a serif, something for a poster, a script to lay over a photo)
 * where every family is again set in its own face. The families the book is
 * already set in come first, because the second text of a book is usually set
 * like the first.
 *
 * The list opens inside the inspector rather than floating over the page: the
 * inspector scrolls, and a popover pinned to a control that scrolls away is a
 * popover pointing at nothing.
 */

function FontRow({
  id,
  on,
  weight,
  onPick,
  t,
}: {
  id: BookFontId;
  on: boolean;
  weight: number;
  onPick: () => void;
  t: FontT;
}) {
  const face = BOOK_FONTS[id];
  return (
    <button
      type="button"
      role="option"
      aria-selected={on}
      className={`st-fontpick-row ${on ? 'is-on' : ''}`}
      onClick={onPick}
      title={face.name}
    >
      <span className="st-fontpick-face" style={{ fontFamily: face.stack, fontWeight: nearestWeight(id, weight) }}>
        {face.name}
      </span>
      <span className="st-fontpick-span">{weightSpan(id, t)}</span>
      <span className="st-fontpick-tick">{on && <Check size={13} />}</span>
    </button>
  );
}

function FontGroup({
  label,
  ids,
  font,
  weight,
  onPick,
  t,
}: {
  label: string;
  ids: BookFontId[];
  font: string;
  weight: number;
  onPick: (id: BookFontId) => void;
  t: FontT;
}) {
  if (!ids.length) return null;
  return (
    <div className="st-fontpick-group" role="group" aria-label={label}>
      <div className="st-fontpick-label">{label}</div>
      {ids.map((id) => (
        <FontRow key={id} id={id} on={font === id} weight={weight} onPick={() => onPick(id)} t={t} />
      ))}
    </div>
  );
}

/** The families the open book is set in, read from the document the Studio holds. */
function useFontsInBook(): BookFontId[] {
  const doc = useStudioStore((s) => s.doc);
  return useMemo(() => (doc ? bookFontsUsed(doc) : []), [doc]);
}

export function StudioFontPicker({
  font,
  weight,
  onPick,
  t,
}: {
  font: string;
  weight: number;
  onPick: (patch: FontPick) => void;
  t: FontT;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();
  const inBook = useFontsInBook();
  const current = BOOK_FONTS[font as BookFontId] ?? BOOK_FONTS.sans;
  const groupName = (c: BookFontCategory) => t(`journey.studio.fonts.cat.${c}`);
  const found = matchFonts(query, groupName);

  // Opened on purpose, so typing goes straight to the search.
  useEffect(() => {
    if (open) search.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
    trigger.current?.focus();
  };
  const choose = (id: BookFontId) => {
    onPick(pickFont(id, weight));
    close();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    close();
  };

  return (
    <div className={`st-fontpick ${open ? 'is-open' : ''}`} onKeyDown={onKey}>
      <button
        ref={trigger}
        type="button"
        className="st-fontpick-current"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t('journey.studio.fonts.change')}: ${current.name}`}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span
          className="st-fontpick-face"
          style={{ fontFamily: current.stack, fontWeight: nearestWeight(current.id, weight) }}
        >
          {current.name}
        </span>
        <span className="st-fontpick-span">{groupName(current.category)}</span>
        <ChevronDown size={14} className="st-fontpick-caret" />
      </button>
      {open && (
        <div className="st-fontpick-panel">
          <div className="st-search st-fontpick-search">
            <Search size={14} />
            <input
              ref={search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('journey.studio.fonts.search')}
              aria-label={t('journey.studio.fonts.search')}
              aria-controls={listId}
              spellCheck={false}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label={t('common.clear')}>
                <X size={13} />
              </button>
            )}
          </div>
          <div id={listId} className="st-fontpick-list" role="listbox" aria-label={t('journey.studio.fonts.list')}>
            {!query && (
              <FontGroup
                label={t('journey.studio.fonts.used')}
                ids={inBook}
                font={font}
                weight={weight}
                onPick={choose}
                t={t}
              />
            )}
            {BOOK_FONT_CATEGORIES.map((category) => (
              <FontGroup
                key={category}
                label={groupName(category)}
                ids={found.filter((id) => BOOK_FONTS[id].category === category)}
                font={font}
                weight={weight}
                onPick={choose}
                t={t}
              />
            ))}
            {!found.length && <p className="st-hint st-fontpick-none">{t('journey.studio.fonts.none')}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
