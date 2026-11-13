import { useEffect, type ReactElement } from 'react';
import { useMailInboxLink } from '../../../components/MailIngest/useMailInboxLink';
import { useAuthStore } from '../../../store/authStore';
import { useMailIngestStore, watchMailInbox } from '../../../store/mailIngestStore';
import MMailInboxSheet from './MMailInboxSheet';

/**
 * The phone shell's one inbox of bookings from forwarded mails: reads the
 * person's import settings once they are signed in (the user menu's badge
 * needs them), follows the server's inbox events, and mounts the sheet only
 * where the import is on.
 */
export default function MMailInboxHost(): ReactElement | null {
  const userId = useAuthStore((s) => s.user?.id);
  const settings = useMailIngestStore((s) => s.settings);
  useEffect(() => {
    if (!userId) return;
    void useMailIngestStore.getState().loadSettings();
    return watchMailInbox();
  }, [userId]);
  const on = !!settings?.available && settings.prefs.enabled;
  useMailInboxLink(on);
  return on ? <MMailInboxSheet /> : null;
}
