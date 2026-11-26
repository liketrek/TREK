# AI Connections

YOUYA's AI features run on a language model from a provider you choose. The **AI connection** is that link: which provider answers, with which account or key, and which model. The [AI Assistant](AI-Assistant) runs on it, and [AI Parsing](AI-Booking-Import) can read your imported bookings with the same connection, so one setup serves both.

[MCP](MCP-Overview) works the other way round and needs no AI connection in YOUYA: there an AI app outside YOUYA brings its own model and talks to YOUYA.

## Providers

| Provider | How you connect | Notes |
|---|---|---|
| **Anthropic** | API key | *Claude Max and Team include API credits.* |
| **OpenAI** | API key | Create a key in your OpenAI dashboard. |
| **Gemini** | API key | AI Studio has a free tier with limits per minute and per day, on which Google may use what you send to improve its products. With billing turned on the limits are higher and that does not apply. |
| **OpenRouter** | API key, or **Connect OpenRouter** | Signing in with OpenRouter hands YOUYA a key, no copying needed. Offered only when YOUYA runs on an `https://` address, because OpenRouter only sends the browser back to one. |
| **ChatGPT** | **Sign in with ChatGPT** | Uses your ChatGPT plan, no key needed. Marked **Beta**: an API key is the official way. |
| **Own server** | Server address, optional API key, model | Any OpenAI compatible server, for example Ollama. Only an administrator can set one up, for everyone. |

**Paste an API key** recognises the provider from the key itself and says **Detected:** with its name. When a key does not give its provider away, YOUYA asks **Which provider is this key from?** The key is tested as soon as you connect. **Get a key** opens the provider's page for making one.

**Sign in with ChatGPT** works in two steps, because ChatGPT does not send you back to YOUYA by itself:

1. **Open ChatGPT sign-in** opens ChatGPT in a new tab. Sign in there.
2. Your browser then shows an error page. That is expected. Copy the address at the top, which starts with `127.0.0.1`, come back and use **Paste address**.

If it takes too long, YOUYA asks you to sign in again. A ChatGPT account other than the one already connected is refused until you remove the connection first.

### Choosing a model

Once connected, **Model** lists what the provider offers. *Only models that can use tools are listed*, because the assistant works through YOUYA's tools. **Recommended** marks a good default and **Free** a model without charge. A new connection starts on a model YOUYA picks; change it whenever you like.

## Your settings

Your connection lives in **Settings → Integrations**, in the **AI assistant** section (named **AI parsing** when only AI Parsing is switched on). What the section offers depends on how the administrator set things up:

| The administrator chose | What you see |
|---|---|
| **I pay for everyone** | **Provided by your admin**, and nothing to set up. *Your admin sets this up.* |
| **I pay, own allowed** | **Provided by your admin**, plus **Connect your own provider** if you prefer your own account. Your own connection then takes over for you. |
| **Everyone uses their own account** | *What would you like to chat with?* with **Sign in with ChatGPT** and **Paste an API key**. |

A connected section shows **Connected to** *the provider*, its status and the model:

| Status | Meaning |
|---|---|
| **Connected** | Working. |
| **Sign-in expired** | A ChatGPT sign-in ran out. **Sign in again** renews it. |
| **Signed out** | You signed out; the connection counts as none. |
| **Not reachable** | The provider did not answer or refused the key. **Replace key** fixes a key that stopped working. |

When your own connection breaks, YOUYA does not quietly switch you to the administrator's: you see why yours does not work instead.

**Disconnect** (or **Sign out** for ChatGPT) removes your connection. Your chats stay. **Open assistant** opens the chat straight from here.

Two switches for the assistant sit in the same section:

- **Map follows the assistant**: the trip map moves to where the assistant searches and suggests places.
- **Estimate costs**: with a restaurant or a ticket, the assistant suggests an estimated expense for the budget, as a card you confirm.

While the administrator pays, the section also shows how many of today's messages you have used.

If you saved your own AI parsing model before the shared connection existed, that older section still shows below; see [AI-Booking-Import](AI-Booking-Import).

## For administrators

> **Admin:** In **Admin → Addons**, the **AI Assistant**, **AI Parsing** and **MCP** addons share one **AI** tile: *One connection for the assistant and booking import. MCP lets other AI apps use YOUYA.* Switch the addons on there, then press **Set up AI**. See [Admin-Addons](Admin-Addons).

**Set up AI** opens one dialog with a tab per part. A tab shows only while its addon is on, and every change is saved at once.

### Connection

**Who pays** decides whose connection the assistant runs on:

| Choice | Effect |
|---|---|
| **I pay for everyone** | Everyone uses the connection below and cannot add their own. |
| **I pay, own allowed** (the default) | Everyone uses the connection below unless they connect their own. |
| **Everyone uses their own account** | Everyone connects their own provider. Nothing is charged to you. |

While you pay, **Connection for everyone** holds the instance's connection: an API key, a ChatGPT sign-in, or an **Own server**. An own server takes a **Server address**, an optional API key and a model; when AI Parsing already talks to a local model, the form is prefilled from it (*Taken over from AI Parsing.*). **Change** replaces the connection and **Remove connection** deletes it.

> Signing in with your own ChatGPT plan for everyone shares that plan with everyone on the server: their chats count against your plan. Check that your plan and OpenAI's terms allow this.

YOUYA reaches an own server through the guard meant for services on your own network, so a model server on the same machine or your LAN works without `ALLOW_INTERNAL_NETWORK`. The cloud providers go through the strict guard. See [Internal-Network-Access](Internal-Network-Access).

### AI Assistant

- **Messages per person per day**: the daily limit, 50 by default. *Only counts while you pay*, so it never limits someone on their own connection. The day ends at midnight UTC.
- **Keep chats**: how long conversations are kept, 30 days, 90 days (the default), 365 days or **Forever**. Older chats are deleted every night.
- **Web search**: on by default. The assistant may look things up on the web through the search of the provider it talks to. Works with ChatGPT, Anthropic and OpenRouter; the searches go only to that provider.

### AI Parsing

**Reads bookings with** chooses the model that reads imported booking files: the shared connection (marked **Shared**), or an **Own connection** used instead of it, such as a local Ollama. Under **Everyone uses their own account**, each person reads with their own connection, set up in their settings. For a local model the tab lists what is **Installed on the server**, with **Refresh**, and **Pull a recommended model**. Details are on [AI-Booking-Import](AI-Booking-Import).

### Where secrets are kept

API keys and ChatGPT sign-in tokens are stored encrypted with the server's encryption key and are never shown again. Rotating that key re-encrypts them; see [Encryption-Key-Rotation](Encryption-Key-Rotation). Saving and removing connections and changing the AI settings is recorded in the [Audit-Log](Audit-Log).

The demo account cannot connect a provider of its own.

## See also

- [AI-Assistant](AI-Assistant)
- [AI-Booking-Import](AI-Booking-Import)
- [MCP-Overview](MCP-Overview)
- [Admin-Addons](Admin-Addons)
- [User-Settings](User-Settings)
