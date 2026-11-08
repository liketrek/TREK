import type { GoogleRoutePreview } from '@trek/shared';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/TranslationContext';
import { googleRouteRepo } from '../../repo/googleRouteRepo';
import { useTripStore } from '../../store/tripStore';
import { generateUUID } from '../../sync/mutationQueue';
import { getApiErrorMessage } from '../../types';

/**
 * A route shared from Google Maps, read and appended to a day of the trip: the logic
 * behind the desktop's import dialog (GoogleRouteImport) and the large screens' sheet
 * (MRtRouteImportSheet), so the two cannot drift.
 *
 * A link is previewed first, the stops it names in order, and only the ones that resolved
 * to a place are appended, at least two of them. One request id per opening and per day
 * picked, so a retried append lands once. Every way out is held while a preview or an
 * import is in flight.
 */
export function useGoogleRouteImport(tripId: number, dayId?: number) {
  const { t } = useTranslation();
  const days = useTripStore((s) => s.days);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<GoogleRoutePreview | null>(null);
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [saved, setSaved] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef('');
  useEffect(() => () => controller.current?.abort(), []);

  const inspect = async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setFailure('');
    setPreview(null);
    try {
      const parsed = await googleRouteRepo.preview(url, abort.signal);
      if (!abort.signal.aborted) setPreview(parsed);
    } catch (error) {
      if (!abort.signal.aborted) setFailure(getApiErrorMessage(error, t('common.error')));
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  };
  const save = async () => {
    if (!preview || !target) return;
    setBusy(true);
    setFailure('');
    try {
      const stops = preview.stops
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => ({ name: s.name, lat: s.lat!, lng: s.lng! }));
      await googleRouteRepo.append(tripId, { dayId: Number(target), stops }, requestId.current);
      setSaved(true);
      await useTripStore.getState().loadTrip(tripId);
      setOpen(false);
    } catch (error) {
      setFailure(getApiErrorMessage(error, t('common.error')));
    } finally {
      setBusy(false);
    }
  };
  const show = () => {
    setUrl('');
    setPreview(null);
    setFailure('');
    setSaved(false);
    setTarget(String(dayId ?? days[0]?.id ?? ''));
    requestId.current = generateUUID();
    setOpen(true);
  };
  const close = () => {
    if (!busy) setOpen(false);
  };
  /** Another day is another append, so it gets a request id of its own. */
  const pickDay = (value: string) => {
    setTarget(value);
    requestId.current = generateUUID();
  };
  const resolved = preview?.stops.filter((s) => s.lat != null && s.lng != null) ?? [];
  const canSubmit = !busy && !saved && (!preview ? !!url.trim() : resolved.length >= 2 && !!target);
  /** The one button: the preview while there is none, the import once there is. */
  const submit = () => {
    void (preview ? save() : inspect());
  };

  return { days, open, url, setUrl, preview, target, pickDay, busy, failure, saved, show, close, canSubmit, submit };
}
