import React from 'react'
import { createPortal } from 'react-dom'
import PhotoLightbox from '../Journey/PhotoLightbox'
import { usePlaceGallery } from './usePlaceGallery'
import type { Place } from '../../types'

interface PlacePhotoGalleryProps {
  place: Place
  language: string
  /** Receives the opener plus whether there is anything to open. */
  children: (open: () => void, canOpen: boolean, loading: boolean) => React.ReactNode
}

/**
 * Wraps a place avatar and portals the lightbox to <body>: the inspector and
 * the phone sheet both sit inside transformed / stacking containers, where an
 * in-place fixed overlay would be trapped.
 */
export default function PlacePhotoGallery({ place, language, children }: PlacePhotoGalleryProps): React.ReactElement {
  const { photos, open, close, isOpen, loading, canOpen } = usePlaceGallery(place, language)

  return (
    <>
      {children(open, canOpen, loading)}
      {isOpen && photos.length > 0 && createPortal(
        <PhotoLightbox photos={photos} onClose={close} />,
        document.body,
      )}
    </>
  )
}
