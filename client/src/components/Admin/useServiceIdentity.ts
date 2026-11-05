import type { ServiceIdentityStatus } from '@trek/shared';
import { useCallback, useEffect, useState, type RefObject } from 'react';
import { useElementVisible } from '../../hooks/useElementVisible';
import { serviceIdentityRepo } from '../../repo/serviceIdentityRepo';

const REFRESH_MS = 30_000;

/**
 * The installation's standing with the TREK services for the admin card:
 * read when the card comes into view, then every 30 seconds while it stays
 * there. Admin configuration, online only like the rest of the settings tab.
 */
export function useServiceIdentity(card: RefObject<Element | null>) {
  const visible = useElementVisible(card);
  const [status, setStatus] = useState<ServiceIdentityStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    const refresh = () => {
      serviceIdentityRepo.status(controller.signal).then(
        (next) => {
          setStatus(next);
          setFailed(false);
        },
        () => {
          if (!controller.signal.aborted) setFailed(true);
        }
      );
    };
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [visible]);

  const regenerate = useCallback(async (): Promise<void> => {
    setRegenerating(true);
    try {
      setStatus(await serviceIdentityRepo.regenerate());
    } finally {
      setRegenerating(false);
    }
  }, []);

  return { status, failed, regenerating, regenerate };
}
