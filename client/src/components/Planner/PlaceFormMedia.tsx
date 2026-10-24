import { Paperclip, X } from 'lucide-react';
import React from 'react';
import type { TranslationFn } from '../../types';
import { fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';
import { LABEL } from '../shared/dialogParts';
import PlaceImagePicker, { type PlaceImageOwn } from './PlaceImagePicker';
import { COLUMN_CARD, WHITE_BUTTON } from './placeDialogParts';
import { offersPictures, type ChosenImage } from './placeImageChoice';

/** Files chosen before the place exists: they are uploaded once the save has given it an id. */
export function PendingFiles({
  files,
  fileRef,
  onAdd,
  onRemove,
  t,
}: {
  files: File[];
  fileRef: React.RefObject<HTMLInputElement | null>;
  onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  t: TranslationFn;
}) {
  return (
    <div className="min-w-0">
      <div className={LABEL}>{t('files.title')}</div>
      <input ref={fileRef} type="file" multiple className="hidden" onChange={onAdd} />
      <button type="button" onClick={() => fileRef.current?.click()} className={WHITE_BUTTON} style={fs(13, 'body')}>
        <Paperclip size={14} aria-hidden="true" />
        {t('files.attach')}
      </button>
      {files.length > 0 && (
        <div className="mt-1.5 flex flex-col gap-1" data-testid="pending-files">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-[8px] border border-edge-faint bg-surface-card px-2.5 py-1.5"
              style={fs(12, 'body')}
            >
              <Paperclip size={11} className="flex-none text-content-faint" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-content-secondary">{file.name}</span>
              <Tooltip label={t('common.delete')}>
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  aria-label={t('common.delete')}
                  className="flex flex-none text-content-faint transition-colors hover:text-danger"
                >
                  <X size={12} />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The place's picture in the form itself, where no details column stands
 * beside it (place details switched off): the same picker, with the place's
 * own pictures and an upload, under the field's label.
 */
export function PlaceImageSection({
  image,
  onPickUrl,
  t,
}: {
  image: { own: PlaceImageOwn; chosen: ChosenImage };
  onPickUrl: (url: string | null) => void;
  t: TranslationFn;
}) {
  if (!offersPictures([], image.own)) return null;
  return (
    <div className="min-w-0">
      <div className={LABEL}>{t('places.details.pickImage')}</div>
      <div className={`${COLUMN_CARD} p-2`}>
        <PlaceImagePicker photos={[]} chosen={image.chosen} onPickUrl={onPickUrl} own={image.own} dialog t={t} />
      </div>
    </div>
  );
}
