# PWA Icon Design and Release

This document records TREK's approved PWA icon direction and the release
procedure required to make icon changes visible on installed devices.

## Approved direction

TREK uses an **instant-photo vacation memory** as its PWA icon:

- a translucent near-white instant-photo frame;
- a simplified fresh-green island and palm tree;
- a sunny-yellow setting sun;
- a uniform pale warm-cream background.

The composition belongs to the shared PWA-suite family: one large physical
object, high-key neon-glass/soft-gel material, smooth continuous surfaces,
subtle three-quarter depth, generous launcher-safe margins, and no text.

The approved source of truth is:

```text
client/public/icons/icon-master-1024.png
```

Do not regenerate or reinterpret this master during routine builds. Treat an
explicitly approved replacement as a new frozen master.

## Design rationale

The instant photo communicates both sides of TREK without becoming a generic
transportation symbol:

- the tropical scene conveys the emotional outcome—vacation and discovery;
- the photo object suggests preserving and sharing trip memories;
- the broad frame, palm, and sun remain recognizable at launcher size;
- green and yellow feel warmer and more leisure-oriented than the rejected
  blue/purple directions;
- one primary object avoids the clutter caused by combining several travel
  symbols.

### Lessons from rejected directions

- A written style recipe is not a substitute for the approved suite masters.
  Match their material, camera, scale, lighting, and visual weight.
- A continuous curved map route with a round endpoint can read as a snake at
  small sizes. Use separated itinerary marks if that motif is revisited.
- A centered umbrella on a circular pedestal reads as a table lamp. Beach
  context requires an angled pole and an irregular sand anchor.
- Suitcases, backpacks, passports, journals, and postcards communicate travel
  logistics, but were less distinctive or emotionally resonant for TREK.
- A globe with one pin was the strongest travel-focused alternative, but the
  instant photo better balances planning, vacation, and memories.
- Color should have explicit semantic roles. Too many accent colors compete;
  a dominant hue plus one supporting hue is usually sufficient.
- "Start from scratch" means replacing the rejected core silhouette, not
  cosmetically restyling it.

## Generated asset pipeline

`client/scripts/generate-icons.mjs` produces all served PNGs from the approved
1024px master. It runs automatically before the client production build.

Current generated files use the `polaroid-v1` identity:

```text
apple-touch-icon-polaroid-v1-180x180.png
icon-polaroid-v1-192x192.png
icon-polaroid-v1-512x512.png
icon-polaroid-v1-maskable-512x512.png
favicon-polaroid-v1-32x32.png
```

Generated PNGs are ignored by Git. The 1024px master is explicitly exempted
and must remain versioned so a clean checkout can reproduce the family.

Generate and build with:

```bash
cd client
node scripts/generate-icons.mjs
npm run build
```

Verify that:

1. each generated file has the declared pixel dimensions;
2. `dist/manifest.webmanifest` lists the regular and maskable icons;
3. `dist/index.html` references the current Apple touch icon and favicon;
4. no active client source still references the retired `/icons/icon.svg`.

## iOS cache invalidation

iOS and Safari cache home-screen icons aggressively. Replacing the bytes at a
stable URL may leave both the Add to Home Screen preview and installed icon on
the previous artwork.

For every approved redesign, increment the identity in **all** generated
filenames and references, for example:

```text
polaroid-v1 -> polaroid-v2
```

Update these together:

- `client/scripts/generate-icons.mjs`;
- the Apple touch icon and favicon in `client/index.html`;
- manifest icon paths in `client/vite.config.js`;
- any in-app icon references.

A query string is less reliable than a genuinely new pathname for launcher
cache invalidation. Users with an already installed PWA may still need to
remove and add it again after deployment.

## Deployment verification

A successful local build does not prove that the running PWA changed. The
actual production service must be rebuilt or updated through the repository's
existing deployment path.

After deployment, verify the served application—not only `client/dist`:

1. `/api/health` returns a healthy response;
2. `/` contains the new versioned `apple-touch-icon` pathname;
3. `/manifest.webmanifest` contains the expected regular and maskable paths;
4. every referenced icon returns HTTP 200;
5. the served Apple icon checksum equals the locally generated checksum;
6. Add to Home Screen shows the new artwork after reopening/refreshing Safari.

Example checksum comparison:

```bash
shasum -a 256 client/public/icons/apple-touch-icon-polaroid-v1-180x180.png
curl -fsS https://YOUR-TREK-HOST/icons/apple-touch-icon-polaroid-v1-180x180.png \
  | shasum -a 256
```

Do not claim the icon is shipped until the deployed HTML, manifest, icon bytes,
and service health have all been verified.

## Approval workflow for future redesigns

1. Inspect current product tokens and the approved PWA-suite masters.
2. Generate exactly one candidate at a time.
3. Keep material, camera, scale, safe area, and background discipline fixed.
4. Freeze explicitly approved leaders; do not mutate them during comparisons.
5. On rejection, restart from the approved family master and latest feedback.
6. After approval, install the new master, bump the filename identity, generate
   every size, build, test, deploy, and verify the served files.
