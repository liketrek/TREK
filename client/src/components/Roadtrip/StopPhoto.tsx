import { useState, type ReactNode } from 'react';

import { useTranslation } from '../../i18n';
import type { Place } from '../../types';
import PlacePhotoGallery from '../Planner/PlacePhotoGallery';
import { usePlacePhoto } from '../shared/usePlacePhoto';

interface StopPhotoProps {
  /** The trip's place behind the stop; a stop not saved yet has none. */
  place: Place | null;
  /** The frame: its size, corners and spacing. The picture fills it. */
  className: string;
  /** What stands in while there is no picture. */
  fallback?: ReactNode;
}

/**
 * A stop's picture on the road (#2629): what helps decide, from the passenger
 * seat, whether a place is worth the detour. A tap opens the place's photos, the
 * same gallery the place sheet and the inspector open. A picture that fails to
 * load gives way to the fallback rather than leaving a broken image behind.
 */
export default function StopPhoto({ place, className, fallback = null }: StopPhotoProps) {
  const { t, language } = useTranslation();
  const photo = usePlacePhoto(place);
  const [broken, setBroken] = useState<string | null>(null);

  if (!place || !photo || photo === broken) return <>{fallback}</>;
  // The corners are the frame's, inherited all the way down, so the focus ring of the
  // gallery trigger follows the picture whatever shape the caller gave it.
  return (
    <div className={className}>
      <PlacePhotoGallery
        place={place}
        language={language}
        label={t('places.openPhotos')}
        className="h-full w-full rounded-[inherit]"
      >
        <img
          src={photo}
          alt=""
          decoding="async"
          onError={() => setBroken(photo)}
          className="block h-full w-full rounded-[inherit] object-cover"
        />
      </PlacePhotoGallery>
    </div>
  );
}
