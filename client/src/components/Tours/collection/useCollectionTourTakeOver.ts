import type { CollectionTourDetailResponse, CollectionTourItem } from '@trek/shared';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../../../i18n';
import { collectionToursRepo } from '../../../repo/collectionToursRepo';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import { useToast } from '../../shared/Toast';

/** Whether the kept tour's waypoints come along; nothing until the user says. */
export type PointsChoice = 'with' | 'without';

type DetailStatus = 'loading' | 'ready' | 'error' | 'offline';

/** An answer with the request it belongs to, so a newer request reads as loading, never as an older answer. */
interface Answer {
  key: string;
  status: Exclude<DetailStatus, 'loading'>;
  data?: CollectionTourDetailResponse;
}

/** What the take-over made, for the dialog's last word. */
interface TakenOver {
  tripId: number;
  tripTitle: string;
  tourName: string;
}

const failure = (err: unknown): 'error' | 'offline' => (err instanceof OnlineOnlyError ? 'offline' : 'error');

/** The kept tour's preview and the trips it could go into, read anew whenever another tour is chosen. */
function useKeptTourDetail(collectionId: number, tour: CollectionTourItem | null, attempt: number) {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const tourId = tour?.id ?? null;
  const key = `${collectionId}:${tourId ?? ''}:${attempt}`;
  useEffect(() => {
    if (tourId === null) return undefined;
    const controller = new AbortController();
    collectionToursRepo
      .detail(collectionId, tourId, controller.signal)
      .then((data) => setAnswer({ key, status: 'ready', data }))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setAnswer({ key, status: failure(err) });
      });
    return () => controller.abort();
  }, [collectionId, tourId, key]);
  const status: DetailStatus | null = tourId === null ? null : answer?.key === key ? answer.status : 'loading';
  return { status, data: status === 'ready' ? (answer?.data ?? null) : null };
}

/**
 * LIB-03: taking a tour kept in a collection into a trip. The dialog shows
 * the kept tour on a map with its facts and waypoints, lists the trips the
 * user can open (those they may not add to dimmed), and asks outright whether
 * the waypoints come along. A tour without a line cannot leave them behind.
 * Nothing is written before the confirm; afterwards the dialog says where the
 * new tour is and offers to open that trip.
 */
export function useCollectionTourTakeOver(collectionId: number) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [tour, setTour] = useState<CollectionTourItem | null>(null);
  const [tripId, setTripId] = useState<number | null>(null);
  const [points, setPoints] = useState<PointsChoice | null>(null);
  const [name, setName] = useState('');
  const [taking, setTaking] = useState(false);
  const [done, setDone] = useState<TakenOver | null>(null);
  const [attempt, setAttempt] = useState(0);
  const detail = useKeptTourDetail(collectionId, tour, attempt);
  const trips = detail.data?.trips ?? [];
  const trip = trips.find((candidate) => candidate.id === tripId && candidate.can_add) ?? null;

  const show = (chosen: CollectionTourItem) => {
    setTour(chosen);
    setName(chosen.name);
    setTripId(null);
    // A tour without a line has only one honest answer, and it is given for the user to see.
    setPoints(chosen.has_line ? null : 'with');
    setDone(null);
  };
  const close = () => {
    if (!taking) setTour(null);
  };
  const chooseTrip = (id: number) => {
    if (trips.some((candidate) => candidate.id === id && candidate.can_add)) setTripId(id);
  };
  const choosePoints = (choice: PointsChoice) => {
    if (choice === 'without' && !tour?.has_line) return;
    setPoints(choice);
  };

  const confirm = async () => {
    const chosenName = name.trim();
    if (!tour || !trip || !points || !chosenName || taking) return;
    setTaking(true);
    try {
      const result = await collectionToursRepo.takeOver(trip.id, {
        collection_id: collectionId,
        collection_tour_id: tour.id,
        include_waypoints: points === 'with',
        name: chosenName,
      });
      // The dialog's last word says where the tour is now, so no toast repeats it.
      setDone({ tripId: trip.id, tripTitle: trip.title, tourName: result.tour.name });
    } catch (err: unknown) {
      toast.error(t(failure(err) === 'offline' ? 'tours.collection.offline' : 'tours.collection.takeFailed'));
    } finally {
      setTaking(false);
    }
  };

  return {
    open: tour !== null,
    tour,
    show,
    close,
    detailStatus: detail.status,
    detail: detail.data,
    trips,
    tripId: trip?.id ?? null,
    chooseTrip,
    points,
    choosePoints,
    name,
    setName,
    taking,
    done,
    canConfirm: !!trip && !!points && name.trim().length > 0 && !taking && !done,
    confirm,
    retry: () => setAttempt((value) => value + 1),
    openTrip: () => {
      if (!done) return;
      setTour(null);
      void navigate(`/trips/${done.tripId}`);
    },
  };
}

export type CollectionTourTakeOver = ReturnType<typeof useCollectionTourTakeOver>;
