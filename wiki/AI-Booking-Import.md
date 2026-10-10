# AI Booking Import

The **AI Parsing** addon gives TREK's booking import a second reader. When [KDE Itinerary](Reservations-and-Bookings#import-from-booking-confirmation) cannot make sense of a confirmation (a plain-text email, an unusual PDF layout, a vendor whose format it does not know) TREK hands the document to an AI model and turns the answer into a booking you check before it is saved. With a model that reads images, it also reads photos of tickets.

The addon is **off by default**. It works with a model running on your own hardware, so booking data never has to leave your server.

> **Admin:** turn on **AI Parsing** in [Admin-Addons](Admin-Addons), in the *Integration* group. Import then works even without the `kitinerary-extractor` binary: with no extractor, the model reads every uploaded file instead of only the ones Itinerary cannot. Installing the extractor is still the better setup, since structured tickets stay fast and predictable and the model stays a fallback. Set up a provider and a model before anyone uses it, though. The import button appears as soon as the addon is on, and with neither an extractor nor a model the import fails.

## How it fits with normal import

AI parsing backs KDE Itinerary up, it does not replace it:

1. Every uploaded file goes to KDE Itinerary first.
2. Only the files Itinerary returns **nothing** for are sent to the AI model.
3. Whatever the model finds opens in the normal editor, one booking at a time, for you to check and correct before it is saved.

Structured tickets keep being read the fast, predictable way, and the model only steps in for documents that would otherwise fail. With the addon off, import works exactly as before. On a server without the extractor there is nothing to back up, and every file goes straight to the model.

AI results are marked for review internally, but the mark never reaches the card: saving in the editor stores each booking as checked.

## Choosing a provider

The addon supports three providers:

| Provider | Runs where | Notes |
|----------|-----------|-------|
| **Local (Ollama)** | Your own hardware | No booking data leaves your network. Recommended for privacy; runs on a CPU. |
| **OpenAI** | OpenAI's API, or any **OpenAI-compatible** endpoint through a custom base URL | Needs an API key. |
| **Anthropic** | Anthropic's API | Needs an API key. **Reads PDFs natively, scans included.** |

> **Scanned PDFs:** local and OpenAI-compatible models get the document's *extracted text*. A scanned PDF has no text layer. When the model reads images, the first two pages are drawn as images and sent like a photo; otherwise those providers return nothing for it. **Anthropic** receives the PDF itself and reads scans either way.
>
> **Photos:** a photo (JPG, PNG, WEBP) goes to the model as an image, with every provider, as long as the model reads images. See [Photos](#photos).

## Admin: instance-wide configuration

Once the addon is on, a configuration panel appears right under it in [Admin-Addons](Admin-Addons):

> *Set instance-wide config (applies to all users). Leave blank to let each user configure their own provider.*

- **Provider**: Local · OpenAI-compatible, OpenAI, or Anthropic.
- **Base URL**: for every provider except Anthropic. It defaults to `http://localhost:11434/v1` for a local Ollama server and `https://api.openai.com/v1` for OpenAI. Any OpenAI-compatible endpoint goes here.
- **API key**: optional for a local server (the field says *(often not required)*), required for the cloud providers. It is stored **encrypted** and shown masked (`••••••••`) once saved; leaving it unchanged keeps the stored key.
- **Model**: the model id, for example `qwen3.5:4b`, `gpt-4o` or `claude-opus-4-8`.
- **Model reads images**: **Automatic**, **Yes** or **No**. With the Local provider, **Automatic** asks the Ollama server what the model can do (`/api/show`) and follows its answer. With OpenAI or Anthropic, **Automatic** means no. **Yes** and **No** apply as set, whatever the server or the model id says. Photos are only accepted when this comes out as yes.

A provider and model set here apply to **all users** and override their personal settings. Leave the panel blank to let every user bring their own model (see below).

### Pulling a local model

With the **Local** provider selected, the panel manages your Ollama server directly:

- **Installed on the server** lists the models Ollama already has, with a **Refresh** button. Click a model to select it.
- **Pull a recommended model** downloads a model with a live progress bar. The recommended one is **Qwen3.5 4B** (`qwen3.5:4b`, 3.4 GB, 256K context): small and quick on a CPU-only host, with "thinking" switched off automatically, under the Apache-2.0 licence. It reads images, so with **Model reads images** on Automatic it accepts photos. A PDF with a text layer reaches it as extracted text, a scanned one as its first two pages drawn as images. When the download finishes, the model is selected.

Any other model already on the server can be selected too, or typed in by hand.

## Per-user configuration

When an admin leaves the instance configuration blank, each user can set up their own model under **Settings → Integrations → AI parsing**. The section only appears while the addon is on:

> *Choose the AI model used to extract bookings from uploaded files. This applies only when your administrator has not configured a model for the whole instance.*

There you pick a **Provider** (only **OpenAI** or **Anthropic**), a **Model** id and an **API key**, which is stored encrypted; leave the key blank to keep the current one. There is no personal Base URL. The address the server calls is instance configuration, so a local Ollama model can only be set up by an admin on the addon. The server refuses a personal base URL or a personal `local` provider from anyone, admins included.

The **Model reads images** switch decides whether photos are offered and sent to your model, both for the booking import and for [Scan receipt](Budget-Tracking#scanning-a-receipt) in Costs. PDFs are not affected: only Anthropic gets the raw PDF, every other provider the extracted text.

> **Precedence:** a model set by the admin for the whole instance always wins. Personal settings only count when there is none.

## Importing a booking with AI

The upload is the normal booking import; the model simply works behind it.

1. In the trip, open the **Bookings** or **Transports** tab and click **Import booking confirmations** (the download icon in the bar). On a tab without bookings, the button reads **Import from file**.
2. Drop your files onto the upload area: EML, PDF, PKPass, HTML or TXT, up to 5 files of 10 MB each. When the model reads images, photos (JPG, PNG, WEBP) are accepted too. Click **Import**.
3. The dialog closes and a **background widget** in the bottom right corner shows *Parsing files…* with a count. You can keep working meanwhile; the widget survives a reload and follows you to other pages.
4. When parsing is done, click **Import** in the widget.
5. Each booking found opens **pre-filled in its editor**, the reservation editor or the transport editor, one after the other. Check it, correct it, and save. Nothing is stored before you do.

![Edit Reservation dialog, the same editor an imported booking opens in for review](assets/BookingEditor.png)

### When nothing is found

If a job ends with *No reservations could be extracted from the uploaded files.*, the widget offers **Try AI parsing**. It sends the same files again in force-AI mode: KDE Itinerary is skipped and every file goes straight to the model. The button only appears on an empty result, and never on a run that was already forced. Without an instance or personal model, the retry fails with the error shown in the widget.

It is a retry, not another route. On a normal import the model has already seen every file Itinerary returned nothing for, so it is mostly worth pressing when the addon or the model was set up after the job started. A document Itinerary *did* read cannot be pushed through the model: as soon as a parse finds any booking, the widget shows **Import** and no retry. Fix such a booking in the editor instead.

### What gets filled in and created

The model is asked for the complete booking, **every leg of a multi-segment flight** included. When you save, TREK ties each booking into the trip:

- **Fields**: the booking code, dates and times, and depending on the type the seat, class, platform, total price and currency. Hotels bring their address, rental cars their company, restaurants and events their venue with phone number and website.
- **Places**: only a **hotel** becomes a trip place. The editor reuses a trip place with a matching name; otherwise it looks up the address you checked and creates a place, so the pin appears on the map. Transport stops are located while the files are parsed and stored as the booking's **From** and **To**, not as trip places. A stop that could not be located is listed as a warning in the widget and dropped when you save, so fix it in the editor first. Restaurant and event venues arrive as the booking's address only; the editor can link a place the trip already has, but it never creates one.
- **Accommodations**: a hotel booking creates the stay on the check-in and check-out days.
- **Linked cost**: when the [Costs addon](Budget-Tracking) is on and the booking has a price, a linked expense is created in the currency the price was quoted in. Without the addon, the price stays on the booking.
- **Source document**: the uploaded file is attached to the booking.

## Photos

When the model reads images (see **Model reads images** above), the import takes photos as well: a phone picture of a paper train ticket, a boarding pass, a hotel confirmation. The upload dialog then says *Photos (JPG, PNG, WEBP) are read by the AI model.*, and a photo goes through the same background job, review and linked cost as any other file.

- A photo always goes to the model. KDE Itinerary is not asked, since it reads documents, not pictures.
- A scanned PDF without a text layer is read the same way: its first two pages are drawn as images and sent to the model.
- A photo is shrunk to 1600 px on its longest side before it is sent. A model pays for every pixel and does not read a ticket better at twelve megapixels; a local `qwen3.5:4b` on a CPU took several times longer on the same ticket at full size.
- A photo over 40 megapixels is refused, with a warning naming the file, before it is even decoded. So is a WEBP over 3.5 MB: TREK shrinks JPG and PNG but cannot shrink a WEBP, and the providers take no more than that.
- HEIC is not accepted. A phone's photo picker hands over a JPEG anyway.
- When the model does not read images, the dialog does not offer photos, and the server refuses one sent anyway with *The configured AI model does not read photos*.

Photographing a receipt for the Costs tab is covered in [Budget-Tracking](Budget-Tracking#scanning-a-receipt).

## Good to know

- **Nothing to migrate**, and everything is set up in the UI. The only environment variable the addon reads is `LLM_TIMEOUT_MS` (see [Environment-Variables](Environment-Variables)).
- **Local models can be slow.** On a CPU-only host one booking can take from tens of seconds to a couple of minutes. TREK gives a model 15 minutes per document by default; `LLM_TIMEOUT_MS` raises or lowers that. Uploads are parsed **one at a time** per user, so several files wait in line rather than run in parallel.
- **Parse jobs are kept for about 10 minutes** after they finish. Start the review within that time.
- **Privacy**: with the Local provider nothing leaves your network. With OpenAI or Anthropic, the document's text (for Anthropic the PDF itself, and for either a photo) is sent to that provider.
- **API keys are never sent back in plain text.** They are encrypted at rest and only ever shown masked.

## See also

- [Reservations-and-Bookings](Reservations-and-Bookings), the import this addon extends
- [Transport-Flights-Trains-Cars](Transport-Flights-Trains-Cars)
- [Admin-Addons](Admin-Addons)
- [Budget-Tracking](Budget-Tracking), for linked costs and receipt scans
