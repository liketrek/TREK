import type { PlaceContribDecisionRequest, PlaceContribState } from '@trek/shared';
import { useCallback, useEffect, useState } from 'react';
import { placeContribRepo } from '../../repo/placeContribRepo';

const KEY_RETRIES = 6;
const KEY_RETRY_MS = 3_000;

/**
 * The admin's decision on sharing place details. Read once when the settings
 * tab opens, so the prompt can come up without the card being scrolled to;
 * every decision answers the new state, which replaces the old one.
 */
export function usePlaceContrib() {
  const [state, setState] = useState<PlaceContribState | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    // A fresh installation fetches its key on first use, so the first answer can
    // be no_key; asking again a few times lets the prompt appear once it landed.
    const read = (tries: number) => {
      placeContribRepo.state(controller.signal).then(
        (next) => {
          setState(next);
          if (next.ineligibleReason === 'no_key' && tries > 1) timer = setTimeout(() => read(tries - 1), KEY_RETRY_MS);
        },
        () => {
          if (!controller.signal.aborted) setFailed(true);
        }
      );
    };
    read(KEY_RETRIES);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, []);

  const decide = useCallback(async (body: PlaceContribDecisionRequest): Promise<PlaceContribState> => {
    setBusy(true);
    try {
      const next = await placeContribRepo.decide(body);
      setState(next);
      return next;
    } finally {
      setBusy(false);
    }
  }, []);

  const withdraw = useCallback(async () => {
    setBusy(true);
    try {
      const result = await placeContribRepo.withdraw();
      // The withdrawal went through; a failed re-read keeps the old state rather than reporting it failed.
      await placeContribRepo.state().then(setState, () => undefined);
      return result;
    } finally {
      setBusy(false);
    }
  }, []);

  return { state, failed, busy, decide, withdraw };
}
