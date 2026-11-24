import type { APIRequestContext } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { day, mailHeaderDate } from '../dates';
import { seededTrip } from './fixtures';
import { asMember, PARTNER } from './fixtures-vacay';

/**
 * The in-app notifications the notification guides read, mark and delete.
 *
 * The seed already leaves the admin a few "New Message" notifications, one per
 * chat line mira and jonas posted in the Japan trip. On top of those the
 * members do two more things a trip's people really do, through their own
 * bearer tokens: jonas saves a booking of the Japan trip unchanged (the
 * "Booking Updated" notification, with View Trip) and mira shares her Vacay
 * calendar with the admin (the "Vacay Calendar Shared" one, with View Vacay).
 * Neither changes anything another picture shows; removeNotificationFixtures
 * takes the share and both notifications back.
 *
 * Every helper is idempotent: a guide that deleted one gets it again at its start.
 */

const INBOX = '/api/notifications/in-app';
const VACAY = '/api/addons/vacay';

/** The member who changes the booking. Not mira: two notifications from one sender read like one. */
export const BOOKER = { username: 'jonas', email: 'jonas@example.com', password: PARTNER.password };
/** A booking the seed puts on the Japan trip; jonas saves it as it is. */
const BOOKING = 'LH716 FRA → HND';

/** The titles as the list renders them (`notif.*.title` in en). */
export const BOOKING_TITLE = 'Booking Updated';
export const SHARE_TITLE = 'Vacay Calendar Shared';
export const MESSAGE_TITLE = 'New Message';

const BOOKING_KEY = 'notif.booking_change.title';
const SHARE_KEY = 'notif.vacay_share.title';

interface InboxRow {
  id: number;
  title_key: string;
  sender_username: string | null;
  is_read: boolean | number;
}

async function ok(res: { ok(): boolean; status(): number; text(): Promise<string> }, what: string): Promise<void> {
  if (!res.ok()) throw new Error(`${what}: ${res.status()} ${await res.text()}`);
}

/** The admin's newest notifications, as many as the server hands out at once. */
export async function inbox(api: APIRequestContext): Promise<InboxRow[]> {
  const res = await api.get(`${INBOX}?limit=50`);
  await ok(res, 'could not load the notifications');
  return ((await res.json()) as { notifications: InboxRow[] }).notifications;
}

const find = (rows: InboxRow[], key: string, sender: string): InboxRow | undefined =>
  rows.find((n) => n.title_key === key && n.sender_username === sender);

async function adminId(api: APIRequestContext): Promise<number> {
  return ((await (await api.get('/api/auth/me')).json()) as { user: { id: number } }).user.id;
}

/** jonas saves the seeded flight unchanged; the server tells every other member. */
async function bookingChangeFromJonas(): Promise<void> {
  const { tripId } = seededTrip();
  const jonas = await asMember(BOOKER);
  try {
    const list = await jonas.get(`/api/trips/${tripId}/reservations`);
    await ok(list, 'jonas could not load the bookings');
    const { reservations } = (await list.json()) as { reservations: { id: number; title: string }[] };
    const booking = reservations.find((r) => r.title === BOOKING) ?? reservations[0];
    if (!booking) throw new Error('the seeded trip has no booking for jonas to save');
    await ok(
      await jonas.put(`/api/trips/${tripId}/reservations/${booking.id}`, { data: { title: booking.title } }),
      'jonas could not save the booking'
    );
  } finally {
    await jonas.dispose();
  }
}

/** mira shares her Vacay calendar with the admin, as she would from her own Vacay. */
async function shareFromMira(api: APIRequestContext): Promise<void> {
  const target = await adminId(api);
  const mira = await asMember(PARTNER);
  try {
    const res = await mira.post(`${VACAY}/shares`, { data: { user_id: target } });
    // Already shared: the notification was deleted, the share is still there.
    // Share again from scratch so the server sends a fresh one.
    if (!res.ok() && (await res.text()).includes('Already shared')) {
      const shares = (await (await mira.get(`${VACAY}/shares`)).json()) as {
        outgoing?: { id: number; user_id: number }[];
      };
      for (const s of (shares.outgoing ?? []).filter((x) => x.user_id === target))
        await mira.delete(`${VACAY}/shares/${s.id}`);
      await ok(
        await mira.post(`${VACAY}/shares`, { data: { user_id: target } }),
        'mira could not share her calendar again'
      );
    } else {
      await ok(res, 'mira could not share her calendar');
    }
  } finally {
    await mira.dispose();
  }
}

/** Wait until the fire-and-forget send has written the row. */
async function waitFor(api: APIRequestContext, key: string, sender: string): Promise<InboxRow> {
  for (let i = 0; i < 20; i++) {
    const row = find(await inbox(api), key, sender);
    if (row) return row;
    await new Promise((res) => setTimeout(res, 250));
  }
  throw new Error(`no "${key}" notification from ${sender} arrived`);
}

/**
 * The two notifications from the members, both unread, the share newest. A
 * guide before may have read or deleted one; this brings it back as it was.
 */
export async function ensureNotificationFixtures(api: APIRequestContext): Promise<void> {
  let rows = await inbox(api);
  if (!find(rows, BOOKING_KEY, BOOKER.username)) await bookingChangeFromJonas();
  await waitFor(api, BOOKING_KEY, BOOKER.username);
  rows = await inbox(api);
  if (!find(rows, SHARE_KEY, PARTNER.username)) await shareFromMira(api);
  await waitFor(api, SHARE_KEY, PARTNER.username);
  for (const n of await inbox(api)) {
    const ours =
      (n.title_key === BOOKING_KEY && n.sender_username === BOOKER.username) ||
      (n.title_key === SHARE_KEY && n.sender_username === PARTNER.username);
    if (ours && !n.is_read) continue;
    if (ours) await ok(await api.put(`${INBOX}/${n.id}/unread`), 'could not mark a notification unread');
  }
}

/** The ids of every unread notification, to give back after a guide that reads them all. */
export async function unreadIds(api: APIRequestContext): Promise<number[]> {
  return (await inbox(api)).filter((n) => !n.is_read).map((n) => n.id);
}

/** Mark these unread again; one that is gone by now is skipped. */
export async function markUnread(api: APIRequestContext, ids: number[]): Promise<void> {
  for (const id of ids) await api.put(`${INBOX}/${id}/unread`);
}

/** Back to the seed: mira's share and both notifications from the members go. */
export async function removeNotificationFixtures(api: APIRequestContext): Promise<void> {
  const shares = (await (await api.get(`${VACAY}/shares`)).json()) as { incoming: { id: number; username: string }[] };
  for (const s of shares.incoming.filter((x) => x.username === PARTNER.username)) {
    await ok(await api.delete(`${VACAY}/shares/${s.id}`), `could not remove ${PARTNER.username}'s share`);
  }
  for (const n of await inbox(api)) {
    const ours =
      (n.title_key === BOOKING_KEY && n.sender_username === BOOKER.username) ||
      (n.title_key === SHARE_KEY && n.sender_username === PARTNER.username);
    if (ours) await api.delete(`${INBOX}/${n.id}`);
  }
}

// ── Booking mails ─────────────────────────────────────────────────────────────

/** The notice a mail whose booking waits for the reader leaves under the bell. */
export const MAIL_PENDING_TITLE = 'Forwarded bookings to review';
const MAIL_PENDING_KEY = 'notif.mail_booking_pending.title';
/** The media run's own webhook key; a mail service signs with the admin's. */
const WEBHOOK_SECRET = 'help-media-webhook-secret-for-the-notifications';
/** The forwarded mail, as Pending bookings lists it. */
export const MAIL_SUBJECT = 'Your ryokan in Hakone';

async function putAppSettings(api: APIRequestContext, data: Record<string, string | boolean>): Promise<void> {
  await ok(await api.put('/api/auth/app-settings', { data }), 'could not save the mail import settings');
}

/**
 * The mail import on, the way an admin switches it on, with the signed webhook
 * as its transport so the fixture can deliver a mail itself, and the admin's
 * own Read with AI off: no model answers in the media run and no extractor is
 * needed, so the mail waits in Pending bookings and TREK sends the "Forwarded
 * bookings to review" notice, which is what the guide shows. Then a plain text
 * confirmation goes to the Japan trip's address, and the fixture waits for
 * the notice.
 */
export async function ensureMailPendingNotice(api: APIRequestContext): Promise<void> {
  await putAppSettings(api, {
    mail_ingest_enabled: true,
    mail_ingest_transport: 'webhook',
    mail_ingest_address_template: 'trips+{token}@example.com',
    mail_ingest_webhook_secret: WEBHOOK_SECRET,
  });
  await ok(
    await api.patch('/api/mail-ingest/settings', { data: { ai_enabled: false } }),
    'could not turn Read with AI off'
  );
  const { tripId } = seededTrip();
  let found = (await (await api.get(`/api/trips/${tripId}/mail-ingest/address`)).json()) as {
    address: { address: string } | null;
  };
  if (!found.address) {
    await ok(
      await api.post(`/api/trips/${tripId}/mail-ingest/address`, { data: {} }),
      'could not create the trip address'
    );
    found = (await (await api.get(`/api/trips/${tripId}/mail-ingest/address`)).json()) as typeof found;
  }
  const to = found.address?.address;
  if (!to) throw new Error('the trip has no mail address');
  const raw = Buffer.from(
    [
      'From: Hakone Ginyu <stay@ginyu.example>',
      `To: ${to}`,
      `Subject: ${MAIL_SUBJECT}`,
      `Date: ${mailHeaderDate(-28, '09:12', '+0900')}`,
      'Message-ID: <gny-40218@ginyu.example>',
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      'Dear guest,',
      '',
      'thank you for choosing Hakone Ginyu. Your room with a private open-air bath is reserved.',
      '',
      `Check-in: ${day(-6)}, from 15:00`,
      `Check-out: ${day(-5)}, until 11:00`,
      'Guests: 2',
      'Confirmation number: GNY-40218',
      '',
      'Hakone Ginyu, 100-1 Miyanoshita, Hakone, Kanagawa',
      '',
    ].join('\r\n')
  );
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac('sha256', WEBHOOK_SECRET).update(`${timestamp}\n${to}\n`).update(raw).digest('hex');
  await ok(
    await api.post('/api/mail-ingest/inbound', {
      headers: {
        'Content-Type': 'message/rfc822',
        'X-Trek-Timestamp': timestamp,
        'X-Trek-Recipient': to,
        'X-Trek-Signature': `sha256=${signature}`,
      },
      data: raw,
    }),
    'the webhook refused the mail'
  );
  for (let i = 0; i < 90; i++) {
    if ((await inbox(api)).some((n) => n.title_key === MAIL_PENDING_KEY && !n.is_read)) return;
    await new Promise((res) => setTimeout(res, 1000));
  }
  throw new Error('no "Forwarded bookings to review" notification arrived');
}

/** Back to the seed: the waiting entry, the trip address, the notice and the import itself go. */
export async function removeMailPendingNotice(api: APIRequestContext): Promise<void> {
  const open = await api.get('/api/mail-ingest/inbox?status=open');
  if (open.ok()) {
    const { entries = [] } = (await open.json()) as { entries?: { id: number }[] };
    for (const entry of entries) await api.post(`/api/mail-ingest/candidates/${entry.id}/discard`, { data: {} });
  }
  const { tripId } = seededTrip();
  await api.delete(`/api/trips/${tripId}/mail-ingest/address`);
  await api.patch('/api/mail-ingest/settings', { data: { ai_enabled: true } });
  for (const n of await inbox(api)) if (n.title_key === MAIL_PENDING_KEY) await api.delete(`${INBOX}/${n.id}`);
  await putAppSettings(api, {
    mail_ingest_enabled: false,
    mail_ingest_transport: 'off',
    mail_ingest_webhook_secret: '',
  });
}
