import type { WalkImportPreviewResponse, WalkImportStation } from '@trek/shared';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import { tourWalkImportRepo, walkImportRefusalOf } from '../../../repo/tourWalkImportRepo';
import type { TourPlannerController } from '../planner/useTourPlanner';

type Phase = 'link' | 'reading' | 'preview';
type Translate = ReturnType<typeof useTranslation>['t'];

/** A stop the link gives a position. */
type PlacedStation = WalkImportStation & { lat: number; lng: number };

const isPlaced = (station: WalkImportStation): station is PlacedStation => station.lat !== null && station.lng !== null;

const WORD = /\s+/;
const HTTPS_LINK = /^https:\/\/\S+$/i;

/**
 * The link in what was pasted. The Google Maps app shares a route as its
 * title and the link; a text holding exactly one https link among other words
 * is taken as that link. Anything else goes to the server as typed.
 */
function linkIn(text: string): string {
  const typed = text.trim();
  const links = typed.split(WORD).filter((word) => HTTPS_LINK.test(word));
  return links.length === 1 ? links[0] : typed;
}

/** What the dialog says when a link was not read, in the reader's language. */
function failureOf(err: unknown, t: Translate): string {
  if (err instanceof OnlineOnlyError) return t('tours.walkImport.offline');
  const reason = walkImportRefusalOf(err);
  return reason ? t(`tours.walkImport.refusal.${reason}`) : t('tours.walkImport.failed');
}

/**
 * CW-07: a city walk from a Google Maps walking route. The dialog reads the
 * link pasted into it (the server follows a short link and refuses a route not
 * on foot), shows the stops in their order, those without a position marked,
 * and only on an explicit load hands the positioned stops to the planner as a
 * new, unsaved walk with their names, which TREK then routes on foot itself.
 * Closing, going back or a failure leaves the planner as it was.
 */
export function useWalkImport({ planner }: { planner: Pick<TourPlannerController, 'tripId' | 'startDerivedTour'> }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState<Phase>('link');
  const [preview, setPreview] = useState<WalkImportPreviewResponse | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  // A read still under way when the planner goes is dropped with it.
  useEffect(() => () => requestRef.current?.abort(), []);

  const stations = preview?.stations ?? [];
  const placed = stations.filter(isPlaced);

  const reset = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setPhase('link');
    setPreview(null);
    setFailure(null);
  };

  const show = () => {
    reset();
    setUrl('');
    setOpen(true);
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  const read = async () => {
    const link = linkIn(url);
    if (!link) return;
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    setPhase('reading');
    setFailure(null);
    try {
      const answer = await tourWalkImportRepo.preview(planner.tripId, link, request.signal);
      if (request.signal.aborted) return;
      setPreview(answer);
      setPhase('preview');
    } catch (err: unknown) {
      if (request.signal.aborted) return;
      setFailure(failureOf(err, t));
      setPhase('link');
    }
  };

  const load = () => {
    if (placed.length < 2) return;
    const started = planner.startDerivedTour({
      name: t('tours.walkImport.defaultName'),
      difficulty: 2,
      points: placed.map(({ lat, lng, name }) => ({ lat, lng, name })),
      inPlace: false,
      tourType: 'walk',
      source: 'google_maps',
    });
    if (started) close();
  };

  return {
    open,
    show,
    close,
    url,
    setUrl,
    phase,
    preview,
    failure,
    /** How many stops the link leaves without a position; they are left out on load. */
    unplaced: stations.length - placed.length,
    canRead: phase !== 'reading' && url.trim().length > 0,
    canLoad: phase === 'preview' && placed.length >= 2,
    read,
    /** Back to the link, which stays as typed. */
    back: reset,
    load,
  };
}

export type WalkImport = ReturnType<typeof useWalkImport>;
