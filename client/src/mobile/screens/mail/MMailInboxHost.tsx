import type { ReactElement } from 'react';
import { useMailInboxShell } from '../../../components/MailIngest/useMailInboxShell';
import { useAuthStore } from '../../../store/authStore';
import MMailInboxSheet from './MMailInboxSheet';

/**
 * The phone shell's one inbox of bookings from forwarded mails: the shell's
 * inbox wiring (settings, events, ?inbox=mail) and the sheet, mounted only
 * where the import is on.
 */
export default function MMailInboxHost(): ReactElement | null {
  const userId = useAuthStore((s) => s.user?.id);
  const { on } = useMailInboxShell(userId);
  return on ? <MMailInboxSheet /> : null;
}
