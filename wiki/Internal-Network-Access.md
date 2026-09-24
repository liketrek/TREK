# Internal Network Access

TREK makes outbound HTTP requests when you configure integrations such as Immich or Synology Photos. By default, it blocks requests to private and local IP ranges to prevent server-side request forgery (SSRF) attacks. You need to allow internal network access when those services are hosted on your LAN.

## Default behavior

TREK has two SSRF guards, both in `ssrfGuard.ts`. Which one applies depends on the call site, not on who configured the URL.

**The strict guard** (`safeFetch` / `safeFetchFollow`, built on `checkSsrf`) covers most outbound traffic: Immich, Synology Photos, AirTrail, Dawarich, the document stores behind [Document-Sync](Document-Sync) (Paperless-ngx, Papra, Nextcloud, OpenCloud and Synology), notification webhooks, ntfy, Unsplash, and place lookups. It resolves the hostname to an IP address before allowing the connection and blocks loopback, link-local and private ranges. Only the private ranges open up, and only with `ALLOW_INTERNAL_NETWORK=true`. The two tables below describe this guard.

**The relaxed guard** (`safeFetchAdminConfigured`, also exported as `safeFetchLlm`) covers endpoints that are expected to live on your own network: OIDC (discovery, token, userinfo, JWKS), the LLM providers behind the AI Parsing addon (a local Ollama or any OpenAI-compatible endpoint), and plugin OAuth token exchanges. The self-hosted routing engines an admin sets for the [Road-Trip](Road-Trip) addon (**Own routing engine**, **Own Valhalla instance**) go through it too when the server asks them itself, which it does for the MCP road trip tools. The planner asks them from the browser, so they must also be reachable from your users' devices. It deliberately permits loopback and LAN targets, so a model server on `localhost` or an identity provider on your LAN works **without** `ALLOW_INTERNAL_NETWORK`. It still resolves every hostname, re-checks every redirect hop, and always blocks link-local and cloud-metadata addresses (`169.254.0.0/16`, the full `fe80::/10`, and the AWS and Alibaba metadata addresses). The only way past is a single address listed in `ALLOW_LINK_LOCAL_IPS`, see [below](#a-link-local-address-you-need).

**No guard** applies to the addresses an admin sets in the environment for place search: `TREK_PLACES_URL`, `NOMINATIM_URL` and `OVERPASS_URL`. They are configuration rather than user input, so a self-run copy of the [TREK Places API](TREK-Places-API), a Nominatim or an Overpass instance on your LAN or in the same Docker network is reached without `ALLOW_INTERNAL_NETWORK`.

## Always blocked

Under the strict guard, these ranges are blocked whatever `ALLOW_INTERNAL_NETWORK` says:

| Range | Description |
|---|---|
| `127.0.0.0/8`, `::1` | Loopback |
| `0.0.0.0/8` | Unspecified |
| `169.254.0.0/16`, `fe80::/10` | Link-local / cloud metadata endpoints |
| `::ffff:127.x.x.x`, `::ffff:169.254.x.x` | IPv4-mapped loopback and link-local |

The IPv6 link-local rule covers the whole `fe80::/10` prefix (`fe80:` to `febf:`), under the relaxed guard as well.

The one way past this table is `ALLOW_LINK_LOCAL_IPS`, for a single IPv4 link-local address, see [below](#a-link-local-address-you-need).

## Blocked unless `ALLOW_INTERNAL_NETWORK=true`

| Range / Hostname | Description |
|---|---|
| `10.0.0.0/8` | RFC-1918 private |
| `172.16.0.0/12` | RFC-1918 private |
| `192.168.0.0/16` | RFC-1918 private |
| `100.64.0.0/10` | CGNAT / Tailscale shared address space |
| `fc00::/7` | IPv6 ULA |
| IPv4-mapped RFC-1918 variants | e.g. `::ffff:10.x`, `::ffff:192.168.x` |
| `*.local`, `*.internal`, `localhost` hostnames | mDNS / internal DNS suffixes (e.g. Docker service names, LAN hosts) and the literal `localhost` |

The hostname `localhost` is matched at the hostname stage too, but it normally resolves to a loopback address (`127.0.0.1` or `::1`), which the always-blocked loopback rule catches first, so under the strict guard it is blocked no matter how `ALLOW_INTERNAL_NETWORK` is set. On a host that maps `localhost` somewhere else, the hostname rule still applies and it stays blocked unless `ALLOW_INTERNAL_NETWORK=true`. The relaxed guard allows `localhost` outright, which is what makes a local Ollama the supported default for AI Parsing.

`*.local` and `*.internal` hostnames are permitted when `ALLOW_INTERNAL_NETWORK=true`: the guard still resolves them to an IP and enforces all IP-level rules, so any such hostname that resolves to a loopback or link-local address remains blocked regardless.

## When to enable

Set `ALLOW_INTERNAL_NETWORK=true` when a service reached through the strict guard (Immich, Synology Photos, AirTrail, Dawarich, a document store bound through [Document-Sync](Document-Sync), or a notification webhook) is hosted on your local network and you need TREK to reach it. You do **not** need it for a local or LAN Ollama, an OpenAI-compatible endpoint, an OIDC provider on your LAN, your own OSRM or Valhalla, or plugin OAuth; those go through the relaxed guard and already work. Nor do you need it for your own TREK Places API, Nominatim or Overpass, which are not guarded at all. Leave the flag off if only those need internal access, since turning it on widens the surface for every strict-guard integration at once.

A service in another container on the same Docker network counts as internal too, because its container name resolves to a private address; so do a Tailscale address (`100.64.0.0/10`) and a `.local` name. A service on loopback (`localhost`, `127.0.0.1`) is never reached through the strict guard, whatever the flag says: use the host's LAN address or the container name instead.

See [Environment-Variables](Environment-Variables) for how to set environment variables.

> **Admin:** Set `ALLOW_INTERNAL_NETWORK=true` in [Environment-Variables](Environment-Variables) before configuring Immich, Synology Photos, AirTrail, Dawarich or a document store on a LAN.

## A link-local address you need

A rootless Podman container reaches its host through `169.254.1.2`: `AddHost=keycloak.example.com:host-gateway` writes that address into the container's `/etc/hosts`. With the identity provider, or the reverse proxy in front of it, on the host, the OIDC login then fails with `[OIDC] Login error: Requests to link-local / cloud-metadata addresses are not allowed`, because both guards block `169.254.0.0/16`.

Name that one address in `ALLOW_LINK_LOCAL_IPS`:

```
ALLOW_LINK_LOCAL_IPS=169.254.1.2
```

- The relaxed guard (OIDC, AI Parsing, plugin OAuth, your own routing engines) then reaches it with nothing else set.
- The strict guard treats it as internal, like a `192.168.x` address, so Immich, a document store or any other integration behind it also needs `ALLOW_INTERNAL_NETWORK=true`.
- Every other link-local address stays blocked. `169.254.169.x` and `169.254.170.x`, where AWS, GCP, Azure and the container services built on them hand out instance metadata and credentials, cannot be listed at all. TREK refuses to start with one of them in the list, and with any entry that is not a single IPv4 address such as `169.254.1.2`, so IPv6 link-local (`fe80::/10`) cannot be listed either.

Several addresses are separated by commas. The list is read at startup, so restart TREK after changing it.

## DNS rebinding protection

Even with `ALLOW_INTERNAL_NETWORK=true`, TREK pins the DNS resolution to prevent rebinding attacks. When the guard checks a URL, it resolves the hostname once and records the IP. The outbound connection is then made directly to that IP using a pinned dispatcher (via undici), so the hostname cannot re-resolve to a different address between the check and the actual request.

## Audit log

When a user saves an Immich URL that resolves to a private IP, TREK records an `immich.private_ip_configured` entry in the [Audit-Log](Audit-Log) including the URL and the resolved IP address. AirTrail does the same with `airtrail.private_ip_configured`, and Dawarich with `dawarich.private_ip_configured`. Synology Photos does not emit an equivalent event, and neither does document sync.

## See also

- [Photo-Providers](Photo-Providers)
- [Dawarich](Dawarich)
- [Document-Sync](Document-Sync)
- [User-Settings](User-Settings)
- [Environment-Variables](Environment-Variables)
- [Security-Hardening](Security-Hardening)
