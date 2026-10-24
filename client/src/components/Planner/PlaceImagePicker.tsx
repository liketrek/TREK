import type { PlacePhotoCandidate } from '@trek/shared';
import { Check, ImageOff, ImagePlus, Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { placePictureRepo } from '../../repo/placePictureRepo';
import type { TranslationFn, TripFile } from '../../types';
import { normalizeImageFile } from '../../utils/convertHeic';
import { Tooltip } from '../shared/Tooltip';
import { offersPictures, type ChosenImage } from './placeImageChoice';
import { creditOf } from './placePhotoCredit';

/** The place's own pictures beside the sources' ones: what it has, what it can get, what waits for the save. */
export interface PlaceImageOwn {
  /** The picture the place has now; null on a new place or one without. */
  currentUrl: string | null;
  /** Images attached to the place that can stand as its picture. */
  attached: TripFile[];
  /** The picture from the device that waits for the save, as a preview. */
  pendingPreview: string | null;
  /** False where the user may not upload files; the upload tile is then left out. */
  canUpload: boolean;
  onUpload: (file: File) => void;
  onPickAttached: (file: TripFile) => void;
  onRemove: () => void;
}

interface PlaceImagePickerProps {
  /** What the sources know, as found for the place; empty while they load or when there are none. */
  photos: PlacePhotoCandidate[];
  chosen: ChosenImage;
  onPickUrl: (url: string | null) => void;
  /** Left out where only the sources' pictures are offered. */
  own?: PlaceImageOwn;
  /** On a white card, without native tooltips: hovering moves the credit line instead. */
  dialog?: boolean;
  t: TranslationFn;
}

const TILE = 'group relative block aspect-square w-full overflow-hidden rounded-lg transition-shadow';

function ring(selected: boolean, dialog: boolean): string {
  if (selected)
    return `ring-2 ring-accent ring-offset-2 ${dialog ? 'ring-offset-surface-card' : 'ring-offset-surface-secondary'}`;
  return 'ring-1 ring-edge hover:ring-content-muted';
}

function Picked(): React.ReactElement {
  return (
    <span className="absolute end-1 top-1 rounded-full bg-accent p-0.5 shadow-card">
      <Check className="h-2.5 w-2.5 text-accent-on" />
    </span>
  );
}

/** What the credit line under the grid says: a source's photo with its author and licence, or the place's own. */
type Credit = { kind: 'photo'; photo: PlacePhotoCandidate } | { kind: 'own'; label: string } | null;

/**
 * The one place a place's picture is chosen, in the editor: a tile to upload
 * one from the device, the picture it has now, the images attached to it and
 * the pictures its sources know. The chosen tile is ringed and ticked; a
 * second tap on a source's photo lets go of it, and "Remove picture" leaves
 * the place without one. Nothing is sent before the form is saved.
 */
export default function PlaceImagePicker({
  photos,
  chosen,
  onPickUrl,
  own,
  dialog = false,
  t,
}: PlaceImagePickerProps): React.ReactElement | null {
  const [hovered, setHovered] = useState<Credit>(null);
  const current = own?.currentUrl && !photos.some((p) => p.url === own.currentUrl) ? own.currentUrl : null;
  const attached = own?.attached ?? [];
  if (!offersPictures(photos, own)) return null;

  const shown = hovered ?? creditFor(chosen, photos, attached, own, t);
  const removable = !!own && chosen.kind !== 'none';

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {own?.canUpload && (
          <UploadTile
            own={own}
            selected={chosen.kind === 'upload'}
            dialog={dialog}
            onHover={(on) => setHovered(on ? { kind: 'own', label: t('places.image.own') } : null)}
            t={t}
          />
        )}
        {current && (
          <button
            type="button"
            onClick={() => (chosen.kind === 'current' ? own?.onRemove() : onPickUrl(current))}
            aria-pressed={chosen.kind === 'current'}
            aria-label={t('places.image.current')}
            onMouseEnter={() => setHovered({ kind: 'own', label: t('places.image.current') })}
            onMouseLeave={() => setHovered(null)}
            className={`${TILE} ${ring(chosen.kind === 'current', dialog)}`}
          >
            <img src={current} alt="" className="h-full w-full object-cover" />
            {chosen.kind === 'current' && <Picked />}
          </button>
        )}
        {attached.map((file) => (
          <AttachedTile
            key={file.id}
            file={file}
            selected={chosen.kind === 'attached' && chosen.fileId === file.id}
            onPick={() => own?.onPickAttached(file)}
            onHover={(on) => setHovered(on ? { kind: 'own', label: file.original_name } : null)}
            dialog={dialog}
          />
        ))}
        {photos.map((photo) => (
          <PhotoTile
            key={photo.key}
            photo={photo}
            selected={chosen.kind === 'url' && chosen.url === photo.url}
            onPick={onPickUrl}
            onHover={(on) => setHovered(on ? { kind: 'photo', photo } : null)}
            dialog={dialog}
            t={t}
          />
        ))}
      </div>
      {(shown || removable) && (
        <CreditLine shown={shown} onRemove={removable ? own?.onRemove : undefined} dialog={dialog} t={t} />
      )}
    </>
  );
}

/** The tile that takes a picture from the device, or shows the one waiting for the save. */
function UploadTile({
  own,
  selected,
  dialog,
  onHover,
  t,
}: {
  own: PlaceImageOwn;
  selected: boolean;
  dialog: boolean;
  onHover: (on: boolean) => void;
  t: TranslationFn;
}): React.ReactElement {
  const fileRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setReading(true);
    try {
      own.onUpload(await normalizeImageFile(file));
    } finally {
      setReading(false);
    }
  };
  const preview = own.pendingPreview;
  return (
    <>
      <Tooltip label={t('places.uploadImage')} placement="top">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={reading}
          aria-pressed={selected}
          aria-label={t('places.uploadImage')}
          className={`${TILE} ${ring(selected, dialog)} ${preview ? '' : 'border border-dashed border-edge bg-surface-card'}`}
          onMouseEnter={() => onHover(!!preview)}
          onMouseLeave={() => onHover(false)}
        >
          {preview ? (
            <>
              <img src={preview} alt="" className="h-full w-full object-cover" />
              {selected && <Picked />}
            </>
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center text-caption leading-tight text-content-muted group-hover:text-content">
              {reading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" strokeWidth={2} />
              )}
              {t('places.uploadImage')}
            </span>
          )}
        </button>
      </Tooltip>
      <input ref={fileRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => void pick(e)} />
    </>
  );
}

/** Who the chosen picture is from, and the way to leave the place without one. */
function CreditLine({
  shown,
  onRemove,
  dialog,
  t,
}: {
  shown: Credit;
  onRemove?: () => void;
  dialog: boolean;
  t: TranslationFn;
}): React.ReactElement {
  return (
    <div
      className={`${dialog ? 'mt-2' : 'mt-1.5'} flex min-w-0 items-center gap-2 text-caption leading-tight text-content-faint`}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {shown?.kind === 'photo' && <PhotoCredit photo={shown.photo} />}
        {shown?.kind === 'own' && <span className="min-w-0 truncate">{shown.label}</span>}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex flex-none items-center gap-1 rounded-md px-1.5 py-0.5 text-content-muted transition-colors hover:bg-surface-hover hover:text-content"
        >
          <ImageOff className="h-3 w-3" />
          {t('places.removeImage')}
        </button>
      )}
    </div>
  );
}

/** The credit line for the chosen tile: a source's photo, the place's own picture, or nothing to say. */
function creditFor(
  chosen: ChosenImage,
  photos: PlacePhotoCandidate[],
  attached: TripFile[],
  own: PlaceImageOwn | undefined,
  t: TranslationFn
): Credit {
  if (chosen.kind === 'url') {
    const photo = photos.find((p) => p.url === chosen.url);
    if (photo) return { kind: 'photo', photo };
  }
  if (chosen.kind === 'current') return { kind: 'own', label: t('places.image.current') };
  if (chosen.kind === 'upload') return { kind: 'own', label: t('places.image.own') };
  if (chosen.kind === 'attached') {
    const file = attached.find((f) => f.id === chosen.fileId);
    if (file) return { kind: 'own', label: file.original_name };
  }
  if (chosen.kind === 'none' && own?.currentUrl) return { kind: 'own', label: t('places.image.none') };
  return photos[0] ? { kind: 'photo', photo: photos[0] } : null;
}

function PhotoTile({
  photo,
  selected,
  onPick,
  onHover,
  dialog,
  t,
}: {
  photo: PlacePhotoCandidate;
  selected: boolean;
  onPick: (url: string | null) => void;
  onHover: (on: boolean) => void;
  dialog: boolean;
  t: TranslationFn;
}): React.ReactElement {
  const credit = creditOf(photo);
  return (
    <button
      type="button"
      onClick={() => onPick(selected ? null : photo.url)}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      aria-pressed={selected}
      aria-label={`${t('places.details.pickImage')}: ${credit}`}
      title={dialog ? undefined : photo.license ? `${credit}, ${photo.license}` : credit}
      className={`${TILE} ${ring(selected, dialog)}`}
    >
      <img
        src={photo.url}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
      />
      {selected && <Picked />}
    </button>
  );
}

/** An image attached to the place, loaded through the authenticated file route. */
function AttachedTile({
  file,
  selected,
  onPick,
  onHover,
  dialog,
}: {
  file: TripFile;
  selected: boolean;
  onPick: () => void;
  onHover: (on: boolean) => void;
  dialog: boolean;
}): React.ReactElement {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    placePictureRepo
      .attachedImage(file.url)
      .then((url) => {
        if (current) setSrc(url);
      })
      .catch(() => {
        if (current) setSrc(null);
      });
    return () => {
      current = false;
    };
  }, [file.url]);
  return (
    <button
      type="button"
      onClick={onPick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      aria-pressed={selected}
      aria-label={file.original_name}
      className={`${TILE} bg-surface-card ${ring(selected, dialog)}`}
    >
      {src && <img src={src} alt="" className="h-full w-full object-cover" />}
      {selected && <Picked />}
    </button>
  );
}

/**
 * Author and licence of the source's photo in play, each linked to its page.
 *
 * Not decoration: Commons images are largely CC BY / CC BY-SA, and reusing one
 * without naming its author does not satisfy those terms. When a source hands
 * us no author (Google), we say where it came from rather than inventing one.
 */
export function PhotoCredit({ photo }: { photo: PlacePhotoCandidate }): React.ReactElement {
  const credit = creditOf(photo);
  return (
    <>
      <span className="min-w-0 truncate">
        {photo.sourceUrl ? (
          <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {credit}
          </a>
        ) : (
          credit
        )}
      </span>
      {photo.license && (
        <span className="flex-none">
          {photo.licenseUrl ? (
            <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {photo.license}
            </a>
          ) : (
            photo.license
          )}
        </span>
      )}
    </>
  );
}
