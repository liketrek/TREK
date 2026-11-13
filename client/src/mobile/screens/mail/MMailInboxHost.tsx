import { useEffect, type ReactElement } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useMailIngestStore } from '../../../store/mailIngestStore';
import MMailInboxSheet from './MMailInboxSheet';

/**
 * The phone shell's one inbox of bookings from forwarded mails: reads the
 * person's import settings once they are signed in (the user menu's badge
 * needs them) and mounts the sheet only where the import is on.
 */
export default function MMailInboxHost(): ReactElement | null {
  const userId = useAuthStore((s) => s.user?.id);
  const settings = useMailIngestStore((s) => s.settings);
  useEffect(() => {
    if (userId) void useMailIngestStore.getState().loadSettings();
  }, [userId]);
  return settings?.available && settings.prefs.enabled ? <MMailInboxSheet /> : null;
}
