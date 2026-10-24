import type { TourListItem, TourSourceCheckResponse } from '@trek/shared';
import { useCallback, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { wandererErrorCode, wandererRepo } from '../../../repo/wandererRepo';
import { useToast } from '../../shared/Toast';
import { wandererErrorText } from '../wanderer/wandererErrors';

interface SourceCheckOptions {
  tripId: number;
  placeId: number;
  /** The new snapshot a confirmed reimport brought in, for the lists and the map to take it in. */
  onReimported?: (tour: TourListItem) => Promise<void> | void;
}

/**
 * MF-03: asking the source of a wanderer snapshot, on purpose, whether the
 * trail changed since it came in. The check only reads; nothing in the trip
 * changes until the user confirms a reimport, which goes the way every
 * wanderer import goes and comes in as a new snapshot beside this one.
 */
export function useSourceCheck({ tripId, placeId, onReimported }: SourceCheckOptions) {
  const { t } = useTranslation();
  const toast = useToast();
  const [checking, setChecking] = useState(false);
  const [reimporting, setReimporting] = useState(false);
  // The answer and the question belong to the tour they were asked for:
  // another tour shown in the same dialog starts unchecked.
  // `answered` stays once the source answered for this tour, through a reimport
  // too: the server then holds no background hint on it any more (WAN-02).
  const [state, setState] = useState<{
    placeId: number;
    result: TourSourceCheckResponse | null;
    confirming: boolean;
    answered: boolean;
  }>({ placeId, result: null, confirming: false, answered: false });
  const result = state.placeId === placeId ? state.result : null;
  const confirming = state.placeId === placeId && state.confirming;
  const answered = state.placeId === placeId && state.answered;
  const setResult = useCallback(
    (next: TourSourceCheckResponse | null) =>
      setState((current) => ({
        placeId,
        result: next,
        confirming: false,
        answered: (current.placeId === placeId && current.answered) || next !== null,
      })),
    [placeId]
  );
  const setConfirming = useCallback(
    (next: boolean) =>
      setState((current) => ({
        ...current,
        placeId,
        confirming: next,
        answered: current.placeId === placeId && current.answered,
      })),
    [placeId]
  );

  const check = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    try {
      setResult(await wandererRepo.checkSource(tripId, placeId));
    } catch (error: unknown) {
      setResult(null);
      toast.error(wandererErrorText(t, wandererErrorCode(error)));
    } finally {
      setChecking(false);
    }
  }, [checking, placeId, setResult, t, toast, tripId]);

  const reimport = useCallback(async () => {
    const payload = result?.reimport;
    if (!payload || reimporting) return;
    setReimporting(true);
    try {
      const { tour } = await wandererRepo.importTrail(tripId, payload);
      setConfirming(false);
      setResult(null);
      await onReimported?.(tour);
      toast.success(t('tours.provenance.reimported'));
    } catch (error: unknown) {
      setConfirming(false);
      toast.error(wandererErrorText(t, wandererErrorCode(error)));
    } finally {
      setReimporting(false);
    }
  }, [onReimported, reimporting, result, setConfirming, setResult, t, toast, tripId]);

  return {
    checking,
    result,
    check,
    /** The source answered a check of this tour; a background hint on it is spent. */
    answered,
    /** A reimport can be offered: the trail was read and differs, and someone takes the new snapshot in. */
    canReimport: !!result?.reimport && !!onReimported,
    confirming,
    askReimport: useCallback(() => setConfirming(true), [setConfirming]),
    cancelReimport: useCallback(() => setConfirming(false), [setConfirming]),
    reimporting,
    reimport,
  };
}

export type SourceCheck = ReturnType<typeof useSourceCheck>;
