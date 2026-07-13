# Reverse Proxy

Putting TREK behind a TLS-terminating reverse proxy is strongly recommended for production.

## Why HTTPS Matters for TREK

- **PWA install** requires HTTPS — browsers block "Add to Home Screen" on plain HTTP.
- **Session cookies** — the `trek_session` cookie is marked `secure` in production, so it won't be sent over HTTP.
- **OIDC / SSO** — identity providers require the redirect URI to use HTTPS.
- **MCP** — the MCP API requires HTTPS for OAuth 2.1 auth.

## Three Hard Requirements

Whatever proxy you use, it must satisfy three constraints:

1. **WebSocket upgrades on `/ws`** — TREK uses WebSockets for real-time sync. Set `proxy_read_timeout 86400` (Nginx) or rely on Caddy's automatic upgrade handling.
2. **Body size ≥ 500 MB** — backup restore ZIPs can include the full uploads directory. Set `client_max_body_size 500m` (Nginx) or `request_body_max_size 500mb` (Caddy) if you restore large backups.
3. **Pass the `Mcp-Session-Id` header through on `/mcp`** — if you use MCP. See below.

## Nginx

```nginx
server {
    listen 80;
    server_name trek.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name trek.yourdomain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        # File uploads are capped at 50 MB; backup restore ZIPs can include the full
        # uploads directory and may exceed that — raise this value if restores fail.
        client_max_body_size 500m;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Needed for backup restore uploads — can exceed the Nginx default of 1 MB.
        client_max_body_size 500m;
    }
}
```

Key lines:
- `proxy_read_timeout 86400` — keeps WebSocket connections alive (86400 s = 24 h).
- `client_max_body_size 500m` — allows large backup restore uploads; set in both locations.
- `X-Forwarded-Proto $scheme` — tells TREK whether the original request was HTTPS; required for `FORCE_HTTPS` redirect and cookie security to work correctly.

## Caddy

Caddy handles WebSocket upgrades automatically:

```
trek.yourdomain.com {
    reverse_proxy localhost:3000
}
```

For large backup restores, add:

```
trek.yourdomain.com {
    request_body max_size 500mb
    reverse_proxy localhost:3000
}
```

## MCP behind a proxy

Skip this section if you don't use the MCP addon.

MCP is session-based. On the first request the server replies with an `Mcp-Session-Id` response header, and the client sends that value back as a request header on every subsequent call. **Both directions must survive the proxy.** If the response header is stripped, the client never learns its session id, so every single tool call looks like a brand-new connection — the server opens a fresh session each time, sessions pile up, and once the user hits `MCP_MAX_SESSION_PER_USER` the oldest session is evicted to make room for each new one. The connection keeps working, but it is churning sessions instead of reusing one, and you will see this warning on every tool call:

```
[MCP] POST without mcp-session-id for user 1 — starting a new session. If this
repeats on every tool call, the Mcp-Session-Id response header is not reaching
the client (check that your reverse proxy forwards it).
```

Nginx and Caddy both forward custom headers in both directions by default, so **the standard configs above already work**. You only need to act if you have deliberately restricted headers:

- Don't list `/mcp` under a `proxy_hide_header` directive, and don't run it through a response-header allowlist that omits `Mcp-Session-Id`.
- If your proxy rewrites or lowercases headers, that's fine — HTTP header names are case-insensitive and both TREK and MCP clients treat them as such.
- The browser-facing `Access-Control-Expose-Headers: Mcp-Session-Id` response header is what permits browser-based clients (Claude.ai, Claude Desktop connectors, MCP Inspector) to *read* the session id at all. TREK sends it automatically — don't strip or overwrite it in the proxy.

TREK 3.3.0 and earlier did not send `Access-Control-Expose-Headers` at all, which caused exactly the symptom above regardless of proxy configuration. If you are on an older version and see a new session per tool call, upgrade — no proxy change will fix it.

### Streaming responses

The `/mcp` endpoint answers with Server-Sent Events. If your proxy buffers responses, tool results are delayed until the buffer flushes. Nginx buffers by default, so disable it for that path:

```nginx
location /mcp {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;      # SSE — deliver tool results as they stream
    proxy_read_timeout 3600s; # long-lived streams between tool calls
}
```

TREK sends an SSE keep-alive comment every 25 seconds (`MCP_SSE_KEEPALIVE`) precisely so proxies with a short idle timeout — nginx defaults to 60 s — don't drop an idle stream between tool calls. Lower the interval if your proxy's timeout is tighter than that.

## HTTPS Environment Variables

Four variables control how TREK behaves behind a proxy. They work as a group:

| Variable | Purpose | Default |
|---|---|---|
| `FORCE_HTTPS` | When `true`: 301-redirects HTTP→HTTPS (except `/api/health`), sends HSTS (`max-age=31536000`), adds CSP `upgrade-insecure-requests`, forces cookie `secure` flag | `false` |
| `TRUST_PROXY` | Number of trusted proxy hops. Lets Express read the real client IP from `X-Forwarded-For`. Automatically set to `1` in production even if not explicitly configured. | `1` (production), off (development) |
| `COOKIE_SECURE` | Controls the `secure` flag on `trek_session`. Auto-derived as `true` when `NODE_ENV=production` or `FORCE_HTTPS=true`. Set to `false` explicitly to allow cookies over plain HTTP (e.g. LAN testing without TLS). | auto |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins (e.g. `https://trek.example.com`). In production without this set, all cross-origin requests are blocked. In development without this set, all origins are allowed. | blocked in prod, open in dev |

> **Note on `FORCE_HTTPS` and proxy headers:** The HTTPS redirect reads `X-Forwarded-Proto` directly from the incoming headers — it does not depend on Express's `trust proxy` setting. If you set `FORCE_HTTPS=true` and your reverse proxy correctly sends `X-Forwarded-Proto: https`, the redirect will work regardless of `TRUST_PROXY`. However, you still need `TRUST_PROXY` set so Express resolves the correct client IP from `X-Forwarded-For`.

If you access TREK directly on `http://<host>:3000` without a proxy, leave `FORCE_HTTPS` unset and do not set `TRUST_PROXY`.

See [Environment-Variables](Environment-Variables) for full documentation of these and all other variables.

## Next Steps

- [Environment-Variables](Environment-Variables) — full variable reference including OIDC
- [Install-Docker-Compose](Install-Docker-Compose) — production compose file with proxy-ready env vars
