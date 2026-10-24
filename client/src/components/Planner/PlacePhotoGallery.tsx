import { Loader2 } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import type { Place } from '../../types';
import PhotoLightbox from '../Journey/PhotoLightbox';
import { Tooltip } from '../shared/Tooltip';
import { usePlaceGallery } from './usePlaceGallery';

interface PlacePhotoGalleryProps {
  place: Place;
  language: string;
  /** What opens the gallery: the place's picture, or what stands in for it. */
  children: React.ReactNode;
  /** The open gallery's label, and the trigger's tooltip. */
  label: string;
  /** The trigger's shape, so its focus ring follows the picture (round on desktop, a rounded tile on the phone). */
  className?: string;
}

/**
 * The place's picture as the way into its photos: a click opens a full screen
 * gallery of its own picture and what its sources know, each credited. While
 * there is nothing to show the picture stays a plain picture. The lightbox is
 * portalled to <body>: the inspector and the phone sheet sit inside
 * transformed containers, where a fixed overlay would be trapped.
 */
export default function PlacePhotoGallery({
  place,
  language,
  children,
  label,
  className = '',
}: PlacePhotoGalleryProps): React.ReactElement {
  const { photos, open, close, isOpen, loading, canOpen } = usePlaceGallery(place, language);

  if (!canOpen) return <>{children}</>;
  return (
    <>
      <Tooltip label={label} placement="top">
        <button
          type="button"
          onClick={open}
          aria-label={label}
          aria-busy={loading}
          className={`relative block cursor-zoom-in transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${loading ? 'opacity-70' : ''} ${className}`}
        >
          {children}
          {loading && (
            <span className="absolute inset-0 grid place-items-center">
              <Loader2 className="h-4 w-4 animate-spin text-content" />
            </span>
          )}
        </button>
      </Tooltip>
      {isOpen &&
        photos.length > 0 &&
        createPortal(<PhotoLightbox photos={photos} onClose={close} label={label} />, document.body)}
    </>
  );
}
