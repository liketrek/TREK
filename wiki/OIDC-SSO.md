# OIDC / Single Sign-On

<!-- TODO: screenshot: OIDC provider configuration form in admin panel -->

## What OIDC gives you

OpenID Connect (OIDC) lets users log in with an existing identity provider — Google, Authentik, Keycloak, or any OIDC-compatible IdP — instead of a local email/password. On first SSO login, a TREK account is created automatically using the email from the provider.

## User flow

1. Click **"Sign in with SSO"** on the login page.
2. You are redirected to your identity provider's login page.
3. Authenticate and grant consent.
4. The provider redirects back to TREK at `GET /api/auth/oidc/callback`. If this is your first login, an account is created automatically (subject to registration settings).
5. The server issues a short-lived one-time code and redirects your browser to `/login?oidc_code=<code>`. The frontend immediately exchanges that code at `GET /api/auth/oidc/exchange?code=<code>` to obtain the session.
   The code is only half of what the exchange needs: the callback also sets a one-minute `HttpOnly` cookie (`trek_oidc_exchange`) holding a secret that never appears in a URL, and the exchange requires both. A code copied out of the address bar, out of history, or out of a proxy log is therefore worthless in any other browser, and it is spent by the first attempt to redeem it whether that attempt succeeds or not. If your reverse proxy strips cookies on the way back from the identity provider, SSO login will fail here with `Invalid or expired code`.
6. Your `trek_session` cookie is set and you land on the dashboard.

**Remember me.** The Remember-me switch on the login page is carried into SSO as a query flag on the login URL: `GET /api/auth/oidc/login?remember=1` (or `remember=0`), appended with `&` when an invite token is already present. Only `0` and `1` are accepted; any other value — and starting SSO from the register tab, where the switch is not shown — is treated as if the parameter were absent. The choice is held in the server-side login state, survives the provider round-trip and the one-time-code exchange, and decides both the session lifetime and the cookie lifetime:

| `remember` | Session lifetime | `trek_session` cookie |
|---|---|---|
| `1` | `SESSION_DURATION_REMEMBER` (default `30d`) | persistent, `maxAge` matches |
| `0` | `SESSION_DURATION` (default `24h`) | browser-session cookie, cleared when the browser closes |
| omitted | `SESSION_DURATION` (default `24h`) | persistent, `maxAge` matches |

If SSO sessions are dying at browser close, the login link is sending `remember=0`.

## Prerequisites

Set the following environment variables before starting the server:

| Variable | Required | Description |
|---|---|---|
| `APP_URL` | Yes | Base URL of your TREK instance (e.g. `https://trek.example.com`). Used to build the redirect URI. **Env var only — not configurable via the admin panel.** If it is unset (or not a parseable URL, in which case it is ignored), TREK falls back to the first `ALLOWED_ORIGINS` entry, and only if that one is missing or unparseable to `http://localhost:{PORT}` — which produces a redirect URI your IdP will reject. A scheme-less `ALLOWED_ORIGINS=trek.example.com` does not parse, so it ends up on localhost too. |
| `OIDC_ISSUER` | Yes | Issuer URL of your identity provider. Must use HTTPS in production. |
| `OIDC_CLIENT_ID` | Yes | OAuth 2.0 client ID registered with your IdP. |
| `OIDC_CLIENT_SECRET` | Yes | OAuth 2.0 client secret. |

Register the following **redirect URI** with your identity provider:

```
<APP_URL>/api/auth/oidc/callback
```

For example: `https://trek.example.com/api/auth/oidc/callback`

## Optional environment variables

| Variable | Description |
|---|---|
| `OIDC_DISPLAY_NAME` | Label shown on the SSO button. Defaults to `SSO`. |
| `OIDC_ONLY` | Set to `true` to disable local password login and password registration. SSO login and SSO registration remain governed by their own toggles. This is an environment-variable-only setting and cannot be toggled at runtime via the admin panel. |
| `OIDC_ADMIN_CLAIM` | OIDC claim to inspect for admin role mapping. Defaults to `groups`. The claim value may be an array or a plain string. The claim only reaches TREK if one of the scopes in `OIDC_SCOPE` carries it — see *Admin role mapping* below. **Env var only — not configurable via the admin panel.** |
| `OIDC_ADMIN_VALUE` | Value that must be present in `OIDC_ADMIN_CLAIM` to grant the admin role. If unset, claim-based role mapping is disabled. When set, the role is re-evaluated on every login. **Env var only — not configurable via the admin panel.** |
| `OIDC_SCOPE` | Overrides the default scope list sent to the provider. Defaults to `openid email profile`. Ensure `openid` and `email` are always included, plus whichever scope carries your `OIDC_ADMIN_CLAIM`. **Env var only — not configurable via the admin panel.** |
| `OIDC_DISCOVERY_URL` | Full URL to the OIDC discovery document. Use this for providers with non-standard discovery paths (e.g. Authentik tenants). If unset, discovery is attempted at `<OIDC_ISSUER>/.well-known/openid-configuration`. The discovery document is cached for 1 hour. |

## Admin role mapping

TREK requests exactly the scopes listed in `OIDC_SCOPE` and nothing else, and a provider only emits a claim when a requested scope carries it. So a claim that is not covered by `OIDC_SCOPE` never arrives, and a claim that never arrives can never grant the admin role — no matter how `OIDC_ADMIN_CLAIM` is spelled.

Authentik is the usual example: `groups` rides the default `profile` scope, so it works out of the box, while `entitlements` has a scope of its own. Mapping admins onto an entitlement therefore takes all three variables:

```
OIDC_ADMIN_CLAIM=entitlements
OIDC_ADMIN_VALUE=trek-admins
OIDC_SCOPE=openid email profile entitlements
```

Keycloak (group and role mappers carry their own "Add to userinfo" switch) and Entra ID (optional claims) behave the same way — whatever the claim is called, check that its scope is requested.

If the configured claim is missing from the userinfo response entirely, TREK leaves the stored role untouched — a claim that never arrived is not a statement that somebody is no longer an admin — and writes one line to the server log naming the claim it looked for and the claims it did receive. Read that line first when role mapping does not do what you expect. A claim that *does* arrive without `OIDC_ADMIN_VALUE` in it still demotes on the next login; that is how the mapping takes admin away. Every role change it makes is recorded in the admin audit log.

### Taking admin away

Some providers omit a claim instead of sending it empty. Okta emits a filtered `groups` claim only when the filter matches at least one group, and Entra ID leaves `groups` out for a user who is in no group at all. **On those providers, removing somebody from the admin group does not demote them in TREK.** Their next login carries no claim, and no claim means no verdict, so the account keeps `admin` for as long as it exists. Take the role away in TREK as well, in **Admin → Users** ([Admin-Users-and-Invites](Admin-Users-and-Invites)) — the IdP side alone is not enough.

TREK writes a warning to the server log on **every** login where this happens, naming the account, so `docker logs trek | grep OIDC` lists the users it affects:

```
[OIDC] User 7 (alex) is stored as an admin and the configured OIDC_ADMIN_CLAIM "groups" was not in their userinfo response, so the admin role is kept. …
```

A provider that sends the claim as an empty list instead of dropping it is not affected: the empty list arrives, does not contain `OIDC_ADMIN_VALUE`, and demotes the account on that same login.

## New-user registration via SSO

When an SSO login matches an existing TREK account by OIDC subject (`sub`), that account is used directly. When it matches only by **email**, the OIDC identity is linked to that account only if the provider asserts `email_verified` for it; if the claim is missing or false the login is rejected with an `email_not_verified` error, so an unverified address can never take over a local account. Make sure your IdP includes `email_verified` in the userinfo response — it is part of the `email` scope. If no matching account exists, TREK attempts to create one. The outcome depends on the following:

- **First user ever**: always created as admin, no invite required.
- **Open SSO registration enabled** (admin panel toggle `oidc_registration`): account is created as a regular user.
- **Invite token present** in the login URL: account is created regardless of the registration toggle. Pass the token as `?invite=<token>` when initiating SSO login (e.g. `GET /api/auth/oidc/login?invite=<token>`).
- **SSO registration disabled and no invite**: login is rejected with a `registration_disabled` error.

## Admin panel (runtime configuration)

OIDC can also be configured without environment variables via **Admin → Settings**, in the **Single Sign-On (OIDC)** card. The following fields are settable at runtime:

| Field | Env var equivalent |
|---|---|
| Issuer URL | `OIDC_ISSUER` |
| Client ID | `OIDC_CLIENT_ID` |
| Client Secret | `OIDC_CLIENT_SECRET` |
| Display name | `OIDC_DISPLAY_NAME` |
| Discovery URL | `OIDC_DISCOVERY_URL` |

Environment variables take priority over database settings when both are present.

The following variables are **env var only** and have no admin panel equivalent: `OIDC_ONLY`, `OIDC_SCOPE`, `OIDC_ADMIN_CLAIM`, `OIDC_ADMIN_VALUE`.

The `OIDC_ONLY` env var always overrides the panel's login-method toggles. To disable password login at runtime without `OIDC_ONLY`, use the **password_login** and **password_registration** toggles in Admin → Settings instead.

> **Note:** The admin panel prevents you from disabling all login methods simultaneously. At least one method (password or SSO) must remain active. Similarly, you cannot remove the OIDC configuration from the admin panel while password login is disabled.

---

**See also:** [Login-and-Registration](Login-and-Registration) · [Environment-Variables](Environment-Variables)
