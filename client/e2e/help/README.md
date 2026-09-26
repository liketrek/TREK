# Help-center media

Every picture the help center shows is made here, by Playwright, against the real
app. Nothing is drawn or cropped by hand, so a new screen gets pictures in exactly
the same style by following the same path.

## The style, in one place

Everything visual is fixed in `guide.ts` and `promote.mjs`; change it there, never
in a script.

| What | Where | Value |
|---|---|---|
| Viewport | `guide.ts` `VIEWPORT` | 1920 × 1080, device scale 2 (`playwright.config.ts`, project `help-media`) |
| Step picture frame | `guide.ts` `frameFor` | 16:10, at least 960 px wide, 64 px padding around the target, centred on it, never larger than the largest 16:10 frame the viewport holds (1728 × 1080). A target wider than that, a full-width row for instance, is therefore cut at the sides, and that is accepted: the narrow frame is the format of the whole library, and a picture that widens to fit one row is at a different magnification from the one beside it. A target taller than the frame is anchored at its top, so a long section shows its heading |
| Ring around the target | `guide.ts` `ring` | 3 px in the app's `--accent`, 12 px radius, 6 px outside the element, the rest dimmed 30 %. A white hairline goes outside the ring and the badge only where the surface measured behind them has too little contrast against the accent, which is the lightbox and the other near-black overlays |
| The step's number | `guide.ts` `ring` | a 28 px disc in the accent on the ring's top-left corner, outside it. Where that spot is not inside the frame, which is every target wider than the frame, it moves inside far enough to clear the frame's edge. The number is part of the picture; the panel numbers the step again beside it and puts nothing on top of the picture |
| Raster tiles | `guide.ts` `settle` → `showLoadedTiles` | loaded tiles are forced visible before every shot. Leaflet fades a tile in over 200 ms and takes the progress from `+new Date()`, and the clock is pinned, so without this the satellite imagery and every raster basemap are a grey rectangle although each tile came back 200 |
| Drag & drop | `guide.ts` `ringDrag` (a step with `dropTo`) | source ringed, destination ringed dashed, a bowed arrow from the one to the other, both undimmed |
| Hover | `captureGuide` | the target is hovered before the shot (tooltips, hover-only buttons show); `hover` overrides where the centre is wrong |
| Result picture | `guide.media.result` | the full frame after the last step, pointer parked in the corner |
| Hero (screen overview) | `captureHero` | the full frame of the screen as the reader finds it |
| Output | `promote.mjs` | PNG → WebP quality 84; steps 1440 px wide, heroes and results 1920 px; into `public/help-media/<guide-id>/step-<n>.webp`, `result.webp`, `ctx/<screen-id>.webp` |
| No videos | | stills only, by decision |

The app's own appearance is the default theme, English, light mode, the seeded
demo data (`e2e/screenshots/seed.ts`) plus the fixtures in `fixtures.ts`. Do not
change the theme, the language or the zoom for a picture.

## How a screen gets its pictures

1. Register the screen and its guides in `src/help/contexts/<screen>.ts` and
   `src/help/registry.ts`; write the English texts as a block in
   `shared/src/i18n/en/help.ts` (`// ── Screen: <id>`). Guide ids are global: one id,
   one picture directory, so never reuse an id from another screen
   (`registry.test.ts` refuses duplicates).
2. Write `e2e/help/<screen>.guide.ts`: one `GuideScript` per guide, exactly one
   `StepAction` per registered step, `start` that opens the screen, `cleanup` that
   puts the seed back. A step's `target` is the element the text tells the reader
   to use; `prepare` gets there, `act` does what the text says.
3. Run `npm run help:media -- <screen>.guide.ts` (own ports 5183/3011, fresh
   database, the seed, then the file). Fix until every guide passes; a failing
   step is a text that no longer matches the UI.
4. Look at the pictures in `e2e/.tmp/help-media/`, then `node e2e/help/promote.mjs`.
5. Translate the block into all 22 locales (`i18n:parity:strict` is the gate) and
   run `src/help/registry.test.ts`, which checks every promised picture is on disk.

## What the fixtures may look like

The documents and pictures the guides upload are drawn in `fixtures.ts`, because
no real person's paperwork and no photograph may live in this repository. They
still have to look like something a traveller would really put into a trip, or
the picture teaches the reader that the feature is a toy.

- **A document is a document.** `drawPdf` takes an issuer band, a title, a
  reference line, a table of labelled fields and a footer, which is the shape of
  every confirmation, ticket and voucher. Four lines of Helvetica on white is not
  a document; it was the first attempt and it was thrown out.
- **A picture is a graphic, not a painting of a photograph.** A hand-drawn
  market or landscape reads as clip art at any size, however it is shaded, and it
  was tried three times. What works is the kind of image people actually upload:
  a map screenshot with a pin and a search field, a booking confirmation in a
  browser window, a printed network map. Those are drawings in reality too, so a
  drawing of them is honest.
- **Every date comes from `e2e/dates.ts`**, never from a calendar typed into a
  fixture. A confirmation whose check-in is two days before the trip's last day
  keeps making sense next month.
- The names of the files are part of the seed: guides find their row by name, so
  renaming a fixture means renaming it in the guide too.

## Changing the style

`guide.ts` is shared by every picture, so anything changed there is a property of
the whole library, not of the guide in front of you. Before changing it, work out
which pictures actually come out different and re-render exactly those, one
`--grep` away:

```bash
npm run help:media -- --grep "pictures: (files-trash|files-preview)$|hero: trip-files"
```

The staging directory answers most of those questions without a browser, because
the frame is in the file:

```bash
# which pictures were taken at the frame's maximum, i.e. cut at the sides
python -c "import struct,os;[print(r,f,struct.unpack('>II',open(os.path.join(r,f),'rb').read(24)[16:24])) for r,_,fs in os.walk('e2e/.tmp/help-media') for f in fs if f.endswith('.png')]"
```

A change that alters every picture (the frame, the ring's geometry, the viewport)
is a full run of about four hours on one worker. It is not a thing to do twice,
so look at three or four pictures from a subset run before starting it.

## Rules learned the hard way

- Never run `npx prettier` over `client/` sources: `client/.prettierrc` says
  `semi: true` and the sources are written without semicolons, so it rewrites
  whole files. Nothing in CI formats the client.
- A killed run leaves its server holding 3011 and 5183, and the next run dies
  with "port is already used". Free them first:
  `Get-NetTCPConnection -LocalPort 3011 -State Listen | %{ Stop-Process -Id $_.OwningProcess -Force }`.
- The browser's clock is pinned to the picture day (`PICTURE_DAY`). Anything in
  the app or a library that animates from the wall clock therefore never
  finishes: Leaflet's tile fade is the one that bit, and the fix is in `settle`.
  A new picture that comes out empty or grey is worth suspecting of the same.
- `promote.mjs` converts the whole staging directory, so a guide that was not
  re-run keeps the picture it had; staging is the source of truth for what gets
  published, not the last run.
- Never edit `shared/` while a media run is going: the watcher rebuilds `dist`
  mid-run and the pictures show raw i18n keys.
- Never `npm run build --workspace=shared` while `npm run dev` is running; restart
  the dev server if it happened.
- Each run boots a fresh server (~2 min); batch fixes, and dump the accessibility
  tree once (`page.locator('body').ariaSnapshot()`) instead of guessing locators.
- A plugin installed by a run lives in `server/data/plugins/`; the dev server
  imports it on its next restart. Guides that install one uninstall it in `cleanup`.
- The trip's last day is the run day by construction (`e2e/dates.ts`: every
  seeded date is an offset from `E2E_PICTURE_DAY`, which `run.mjs` fixes to today
  once for the whole run), so the plan opens on today, the trip's last and empty
  day; `openTrip` in `trip-shared.ts` selects day 1 and closes its details panel.
  A guide that has to find a date by its label builds it with the same helpers
  (`short`, `long`, `pickerLabel`, `dotted`) instead of writing a calendar date.

## How the panel shows them

`src/components/Help/HelpGuideView.tsx` and `HelpHome.tsx` hold the other half of
the style, and the two have to agree:

- A step picture goes into a 16:10 box, a hero and a result picture into a 16:9
  one, and all three with `object-contain`. Never `object-cover`: the pictures
  are already framed, and covering crops them a second time, which took the
  sides off every wide one.
- Nothing is drawn over a picture in the panel. The step is numbered beside the
  text and the number is in the picture itself.
- A click opens the lightbox, which shows the picture at its own size.

## Before you promote

Look at three or four of the new pictures, not the list of passing tests:

- The ring is in the picture and visible against what is behind it.
- The number is in the picture.
- What the step's text names is in the frame.
- A map shows a map, not a grey rectangle.
- An uploaded document looks like a document someone would upload.

## The guides that show another service

A few guides picture TREK talking to something outside it: AirTrail (flights
into the Transports tab), Dawarich (the recorded route on the map, countries
and wishes in the Atlas), a document store (Nextcloud on the Files tab) and the
booking extractor (confirmations into Bookings and Transports). Their fixtures
in `external.ts` fill each service themselves through its API, so the pictures
do not depend on what happens to be in it; they need its address and key from
`e2e/help/media.env` (copy `media.env.example`, not committed). Without the
file those guides fail loudly at their first step and every other guide runs
as before.

- Every address has to be the machine's LAN address: the server's SSRF guard
  refuses loopback whatever `ALLOW_INTERNAL_NETWORK` says, and that flag has to
  be `true` in the same file for a private network to be reachable at all.
- AirTrail: any instance with one user and an API key from Settings > Security.
  The fixture puts four flights into that account.
- Dawarich: any 1.15 instance with a user and their API key; add the LAN address
  to its `APPLICATION_HOSTS`, and give it a reverse geocoder (Nominatim works)
  or the Atlas dialog finds no countries. The fixture uploads a synthetic
  recording of the trip and of the year before it (`dawarich-track.ts`).
- Nextcloud: an app password. The fixture keeps a folder under `/Reisen` with
  two documents, and the guide binds the trip to it.
- The extractor: `KITINERARY_EXTRACTOR_PATH` must point at a program the
  server can run with one file argument. On Linux that is the package's binary
  (`libkitinerary-bin`); on Windows, a small executable that runs it inside the
  TREK Docker image (`docker run --rm -v <dir>:/in:ro --entrypoint
  /usr/local/bin/kitinerary-extractor <image> /in/<file>`) and answers
  `--version` by itself.
