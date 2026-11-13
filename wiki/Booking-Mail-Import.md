# Booking Mail Import

Everyone on the instance gets a forwarding address of their own. A booking confirmation forwarded there is read by
TREK and added to the matching trip, with its times, places, booking reference and cost, and the mail attached as its
document. A booking TREK is not sure about waits in **Open bookings** with the reason, where it can be added to a trip
by hand, filed as a document or discarded. A booking added on its own can be undone with one tap for seven days.

The import is **off by default**.

## How mail reaches TREK

An admin sets it up in **Admin → Integrations → Booking mail import**. Every field there can also be set by an
[environment variable](Environment-Variables#booking-mail-import), which then wins.

| Field | What it is |
|---|---|
| Import on | The switch for the whole instance. Off, no address takes mail and the entry points disappear. |
| Transport | `IMAP`, `Webhook`, or none (only the `.eml` upload in the inbox works). |
| Address template | The forwarding address with `{token}` where each person's token goes, for example `trek+{token}@example.com`. |
| AI mails per person and day | How many forwarded mails a day an AI reads for one person (default 10). Above it, only machine-readable data is read. |

Each person's token is 24 random characters. A person can renew their address at any time; the old one stops taking
mail at once. Treat the address like a password: whoever knows it can put bookings into that person's trips.

### IMAP

TREK reads one mailbox every two minutes. Point a catch-all, or a mailbox with sub-addressing (`trek+anything@`), at
it and use the matching address template. Read mails move to the folder `TREK/processed` and are never deleted, so
anyone with access to the mailbox can read them. A mail TREK cannot take for now, because its address took its 50 mails
of the day or its person has 200 bookings waiting, moves to `TREK/deferred` and is offered again on every run for three
days; after that it moves to `TREK/processed` as well.

TREK files a mail under the address in the topmost `Delivered-To` header, else the topmost `X-Original-To`, which the
receiving server adds; only without either does it read `To`. A mail addressed to several people's addresses reaches
each of them.

| Field | Default |
|---|---|
| Host | |
| Port | `993` |
| Encryption | `tls` (from the first byte) or `starttls` |
| User, password | |
| Folder | `INBOX` |

A mail server on your own network needs `ALLOW_INTERNAL_NETWORK=true` ([Internal network access](Internal-Network-Access)).
**Test connection** in the dialog opens the folder the way the import does and says what failed.

### Webhook

A mail service posts every mail to `POST /api/mail-ingest/inbound`, raw, with `Content-Type: message/rfc822`, at most
10 MB. The route answers `404` unless the webhook is the transport and a secret of at least 32 characters is set.

Each request carries three headers:

| Header | Value |
|---|---|
| `X-Trek-Timestamp` | The time of sending, in Unix seconds. Requests more than five minutes off are refused. |
| `X-Trek-Recipient` | The address the mail was sent to (the envelope recipient). Optional; without it TREK reads the topmost `Delivered-To`, else `X-Original-To`, else `To`. |
| `X-Trek-Signature` | `sha256=` followed by the hex HMAC-SHA256 of `<timestamp>\n<recipient>\n<raw mail>`, keyed with the secret. |

A Cloudflare Email Worker that forwards a mail:

```js
export default {
  async email(message, env) {
    const raw = new Uint8Array(await new Response(message.raw).arrayBuffer());
    const timestamp = String(Math.floor(Date.now() / 1000));
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.TREK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const head = new TextEncoder().encode(`${timestamp}\n${message.to}\n`);
    const signed = new Uint8Array(head.length + raw.length);
    signed.set(head);
    signed.set(raw, head.length);
    const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, signed));
    const signature = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
    const res = await fetch(`${env.TREK_URL}/api/mail-ingest/inbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'message/rfc822',
        'X-Trek-Timestamp': timestamp,
        'X-Trek-Recipient': message.to,
        'X-Trek-Signature': `sha256=${signature}`,
      },
      body: raw,
    });
    if (!res.ok) message.setReject(`TREK answered ${res.status}`);
  },
};
```

Postmark and Mailgun forward inbound mail as JSON, not raw; put a small function like the one above between them and
TREK. The answer is `{"accepted":true,"duplicate":false}`; a mail sent twice is stored once.

A request whose headers cannot carry a valid signature is refused with `401` before its body is read. One address may
post 120 requests a minute, and TREK reads four mails at once; above either it answers `429`, as it does when an
address took its mails of the day or its person's open bookings are full, so the sender tries again later.

## The sender hint

An entry shows whether its sender is confirmed: the mail came from the person's own account address, and the
receiving mail server found a DKIM signature of that address's domain or a DMARC pass for it. Only the IMAP transport
can show this, since only there the receiving server's `Authentication-Results` header is the topmost one; a mail that
came by webhook or upload is always shown as not confirmed. The hint never stops a booking.

## Status

The **Status** card in the dialog shows the last successful read, the last error, and the mails of the last day by
outcome, in counts only. No subject, sender or content of any mail is shown there.

## Privacy

Forwarded mails are stored encrypted on the server for at most 30 days, and seven days after their booking was added.
With an AI connection set up, the mail's text and attachments, plus the title, dates and destinations of the
forwarding person's trips, go to that provider; the sender, recipient and forwarding headers are removed first.
Without AI, everything stays on the server. Let your users know.
