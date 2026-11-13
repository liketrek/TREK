import { useEffect } from 'react';
import { useMailIngestStore, watchMailInbox } from '../../store/mailIngestStore';
import { useMailInboxLink } from './useMailInboxLink';

/**
 * Everything a shell needs for the inbox of forwarded bookings: reads the
 * person's import settings once they are signed in, follows the server's
 * inbox events, opens the inbox from a ?inbox=mail link, and answers whether
 * the import is on (the menu entry and the dialog show only then) and how many
 * entries wait (the badge). The desktop Navbar and the phone's MMailInboxHost
 * mount it, one per shell.
 */
export function useMailInboxShell(userId: number | undefined): { on: boolean; pending: number } {
  const settings = useMailIngestStore((s) => s.settings);
  const pending = useMailIngestStore((s) => s.pending);
  const on = !!settings?.available && settings.prefs.enabled;
  useMailInboxLink(on);
  useEffect(() => {
    if (!userId) return;
    void useMailIngestStore.getState().loadSettings();
    return watchMailInbox();
  }, [userId]);
  return { on, pending };
}
