import type { NotificationLocale } from '../externalNotifications/types';

const en: NotificationLocale = {
  email: {
    footer: 'You received this because you have notifications enabled in TREK.',
    manage: 'Manage preferences in Settings',
    madeWith: 'Made with',
    openTrek: 'Open TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Trip invite: "${p.trip}"`,
      body: `${p.actor} invited ${p.invitee || 'a member'} to the trip "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `New booking: ${p.booking}`,
      body: `${p.actor} added a new ${p.type} "${p.booking}" to "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Trip reminder: ${p.trip}`,
      body: `Your trip "${p.trip}" is coming up soon!`,
    }),
    todo_due: (p) => ({
      title: `To-do due: ${p.todo}`,
      body: `"${p.todo}" in "${p.trip}" is due on ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Vacay Fusion Invite',
      body: `${p.actor} invited you to fuse vacation plans. Open TREK to accept or decline.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} photos shared`,
      body: `${p.actor} shared ${p.count} photo(s) in "${p.trip}".`,
    }),
    collab_message: (p) => ({
      title: `New message in "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Packing: ${p.category}`,
      body: `${p.actor} assigned you to the "${p.category}" packing category in "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'New TREK version available',
      body: `TREK ${p.version} is now available. Visit the admin panel to update.`,
    }),
    synology_session_cleared: () => ({
      title: 'Synology session cleared',
      body: 'Your Synology account or URL changed. You have been logged out of Synology Photos.',
    }),
  },
  passwordReset: {
    subject: 'Reset your password',
    greeting: 'Hi',
    body: 'We received a request to reset the password for your TREK account. Click the button below to set a new password.',
    ctaIntro: 'Reset password',
    expiry: 'This link expires in 60 minutes.',
    ignore: "If you didn't request this, you can safely ignore this email — your password won't change.",
  },
};

export default en;
