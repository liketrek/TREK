# Passkeys

Sign in with a fingerprint, face, PIN, or hardware security key instead of typing a password.

## Where to find it

Open **Settings** and select the **Account** tab. The **Passkeys** section sits below the two-factor authentication block.

> **Admin:** Passkey login is off by default. Turn on **Enable passkey login** in **Admin → Settings**, under the **Passkey login** card.

The section is hidden entirely when the feature is off and you have no passkeys enrolled. If you already have passkeys, the list stays visible even after an admin turns the feature off, so you can always clean them up.

## Enrolling a passkey

1. Click **Add a passkey**.
2. Enter your **current password** — TREK asks for it so a hijacked session cannot silently plant a passkey.
3. Optionally give the passkey a name (the placeholder suggests something like `iPhone`). Leave it blank and TREK names it **Passkey (synced)** or **Passkey** depending on the authenticator.
4. Click **Add a passkey** again and follow your device prompt (Touch ID, Windows Hello, Android screen lock, a YubiKey, and so on).

Every passkey is registered with *user verification required*, so a biometric or PIN check always happens — a bare "tap the key" gesture is not enough. The same authenticator cannot be enrolled twice on one account, and enrolment expires if you take longer than five minutes.

If you dismiss the browser dialog you get **Passkey setup cancelled** and nothing is stored.

## Signing in with a passkey

On the login page, a **Sign in with a passkey** button appears below the password form (separated by an **or** divider). Click it, pick your passkey in the browser prompt, and you are signed straight in — no username, no password, no second step.

The button only shows when all of these hold:

- An admin enabled passkey login.
- A usable WebAuthn domain resolves for the deployment (see [Setup requirements](#setup-requirements)).
- The instance is not in OIDC-only mode.
- You are on the sign-in form (not registration, the 2FA step, or a forced password change).

TREK never reveals which accounts have passkeys: the login ceremony uses discoverable credentials, every failure returns the same generic *Authentication failed*, and responses are padded to a fixed minimum latency so timing gives nothing away.

## Managing your passkeys

Each entry in the list shows its name, a **Synced** or **This device** badge, the date it was **Added**, and either **Last used** with a date or **Never used**.

- **Rename** (pencil icon) — edit the name inline; press Enter to save, Escape to cancel. Names are capped at 60 characters.
- **Delete** (trash icon) — confirms with *Remove this passkey? Confirm with your password.* and requires your current password.

Removing every passkey can never lock you out — your password always remains as a fallback.

> **Admin:** In **Admin → Users**, editing a user exposes a **Reset passkeys** action that removes all of that user's passkeys at once (for a lost device). The user can still sign in with their password.

## Passkeys and two-factor authentication

A user-verified passkey is already two factors — possession of the device plus a biometric or PIN — so it mints a session directly and does **not** prompt for a TOTP code afterwards.

The same reasoning applies to the admin **Require two-factor authentication (2FA)** policy: owning at least one passkey satisfies that policy exactly like an enabled TOTP authenticator does. A brand-new user under the policy can enrol a passkey instead of setting up an authenticator app; the enrolment endpoints stay reachable while the rest of the API is blocked, so nobody gets stuck. See [Two-Factor-Authentication](Two-Factor-Authentication).

## Setup requirements

Passkeys are bound to a domain (the *Relying Party ID*). If no usable domain resolves, the feature stays hidden even with the toggle on, and the admin card shows a warning.

> **Admin:** The **Passkey login** card also has **Relying Party ID (domain)** and **Allowed origins** fields. Leave them empty to derive both from `APP_URL`. Changing the RP ID later invalidates existing passkeys.

Both values can be pinned with environment variables, which take priority over the Admin panel fields:

- `WEBAUTHN_RP_ID` — the registrable domain, e.g. `trek.example.com`. Bare IP addresses are rejected.
- `WEBAUTHN_ORIGINS` — comma-separated allowed origins, e.g. `https://trek.example.com`.

See [Environment-Variables](Environment-Variables) for the full description of both.

## Audit and rate limits

Enrolment, deletion, and passkey logins are recorded in the [Audit-Log](Audit-Log) (`user.passkey_register`, `user.passkey_delete`, and `user.login` with `method: passkey`). If an authenticator ever replays a stale signature counter, TREK rejects that attempt and logs `user.passkey_clone_suspected` without disabling the credential.

Login and enrolment attempts are rate limited per IP over a 15-minute window.

## Permissions

No TREK permission gates passkeys — any signed-in user can enrol and manage their own. Only the instance-wide toggle and the WebAuthn domain configuration are admin-controlled, and the **Reset passkeys** action is admin-only.

## See also

- [Login-and-Registration](Login-and-Registration)
- [Two-Factor-Authentication](Two-Factor-Authentication)
- [User-Settings](User-Settings)
- [Environment-Variables](Environment-Variables)
- [Security-Hardening](Security-Hardening)
- [Audit-Log](Audit-Log)
