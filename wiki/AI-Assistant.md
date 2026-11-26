# AI Assistant

The assistant is a chat inside YOUYA that knows your trip. Ask it what is still open, let it plan a day, find somewhere to eat near the hotel or turn a booking confirmation into a booking. It reads your plan the way you see it and answers in words, cards and places on the map. **Nothing in your trip changes until you confirm it**: every change the assistant wants to make arrives as a card with **Apply** and **Discard**, and an applied change can be undone.

The assistant runs on an AI model from a provider you or your administrator connect, such as Anthropic, OpenAI, Gemini, OpenRouter, a ChatGPT plan, or a model server of your own. Setting that up is explained in [AI-Connections](AI-Connections).

> **Admin:** The assistant is the **AI Assistant** addon. It is off by default. In **Admin → Addons** it sits on the **AI** tile together with AI Parsing and MCP; switch it on there and set up the connection with **Set up AI**. See [AI-Connections](AI-Connections#for-administrators) and [Admin-Addons](Admin-Addons).

## Where the assistant runs

| Where | What it is about | What it may change |
|---|---|---|
| In a trip | That trip: its days, places, bookings, transports, costs, lists, tours, road trip and collab | Everything you may change in the trip yourself, after you confirm |
| Outside a trip (the home chat) | All your trips at once, plus your Atlas, Vacay and journals | Nothing. It reads, compares and answers, and hands you over to a trip's own chat |
| In [YOUYA Studio](TREK-Studio#the-book-assistant) | One journey and its photo book | The book's pages, layouts and theme, after you confirm |

The assistant appears only once a connection you can use is set up. Until then there is no button for it, so nobody is shown a feature they cannot use.

## Opening it

- **On the desktop**, the **Assistant** button in the navigation bar opens and closes it, and in the trip planner a round button floats at the bottom of the screen. **Ctrl+K** (**⌘K** on a Mac) does the same anywhere, except while a dialog is open.
- **On a phone**, a trip's **More** sheet starts with **Ask YOUYA** (*Plan with the assistant*), and outside a trip **Assistant** leads the **More** list of the bottom bar. The dashboard has an assistant button at the top as well. See [Mobile-App](Mobile-App).
- **From the planner**, a right click on a place offers **Find an alternative** and **Restaurant nearby**, and one on a day offers **Plan this day** and **Plan for rain**. The place details have an **Ask** button. Each of these opens the chat with that place or day as its subject and sends the question straight away.

On the desktop the assistant is a window floating over the app. Drag it by its head, resize it from any edge or corner, and let go near a corner to make it settle there. A double click on the head switches between a compact and a large window, and **Alt+arrow keys** move it (**Alt+Shift+arrow keys** resize it). The window remembers where it was. Closing it only hides it: an answer still being written carries on, and the round button breathes until it is done. **Escape** first stops an answer, then closes the window.

## Asking

Type into **Ask anything about** *your trip* and press **Send**. While an answer is being written, **Stop** ends it.

- **Suggestions.** An empty chat offers questions that fit the moment, such as *Plan the first days for me* before the trip, *What's on today?* during it, or *Sum up our trip* after it.
- **Mentions.** Type **@** to pick a day, a place or a booking of the trip, and the assistant knows exactly which one you mean. You can also drag a place from the sidebar or the map into the chat.
- **Steps.** While it works, the chat shows what the assistant is doing (*Reading your plan*, *Searching for places*, *Checking the weather*) and folds the steps away once the answer is there.
- **Ask next.** Under an answer come a few follow ups that fit it, for example *Only cheaper ones* or *Plan the next day the same way*. One click sends it.
- **Web search.** When the administrator allows it and the provider supports it (ChatGPT, Anthropic and OpenRouter), the assistant can look things up on the web, such as reviews, opening times or events. The answer then lists its **Sources**.

**Recent chats** in the window's head lists your earlier conversations, and **New chat** starts another. Your chats are your own: other trip members never see them. A chat you no longer want goes with **Delete chat** in the **More options** menu.

### Trip notes

The assistant can remember things about a trip for every later conversation: *we eat vegetarian*, *we travel with children*, *no early mornings*. When it keeps something, the chat shows **Noted for this trip:** and the note. **Edit trip notes** in the **More options** menu opens the full list, with a row of **Common wishes** to tick and a field for your own words. Trip notes are yours, per trip, and are not shown to other members.

### Hints

The assistant looks over the plan on its own and lists what is **Worth a look**: two things that overlap, a place that is closed on the day you planned it or opens too late, a long gap in a day, a leg that is far or tight, nights with nowhere to stay yet, and bookings that are not on any day. Each hint is one click away from a question about it, and **Hide this hint** puts one away. The launcher shows how many hints are waiting; **Stop showing hints** in the **More options** menu switches them off.

## Suggested changes

When the assistant wants to change something, it does not do it. It shows a **Suggested changes** card:

1. Each row names what would happen (**Add place**, **Move to another day**, **Add expense**, **Add booking**, and so on) and the values it would set. Untick **Include this change** on a row to leave it out.
2. **Compare on the map** switches between **Before** and **After**, and **Show on map** opens the planner on the change. Planned days come with a day preview (*Moves here*, *Comes off*), a check whether the day still **Fits the time**, and for longer plans an overview of **The days of this plan**.
3. **Apply** (or **Apply** *count*) makes the changes, with your own permissions, exactly as if you had made them by hand. **Discard** drops them.

While a card is waiting, the chat asks you to **Apply or discard the changes above first** before it goes on. A suggestion nobody decides on expires after 24 hours and then reads **No longer available**.

**Undo** on an applied card takes the change back again, and **Undo all** takes back the whole card. Undo is offered for 15 minutes. When someone changed the same thing in the meantime, YOUYA does not overwrite their work: the row reads *Changed in the meantime. Please adjust it by hand.*

On a trip you can only view, the assistant still answers questions, but it says so and suggests no changes.

## What the answers show

Besides text, an answer can carry cards that work like the rest of YOUYA:

- **Places found**: the places the assistant found, with **Add to trip**, **On map**, opening hours (**Open now** or **Closed**) and the distance from the previous stop. A place already planned reads **Already in your trip**. On a tour, **Add to tour** puts one in as a stop.
- **Weather** for the days the question is about, with the chance of rain.
- Cards for days, bookings, costs, packing items, to-dos, tours, journal entries and photo book pages, each with a way to open the item in YOUYA.
- With **Map follows the assistant** on, the trip map moves to where the assistant searches and suggests places.
- With **Estimate costs** on, a suggested restaurant or ticket comes with an estimated expense for the budget, as a card you confirm.

Both switches are in **Settings → Integrations** under the AI connection, see [AI-Connections](AI-Connections#your-settings).

## Files and bookings

**Attach a booking** under the chat field, or a file dropped on the chat, hands the assistant a booking confirmation, an email, a PDF, an image or a wallet pass of up to 10 MB.

- YOUYA's own booking reader looks at it first, the same one [AI-Booking-Import](AI-Booking-Import) uses. The bookings it finds come back as cards to add.
- When it finds none, the chat says why and offers what to do next: **Keep it in Files**, **Create a booking from it**, **Attach it to a booking or an expense** or **What is in the file?**
- The file's contents go to the AI provider only after you confirm a card, **Let the assistant read the file**, which names where it is sent. Keeping the file in the trip's Files is a card too.
- Route files (GPX and similar) can become a tour, see [Tours](Tours).

A file attached in the chat is kept for seven days so the conversation can come back to it, then it is deleted. A file you kept in Files stays there like any upload.

## Sharing an answer

**Share in the trip chat** posts an answer to the trip's [Collab chat](Collab-Chat), marked as coming from the assistant. The preview shows what everyone on the trip will see, and **Add the changes you applied** lists what you applied. This needs the trip chat to be switched on.

## The home chat

Outside a trip the assistant is about **Your travels**: *Which trip is next, and what is still open?*, *Compare my upcoming trips*, *How many countries have I visited?* or *How many vacation days do I have left this year?* It reads your trips but changes none of them. When a question belongs to one trip, it offers **Continue in a trip chat**, and **Chat about one trip** in the head opens a trip's own chat directly. **Back to all trips** returns.

## What it can and cannot do

The assistant works with your rights and no more. It can do what you could do through [MCP](MCP-Overview) yourself, with a few exceptions it never gets: it cannot delete a trip, create share or invite links, read the contents of your files without your consent, or use plugin tools.

- One answer may take up to 30 model steps. A very large request stops there and asks *That was a lot at once. Shall I continue?*, and **Continue** goes on.
- The administrator can limit how many messages each person sends per day while the instance pays for the model. Your settings then show how many of today's messages you have used, and at the limit the chat says *That's it for today. See you tomorrow.*
- The assistant needs a connection. Offline it says so and waits.

## Privacy

The first time you chat, a banner names the provider your messages go to. **What gets shared?** spells it out: your messages and the trip details the assistant reads, like places, days and bookings. Not your password, your files or your other trips. The provider handles this under its own privacy terms.

Chats are deleted after the number of days the administrator chose (90 by default); the chat list says how long they are kept. Deleting a chat removes it at once.

## The assistant and other AI features

| Feature | What it is |
|---|---|
| AI Assistant (this page) | A chat inside YOUYA that suggests changes you confirm |
| [AI-Booking-Import](AI-Booking-Import) | Reads booking files that YOUYA's own reader cannot. It can share the assistant's connection |
| [MCP](MCP-Overview) | Lets an AI app outside YOUYA, such as Claude or Cursor, work with your trips |

## See also

- [AI-Connections](AI-Connections)
- [YOUYA-Studio](TREK-Studio#the-book-assistant)
- [Mobile-App](Mobile-App)
- [Admin-Addons](Admin-Addons)
- [MCP-Overview](MCP-Overview)
