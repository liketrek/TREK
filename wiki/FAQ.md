# FAQ

## Do I need a Google Maps API key?

No. Place search runs on YOUYA's own place index, the [YOUYA Places API](TREK-Places-API), asked together with OpenStreetMap, with no API key, no quota and no account. A Google Maps key only answers where both come up empty, and adds ratings and photos for the places Google finds, which no open dataset has. An admin can add one in **Admin → Settings → API Keys**, see [Places and Search](Places-and-Search#with-a-google-maps-api-key). A key saved there applies instance-wide to every member; there is no per-user field for it in the UI. A key can also come from the `PLACES_API_KEY` environment variable, which then wins over the field, see [Environment-Variables](Environment-Variables#place-search-google-places).

To keep the Google bill in check, the same card has **Daily limit for Google calls**: once today's calls reach it, YOUYA stops calling Google until the next day (UTC) and searches with OpenStreetMap instead. Today's count sits next to the field. Leave it empty for no limit.

## Can I use YOUYA offline?

Yes. YOUYA is a Progressive Web App. After your first visit, the service worker (powered by Workbox) caches map tiles (Carto, OpenStreetMap, Mapbox GL and OpenFreeMap), uploaded covers and avatars, and every page of the app. Subsequent visits work without a network connection for already-cached content. Trip data does not come from that cache: it is stored per user in IndexedDB and read back through YOUYA's own offline layer, with writes queued and replayed once you reconnect. **Settings → Offline** adds **Force offline mode**, which routes the whole app to the local copy, and **Download for offline use**, which fetches your trips, documents and map tiles up front. See [Offline Mode and PWA](Offline-Mode-and-PWA) for installation instructions.

> **Note:** API responses are **never** stored in the service-worker cache. Workbox keys its entries by URL and cannot vary them on the session cookie, so caching them would mean one account's data could be served to the next on a shared device.

## How many MCP tokens can I create?

Each user can create up to **10 static API tokens**. Static tokens are deprecated — migrate to OAuth 2.1 when possible.

For OAuth 2.1, each user can register up to **10 OAuth clients**. The default limit for concurrent MCP sessions is **20 per user** (configurable via `MCP_MAX_SESSION_PER_USER`). See [MCP Setup](MCP-Setup).

> **Admin:** MCP must be enabled in Admin Panel > Addons before any user can access it.

## Where is my data stored?

| Type | Path |
|------|------|
| Database | `./data/travel.db` (SQLite) |
| Uploads | `./uploads/` |
| Logs | `./data/logs/trek.log` (auto-rotated) |
| Backups | `./data/backups/` |

When running in Docker, mount `./data` and `./uploads` as volumes so your data survives container updates. See [Install: Docker Compose](Install-Docker-Compose).

## How do I update YOUYA?

Pull the new image and recreate the container. Your data is in the mounted volumes and is never modified by the update process. See [Updating](Updating) for the exact commands.

## Can I restrict who can register?

Yes. An admin can disable open registration so that new accounts can only be created via invite links. See [Admin: Users and Invites](Admin-Users-and-Invites).

## Does YOUYA support single sign-on?

Yes, via OpenID Connect (OIDC). Compatible providers include Google, Authentik, Keycloak, and any standard OIDC-compliant IdP. Set `OIDC_ONLY=true` to disable password login entirely. See [OIDC SSO](OIDC-SSO).

## Can YOUYA open straight on my trip instead of the dashboard?

Yes. In Settings → General → **Startup**, set the start page to **Active trip** and pick the tab it should open on — Costs, for instance, if you mostly add expenses while travelling. Opening YOUYA (including the installed PWA or a home-screen shortcut) then goes there in one step instead of three.

If you would rather build the shortcut yourself, or point a wrapper app at it, any trip URL takes a tab directly: `/trips/42?tab=finanzplan`. See [Display-Settings](Display-Settings) for the full list of tab ids.


## Is the AI assistant required, and what does it send out?

No. The **AI Assistant** addon is off by default, and an admin has to switch it on before anyone sees it. It is a chat inside the trip that reads the plan and proposes changes, and nothing changes until you confirm a proposal. Each person connects their own AI account: an API key from Anthropic, OpenAI or Gemini, a sign-in with OpenRouter or ChatGPT, or an own server that speaks the same protocol. The conversation and the parts of your trip the assistant reads to answer go to the provider you connected, and nowhere else. In YOUYA Studio the assistant sees a page only after you allow it with **Show it pages**. See [Journey-Journal](Journey-Journal#youya-studio).

## What is the difference between the AI assistant and AI parsing?

They are two separate addons with their own switches. **AI Parsing** reads booking confirmations that the built-in parser cannot, see [AI-Booking-Import](AI-Booking-Import). The **AI Assistant** is the chat. You can run one without the other.

## What are Tours and Road trip?

**Tours** are hikes, city walks, bike, ski, paddle and horse tours with a route that you draw in YOUYA or import from GPX, KML or KMZ, see [Tours](Tours). **Road trip** plans a trip as one continuous drive, with search along the route and daily driving times, see [Road-Trip](Road-Trip). Both are addons that an admin switches on.

## Can I turn a trip into a photo book?

Yes. Link a journal to the trip, then open the journey and click **Studio**. YOUYA Studio lays the journey out as a printable photo book and exports it as a PDF. It needs a window at least 1024 px wide, so it is not offered on a phone. See [Journey-Journal](Journey-Journal#youya-studio).

## Can I get notifications on my phone?

Yes, in three ways. The bell and the **Notifications** page inside YOUYA, email, webhook and ntfy if your admin set them up, and **Web Push**, which reaches a device even while YOUYA is closed. Push needs HTTPS, and on an iPhone or iPad it only works in the Home Screen app. You turn it on per device under **Settings → Notifications**. See [Notifications](Notifications).

## Can YOUYA show where I actually travelled?

If you run a [Dawarich](Dawarich) server, you can connect it, and YOUYA offers the stays and routes it recorded as suggestions that you confirm. Nothing is written back to Dawarich.

## Where do I find help inside the app?

Click the **?** in the top bar for the help center, which explains the screen you are on, with guides and pictures. It is hidden on phones. The full wiki is also available inside YOUYA at `/help`. See [Help-Center](Help-Center) and [In-App-Help](In-App-Help).

## How do I check that YOUYA is running?

Open `/api/health` on your instance. The compose file's healthcheck polls it. During a shutdown, `/api/health/ready` answers 503 while YOUYA finishes what it is doing, which is what an orchestrator should wait on. See [Install-Docker](Install-Docker).
