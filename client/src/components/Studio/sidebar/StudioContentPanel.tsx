import type { BookPageSetup } from '@trek/shared';
import { ImagePlus, Upload } from 'lucide-react';
import { useId, useState } from 'react';

import { useStudioStore } from '../../../store/studioStore';
import { photoSrc } from '../bookRender';
import { emptyKeyFor, matchingEntries, matchingPhotos, photosFor, type PhotoFilter } from '../photoFilter';
import { StudioContentFilter } from '../StudioContentFilter';
import { PanelHead } from '../StudioPanelHead';
import { StudioSearch } from '../StudioSearch';
import type { JourneySource, StudioT } from '../StudioSidebar';
import { StudioTabPanel, StudioTabs } from '../StudioTabs';
import type { StudioUploader } from '../studioUpload';
import { photoDrop, type DropPlace } from './contentDrops';
import { StudioEntryCard } from './StudioEntryCard';
import { useContentUpload } from './useContentUpload';

/**
 * The journey's own material.
 *
 * This is what separates a book maker from a drawing program: the pictures and
 * the words are already written, and the job is putting them on pages. Clicking
 * an item drops it on the current spread, centred, at a sensible size.
 *
 * Pictures can also come in here. A book is where you notice the one that
 * never made it into the journal, and going back to the journey to add it was
 * the one round trip Studio still asked for. What comes in goes through the
 * journey store like any other upload, so the journal sees it the moment the
 * panel does.
 */

type Tab = 'photos' | 'text';

/**
 * The tooltip of an upload cell: its words in full, then what it does. The
 * cell is a square a third of the panel wide, so a long label ("Μεταφόρτωση
 * φωτογραφιών", "Uploading 12 of 30") is held to two lines there.
 */
const cellTitle = (label: string, hint: string) => `${label}\n${hint}`;

export function StudioContentPanel({
  source,
  page,
  t,
  locale,
  canEdit,
  onUpload,
  providers = [],
  onBrowseProvider,
}: {
  source: JourneySource;
  page: BookPageSetup;
  t: StudioT;
  locale: string;
  canEdit: boolean;
  onUpload: StudioUploader;
  providers?: { id: string; name: string }[];
  onBrowseProvider?: (provider: string, entryId: number | null) => Promise<number[]>;
}) {
  const [tab, setTab] = useState<Tab>('photos');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PhotoFilter>({ kind: 'all' });
  const tabsId = useId();

  const entries = matchingEntries(source, query);
  const admitted = photosFor(source, filter);
  const photos = matchingPhotos(admitted, source, query);
  const emptyKey = emptyKeyFor(source, filter, admitted);

  const addElement = useStudioStore((s) => s.addElement);
  const active = useStudioStore((s) => s.activeSpread);
  const spread = useStudioStore((s) => s.doc?.spreads[s.activeSpread]);
  const place: DropPlace = { page, single: !!spread && spread.role !== 'inner' };

  const content = useContentUpload({
    filter,
    showArrived: (photoIds) => {
      setFilter({ kind: 'recent', photoIds });
      setQuery('');
    },
    onUpload,
    onBrowseProvider,
    enabled: canEdit && tab === 'photos',
    t,
  });
  const { upload, fileInput } = content;
  const uploadLabel = upload
    ? t('journey.studio.uploading', { done: upload.done, total: upload.total })
    : t('journey.studio.uploadPhotos');

  return (
    <>
      <PanelHead label={t('journey.studio.content')} />

      <StudioSearch
        value={query}
        onChange={setQuery}
        label={t('journey.studio.searchContent')}
        clearLabel={t('common.clear')}
      />

      <StudioTabs<Tab>
        idBase={tabsId}
        label={t('journey.studio.content')}
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'photos', label: t('journey.studio.photos'), count: photos.length },
          { id: 'text', label: t('journey.studio.entries'), count: entries.length },
        ]}
      />

      {/*
        Which entry, as a row of its own under the tabs rather than a control
        inside the search box: the search answers "which words" and this
        answers "which day", and the two combine.
      */}
      {tab === 'photos' && (
        <StudioContentFilter
          source={source}
          filter={filter}
          setFilter={setFilter}
          admitted={admitted.length}
          pageEntryId={spread?.entryId ?? null}
          t={t}
          locale={locale}
        />
      )}

      <StudioTabPanel
        idBase={tabsId}
        value={tab}
        className={`st-panel-scroll ${content.dropOver ? 'is-drop-over' : ''}`}
        {...content.dropZone}
      >
        {tab === 'photos' ? (
          <>
            {canEdit && (
              <p className="st-hint st-upload-where">
                {t(filter.kind === 'entry' ? 'journey.studio.uploadToEntry' : 'journey.studio.uploadToGallery')}
              </p>
            )}
            <div className="st-photo-grid">
              {/*
                The first cell rather than a button above the grid: it is the
                size and shape of what it produces, and it stays where the eye
                already is. Disabled, not hidden, while a batch is on its way, so
                the count has somewhere to be read.
              */}
              {canEdit && (
                <button
                  type="button"
                  className="st-photo-cell is-upload"
                  onClick={() => fileInput.current?.click()}
                  disabled={!!upload}
                  title={cellTitle(uploadLabel, t('journey.studio.uploadHint'))}
                >
                  <Upload size={18} strokeWidth={1.6} aria-hidden />
                  <span>{uploadLabel}</span>
                </button>
              )}
              {canEdit &&
                onBrowseProvider &&
                providers.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className="st-photo-cell is-upload"
                    onClick={() => {
                      void content.pickFromProvider(p.id);
                    }}
                    disabled={!!upload}
                    title={cellTitle(
                      t('journey.studio.fromProvider', { name: p.name }),
                      t('journey.studio.fromProviderHint', { name: p.name })
                    )}
                  >
                    <ImagePlus size={18} strokeWidth={1.6} aria-hidden />
                    <span>{t('journey.studio.fromProvider', { name: p.name })}</span>
                  </button>
                ))}
              {photos.map((p) => (
                <button
                  type="button"
                  key={p.photoId}
                  className="st-photo-cell"
                  onClick={() => addElement(active, photoDrop(place, p.photoId))}
                  title={t('journey.studio.addToPage')}
                  aria-label={
                    p.caption ? `${t('journey.studio.addToPage')}: ${p.caption}` : t('journey.studio.addToPage')
                  }
                  draggable
                  onDragStart={(e) => {
                    // HTML5 drag is the right tool for one item from a list onto a target, and it gives
                    // the thumbnail as the drag image for free; the canvas uses pointer events instead.
                    e.dataTransfer.setData('application/x-trek-photo', String(p.photoId));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <img src={photoSrc(p.photoId, false)} alt="" loading="lazy" draggable={false} />
                </button>
              ))}
              {!photos.length && <p className="st-hint">{t(emptyKey)}</p>}
            </div>
            {canEdit && (
              <input
                ref={fileInput}
                type="file"
                multiple
                accept="image/*,.heic,.heif"
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  // Cleared straight away, as the spread import does, so the same pictures can be chosen twice.
                  e.target.value = '';
                  void content.send(files);
                }}
              />
            )}
          </>
        ) : (
          <div className="st-entries">
            {entries.map((e) => (
              <StudioEntryCard
                key={e.id}
                entry={e}
                place={place}
                locale={locale}
                t={t}
                onAdd={(el) => addElement(active, el)}
                onPhotos={(entryId) => {
                  setFilter({ kind: 'entry', id: entryId });
                  setTab('photos');
                }}
              />
            ))}
            {!entries.length && <p className="st-hint">{t('journey.studio.noMatches')}</p>}
          </div>
        )}
      </StudioTabPanel>
    </>
  );
}
