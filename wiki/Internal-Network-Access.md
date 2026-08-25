# Internal Network Access

TREK makes outbound HTTP requests when you configure integrations such as Immich or Synology Photos. By default, it blocks requests to private and local IP ranges to prevent server-side request forgery (SSRF) attacks. You need to allow internal network access when those services are hosted on your LAN.

## Default behavior

TREK has two SSRF guards, both in `ssrfGuard.ts`. Which one applies depends on the call site, not on who configured the URL.

**The strict guard** (`safeFetch` / `safeFetchFollow`, built on `checkSsrf`) covers most outbound traffic — Immich, Synology Photos, AirTrail, notification webhooks, ntfy, Unsplash, and place lookups. It resolves the hostname to an IP address before allowing the connection and blocks loopback, link-local and private ranges. Only the private ranges open up, and only with `ALLOW_INTERNAL_NETWORK=true`. The two tables below describe this guard.

**The relaxed guard** (`safeFetchAdminConfigured`, also exported as `safeFetchLlm`) covers endpoints that are expected to live on your own network: OIDC (discovery, token, userinfo, JWKS), the LLM providers behind the AI Parsing addon (a local Ollama or any OpenAI-compatible endpoint), and plugin OAuth token exchanges. It deliberately permits loopback and LAN targets, so a model server on `localhost` or an identity provider on your LAN works **without** `ALLOW_INTERNAL_NETWORK`. It still resolves every hostname, re-checks every redirect hop, and always blocks link-local and cloud-metadata addresses (`169.254.0.0/16`, the full `fe80::/10`, and the AWS and Alibaba metadata addresses).

## Always blocked (no override possible)

Under the strict guard, these ranges are blocked regardless of any setting:

| Range | Description |
|---|---|
| `127.0.0.0/8`, `::1` | Loopback |
| `0.0.0.0/8` | Unspecified |
| `169.254.0.0/16`, `fe80::/16` | Link-local / cloud metadata endpoints |
| `::ffff:127.x.x.x`, `::ffff:169.254.x.x` | IPv4-mapped loopback and link-local |

The IPv6 link-local rule here matches the `fe80:` hextet only, which is narrower than the nominal `fe80::/10` prefix (`fe80:`–`febf:`). In practice that is the same set of addresses, since RFC 4291 link-local addresses are always `fe80::/64`. The relaxed guard covers the whole `/10`.

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

The hostname `localhost` is matched at the hostname stage too, but it normally resolves to a loopback address (`127.0.0.1` or `::1`), which the always-blocked loopback rule catches first — so under the strict guard it is blocked no matter how `ALLOW_INTERNAL_NETWORK` is set. On a host that maps `localhost` somewhere else, the hostname rule still applies and it stays blocked unless `ALLOW_INTERNAL_NETWORK=true`. The relaxed guard allows `localhost` outright, which is what makes a local Ollama the supported default for AI Parsing.

`*.local` and `*.internal` hostnames are permitted when `ALLOW_INTERNAL_NETWORK=true` — the guard still resolves them to an IP and enforces all IP-level rules, so any such hostname that resolves to a loopback or link-local address remains blocked regardless.

## When to enable

Set `ALLOW_INTERNAL_NETWORK=true` when a service reached through the strict guard — Immich, Synology Photos, AirTrail, or a notification webhook — is hosted on your local network and you need TREK to reach it. You do **not** need it for a local or LAN Ollama, an OpenAI-compatible endpoint, an OIDC provider on your LAN, or plugin OAuth; those go through the relaxed guard and already work. Leave the flag off if only those need internal access, since turning it on widens the surface for every strict-guard integration at once.

See [Environment-Variables](Environment-Variables) for how to set environment variables.

> **Admin:** Set `ALLOW_INTERNAL_NETWORK=true` in [Environment-Variables](Environment-Variables) before configuring Immich or Synology on a LAN.

## DNS rebinding protection

Even with `ALLOW_INTERNAL_NETWORK=true`, TREK pins the DNS resolution to prevent rebinding attacks. When the guard checks a URL, it resolves the hostname once and records the IP. The outbound connection is then made directly to that IP using a pinned dispatcher (via undici), so the hostname cannot re-resolve to a different address between the check and the actual request.

## Audit log

When a user saves an Immich URL that resolves to a private IP, TREK records an `immich.private_ip_configured` entry in the [Audit-Log](Audit-Log) including the URL and the resolved IP address. AirTrail does the same with `airtrail.private_ip_configured`. Synology Photos does not emit an equivalent event.

## See also

- [Photo-Providers](Photo-Providers)
- [User-Settings](User-Settings)
- [Environment-Variables](Environment-Variables)
- [Security-Hardening](Security-Hardening)
