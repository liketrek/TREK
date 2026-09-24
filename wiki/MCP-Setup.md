# MCP Setup

This page explains how to connect an AI assistant to your TREK instance. TREK supports three authentication methods: OAuth 2.1 with browser consent (recommended for interactive clients), machine clients with no browser login (recommended for AI agents and scripts), and static API tokens (deprecated).

![MCP Setup](assets/MCPConfig.png)

> **Cloudflare users:** If your TREK instance is proxied through Cloudflare, Bot Fight Mode and Super Bot Fight Mode will block MCP requests from ChatGPT. Claude.ai is not affected. See [Troubleshooting → MCP requests blocked by Cloudflare WAF](Troubleshooting#mcp-requests-blocked-by-cloudflare-waf-bot-fight-mode) for the fix.

## Option A: OAuth 2.1 (recommended)

OAuth 2.1 is the preferred connection method. You grant specific scopes during the consent step and no token management is required afterward — TREK issues short-lived access tokens and automatically rotates refresh tokens.

### Claude.ai

Claude.ai (web) supports native MCP connections — no JSON config file required:

1. In TREK, go to your **Settings → Integrations → MCP → OAuth 2.1 Clients** and click **New Client**.
2. Select the **Claude.ai** preset. This fills in the redirect URI (`https://claude.ai/api/mcp/auth_callback`) and a default scope set.
3. Give the client a name, adjust scopes if needed, and save. Copy the client ID and client secret (`trekcs_` prefix) — the secret is shown only once.
4. In Claude.ai, open the MCP settings and add a new server using your TREK URL (`https://<your-trek-instance>/mcp`). Claude.ai will open your browser to complete the OAuth consent flow.

### Claude Desktop

Claude Desktop supports native MCP connections — no JSON config file required:

1. In TREK, go to your **Settings → Integrations → MCP → OAuth 2.1 Clients** and click **New Client**.
2. Select the **Claude Desktop** preset. This fills in the redirect URI and a default scope set.
3. Give the client a name, adjust scopes if needed, and save. Copy the client ID and client secret — the secret is shown only once.
4. In Claude Desktop, open Settings → MCP and add a new server using your TREK URL (`https://<your-trek-instance>/mcp`). Claude Desktop will open your browser to complete the OAuth consent flow.

### Cursor, VS Code, Windsurf, and Zed

Clients that support `mcp-remote` can connect in one of two ways.

**Option 1 — dynamic registration (no pre-created client needed):**

```json
{
  "mcpServers": {
    "trek": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://<your-trek-instance>/mcp"
      ]
    }
  }
}
```

When the client starts, it fetches TREK's OAuth discovery document (`/.well-known/oauth-authorization-server`), registers itself automatically, and opens your browser to the TREK consent screen. You choose scopes there.

**Option 2 — pre-created OAuth client:**

Create a client in TREK using the appropriate preset (Cursor, VS Code, Windsurf, or Zed — all use `http://localhost` as redirect URI), then pass the credentials via `--static-oauth-client-info`:

```json
{
  "mcpServers": {
    "trek": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://<your-trek-instance>/mcp",
        "--static-oauth-client-info",
        "{\"client_id\": \"<your_client_id>\", \"client_secret\": \"<your_client_secret>\"}"
      ]
    }
  }
}
```

> On Windows, `npx` may need a full path, for example `C:\PROGRA~1\nodejs\npx.cmd`.

> **Requirement:** `APP_URL` must be set on the server for OAuth discovery to work, and it must be the public `https://` address. A plain-HTTP `APP_URL` is not a valid OAuth issuer, so TREK falls back to `http://localhost:{PORT}` in the discovery document and every remote client is sent to an address it cannot reach. The boot log says so: `APP_URL: not MCP-safe (requires https:// or http://localhost)`.

TREK answers the discovery documents both at the origin (`/.well-known/oauth-authorization-server`, `/.well-known/openid-configuration`, `/.well-known/oauth-protected-resource`) and under the server address a client is given (`/mcp/.well-known/…`), because clients differ on where they look. Anything else below `/.well-known` answers a JSON 404, never the web app.

### Redirect URI

The redirect URI belongs to **your client, not to TREK**: it is the address the client wants the browser sent back to, so it is never your TREK URL and never `/mcp`. Open WebUI, for example, uses `{your Open WebUI URL}/oauth/clients/mcp:{ID}/callback`, where `{ID}` is the ID of the tool server connection with `mcp:` put in front of it (matched exactly, capitals included), the Claude clients use their own callbacks, and the editors use `http://localhost`. When the client supports dynamic registration, let it register itself and the URI is filled in for you. A mismatch shows up at the consent step as `invalid_request: Unregistered redirect_uri`.

TREK accepts `https://` URIs, plain HTTP only on `localhost` or `127.0.0.1`, and private custom schemes such as `myapp://callback`. A client running on a LAN address over plain HTTP is refused for that reason; put it behind HTTPS.

**Open WebUI.** Add TREK as an MCP (Streamable HTTP) tool server with the URL `https://<your-trek-instance>/mcp` and OAuth 2.1 as the auth type, click **Register Client**, save, then open the connection again and authorize. Open WebUI registers the client and trades the code for a token from its own server rather than from your browser, so the Open WebUI container has to reach your public TREK address. Its **WebUI URL** (Admin Panel → Settings → General) has to be the public `https://` address, otherwise the redirect URI goes out as plain HTTP and TREK refuses it.

### Pre-created OAuth clients

Your **Settings → Integrations → MCP → OAuth 2.1 Clients** page (your own settings, not the admin area) lets you create named OAuth clients before connecting. This gives you:

- A fixed, named scope list defined up front
- A client secret (`trekcs_` prefix, shown once) for confidential client mode
- Preset buttons for Claude.ai, Claude Desktop, Cursor, VS Code, Windsurf, and Zed that fill in the correct redirect URIs and a sensible default scope set

Each user can have up to **10 OAuth clients**.

## Option B: Machine client — no browser login (for AI agents and scripts)

Use this when your AI agent or automation script needs to authenticate silently without any browser interaction. Instead of going through an OAuth consent flow, the client exchanges a `client_id` and `client_secret` directly for an access token ([RFC 6749 §4.4 — Client Credentials grant](https://datatracker.ietf.org/doc/html/rfc6749#section-4.4)).

**Why this exists:** browser-based OAuth flows are an awkward fit for an agent running unattended. Two sessions sharing one refresh token used to be read as a replay, which revoked the whole chain and popped a login window; TREK now allows a short grace period on a just-rotated token, so a concurrent refresh no longer ends the session. Machine clients still sidestep the question entirely — there is no refresh token and no rotation at all.

**How it works:** the token acts as its owner (the user who created the client), scoped to the permissions chosen at creation. All TREK permission checks still apply — the AI agent can only access what you can access, narrowed further to the selected scopes.

### Create a machine client

1. Go to your **Settings → Integrations → MCP → OAuth 2.1 Clients** and click **New Client**.
2. Tick **Machine client (no browser login)**. The redirect URI field disappears — machine clients don't need one.
3. Give it a name, select scopes, and click **Register Client**.
4. Copy the `client_id` and `client_secret` shown — the secret is displayed only once.

### How token management works

Your AI client uses the `client_id` and `client_secret` to request a token directly from TREK (`POST /oauth/token` with `grant_type=client_credentials`). Tokens are valid for 1 hour. When one expires, the client requests a new one silently — no browser window, no user action, no consent screen. This is handled entirely by the client.

### Who should use this

Machine clients are designed for **AI agent frameworks and custom MCP client implementations** that can call the token endpoint themselves and handle renewal programmatically. TREK advertises `client_credentials` in its OAuth discovery document (`/.well-known/oauth-authorization-server`), so any compliant client can discover and use it automatically.

> **`mcp-remote` users:** `mcp-remote` implements the browser-based `authorization_code` flow only — it does not support `client_credentials`. If you use `mcp-remote`, stick with Option A and use the preset for your client. The machine client option is not applicable.

## Option C: Static API token (deprecated)

> **Deprecated:** Static tokens will stop working in a future version of TREK. Migrate to OAuth 2.1 or machine clients.

Static tokens grant full access to all tools and resources with no scope restrictions. A static-token session is warned about the deprecation once, not on every call: the notice rides along with the result of the first `list_trips` or `get_trip_summary` in that session — the trip-discovery tools an AI client normally reaches for first — for the client to surface to you. The tool's own payload still comes with it, and every later call in that session returns a plain result. The notice is also part of the session instructions the server sends when the connection initializes.

1. Go to your **Settings → Integrations → MCP**, open the **API Tokens** sub-tab, and click **Create New Token**.
2. Give the token a name and copy it immediately — it is shown only once. The token starts with `trek_`.
3. Pass the token as a header in your client config:

```json
{
  "mcpServers": {
    "trek": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://<your-trek-instance>/mcp",
        "--header",
        "Authorization: Bearer trek_your_token_here"
      ]
    }
  }
}
```

Each user can create up to **10 static tokens**.

## Authentication reference

| Method | Grant | Token prefix | Access level | Expiry |
|---|---|---|---|---|
| OAuth 2.1 — browser consent | `authorization_code` | `trekoa_` | Scoped (per-consent) | 1 hour; auto-refreshed via 30-day rolling refresh token (`trekrf_`) |
| Machine client — no browser | `client_credentials` | `trekoa_` | Scoped (per-client), acts as owner | 1 hour; re-request silently, no refresh token |
| OAuth client secret | — | `trekcs_` | Used to authenticate the client at the token endpoint | No expiry (revoke via UI) |
| Static API token | — | `trek_` | Full access | No expiry — **deprecated** |

## Related

- [MCP-Overview](MCP-Overview)
- [MCP-Scopes](MCP-Scopes)
- [Admin-MCP-Tokens](Admin-MCP-Tokens)
- [Environment-Variables](Environment-Variables)
- [Reverse-Proxy](Reverse-Proxy) — the proxy must pass `Mcp-Session-Id` through, or every tool call opens a new session
- [Troubleshooting](Troubleshooting) — OAuth flow not starting, sessions piling up, Cloudflare WAF blocks
