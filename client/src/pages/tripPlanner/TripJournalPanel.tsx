import { JourneyDetailPageDesktop } from '../JourneyDetailPage';

/**
 * The trip's Journal tab on the desktop: the Journey addon's own journal view,
 * not a copy of it, so the journal looks and works the same in both places and
 * stays live through the journey's own sync.
 *
 * The view's fixed bars measure themselves from --nav-h, so the wrapper sets it
 * to the navbar plus the trip's 44 px tab bar, and they sit below both.
 */
const BELOW_TRIP_TABS = '[--nav-h:44px] md:[--nav-h:calc(64px+env(safe-area-inset-top,0px)+44px)]';

export default function TripJournalPanel({ journeyId }: { journeyId: number | null }) {
  if (journeyId == null) return null;
  return (
    <div className={`${BELOW_TRIP_TABS} absolute inset-0 overflow-y-auto`}>
      <JourneyDetailPageDesktop journeyId={journeyId} embedded />
    </div>
  );
}
