import { useEffect } from 'react';
import { useSaveToCollectionStore, type SaveTourToCollectionTarget } from '../../../store/saveToCollectionStore';
import { SaveTourToCollectionDialog } from './SaveTourToCollectionDialog';
import { useSaveTourToCollection } from './useSaveTourToCollection';

/** The keep dialog for one tour, open from its first render; closing it clears the store's tour. */
function HostedKeep({ target, onDone }: { target: SaveTourToCollectionTarget; onDone: () => void }) {
  const keep = useSaveTourToCollection(target, { startOpen: true });
  useEffect(() => {
    if (!keep.open) onDone();
  }, [keep.open, onDone]);
  return <SaveTourToCollectionDialog keep={keep} tourName={target.name} />;
}

/**
 * The tour card's keep dialog for the surfaces that list a tour as a plain
 * row, such as the day plan's place menu: they open it through
 * saveToCollectionStore.openTour, so the tour is kept with its route instead
 * of being saved as a bare place. Mounted once, beside the place picker.
 */
export default function TourSaveToCollectionHost() {
  const tour = useSaveToCollectionStore((state) => state.tour);
  const closeTour = useSaveToCollectionStore((state) => state.closeTour);
  if (!tour) return null;
  return <HostedKeep key={`${tour.tripId}:${tour.placeId}`} target={tour} onDone={closeTour} />;
}
