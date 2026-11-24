import { create } from 'zustand';

/**
 * Whether the inbox of bookings from forwarded mails is open. One flag for the
 * whole app, so the settings card, the account menu and a notification open
 * the same dialog (desktop) or sheet (phone), which the layout mounts once.
 */
export const useMailInboxOpen = create<{ open: boolean }>(() => ({ open: false }));

export const openMailInbox = (): void => useMailInboxOpen.setState({ open: true });
export const closeMailInbox = (): void => useMailInboxOpen.setState({ open: false });
