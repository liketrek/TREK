# Admin: Notifications

The **Notifications** tab (in the **Integrations** group of the admin side navigation, `/admin?tab=notifications`) decides which delivery channels users can pick, where admin alerts go, and how every user's notification settings start. What a user then chooses for themselves, and what each channel delivers, is described in [Notifications](Notifications).

On a wide screen the cards sit in two columns: the channels users receive on the left, the admin's own targets and alerts on the right. **Defaults for users** runs across the full width below both. On a narrow screen everything stacks in that order.

## Channels for users

Each channel card has a switch in its head. A channel that is switched on appears as a column in every user's notification settings; one that is off does not. The switches save at once. **All four are off on a fresh install**, so users only have in-app notifications until you switch a channel on.

### Email (SMTP)

SMTP configuration for sending email notifications. The fields stay visible while the switch is off, but greyed out and out of reach.

| Field | Example |
|-------|---------|
| **SMTP Host** | `mail.example.com` |
| **SMTP Port** | `587` |
| **SMTP User** | `trek@example.com` |
| **SMTP Password** | shown as `••••••••` once saved |
| **From Address** | `trek@example.com` |

**Skip TLS certificate check** allows self-signed certificates on local mail servers. Off by default.

**Save** stores the fields and the TLS switch. **Send test email** saves them as well and then sends a test message to your own account's email address; it stays disabled until **SMTP Host** is filled in. A toast reports success or the mail server's error.

The `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` and `SMTP_SKIP_TLS_VERIFY` environment variables take priority over the matching field, one by one, when they are set. The fields are not locked, so a value typed there is simply not used while its variable is set. See [Environment-Variables](Environment-Variables).

### Webhook

Allow users to configure their own webhook URLs for notifications (Discord, Slack and others). There is nothing to set here beyond the switch: each user enters their own URL.

### Ntfy

Allow users to configure their own ntfy topics for push notifications. The default server users start from is the **Ntfy Server URL** of the **Admin Ntfy** card below.

### Web Push

Lets users receive notifications on their phones and computers through the browser, even while TREK is closed. It needs HTTPS, and on iPhone and iPad TREK has to be added to the Home Screen. No setup beyond the switch: TREK creates its signing keys on first start. See [Notifications](Notifications#web-push) for the requirements and the server keys.

### In-App

In-app notifications are always active and cannot be switched off for the whole instance. The card shows its switch on and greyed out.

### Trip Reminders

Sends a reminder notification before a trip starts, to trips that have reminder days set. **On by default.** The check runs once a day and picks trips that start exactly that many days later. When it is off, the reminder section of a trip is greyed out with a note that reminders are disabled. See [Creating-a-Trip](Creating-a-Trip).

## Admin alerts

Admin-only notifications, such as a new TREK version or a failed write to a storage replica, go to the admin's own targets. These are separate from the users' webhooks and topics.

### Admin Webhook

A webhook used only for admin notifications. It always fires when a URL is set. Enter the URL (for example `https://discord.com/api/webhooks/...`) and press **Save**; after that it shows as `••••••••`. **Send test webhook** sends a test message to the URL in the field, or to the stored one while the field shows the mask.

### Admin Ntfy

An ntfy topic used only for admin notifications. It always fires when a topic is set.

- **Ntfy Server URL**: also the default server for users' ntfy notifications. Leave it blank for `https://ntfy.sh`. Users can override it in their own settings.
- **Admin Topic**: for example `trek-admin-alerts`.
- **Access Token (optional)**: for a protected topic. Once saved it shows as `••••••••`, and a **Clear** button removes it.

**Save** stores the three fields. **Send test ntfy** sends a test message to the topic; it is disabled while **Admin Topic** is empty.

### Notifications

The matrix under the admin targets sets which channels deliver each admin-only event: **New version available** and **Storage replica failure**. Columns appear only for channels that can reach the admin: **In-App** always, **Email** once SMTP is configured, **Webhook** once an admin webhook URL is saved, **Ntfy** once an admin topic is saved. Every cell is a switch, on by default, and saves at once. A dash means that event cannot go out on that channel. Admin alerts are never sent as Web Push.

## Defaults for users

How every user's notifications start. The card shows one row per user event and one column per channel: **In-App**, **Email**, **Webhook**, **Ntfy**, **Push**, and any channel a plugin adds. A column is shown even while its channel is switched off above, so the defaults can be set before the channel goes live. A dash marks an event that channel cannot deliver.

Each cell is a pill that cycles through three states when clicked, and saves at once; its tooltip names the next state (**Click for: Off**).

| State | Meaning |
|-------|---------|
| **On** | Switched on until the user turns it off. The default for every cell. |
| **Off** | Switched off until the user turns it on. |
| **Blocked** | Switched off for everyone. In each user's settings the cell shows a lock instead of a switch, and nothing is sent there. |

A default applies to every user who has not changed that cell themselves, including users who joined before you set it, so a later change reaches them too. A cell a user switched keeps the user's choice, unless you block it. The events themselves are listed in [Notifications](Notifications#notification-events).

## See also

- [Notifications](Notifications) - the per-user side: channels, events, webhook and ntfy setup, Web Push
- [Admin-Panel-Overview](Admin-Panel-Overview) - all admin tabs
- [Environment-Variables](Environment-Variables) - SMTP and Web Push variables
- [Creating-a-Trip](Creating-a-Trip) - setting a trip's reminder
- [Admin-Storage](Admin-Storage) - storage replicas and their failure alerts
