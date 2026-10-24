# Admin: Settings

The **Settings** tab (in the **Configuration** group of the admin side navigation, `/admin?tab=settings`) holds the instance-wide switches for signing in, uploads and place data. On a wide screen the cards sit in two columns: access and identity on the left (**Authentication Methods**, **Passkey login**, **Require two-factor authentication (2FA)**, **Single Sign-On (OIDC)**), files and place data on the right (**Allowed File Types**, **API Keys**). The **Danger Zone** runs across the full width at the bottom. On a narrow screen the same cards stack in that order.

Switches save as soon as you flip them. Text fields save with the card's own **Save** button.

## Authentication Methods

Decides which ways in are offered on the login page.

| Row | What it does | Default |
|-----|--------------|---------|
| **Password Login** | Allow users to sign in with email and password. | On |
| **Password Registration** | Allow new users to register with email and password. | On |
| **SSO Login** | Allow users to sign in with SSO. | On |
| **SSO Auto-Provisioning** | Automatically create accounts for new SSO users. | On |

The two SSO rows only appear once OIDC is configured, that is, once an issuer and a client ID are known (from the **Single Sign-On (OIDC)** card or from the environment).

At least one login method must stay enabled. The switch that would remove the last way in is greyed out, and hovering it shows **At least one login method must remain enabled**. The server enforces the same rule: password login can only be switched off while SSO login is on and OIDC is configured.

When the `OIDC_ONLY` environment variable is set, a warning at the top of the card says that the password settings are controlled by it, and **Password Login** and **Password Registration** are read-only. See [OIDC-SSO](OIDC-SSO) and [Login-and-Registration](Login-and-Registration).

## Passkey login

Lets users sign in with passkeys (WebAuthn). **Off by default.**

- **Enable passkey login**: shows a **Sign in with a passkey** option on the login page and lets users enrol passkeys in their own settings.
- **Relying Party ID (domain)**: the bare domain passkeys are bound to, for example `trek.example.org`. Leave it empty to derive it from `APP_URL`. Changing it later invalidates every passkey already enrolled.
- **Allowed origins**: comma-separated full origins, for example `https://trek.example.org`. Leave it empty to use `APP_URL`.

The two fields save with **Save** under them. `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGINS` take priority over the fields when they are set; the fields stay editable, but what you type there has no effect while the variable holds a value.

If the switch is on but no domain can be resolved (no `APP_URL`, no Relying Party ID, or an `APP_URL` that is a bare IP address), a warning says so and passkeys stay hidden until one is set. See [Passkeys](Passkeys).

## Require two-factor authentication (2FA)

One switch, **off by default**. When it is on, users without 2FA must complete the setup in their settings before they can use the app.

You can only switch it on once your own account is protected, by two-factor authentication or by a passkey. Otherwise the server refuses and asks you to secure your own account first. See [Two-Factor-Authentication](Two-Factor-Authentication).

## Single Sign-On (OIDC)

Allow login via external providers like Google, Apple, Authentik or Keycloak.

| Field | Notes |
|-------|-------|
| **Display Name** | The name on the SSO button. Without one, the button reads **SSO**. |
| **Issuer URL** | The OpenID Connect issuer URL of the provider, for example `https://accounts.google.com`. |
| **Discovery URL** (optional) | Overrides the discovery URL TREK builds from the issuer (`<issuer>/.well-known/openid-configuration`). Needed for providers like Authentik, where the endpoint lives elsewhere. |
| **Client ID** | From your provider. |
| **Client Secret** | From your provider. Once saved it shows as `••••••••`; leaving the field empty on a later save keeps the stored secret. |

**Save** stores all five at once. The environment variables `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_DISPLAY_NAME` and `OIDC_DISCOVERY_URL` take priority over the matching field when they are set. The fields are not locked, so a value typed there is simply not used while its variable is set. See [OIDC-SSO](OIDC-SSO) for the provider setup, claims and admin role mapping.

## Allowed File Types

Configure which file types users can upload. Enter comma-separated extensions without dots, for example `jpg,png,pdf,doc`, and press **Save**. A single `*` allows every type.

The default list is `jpg,jpeg,png,gif,webp,heic,pdf,doc,docx,xls,xlsx,txt,csv,pkpass,pkpasses,md,markdown`.

Two rules apply whatever the field says:

- Some extensions are always refused, even with `*`: SVG, HTML and XML documents, scripts (`.js`, `.ts`, `.php`, `.py` and similar) and executables (`.exe`, `.bat`, `.sh`, `.msi`, `.dll` and similar).
- In a trip's files, videos are accepted even when their extension is not on the list.

See [Documents-and-Files](Documents-and-Files).

## API Keys

Where place data comes from. The TREK index needs no key; the providers below it are optional. The card is a column of blocks, in the order TREK recommends them.

### TREK Places API

The first block, marked **Recommended default**. It is TREK's own place index: search without a Google key, without a quota and without anyone counting your lookups. There is nothing to configure here. The fold **What is in it** lists the fields a result carries (**Included**), what it does not have (**Not included**: ratings and photos of ordinary businesses) and its **Sources** (Overture Maps Foundation, OpenStreetMap, Wikivoyage, Wikimedia). See [TREK-Places-API](TREK-Places-API).

### Google Maps API Key

Optional. Without a Google key the TREK API is used. With one, photos, ratings and opening hours can be loaded on top, and every such lookup goes to Google. Create a key at console.cloud.google.com.

Next to the field, **Test** checks the key and shows **Connected** or **Invalid** under it. The eye icon shows or hides the key.

Below the field, the fold **What the key may be used for** shows how many of its five switches are on (for example **4 of 5 on**) and holds:

| Row | What it does | Default |
|-----|--------------|---------|
| **Place Photos** | Fetch photos from the Google Places API. Wikimedia photos are unaffected. | On |
| **Place Autocomplete** | Use Google for search suggestions. | On |
| **Place Details** | Fetch hours, rating and website from Google. | On |
| **Place Enrichment** | Show pictures and a description while adding a place. Wikipedia and OpenStreetMap are always used; Google is added on top when **Place Photos** or **Place Details** is on. | On |
| **Search with Google only** | Every search and every suggestion goes to Google Places. Off, TREK's own index and OpenStreetMap answer first and Google is only asked when they find nothing. | Off |
| **Daily limit for Google calls** | See below. | No limit |

Switch the first four off to save API quota. **Search with Google only** needs a Google key and Google as the place search provider; when either is missing, its subtitle says that search will not go to Google whatever the switch says.

**Daily limit for Google calls**: once the limit is reached, TREK stops calling Google until the next day (UTC) and searches with OpenStreetMap instead. Leave the field empty for no limit. A pill beside the name shows today's usage, **Today: 120** or **Today: 120 of 500**, and turns amber with **Limit reached (120), Google paused until tomorrow** once the day is used up. A **Save** button appears only while the number differs from the stored one; **Enter** saves as well.

### Unsplash API Key

For image search. Free at unsplash.com/developers.

### Amap (高德地图) API Key

For place search inside mainland China, where Google is unreachable and OpenStreetMap coverage is thin. It needs a "Web 服务" (web service) key, not a JS API key. Get one at console.amap.com. There is no **Test** button for this key.

### Keys set through the environment

A key that comes from an environment variable makes its field read-only. The field stays empty and reads **Set via** and the variable's name: `PLACES_API_KEY` for Google, `UNSPLASH_ACCESS_KEY` for Unsplash, `AMAP_API_KEY` for Amap. **Save** leaves those keys alone, and **Test** still checks the Google key from the environment. See [Environment-Variables](Environment-Variables).

### Transit Provider

Which service answers public transit search. It saves as soon as you pick.

- **Transitous (free)**, the default: community GTFS feeds, free and keyless, with the best coverage in Europe.
- **Google**: uses the Google API key above, for regions Transitous has no data for. Google bills each search.

With **Google** picked but no Google key configured, a warning says transit search is still using Transitous. When only your own personal Google key is set, a warning says that other members still fall back to Transitous until the key is saved here as the instance key. See [Transport-Flights-Trains-Cars](Transport-Flights-Trains-Cars).

### Place search provider

TREK's own index and OpenStreetMap answer every search. This picks who else is asked when they find nothing:

- **Automatic** (default): prefers Google where a key exists, then Amap.
- **Google Places**
- **Amap (高德地图)**
- **OpenStreetMap**

The choice saves at once. If the selected provider has no API key, a warning says that place search is answered by the TREK index and OpenStreetMap alone. See [Places-and-Search](Places-and-Search).

### Place Search Log

One switch, **off by default**. When it is on, TREK records which search result was picked, so a different place index can be measured against real searches later: the search text, the picked place's name and rounded coordinates, and where it stood in the result list. No user is stored with it, and nothing leaves the instance. Rows are deleted after 180 days, also while the switch is off. An admin can read the log through `GET /api/place-shadow/summary` and `GET /api/place-shadow/export`, and delete it with `DELETE /api/place-shadow`.

### Saving the keys

The **Save** button at the bottom of the card stores the Google, Unsplash and Amap keys. Everything else on the card (the switches, the daily limit, the two provider choices) saves on its own.

## Danger Zone

**Rotate JWT Secret** generates a new signing secret for login sessions. **Rotate** opens a confirmation; **Rotate & Log out** writes the new secret to `data/.jwt_secret` and invalidates every active session at once, yours included, so you land on the login page. Everyone has to sign in again. The action is recorded in the [Audit-Log](Audit-Log).

Rotating the JWT secret does not touch the encryption key that protects stored API keys and passwords; see [Encryption-Key-Rotation](Encryption-Key-Rotation) for that one.

## See also

- [Admin-Panel-Overview](Admin-Panel-Overview) - all admin tabs
- [OIDC-SSO](OIDC-SSO) - single sign-on setup
- [Passkeys](Passkeys) - passkeys from the user's side
- [Two-Factor-Authentication](Two-Factor-Authentication) - 2FA and the enforced setup
- [TREK-Places-API](TREK-Places-API) - TREK's own place index
- [Places-and-Search](Places-and-Search) - how place search uses these providers
- [Environment-Variables](Environment-Variables) - variables that override these fields
- [Encryption-Key-Rotation](Encryption-Key-Rotation) - rotating the encryption key
