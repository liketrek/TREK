# Native Apps

**TREK Travel Planner** is the TREK app for iPhone, iPad and Android, from the App Store and Google Play. It is a client for your TREK server: it asks for the server's address once and then shows the TREK interface that server delivers, in the version the server runs, with the same data, the same accounts and the same settings as in the browser. On the home screen it is called **TREK**.

The browser keeps working as before, and installing TREK from the browser as a web app is still possible; see [Offline-Mode-and-PWA](Offline-Mode-and-PWA). The app adds what a browser cannot do well on a phone: signing in with single sign-on and passkeys, the system share sheet for exports, haptics, and on iOS a start without network.

## Connecting to a server

On first start the app shows its address screen. Enter the address you open TREK at in the browser, for example `trek.example.com` or `192.168.1.10:3001`. Without a scheme the app tries https first and then plain http.

The app checks that the address answers as a TREK server that knows the apps, and then loads it. If it does not, it says why:

- **No server answered**: the address is wrong, the server is down, or the phone cannot reach it (see the network section below).
- **Not TREK**: something answered, but not a TREK server.
- **Too old**: a TREK server from before the apps. Update it to a current release.
- **A sign-in page protects this server**: a proxy of your own stands in front of TREK. See the next section.
- **This server asks for a client certificate**: the proxy in front of TREK uses mutual TLS. See [Client certificates (mTLS)](#client-certificates-mtls).

No server yet? **Try the demo** connects to the public demo at demo.liketrek.com, which everybody shares and which is reset every hour. **What is a TREK server?** leads to the project page, which explains how to run your own.

To switch servers later, open **Settings → Account** in the app: the **Server** card names the server and has **Change server**, which returns to the address screen. The sign-in screen has the same link at the bottom.

## Signing in

A password works inside the app as in the browser, and **Remember me** is on by default, so the app does not ask again after the phone closed it.

Single sign-on and passkeys cannot run inside the app's web view: identity providers refuse embedded browsers, and a passkey belongs to your server's domain, which the app cannot be tied to for every server. So the app opens your server's sign-in in the system browser instead. Sign in there as usual, tap **Open the TREK app**, and the app continues signed in. The browser hands over a one-time code that only the app that asked for it can redeem, valid for a minute. The server records the sign-in as a login from the native app.

Passkeys are managed in the browser for the same reason: the **Passkeys** card is hidden in the app.

## Offline

The app keeps the trips you choose offline the same way the browser does, including their maps; see [Offline-Mode-and-PWA](Offline-Mode-and-PWA). On iOS, where the web view runs no service worker, the app stores a copy of the server's start page and of every script of its current version, so it also starts with no network. When the server cannot be reached on start, the app opens that copy, or offers **Try again** and **Change server**.

## Behind a sign-in proxy

Many servers sit behind a proxy that asks for its own sign-in before anything reaches TREK: Cloudflare Access, Pangolin, authentik, Authelia, OAuth2 Proxy, or a password prompt (Basic Auth) in nginx, Caddy or Traefik. The app recognises these when you enter the address and names the one it found.

**Sign in inside the app.** For a proxy with a sign-in page, the address screen offers **Sign in to …**. The app then opens your server, and the proxy's sign-in page shows inside the app, as it would in a browser. Sign in there once; the proxy's session stays with the app and every request carries it, so TREK loads behind it. Only the sign-in host the app saw while checking the address may open inside the app; every other site still opens in the system browser, and the proxy's page has no access to the app. When the proxy's session runs out, its sign-in page shows again on the next start.

What cannot work inside an app:

- **Sign in with Google** (or another provider that refuses embedded browsers) on the proxy's page. Google blocks sign-ins inside apps.
- **A password prompt** (Basic Auth). The app cannot answer it.
- **Header or service-token rules only**, without a sign-in page. The app cannot add headers to the requests the TREK interface makes.

For those, let TREK through the proxy instead: a bypass rule for TREK's address in Cloudflare Access, Pangolin, authentik or Authelia, or the password prompt removed for TREK. TREK's own sign-in still protects it. With Cloudflare Access, enrolling the phone in Cloudflare WARP also lets the app through. To keep TREK closed to everyone but your own devices without a sign-in page, use a client certificate instead.

## Client certificates (mTLS)

A proxy can let in only devices that show a certificate signed by your own certificate authority: mutual TLS, offered by Cloudflare, nginx, Caddy, Traefik and HAProxy. The app supports it, on iOS and Android.

**Adding the certificate.** Enter your server's address as usual. When the proxy asks for a certificate, the app says **This server asks for a client certificate** and offers **Add certificate file**. You can also add it before connecting: type the address and tap **Add certificate file** below **Connect**. Pick the `.p12` or `.pfx` file you made for this phone (from Files, iCloud Drive, Google Drive or your downloads), enter its password, and the app connects. The same happens when a stored certificate expires or the proxy stops accepting it: the app returns to that screen instead of showing the proxy's error page.

**Where it is kept.** On iOS in the keychain, for this device only and not in backups. On Android the private key is sealed with a key of the Android Keystore, which never leaves it. The password of the file is not stored. The app shows the certificate only to the server it was added for, the exact host and port, and never to a sign-in page, a map provider or any other site. It holds one certificate at a time. Certificates installed in the system settings are not used: on iOS, a certificate from a configuration profile is open to Safari and the system but not to other apps, so add the `.p12` to the app as well.

**Changing or removing it.** **Settings → App → Client certificate** shows whom the certificate names, who issued it, the server it is for and how long it is valid, with **Replace** and **Remove**.

### Making a certificate for the app

With your own certificate authority (`ca.pem` and `ca.key`):

```bash
openssl req -newkey rsa:2048 -nodes -keyout phone.key -out phone.csr -subj "/CN=my-phone"
printf 'extendedKeyUsage=clientAuth\n' > client.ext
openssl x509 -req -in phone.csr -CA ca.pem -CAkey ca.key -CAcreateserial -days 730 -extfile client.ext -out phone.pem
openssl pkcs12 -export -inkey phone.key -in phone.pem -out phone.p12
```

Copy `phone.p12` to the phone and add it in the app. Give every device its own certificate, so you can revoke one without the others. If the app says it cannot read the file, export it again with the older encryption that some systems still expect: `openssl pkcs12 -export -legacy -inkey phone.key -in phone.pem -out phone.p12`.

### Cloudflare

1. **SSL/TLS → Client Certificates → Create Certificate**, and under **Hosts** add TREK's hostname.
2. A WAF custom rule that blocks requests to that hostname when `cf.tls_client_auth.cert_verified` is false.
3. Cloudflare shows the certificate and its private key as PEM. Save them as `phone.pem` and `phone.key` and make the file for the app with `openssl pkcs12 -export -inkey phone.key -in phone.pem -out phone.p12`.

Without a certificate Cloudflare answers with its block page; the app recognises that and asks for the certificate.

### nginx, Caddy, Traefik

```nginx
ssl_client_certificate /etc/nginx/trek-ca.pem;
ssl_verify_client on;
```

```caddy
trek.example.com {
	tls {
		client_auth {
			mode require_and_verify
			trust_pool file /etc/caddy/trek-ca.pem
		}
	}
	reverse_proxy localhost:3000
}
```

In Traefik, a TLS option with `clientAuth.caFiles` and `clientAuthType: RequireAndVerifyClientCert`, attached to TREK's router.

A browser on your computer needs the same certificate, imported into the browser or the system keychain; it asks which one to use on the first visit.

## Plain http, the home network and VPNs

The app accepts plain http on purpose, because a server at home is often reached as `http://192.168.x.x:3001` or over a VPN such as Tailscale. Use https for anything reachable from the internet. iOS asks once for access to the local network; allow it, or the app cannot reach a server on your network.

## Files and downloads

Exports, attachments and backup codes open in the system share sheet, from where you save them to Files, open them in another app or send them on.

## Privacy

The app sends what you enter to your TREK server and nowhere else; the makers of TREK receive nothing. Map tiles come from the map provider your server is set up with. The privacy policy is at https://liketrek.com/privacy and is linked from the address screen and from **Settings → Account**. How to delete an account: https://liketrek.com/delete-account.

The app hides the donation links (Ko-fi, Buy Me a Coffee) that the browser shows, because the store rules allow no outside payment links in an app.

## For maintainers: releasing the apps

The apps are built from `client/`: Capacitor wraps the address screen in `client/native-shell/`, and the iOS and Android projects are `client/ios/` and `client/android/`.

- **Every pull request** that touches the native code runs `.github/workflows/native.yml`: an unsigned Android debug and release build (the release build runs R8 with `client/android/app/proguard-rules.pro`), an iOS simulator build with Xcode 26, and a check of the store texts and images.
- **A release** runs `.github/workflows/native-release.yml`, by hand (choose the Play track) or on a `v*` tag. A tag pushed by another workflow with the default token does not start it, so after a release run it by hand on the tag. It builds the signed Android App Bundle and sends it to the chosen Google Play testing track as a draft, and archives the iOS app and uploads it to App Store Connect, where it appears in TestFlight. Promoting a build to production happens in the two consoles.
- **Version numbers**: both stores get the version from `client/package.json` without a prerelease suffix, and the workflow run number plus 1000 as the build number. A prerelease reuses its version with a higher build number and stays on the internal track and in TestFlight.
- **The `store` environment** holds every secret and needs the approval of a required reviewer before a job starts. It only runs in liketrek/TREK, never for a pull request.

### Secrets in the `store` environment

| Secret | What |
| --- | --- |
| ANDROID_UPLOAD_KEYSTORE_B64 | The upload keystore, base64 encoded |
| ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD | Its password, key alias and key password |
| PLAY_SERVICE_ACCOUNT_JSON | The Google Cloud service account with "Release to testing tracks" in Play Console |
| APPLE_TEAM_ID | The Apple Developer team of [APPLE ORGANISATION ACCOUNT] |
| ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8_B64 | The App Store Connect team API key (App Manager role), the .p8 file base64 encoded |

The Play account is [GOOGLE PLAY ORGANISATION ACCOUNT], the Apple account [APPLE ORGANISATION ACCOUNT]. Google Play App Signing holds the app signing key; the upload key above only proves a build comes from us and can be reset through Play support if lost. Its offline backup lives at [KEYSTORE BACKUP LOCATION]. Never commit a keystore, a .p8 key or a service account file: `client/android/.gitignore` ignores them.

The first Android bundle has to be uploaded by hand once (Play only accepts API uploads after that): run the release workflow, download the bundle from the run's artifacts and upload it to Internal testing in Play Console.

### Store listings

The listing texts, the review notes, the policy page drafts and the screenshots live in `client/fastlane/`; its `client/fastlane/README.md` explains how to make the screenshots and upload the listings. App Review gets a separate review server, [REVIEW SERVER URL], with its own accounts, because the public demo blocks account deletion and uploads; the review notes in App Store Connect name it.

### The server side

The app relies on two things of the server: `/api/health/features` answers `nativeApp: true` and `nativeApi` (the version of what the apps use), and `/api/auth/native` carries the sign-in hand-off. `nativeApi` is raised only for a change an older app cannot follow; the app refuses a server below the minimum it knows. Keep demo.liketrek.com on a current release for as long as the apps are in the stores, since **Try the demo** connects to it.
