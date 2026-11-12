/**
 * Pages the apps link to outside the user's server. They open in the system
 * browser: the WebView hands every navigation off the server's own origin to it.
 */

/** The privacy policy the store listings name too. */
export const PRIVACY_URL = 'https://liketrek.com/privacy?app=1';

/** Running the app with a sign-in proxy (Cloudflare Access, Pangolin and the like) in front of TREK. */
export const AUTH_PROXY_DOCS_URL = 'https://github.com/liketrek/TREK/wiki/Native-Apps#behind-a-sign-in-proxy';

/** Adding a client certificate for a server behind mutual TLS (Cloudflare, nginx, Caddy, Traefik). */
export const CLIENT_CERT_DOCS_URL = 'https://github.com/liketrek/TREK/wiki/Native-Apps#client-certificates-mtls';

/** The public demo the address screen offers to someone without a server. */
export const DEMO_SERVER_URL = 'https://demo.liketrek.com';

/** TREK Cloud, for someone who wants a hosted TREK rather than running their own. */
export const CLOUD_URL = 'https://liketrek.com';

/**
 * The terms an in-app subscription is sold under: Apple's standard licence
 * agreement, which the App Store applies when an app names no own EULA. The
 * store rules ask for it next to the purchase, together with the privacy policy.
 */
export const STORE_TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
/** Where the App Store and Google Play let someone manage or end a subscription. */
export const APP_STORE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';
export const PLAY_SUBSCRIPTIONS_URL = 'https://play.google.com/store/account/subscriptions?package=com.liketrek.trek';
/** Our terms for TREK Cloud (§ 5a covers a purchase in the app), as the app opens them: without the site's sales header. */
export const CLOUD_TERMS_URL = 'https://liketrek.com/terms?app=1';
