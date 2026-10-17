import { useMatch, useNavigate } from 'react-router';

import { useTranslation } from '../../i18n';
import { useJourneyStore } from '../../store/journeyStore';

interface CreateAction {
  label: string;
  run: () => void;
  upload?: boolean;
}

/**
 * The centre "+" of the bottom navs means something different per context: inside a
 * trip it adds a place, on the journey list it starts a journey, inside a journey it
 * adds an entry, everywhere else it creates a new trip. Pages pick the intent up from
 * the query params.
 *
 * `phone` adds what only the phone dock offers: inside a journey whose gallery is open
 * it uploads a photo, on the atlas it opens the country search, on collections it adds
 * a place to the active list.
 */
export function useCreateAction(phone: boolean): CreateAction {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const galleryOpen = useJourneyStore((state) => state.mobileGalleryOpen);
  const inTrip = useMatch('/trips/:id');
  const inJourney = useMatch('/journey/:id');
  const onJourneyList = useMatch('/journey');
  const onAtlas = useMatch('/atlas');
  const onCollections = useMatch('/collections');
  const inCollection = useMatch('/collections/:id');

  if (inTrip) {
    // The "+" is context-aware per active tab: Bookings → reservation,
    // Transports → transport, Costs → expense. Tabs without a create modal
    // (lists / files / collab) fall through to adding a place. #1349
    const id = inTrip.params.id;
    const tripTab = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`trip-tab-${id}`) : null;
    if (tripTab === 'finanzplan')
      return { label: t('costs.addExpense'), run: () => navigate(`/trips/${id}?create=expense`) };
    if (tripTab === 'buchungen')
      return { label: t('reservations.addManual'), run: () => navigate(`/trips/${id}?create=reservation`) };
    if (tripTab === 'transports')
      return { label: t('transport.addManual'), run: () => navigate(`/trips/${id}?create=transport`) };
    return { label: t('places.addPlace'), run: () => navigate(`/trips/${id}?create=place`) };
  }
  if (inJourney) {
    // Context-aware per tab, like the trip's "+": the Gallery holds photos, so
    // there the one big action is uploading one.
    const journeyId = inJourney.params.id;
    if (phone && galleryOpen) {
      return { label: t('common.upload'), run: () => navigate(`/journey/${journeyId}?create=photo`), upload: true };
    }
    return { label: t('journey.detail.addEntry'), run: () => navigate(`/journey/${journeyId}?create=entry`) };
  }
  if (onJourneyList) {
    return { label: t('journey.new'), run: () => navigate('/journey?create=1') };
  }
  if (phone && onAtlas) {
    return { label: t('atlas.searchCountry'), run: () => navigate('/atlas?search=1') };
  }
  if (phone && (onCollections || inCollection)) {
    // Picking a list moves the route to /collections/:id, so the exact match
    // alone dropped the "+" through to creating a trip (#1930). The handoff keeps
    // the id, otherwise adding would land on "All saved".
    const path = inCollection ? `/collections/${inCollection.params.id}` : '/collections';
    return { label: t('collections.addPlace'), run: () => navigate(`${path}?create=place`) };
  }
  return { label: t('dashboard.newTrip'), run: () => navigate('/dashboard?create=1') };
}

/** Whether a nav item is the current route: the dashboard only on its exact path, the rest by prefix. */
export function isNavItemActive(pathname: string, to: string): boolean {
  return to === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(to);
}
