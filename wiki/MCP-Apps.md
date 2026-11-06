# MCP Apps (interactive views)

Some MCP hosts can draw a small interactive view next to a tool's answer. Claude and ChatGPT both support this, through the MCP Apps extension (`io.modelcontextprotocol/ui`). TREK ships these views for a few of its tools. A host that supports them shows the view. Every other host reads the same answer as text, and nothing about it changes.

## What you see

| Tool | View |
|---|---|
| `list_trips` | Your trips as cards you can scroll through, each with its dates. **Open in TREK** opens the trip in your browser. **Ask about this trip** tells the assistant which trip you mean. |
| `get_trip_overview` | One trip as a card: its dates, how many days, places, bookings and travelers it has, and its next days with their stops. **Show this day** asks the assistant about that day for you. |
| `list_packing_items` | The packing list as a checklist. Tick items off right in the view. The tick goes through your own MCP connection, so it needs the `packing:write` scope and is audited like any other call. Filter by bag. **Show all** unfolds a list longer than a dozen items. |
| `get_weather` | The day's forecast, or the climate average for a day too far ahead, as a card. |
| `search_place` | The places found, as cards with their address and rating. **Add to trip** asks the assistant to add that place, naming it by its map id only. **Tell the assistant about this place** lets the assistant know which one you mean without sending a message. |
| `list_budget_items`, `get_budget_per_person` | The budget as a card: the total and a bar per category, or each traveler's share and what they paid. Switching between the two reads the other side through your connection. Read only. |
| `list_todos` | The trip's to-dos as a checklist, the open ones first, each with its due date. Ticking one off goes through your connection like the packing list, so it needs the `todos:write` scope. |

More views follow the same pattern. The tool still answers in text and with a structured result, and the view draws that result. A view never fetches anything on its own. It changes a trip only when you tick or press something in it, and then through your own MCP connection and its scopes.

## Switching them off

An administrator can turn the views off for the whole instance under **Admin → Addons → AI → MCP → Interactive views**. With the switch off:

- Tools stop pointing hosts at a view, so connected clients get text only.
- The view documents are no longer listed as resources.

The switch only shows while the MCP addon is on, and it starts out on. Changes apply to new MCP sessions, so a client may need to reconnect before it sees them. Each change is recorded in the audit log as `admin.mcp_apps`.

## How it works

- Each view is one self-contained HTML document, served as a `ui://trek/<name>.html` resource with the MIME type `text/html;profile=mcp-app`.
- The host runs the document in a sandboxed frame. Its content security policy only allows images from your TREK address, and the view makes no network requests of its own.
- The tool's result carries your TREK address in its `_meta` (`trek/appUrl`), so the text content stays exactly what a host without views reads.
- Views follow the host's light or dark theme and its language. The view texts are translated into every language TREK supports.

## For self-hosters

The Docker image includes the views. When you build from source, `npm run build` at the repository root builds them into the server's mcp-apps folder before the server starts. A checkout that never built them still works: its tools answer as text alone, the same as with the switch off.

## Related

- [MCP-Tools-and-Resources](MCP-Tools-and-Resources)
- [MCP-Setup](MCP-Setup)
- [Admin: MCP Tokens](Admin-MCP-Tokens)
