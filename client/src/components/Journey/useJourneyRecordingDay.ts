import type { JourneyRecordedDay, JourneyRecordingPreview } from '@trek/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n';
import { journeyRecordingsRepo } from '../../repo/journeyRecordingsRepo';
import { useToast } from '../shared/Toast';
import { deviceOffsetOn, recordingErrorCode, recordingErrorText, zoneOptions } from './journeyRecordingModel';

/** What the desktop dialog and the phone sheet are opened with. */
export interface JourneyRecordingViewProps {
  journeyId: number;
  journeyTitle: string;
  date: string;
  /** What the journey keeps for the day, if anything. */
  stored: JourneyRecordedDay | undefined;
  onKept: (day: JourneyRecordedDay) => void;
  onRemoved: (date: string) => void;
  onClose: () => void;
}

/**
 * What the dialog offers for the day.
 * `keep`: nothing kept yet. `replace`: a different version is kept. `same`: this
 * very recording is kept already. `empty`: nothing was recorded in this zone.
 */
type RecordingAction = 'keep' | 'replace' | 'same' | 'empty';

/**
 * Taking one day's recorded route over into a journey (JRN-01), for the
 * desktop dialog and the phone sheet alike.
 *
 * The preview is read when the dialog opens, cut in Dawarich's own zone where
 * it reveals one and in this device's otherwise, and again whenever another
 * zone is picked. Nothing is kept before the traveller says so, and what is
 * kept is the preview they saw: when Dawarich changed in between, the preview
 * is read again and says why instead of keeping something unseen.
 */
export function useJourneyRecordingDay({
  journeyId,
  date,
  onKept,
  onRemoved,
  onClose,
}: Omit<JourneyRecordingViewProps, 'journeyTitle' | 'stored'>) {
  const { t } = useTranslation();
  const toast = useToast();
  const deviceOffset = useMemo(() => deviceOffsetOn(date), [date]);
  const [zone, setZone] = useState({ minutes: deviceOffset, useSource: true });
  const [changedSincePreview, setChangedSincePreview] = useState(false);
  const [busy, setBusy] = useState<'save' | 'remove' | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  // The answer remembers which request it answers: while it is not the one
  // asked last, the day is loading, without a flag reset inside the effect.
  const [answer, setAnswer] = useState<{ key: string; preview: JourneyRecordingPreview | null; failure: unknown }>(
    NO_ANSWER
  );
  const requestKey = `${journeyId}|${date}|${zone.minutes}|${zone.useSource}|${reloadToken}`;

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    journeyRecordingsRepo
      .preview(journeyId, { date, utcOffsetMinutes: zone.minutes, useSourceOffset: zone.useSource }, controller.signal)
      .then((preview) => {
        if (!cancelled) setAnswer({ key: requestKey, preview, failure: null });
      })
      .catch((failure: unknown) => {
        if (!cancelled) setAnswer({ key: requestKey, preview: null, failure });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [journeyId, date, zone, requestKey]);

  const loading = answer.key !== requestKey;
  const preview = loading ? null : answer.preview;
  const failure = loading ? null : answer.failure;

  const retry = useCallback(() => setReloadToken((n) => n + 1), []);
  const chooseZone = useCallback((minutes: number) => {
    setChangedSincePreview(false);
    setZone({ minutes, useSource: false });
  }, []);

  const action: RecordingAction | null = !preview
    ? null
    : preview.contentHash === null
      ? 'empty'
      : preview.sameAsStored
        ? 'same'
        : preview.stored
          ? 'replace'
          : 'keep';

  const save = useCallback(async () => {
    if (!preview?.contentHash || (action !== 'keep' && action !== 'replace')) return;
    setBusy('save');
    setChangedSincePreview(false);
    try {
      const result = await journeyRecordingsRepo.save(journeyId, date, {
        utcOffsetMinutes: preview.utcOffsetMinutes,
        expectedHash: preview.contentHash,
        ...(action === 'replace' ? { replace: true } : {}),
      });
      onKept(result.day);
      toast.success(t(action === 'replace' ? 'journey.recording.replacedToast' : 'journey.recording.keptToast'));
      onClose();
    } catch (err) {
      const code = recordingErrorCode(err);
      if (code === 'recording_changed') {
        setChangedSincePreview(true);
        retry();
      } else {
        toast.error(recordingErrorText(err, t));
        // Someone kept the day meanwhile: read it again so the dialog shows
        // their version and offers Replace instead of a Keep that cannot work.
        if (code === 'recording_exists') retry();
      }
    } finally {
      setBusy(null);
    }
  }, [preview, action, journeyId, date, onKept, onClose, toast, t, retry]);

  const remove = useCallback(async () => {
    setBusy('remove');
    try {
      await journeyRecordingsRepo.remove(journeyId, date);
      onRemoved(date);
      toast.success(t('journey.recording.removedToast'));
      onClose();
    } catch (err) {
      toast.error(recordingErrorText(err, t));
    } finally {
      setBusy(null);
    }
  }, [journeyId, date, onRemoved, onClose, toast, t]);

  return {
    preview,
    loading,
    /** Translated; null while nothing failed. */
    error: failure === null ? null : recordingErrorText(failure, t),
    action,
    busy,
    changedSincePreview,
    zone: zone.useSource && preview ? preview.utcOffsetMinutes : zone.minutes,
    zoneOptions: zoneOptions(t, preview?.sourceOffsetMinutes ?? null, deviceOffset),
    chooseZone,
    retry,
    save,
    remove,
  };
}

const NO_ANSWER = { key: '', preview: null, failure: null };
