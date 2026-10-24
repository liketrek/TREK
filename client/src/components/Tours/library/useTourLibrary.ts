import type {
  TourLibraryDetailResponse,
  TourLibraryItem,
  TourLibraryResponse,
  TourListItem,
  TourTypeKey,
} from '@trek/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import { tourLibraryRepo } from '../../../repo/tourLibraryRepo';
import { useToast } from '../../shared/Toast';

/** How long typing rests before the list is asked again. */
const SEARCH_PAUSE_MS = 250;

type LoadStatus = 'loading' | 'ready' | 'error' | 'offline';

/** An answer with the request it belongs to, so a newer request reads as loading, never as an older answer. */
interface Answer<T> {
  key: string;
  status: Exclude<LoadStatus, 'loading'>;
  data?: T;
}

const failure = (err: unknown): 'error' | 'offline' => (err instanceof OnlineOnlyError ? 'offline' : 'error');

interface ListFilters {
  query: string;
  tripFilter: number | null;
  typeFilter: TourTypeKey | null;
}

/** The list while the dialog is open: asked at once on opening, then after a pause in typing; the asking trip left out. */
function useLibraryList(
  open: boolean,
  tripId: number,
  { query, tripFilter, typeFilter }: ListFilters,
  attempt: number
) {
  const [answer, setAnswer] = useState<Answer<TourLibraryResponse> | null>(null);
  const askedRef = useRef(false);
  const q = query.trim();
  const key = JSON.stringify([q, tripFilter, typeFilter, attempt]);
  useEffect(() => {
    if (!open) {
      askedRef.current = false;
      return undefined;
    }
    const controller = new AbortController();
    const ask = () =>
      tourLibraryRepo
        .list(
          {
            q: q || undefined,
            trip_id: tripFilter ?? undefined,
            type: typeFilter ?? undefined,
            exclude_trip_id: tripId,
          },
          controller.signal
        )
        .then((data) => setAnswer({ key, status: 'ready', data }))
        .catch((err: unknown) => {
          if (!controller.signal.aborted) setAnswer({ key, status: failure(err) });
        });
    const timer = window.setTimeout(() => void ask(), askedRef.current ? SEARCH_PAUSE_MS : 0);
    askedRef.current = true;
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, key, q, tripFilter, typeFilter, tripId]);
  return {
    status: (answer?.key === key ? answer.status : 'loading') as LoadStatus,
    /** The last list that came in, kept while a newer one loads so the rows do not flicker away. */
    data: answer?.data ?? null,
  };
}

/** The preview of the tour chosen, read anew for each choice. */
function useLibraryPreview(open: boolean, selected: TourLibraryItem | null, attempt: number) {
  const [answer, setAnswer] = useState<Answer<TourLibraryDetailResponse> | null>(null);
  const placeId = selected?.place_id ?? null;
  const key = `${placeId ?? ''}:${attempt}`;
  useEffect(() => {
    if (!open || placeId === null) return undefined;
    const controller = new AbortController();
    tourLibraryRepo
      .detail(placeId, controller.signal)
      .then((data) => setAnswer({ key, status: 'ready', data }))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setAnswer({ key, status: failure(err) });
      });
    return () => controller.abort();
  }, [open, placeId, key]);
  const status: LoadStatus | null = placeId === null ? null : answer?.key === key ? answer.status : 'loading';
  return { status, data: status === 'ready' ? (answer?.data ?? null) : null };
}

/**
 * LIB-02: taking a tour of another trip over into this one. The dialog lists
 * the tours of the user's other trips, searched by name and filtered by trip
 * and type, previews the one chosen, and takes it over only on an explicit
 * confirm, under the name in the field. Nothing is written before that, and
 * closing writes nothing. The new tour then comes into the trip through
 * `onTakenOver`, which also opens it.
 */
export function useTourLibrary({
  tripId,
  onTakenOver,
}: {
  tripId: number;
  onTakenOver: (tour: TourListItem) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<ListFilters>({ query: '', tripFilter: null, typeFilter: null });
  const [selected, setSelected] = useState<TourLibraryItem | null>(null);
  const [name, setName] = useState('');
  const [taking, setTaking] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const list = useLibraryList(open, tripId, filters, attempt);
  const preview = useLibraryPreview(open, selected, attempt);

  const reset = () => {
    setOpen(false);
    setSelected(null);
    setFilters({ query: '', tripFilter: null, typeFilter: null });
  };
  const close = () => {
    if (!taking) reset();
  };
  const choose = (tour: TourLibraryItem) => {
    setSelected(tour);
    setName(tour.name);
  };
  const filter = (change: Partial<ListFilters>) => setFilters((current) => ({ ...current, ...change }));

  const confirm = async () => {
    const chosenName = name.trim();
    if (!selected || !chosenName || taking) return;
    setTaking(true);
    try {
      const result = await tourLibraryRepo.takeOver(tripId, {
        source_trip_id: selected.trip.id,
        source_place_id: selected.place_id,
        name: chosenName,
      });
      setTaking(false);
      reset();
      await onTakenOver(result.tour);
      toast.success(t('tours.library.taken', { name: result.tour.name }));
    } catch (err: unknown) {
      setTaking(false);
      toast.error(t(failure(err) === 'offline' ? 'tours.library.offline' : 'tours.library.failed'));
    }
  };

  return {
    open,
    show: useCallback(() => setOpen(true), []),
    close,
    filters,
    filter,
    listStatus: list.status,
    list: list.data,
    selected,
    choose,
    previewStatus: preview.status,
    preview: preview.data,
    name,
    setName,
    taking,
    canConfirm: !!selected && name.trim().length > 0 && !taking,
    confirm,
    retry: () => setAttempt((value) => value + 1),
  };
}

export type TourLibrary = ReturnType<typeof useTourLibrary>;
