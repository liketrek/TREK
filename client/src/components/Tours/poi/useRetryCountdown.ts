import { useCallback, useEffect, useState } from 'react';

/**
 * PLN-05: the seconds until asking again makes sense, as the server named
 * them with an answer, counted down once a second to zero. Starting it with
 * nothing clears it.
 */
export function useRetryCountdown() {
  const [retry, setRetry] = useState<{ at: number; remaining: number } | null>(null);
  const at = retry?.at ?? null;

  useEffect(() => {
    if (at === null) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((at - Date.now()) / 1000));
      setRetry((current) => (current?.at === at ? { at, remaining } : current));
      if (remaining === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [at]);

  const start = useCallback(
    (seconds?: number) => setRetry(seconds ? { at: Date.now() + seconds * 1000, remaining: seconds } : null),
    []
  );

  return { secondsLeft: retry?.remaining ?? 0, start };
}
