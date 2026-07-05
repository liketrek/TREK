# Publishing a Plugin

Plugins are distributed from a static registry — the
[TREK-Plugins](https://github.com/mauriceboe/TREK-Plugins) GitHub repo. There is
no upload server and no account: you host the code in your own public GitHub repo,
attach a built `plugin.zip` to a release, and list it with a pull request.

The `trek-plugin` CLI (shipped in the `trek-plugin-sdk` package) does almost all
the mechanical work — you rarely hand-type a hash, size, commit, or JSON field.

## The short version — one command

Commit and push your plugin to its public GitHub repo, then:

```bash
npx trek-plugin-sdk publish --repo you/trek-plugin-flight-tracker --tag v1.0.0
```

`publish` runs the whole release: **pack** → **tag + GitHub release** →
**preflight** (the registry CI checks, locally) → **open the registry PR**. If
preflight finds a problem it stops *before* submitting, so a broken entry never
becomes a doomed PR. It prints the PR URL at the end. Sign it with `--sign`.

The individual steps below still exist for when you want one by hand — `release`
(pack → GitHub release → entry), `preflight`, and `submit` (opens the PR) — or
`entry --out registry/plugins/<id>.json` to write the file and open the PR
yourself.

## 1. Host and build your plugin

Put your plugin in a **public GitHub repo** (convention: `trek-plugin-<id>`).
`create-trek-plugin` scaffolds the layout:

```bash
npx trek-plugin-sdk create flight-tracker --type widget   # integration | page | widget | trip-page
```

A publishable plugin has, at the repo root:

- `trek-plugin.json` — the manifest (see [[Plugin Development|Plugin-Development]])
- `package.json` — the CommonJS marker (`"type": "commonjs"`), with the SDK as a devDependency at most
- `server/index.js` — the built server entry (required)
- `client/` — the built frontend (only for `page`/`widget`/`trip-page` plugins)
- `README.md` — filled in, with a real screenshot (the quality gate is strict — see below)
- `docs/screenshot.png` — the store card image, committed to the repo

## 2. Validate

```bash
npx trek-plugin-sdk validate .
```

`validate` runs the manifest checks plus a light layout/README sanity pass:
it fails if `trek-plugin.json` is invalid or `server/index.js` is missing, and
warns if the directory name doesn't match the plugin `id`, the README has no
screenshot, or the README still contains scaffold placeholders. This is a
**subset** of what CI runs — CI additionally verifies the release, the artifact's
SHA-256, and the README over the network — so a clean local run predicts a clean
CI run but doesn't replace it.

## 3. Pack

```bash
npx trek-plugin-sdk pack .                 # writes ./plugin.zip
npx trek-plugin-sdk pack . --out dist.zip  # custom output path
npx trek-plugin-sdk pack . --json          # machine-readable result
```

`pack` validates first, then builds `plugin.zip` in the installer's exact layout
and prints the **sha256** and **size** you'd otherwise compute by hand. It ships
only what the runtime needs — `trek-plugin.json`, `README.md`, `LICENSE`,
`package.json`, and the `server/` and `client/` trees — and drops `node_modules`,
`.git`, source maps and `.ts` sources. It **refuses native binaries**
(`.node`, `binding.gyp`, `prebuilds/`) and enforces the same size limits as the
installer (25 MB per file, 50 MB total, 4000 entries).

> **`docs/` is intentionally not shipped.** The store fetches your
> `docs/screenshot.png` straight from the repo at the pinned commit, so keep it
> committed to GitHub but out of the zip — `pack` handles this for you.

The `plugin.zip` `pack` produces is also the artifact for **sideloading**: hand it
to an instance admin (or drag it onto **Admin → Plugins**) to install without the
registry at all — no PR, no review, no SHA-256/signature pin. Sideloaded plugins
are flagged as such and never auto-update, so the registry PR below is still the
path for anything you want discoverable and updatable. See [[Plugins|Plugins]].

## 4. Create the GitHub release

Tag `vX.Y.Z` where `X.Y.Z` **equals** `version` in your manifest, and attach the
packed `plugin.zip` as a release asset:

```bash
gh release create v1.0.0 plugin.zip --repo you/trek-plugin-flight-tracker
```

Prefer the uploaded `plugin.zip` asset — it's the exact bytes you packed and the
registry pins their hash. Don't rely on GitHub's auto-generated source archives;
they aren't the installer layout and their bytes aren't stable.

## 5. Generate the registry entry

```bash
npx trek-plugin-sdk entry \
  --repo you/trek-plugin-flight-tracker \
  --tag v1.0.0 \
  --out registry/plugins/flight-tracker.json
```

`entry` reads your manifest and `plugin.zip` and emits the complete entry —
deriving `commitSha` (from `git rev-parse <tag>^{commit}`), `downloadUrl`,
`sha256`, `size`, `apiVersion`, and `minTrekVersion` (the lower bound of the
manifest's `trek` range, e.g. `">=3.2.0 <4.0.0"` → `3.2.0`). Flags: `--zip`
(default `plugin.zip`), `--commit <sha>` to override commit resolution, `--asset`
to name a differently-named release asset, `--merge` for updates (below), and
`--out` to write a file.

### One-shot: `release`

```bash
npx trek-plugin-sdk release . --repo you/trek-plugin-flight-tracker --tag v1.0.0
```

`release` does **pack → `gh release create` → entry** in one go and prints the
entry to stdout. It accepts `--out`, `--notes`, `--commit`, and `--merge`. (It
requires the `gh` CLI, authenticated.)

## 6. Preflight — run the CI checks locally

Before you open the PR, run the exact registry CI checks against your pushed
release, so you catch what CI would reject without a review round-trip:

```bash
npx trek-plugin-sdk preflight --repo you/trek-plugin-flight-tracker --tag v1.0.0
```

`preflight` mirrors both CI scripts over the network: the tag resolves to the
pinned `commitSha`, the manifest at that commit matches the entry, the released
artifact's **sha256 + size** match and it carries **no native binaries**, and the
README passes the quality gate (required sections, real prose, a resolving
screenshot, permission parity). It also accepts `--entry <file.json>` to check a
hand-written entry. A green preflight predicts a green CI.

## 7. Open the registry PR

The fast path — `submit` does the whole fork/branch/commit/PR dance for you:

```bash
npx trek-plugin-sdk submit --repo you/trek-plugin-flight-tracker --tag v1.0.0
```

It forks [TREK-Plugins](https://github.com/mauriceboe/TREK-Plugins) (once),
branches off the current `main`, writes (or, for an update, merges into)
`registry/plugins/<id>.json`, pushes, and opens the PR — printing its URL. Add
`--draft` for a draft PR, `--registry <owner/name>` for a mirror. (Requires `gh`,
authenticated.)

**By hand instead:** fork the registry, add your generated file as
`registry/plugins/<id>.json`, and open a PR back to `main`. Add **only** that
file — `dist/` is generated on merge, and CI rejects manual edits to it.

The entry follows [`schema/plugin-entry.schema.json`](https://github.com/mauriceboe/TREK-Plugins/blob/main/schema/plugin-entry.schema.json);
[`schema/example-entry.json`](https://github.com/mauriceboe/TREK-Plugins/blob/main/schema/example-entry.json)
is the canonical shape. `size` is **required** (a common omission), as are
`commitSha`, `downloadUrl`, `sha256`, `minTrekVersion`, `apiVersion`, and
`nativeModules: false` on every version — all of which `trek-plugin entry` fills
in for you.

## What CI enforces

CI runs `scripts/validate-entry.mjs` and `scripts/check-readme.mjs` on every
changed `registry/plugins/*.json`.

**Entry** (`validate-entry.mjs`): valid schema · `id` matches the filename and
the slug pattern `^[a-z][a-z0-9-]{2,39}$` · your `id` is bound to your GitHub
owner on first registration, so nobody can repoint it later (owner changes need a
maintainer override) · homoglyph/mixed-script name check · the release tag exists
and resolves to `commitSha` · manifest parity at that commit (`id`, `version`,
`type`, `apiVersion`, and `nativeModules` must not be `true`) · **the downloaded
artifact's SHA-256 matches the pin** and its size is within bounds · **no native
binaries** in the archive · `egress[]` present (and no bare `*`) when
`http:outbound` is declared. Any unique slug is fine **except `registry`,
`install` and `rescan`**, which the install loader refuses (they collide with
admin API route segments).

**README** (`check-readme.mjs`, fetched at the pinned commit): must exist at the
repo root, contain the sections **What it does / Screenshots / Permissions /
Setup**, carry **at least one screenshot that resolves to a real image**
(a relative `docs/screenshot.png` is resolved against the commit), have real
prose (**≥ 400 characters** after stripping headings/code/images/tables), contain
no leftover scaffold placeholders, and **explain every permission** your manifest
declares (each permission string must appear in the README).

## Provenance & integrity

- `commitSha` pins the exact source the maintainer reviewed (git tags are movable).
- `sha256` pins the exact artifact bytes TREK will run (release assets are mutable).

TREK verifies the downloaded bytes against `sha256` and refuses to install on a
mismatch. A `reviewedAt` date on your entry means a maintainer looked at that
exact commit — it is **not** an ongoing guarantee. `reviewedAt` and `boundOwner`
are maintained by CI on merge; don't set them yourself.

## Signing your releases (optional, recommended)

`sha256` proves the bytes are the ones the *registry* vouches for. An author
signature additionally proves the bytes were signed by **you**, so a compromised
registry can't ship attacker code under your name. The entry schema allows two
optional fields — `authorPublicKey` on the entry and `signature` on each version.
TREK verifies the signature offline (minisign / Ed25519, no external service) and
pins your key on first install (trust-on-first-use): a later release signed with a
different key is refused until an admin re-trusts it.

**The easy way — let the SDK do it** (dependency-free Ed25519, no minisign needed):

```bash
npx trek-plugin-sdk keygen                                     # once: writes ~/.trek-plugin/signing.key
npx trek-plugin-sdk release --repo you/repo --tag v1.2.0 --sign
npx trek-plugin-sdk submit  --repo you/repo --tag v1.2.0 --sign
```

`--sign` signs the exact artifact bytes and fills both `authorPublicKey` (entry)
and `signature` (version) for you; `submit --sign` even refuses to publish an
update signed with a *different* key than the one already listed, so you can't
lock yourself out by accident. **Back up `~/.trek-plugin/signing.key`** — losing
it means you can't ship signed updates.

**By hand with minisign**, if you prefer:

```bash
minisign -G            # writes minisign.key (keep secret) + minisign.pub
```

Put the base64 payload line from `minisign.pub` in your entry as
`authorPublicKey` (stable across versions), then per release:

```bash
minisign -Sm plugin.zip   # writes plugin.zip.minisig
```

Add the base64 line from `plugin.zip.minisig` to that version as `signature`,
next to its `sha256`:

```jsonc
{
  "id": "flight-tracker",
  "authorPublicKey": "RWQ…base64 minisign public key…",
  "versions": [{
    "version": "1.2.0",
    "sha256": "3b2a…",
    "signature": "RUR…base64 .minisig payload…"
  }]
}
```

Signing is **opt-in**: an entry without `authorPublicKey`/`signature` installs on
`sha256` alone. But once a plugin has shipped signed, an *unsigned* update is
refused — don't drop the signature between versions.

## Updating

Bump `version` in the manifest, re-`pack`, cut a new `vX.Y.Z` release, then fold
the new version onto your existing entry with `--merge`:

```bash
npx trek-plugin-sdk entry --repo you/trek-plugin-flight-tracker --tag v1.1.0 \
  --merge registry/plugins/flight-tracker.json \
  --out registry/plugins/flight-tracker.json
```

`--merge` prepends the new version (keeping the array newest-first) and preserves
the rest of the entry. PR the updated file. Instances see the update on their next
registry poll; applying it is always an explicit admin action, and if a new
version requests **more** permissions the admin must re-approve — see
[[Plugin Permissions|Plugin-Permissions]].
