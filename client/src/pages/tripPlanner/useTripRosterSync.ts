import { useEffect, useEffectEvent } from 'react';
import { useNavigate } from 'react-router';
import { useToast } from '../../components/shared/Toast';
import { useTranslation } from '../../i18n';
import { useTripStore, type TripGone } from '../../store/tripStore';
import { useServerPing } from '../../sync/useServerPing';

/** The events after which the planner reads the trip's roster again. */
const MEMBER_EVENTS = ['member:added', 'member:removed', 'member:updated'] as const;

/**
 * Keeps the planner's roster current and leaves a trip that went away.
 *
 * The roster is page-local (Costs participants, packing and day-plan pickers read
 * it from the planner), so a member or guest added, removed or renamed elsewhere
 * reads it again, one read per burst. When the open trip is deleted elsewhere, or
 * this user is taken off it, the trip store marks it gone; the planner then says
 * so and goes back to the trip list, on the desktop and the phone alike, since
 * both run this planner.
 */
export function useTripRosterSync(tripId: number, refreshMembers: () => Promise<void>): void {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  useServerPing(MEMBER_EVENTS, Number.isFinite(tripId), refreshMembers);

  const gone = useTripStore((s) => s.tripGone);
  const leave = useEffectEvent((why: TripGone['reason']) => {
    useTripStore.getState().clearTripGone();
    toast.info(t(why === 'deleted' ? 'dashboard.toast.deleted' : 'trip.toast.accessLost'));
    navigate('/dashboard', { replace: true });
  });
  useEffect(() => {
    if (gone && gone.tripId === tripId) leave(gone.reason);
  }, [gone, tripId]);
}
