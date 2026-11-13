# Booking Mail Import

Forward a booking confirmation to TREK and the booking lands in the right trip: a flight with every leg, a hotel with its nights, a rental car, a table, a ticket, with its booking reference, times, travellers and price, and the mail or its PDF kept as a document of the booking.

The import is **off by default**; an admin switches it on for the instance (see [Setting it up](#setting-it-up)).

## Your address

**Settings → Integrations → Booking mails** shows your personal address. Forward any booking mail to it, attachments included, by hand or with a rule in your mail program. Treat the address like a password: whoever knows it can send bookings into your trips. **New address** replaces it at once; the old one stops working.

A trip can also have its own address: **Import** in the trip's Bookings or Transports tab shows it under the file drop. A mail sent to a trip's address lands in that trip without any guessing. It is yours, so a fellow traveller who wants one creates their own.

### Forwarding automatically

- **Gmail:** Settings → Forwarding and POP/IMAP → Add a forwarding address. Gmail sends a confirmation code to TREK; it shows up under **Pending bookings**, where you copy it. Then create a filter for your booking senders that forwards to TREK.
- **Outlook:** Settings → Mail → Rules → add a rule that forwards booking mails. Some work accounts block automatic forwarding; forward by hand there.
- **Any other program:** forward the mail as it is. A mail already on your disk can be uploaded as an `.eml` file from the same settings card.

## What TREK does with a mail

1. It reads what the mail and its attachments hold: the machine-readable booking data many airlines, rail companies and booking sites put in their mails, wallet passes and calendar files, and, with **Read with AI** on, everything else.
2. It finds the trip: the trip of the address the mail came in on, or the trip whose dates and places fit the booking.
3. It checks the result: the dates fit the trip, the values are plausible and stand in the mail, the booking is not in the trip already.
4. With **Add on its own** on and every check passed, it adds the booking and tells you so; **Undo** in that notice takes it back for 7 days. Fellow travellers of a shared trip are told about it too.

A booking with a detail TREK could not read for sure carries a **Review** mark. Check it in the booking and click the mark (**Looks right** on the phone) to take it off.

Anything TREK is not sure about waits under **Pending bookings**. A mail the AI could not read because of a passing error is read again on its own; once the day's AI allowance is used up, the mail waits with **Fill in yourself** and **Save as a document**.

## Pending bookings

Open them from the account menu (the number beside the entry counts them) or from the settings card. Each entry says what TREK read and why it waits, suggests a trip when it found one, and offers the ways out:

- **Add** or **Add to a trip** adds the booking.
- **Save as a document** keeps the mail's attachments, or the mail itself, in the trip's files.
- **Fill in yourself** opens the booking form in the trip with what the mail held.
- **Discard** drops it.

**Show mail** shows the mail's text. A forwarding confirmation from Gmail or Outlook appears here too, with its code in large type.

An entry also shows whether its sender is confirmed: the mail came from your own account address, and the receiving mail server found a DKIM signature of that address's domain or a DMARC pass for it. Only the IMAP transport can tell; a mail that came by webhook, upload or the TREK Cloud is always shown as not confirmed. The hint never stops a booking.

## AI reading

With **Read with AI** on, the mail's text and attachments, and the title, dates and destinations of your trips, go to the AI provider set up for your instance, so it can read the booking and name its trip; the sender, recipient and forwarding headers are removed first. The AI only fills in the booking; TREK's own checks decide whether it is added. **Read with AI** needs the **AI Parsing** addon and an AI connection, both set up by an admin ([AI Booking Import](AI-Booking-Import)); until then the switch stays off and says so. Without AI, only mails with machine-readable booking data are read, and everything else waits under Pending bookings. An admin sets how many mails a day the AI reads for one person (default 10); above it, only machine-readable data is read.

On TREK Cloud, reading a mail with AI counts as one document of your plan's AI allowance. The Start plan has no booking mail import.

## Privacy

Forwarded mails are stored encrypted for at most 30 days, and for seven days once their booking was added, then deleted; what was read from them stays until you decide, and an added booking stays like any other. Without AI, nothing leaves the server. Please do not forward mails with ID or health documents.

## Setting it up

> **Admin:** the import is set up under **Admin → Settings → Booking mail import**. Every field there can also be set by an [environment variable](Environment-Variables#booking-mail-import), which then wins. On TREK Cloud all of this is managed for you.

| Field | What it is |
|---|---|
| Import on | The switch for the whole instance. Off, no address takes mail and the entry points disappear. |
| Transport | `IMAP`, `Webhook`, or none (only the `.eml` upload works). |
| Address template | The forwarding address with `{token}` where each person's token goes, for example `trek+{token}@example.com`. |
| AI mails per person and day | How many forwarded mails a day an AI reads for one person (default 10). |

Each person's token is 24 random characters.

### IMAP

TREK reads one mailbox every two minutes. Point a catch-all, or a mailbox with sub-addressing (`trek+anything@`), at it and use the matching address template. Read mails move to the folder `TREK/processed` and are never deleted, so anyone with access to the mailbox can read them. A mail TREK cannot take for now, because its address took its 50 mails of the day or its person has 200 bookings waiting, moves to `TREK/deferred` and is offered again on every run for three days; after that it moves to `TREK/processed` as well.

TREK files a mail under the address in the topmost `Delivered-To` header, else the topmost `X-Original-To`, which the receiving server adds; only without either does it read `To`. A mail addressed to several people's addresses reaches each of them.

| Field | Default |
|---|---|
| Host | |
| Port | `993` |
| Encryption | `tls` (from the first byte) or `starttls` |
| User, password | |
| Folder | `INBOX` |

A mail server on your own network needs `ALLOW_INTERNAL_NETWORK=true` ([Internal network access](Internal-Network-Access)). **Test connection** opens the folder the way the import does and says what failed.

### Webhook

A mail service posts every mail to `POST /api/mail-ingest/inbound`, raw, with `Content-Type: message/rfc822`, at most 10 MB. The route answers `404` unless the webhook is the transport and a secret of at least 32 characters is set.

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

Postmark and Mailgun forward inbound mail as JSON, not raw; put a small function like the one above between them and TREK. The answer is `{"accepted":true,"duplicate":false}`; a mail sent twice is stored once.

A request whose headers cannot carry a valid signature is refused with `401` before its body is read. One address may post 120 requests a minute, and TREK reads four mails at once; above either it answers `429`, as it does when an address took its mails of the day or its person's pending bookings are full, so the sender tries again later.

### Status

The **Status** card shows the last successful read, the last error, and the mails of the last day by outcome, in counts only. No subject, sender or content of any mail is shown there. Let your users know what the import does with their mail (see [Privacy](#privacy)).

## See also

- [Reservations and Bookings](Reservations-and-Bookings)
- [Transport: Flights, Trains, Cars](Transport-Flights-Trains-Cars)
- [Environment Variables](Environment-Variables#booking-mail-import)
