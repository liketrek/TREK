import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { openMailInbox } from './mailInboxOpener';

/** The query a link uses to open the inbox, e.g. the "bookings waiting" notification's `/dashboard?inbox=mail`. */
const INBOX_PARAM = 'inbox';
const INBOX_MAIL = 'mail';

/**
 * Opens the inbox of forwarded bookings when the address asks for it, then
 * takes the query off again so a reload or the back button does not reopen
 * it. Mounted where the inbox itself is mounted: the Navbar on the desktop,
 * MMailInboxHost on the phone.
 */
export function useMailInboxLink(enabled: boolean): void {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!enabled) return;
    const params = new URLSearchParams(location.search);
    if (params.get(INBOX_PARAM) !== INBOX_MAIL) return;
    openMailInbox();
    params.delete(INBOX_PARAM);
    const search = params.toString();
    void navigate(
      { pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash },
      { replace: true }
    );
  }, [enabled, location.pathname, location.search, location.hash, navigate]);
}
