import type { BookPageSetup } from '@trek/shared';
import { ChevronDown, ChevronUp, Copy, FileDown, Plus, Trash2 } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';

import { useElementSize } from '../../../hooks/useElementSize';
import { useStudioStore } from '../../../store/studioStore';
import { folioLabel, foliosOf } from '../bookSheets';
import { MAX_SPREAD_FILE_BYTES, importSpread } from '../spreadFile';
import { SpreadThumb } from '../SpreadThumb';
import { PanelHead } from '../StudioPanelHead';

/**
 * The Pages section of the rail: the book's pages in order, the actions on
 * each, and the two ways to a new one.
 *
 * Page thumbnails are drawn at a `scale()` rather than laid out by CSS (the
 * sheet inside them is sized in millimetres), so they need an actual pixel
 * width, and it is **measured** rather than derived. Deriving it was tried
 * twice and was wrong twice: the scrollbar appears only once the list is long
 * enough and takes a width that depends on the platform, and the arithmetic
 * that ignored it produced a card overhanging its own selection outline.
 * Measuring the row the cards sit in gets every contribution at once.
 */

/** The narrowest a page preview is drawn. */
const MIN_PREVIEW_W = 120;

/** The button's border and padding, which the row's width still includes. */
const THUMB_CHROME = (2 + 3) * 2;

export function StudioPagesPanel({
  page,
  pxPerMm,
  bookView,
  t,
}: {
  page: BookPageSetup;
  pxPerMm: number;
  bookView: boolean;
  t: (k: string) => string;
}) {
  const doc = useStudioStore((s) => s.doc);
  const active = useStudioStore((s) => s.activeSpread);
  // The page a chat card points at, outlined here (journey-studio.md 4.2).
  const hinted = useStudioStore((s) => s.hintSpread);
  const setActive = useStudioStore((s) => s.setActiveSpread);
  const addSpread = useStudioStore((s) => s.addSpread);
  const insertSpread = useStudioStore((s) => s.insertSpread);
  const duplicateSpread = useStudioStore((s) => s.duplicateSpread);
  const removeSpread = useStudioStore((s) => s.removeSpread);
  const moveSpread = useStudioStore((s) => s.moveSpread);
  const canEditSpread = useStudioStore((s) => s.canEditSpread);
  const spreads = doc?.spreads ?? [];
  const list = useElementSize<HTMLDivElement>();
  const thumbWidth = Math.max(MIN_PREVIEW_W, list.width - THUMB_CHROME);

  /** Where a new spread would land: after the last inner one. */
  const lastInner = spreads.reduce((last, sp, i) => (sp.role === 'inner' ? i : last), -1);
  const fileInput = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Cleared straight away so choosing the same file twice in a row still fires a change event the second time.
    e.target.value = '';
    if (!file) return;
    setImportError(null);
    // Checked before reading rather than after: the point of a limit on a file someone else wrote is not to parse it.
    if (file.size > MAX_SPREAD_FILE_BYTES) {
      setImportError(t('journey.studio.importSpreadFailed'));
      return;
    }
    try {
      const spread = importSpread(JSON.parse(await file.text()), page);
      if (!spread) {
        setImportError(t('journey.studio.importSpreadFailed'));
        return;
      }
      insertSpread(lastInner, spread);
    } catch {
      setImportError(t('journey.studio.importSpreadFailed'));
    }
  };

  return (
    <>
      <PanelHead label={t('journey.studio.pages')} count={spreads.length} />
      <div className="st-panel-scroll">
        <div className="st-thumbs" ref={list.ref}>
          {spreads.map((sp, i) => {
            const editable = canEditSpread(i);
            const folios = foliosOf(spreads, i, page.pageNumbers.startAt);
            return (
              <div className="st-thumb-row" key={sp.id}>
                <button
                  type="button"
                  className={`st-thumb ${i === active ? 'is-active' : ''} ${sp.id === hinted ? 'is-hinted' : ''}`}
                  aria-current={i === active ? 'page' : undefined}
                  onClick={() => setActive(i)}
                >
                  <SpreadThumb
                    spread={sp}
                    page={page}
                    width={thumbWidth}
                    pxPerMm={pxPerMm}
                    folios={folios}
                    fold={bookView}
                    className="st-thumb-sheet"
                    coverInside={t(
                      sp.role === 'last' ? 'journey.studio.backCoverInside' : 'journey.studio.coverInside'
                    )}
                  />
                  <span className="st-thumb-label">
                    {sp.role === 'cover'
                      ? t('journey.studio.cover')
                      : sp.role === 'back'
                        ? t('journey.studio.backCover')
                        : folioLabel(folios)}
                  </span>
                </button>

                {/*
                  The actions sit on the thumbnail rather than in a menu bar of
                  their own: what you are acting on is the page you are pointing
                  at. The cover and the back cover have none: a book has exactly
                  one of each, and moving or deleting them is not a thing anyone
                  means to do.
                */}
                {editable && (
                  <div className="st-thumb-actions">
                    <button
                      type="button"
                      onClick={() => moveSpread(i, -1)}
                      disabled={!canEditSpread(i - 1)}
                      title={t('journey.studio.movePageUp')}
                      aria-label={t('journey.studio.movePageUp')}
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSpread(i, 1)}
                      disabled={!canEditSpread(i + 1)}
                      title={t('journey.studio.movePageDown')}
                      aria-label={t('journey.studio.movePageDown')}
                    >
                      <ChevronDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateSpread(i)}
                      title={t('journey.studio.duplicatePage')}
                      aria-label={t('journey.studio.duplicatePage')}
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      type="button"
                      className="is-danger"
                      onClick={() => removeSpread(i)}
                      title={t('journey.studio.deletePage')}
                      aria-label={t('journey.studio.deletePage')}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}

                {/* Insert between two spreads, where the new one will go: a single
                    "add" at the end cannot express "another page here". */}
                {editable && (
                  <button
                    type="button"
                    className="st-thumb-insert"
                    onClick={() => addSpread(i)}
                    title={t('journey.studio.addPageAfter')}
                    aria-label={t('journey.studio.addPageAfter')}
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/*
          Two ways to get a new page: an empty one, or somebody else's design.
          Side by side because they answer the same question; the import is not
          a setting buried in a menu, it is the other half of "add".
        */}
        <div className="st-add-row">
          <button
            type="button"
            className="st-add-page"
            onClick={() => addSpread(lastInner)}
            title={t('journey.studio.addPage')}
            aria-label={t('journey.studio.addPage')}
          >
            <Plus size={14} aria-hidden />
            {t('journey.studio.addPageShort')}
          </button>
          <button
            type="button"
            className="st-add-page is-import"
            onClick={() => fileInput.current?.click()}
            title={t('journey.studio.importSpreadHint')}
          >
            <FileDown size={14} aria-hidden />
            {t('journey.studio.importSpread')}
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            void importFile(e);
          }}
        />
        {importError && (
          <p className="st-add-error" role="alert">
            {importError}
          </p>
        )}
      </div>
    </>
  );
}
