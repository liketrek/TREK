# Publishing a Plugin

Plugins are distributed from a static registry — the
[TREK-Plugins](https://github.com/liketrek/TREK-Plugins) GitHub repo. There is
no upload server and no account: you host the code in your own public GitHub repo,
attach a built `plugin.zip` to a release, and list it with a pull request.

The `trek-plugin` CLI (shipped in the `trek-plugin-sdk` package) does almost all
the mechanical work — you rarely hand-type a hash, size, commit, or JSON field.

## The short version — one command

Get the plugin green locally (`trek-plugin status` will tell you what is left), commit
and push it to its public GitHub repo, then:

```bash
npx trek-plugin-sdk publish --repo you/trek-plugin-flight-tracker --tag v1.0.0
```

`publish` runs the whole release, in five steps and in **this order**:

1. **check** — every registry gate that can be checked locally
2. **pack** — build `plugin.zip`
3. **release** — git tag, push, and cut the GitHub release with the artifact attached
4. **preflight** — the gates that need the tag and the release to exist
5. **submit** — open the PR against the registry

The order is the point. A GitHub release is effectively immutable: the registry pins
its sha256, so overwriting the bytes breaks the checksum for everyone who already
installed that version. So the local gates run **first** — if one fails, nothing is
packed, tagged, pushed or released, and you can fix it and re-run against the same
version.

And when a **later** step fails — a preflight or PR problem after the release is
cut — `publish` rolls back exactly what that run created: the GitHub release, the
pushed tag, and the local tag, so the same tag is free to re-run against once you
have fixed the problem. Anything that existed before the run is never touched, and
`--keep-release` opts out (the error then prints the manual cleanup commands). A
leftover tag from an earlier failed run — one with no release that no longer points
at `HEAD` — is recognised as debris and **moved to your current commit** rather than
silently releasing the stale one. And for a stranded state you already have,
`trek-plugin unrelease <vX.Y.Z> --repo you/repo` deletes the release, the remote
tag, and the local tag in one go — after checking the published registry index and
**refusing, with no override, to touch a version that is actually published** (its
artifact is immutable; ship a new version instead).

It prints the PR URL at the end. In a terminal it **offers to sign** the release (and
creates the key if you have none); scripts and CI are never prompted and pass `--sign`.
`--no-checks` skips step 1 and
`--no-preflight` skips step 4 — escape hatches for a re-run, never right on a first
publish. It needs `git` and an authenticated `gh`.

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

What `create` gives you runs and packs, but it does **not** pass `validate`: the README
is a template and there is no screenshot. Those are the two things only you can write.

## 2. Get it green locally

```bash
npx trek-plugin-sdk status         # where am I? what's left? — never fails
npx trek-plugin-sdk validate .     # the same checks, but it exits non-zero
```

`status` and `validate` run the **same registry gates** at two different depths.
`status` prints them as a checklist grouped by stage (Manifest, Code, Docs, Release,
Repo) and names the one command to run next; it is for orientation, so it never fails.
`validate` is the gate — same checks, exit code — and is the form for scripts and CI.

Between them they now catch, **offline**, nearly everything the registry rejects for:

- an `icon` that isn't a real lucide name (TREK falls back to `Blocks` silently, so a
  typo is invisible locally — but CI rejects it)
- a README missing any of the four required sections, still carrying scaffold
  placeholders, or under **400 characters** of real prose
- a screenshot that doesn't resolve to a file on disk (not just a link in the README —
  the file has to be there)
- a permission your manifest declares but the README never explains
- a `name`, `description` or `author` outside the registry's length limits, or a name
  that mixes Latin with Cyrillic/Greek look-alikes (a homoglyph spoof)
- an `egress[]` host with no matching `http:outbound:<host>` permission — TREK builds
  the network allow-list and the iframe CSP from those permissions only and never reads
  `egress[]`, so such a host is silently unreachable at runtime
- a permission TREK doesn't know — the SDK and registry CI check against the same
  63-entry list the host enforces, so a typo'd permission fails here instead of at
  install on every instance

Only **six** gates genuinely need the network, because none of them can be answered from
your working tree: that the tag resolves to the commit the entry pins, that the manifest at
that commit matches the entry, that the README at that commit still passes the quality gate,
that the released artifact downloads and hashes to the pinned sha256 (and verifies against
your key), that your plugin id isn't bound to another GitHub owner, and that an update
doesn't drop or rotate a signing key you already published under. Those run in `preflight`
— step 4 of `publish`.

### Capture the screenshot

```bash
npm i -D playwright && npx playwright install chromium   # once — not an SDK dependency
npx trek-plugin-sdk shot                                 # --dark for the dark theme
```

`shot` boots the dev server, renders your plugin in the same themed frame TREK uses,
and writes a 1600×900 `docs/screenshot.png`. An `integration` plugin has no UI to
render, so `shot` can't help — screenshot the TREK surface your plugin changes instead.

Commit the screenshot. The registry resolves it **at the pinned commit**, so an image
that exists only in your working tree fails CI even though `status` was green.

## 3. Pack

```bash
npx trek-plugin-sdk pack .                 # writes ./plugin.zip
npx trek-plugin-sdk pack . --out dist.zip  # custom output path
npx trek-plugin-sdk pack . --json          # machine-readable result
```

`pack` builds `plugin.zip` in the installer's exact layout and prints the **sha256**
and **size** you'd otherwise compute by hand. It refuses to pack a plugin that could
not *load* — a broken manifest, a missing `server/index.js`, a native binary — but it
deliberately does **not** enforce the publish gates (an unwritten README, a missing
screenshot), because packing is also how you sideload a plugin into a local TREK to try
it, and the docs only have to be there when you ship. `validate` is what gates those.
It ships
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
`sha256`, `size`, `apiVersion`, and **`trek`** — your manifest's range, verbatim.
That range is the entry's only compatibility field: it is what TREK gates installs
and activation on. (The older `minTrekVersion`/`maxTrekVersion` are **deprecated**
and no longer emitted — the first merely restated the range's lower bound, and the
second is *inclusive*, so it cannot express `<4.0.0` at all. Entries published
before `trek` existed may still carry them.) `entry` refuses to build an entry for a
manifest with no usable `trek` range, because TREK would refuse to install it. Flags: `--zip`
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

## 6. Preflight — the checks that need the release to exist

Before you open the PR, run the registry's remaining CI checks against your pushed
release, so you catch what CI would reject without a review round-trip:

```bash
npx trek-plugin-sdk preflight --repo you/trek-plugin-flight-tracker --tag v1.0.0
```

`preflight` runs everything `validate` runs, plus the six gates that genuinely need
the network: the tag resolves to the pinned `commitSha`; the **manifest** at that commit
matches the entry; the **README** at that commit passes the quality gate; the released
artifact downloads, hashes to the pinned **sha256**, carries **no native binaries** and
verifies against your key; your plugin id is not bound to a different GitHub owner; and
an update does not drop or rotate a signing key you already published under
(`--allow-key-change` declares a deliberate rotation — see "Rotating your signing key").

Re-grading the manifest and the README *at the commit* is not redundant with the local
pass: an author who writes the README and forgets to commit it has a green tree and a
red tag, and the tag is what CI grades. `--entry <file.json>` checks a hand-written
entry, `--all` checks every version rather than just the newest. A green preflight
predicts a green CI.

## 7. Open the registry PR

The fast path — `submit` does the whole fork/branch/commit/PR dance for you:

```bash
npx trek-plugin-sdk submit --repo you/trek-plugin-flight-tracker --tag v1.0.0
```

It forks [TREK-Plugins](https://github.com/liketrek/TREK-Plugins) (once),
**fast-forwards your fork from the registry** (a diverged fork warns with the
`gh repo sync --force` command to reset it, and the submit continues), branches off
the registry's current `main`, writes (or, for an update, merges into)
`registry/plugins/<id>.json`, pushes, and opens the PR — printing its URL. Add
`--draft` for a draft PR, `--registry <owner/name>` for a mirror. (Requires `gh`,
authenticated.)

**By hand instead:** fork the registry, add your generated file as
`registry/plugins/<id>.json`, and open a PR back to `main`. Add **only** that
file — `dist/` is generated on merge, and CI rejects manual edits to it.

The entry follows [`schema/plugin-entry.schema.json`](https://github.com/liketrek/TREK-Plugins/blob/main/schema/plugin-entry.schema.json);
[`schema/example-entry.json`](https://github.com/liketrek/TREK-Plugins/blob/main/schema/example-entry.json)
is the canonical shape. `size` is **required** (a common omission), as are
`commitSha`, `downloadUrl`, `sha256`, `trek`, `apiVersion`, and
`nativeModules: false` on every version — all of which `trek-plugin entry` fills
in for you. CI rejects an entry whose `trek` disagrees with the manifest at
`commitSha` (and, on a legacy entry that still carries a `minTrekVersion`, one
whose floor disagrees with that range).

## What CI enforces

CI runs `scripts/validate-entry.mjs` and `scripts/check-readme.mjs` on every
changed `registry/plugins/*.json`. Nearly every rule below is a pure function of your
`trek-plugin.json` and `README.md`, so `trek-plugin validate` checks it offline before
you have tagged anything — you should never learn any of this from CI.

**Entry** (`validate-entry.mjs`): valid schema · `id` matches the filename and
the slug pattern `^[a-z][a-z0-9-]{2,39}$` and is not one of the reserved ids
`registry`/`install`/`rescan` (they collide with admin API route segments — CI and
the install loader both refuse them) · your `id` is bound to your GitHub
owner on first registration, so nobody can repoint it later (owner changes need a
maintainer override) · homoglyph/mixed-script name check · `versions[]` sorted
newest-first · the release tag exists
and resolves to `commitSha` · manifest parity at that commit (`id`, `version`,
`type`, `apiVersion`, and `nativeModules` must not be `true`) · every declared
permission is on TREK's known-permission list (or a valid `http:outbound:<host>`) ·
**the downloaded
artifact's SHA-256 matches the pin** and its size is within bounds · **no native
binaries** in the archive · `egress[]` present (and no bare `*`) when
`http:outbound` is declared.

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

**The easy way — let the SDK do it** (dependency-free Ed25519, no minisign needed).
In a terminal, `publish` **proposes signing**: it explains the tradeoff, offers to
create the key if you have none, and signs. You never have to know `keygen` or
`--sign` exist. Scripts and CI are never prompted — they pass `--sign`:

```bash
npx trek-plugin-sdk publish --repo you/repo --tag v1.2.0 --sign
```

`--sign` signs the exact artifact bytes and fills both `authorPublicKey` (entry)
and `signature` (version) for you. If the plugin was already published signed,
`publish` **refuses an unsigned release at step 1** — and, since SDK 1.7.0, one
whose signing key's *identity* differs from the published `authorPublicKey` —
before anything is packed, tagged or released, because a GitHub release is
immutable and learning this at step 4 would have burned the tag. **Back up
`~/.trek-plugin/signing.key`** — losing it means a full key rotation (see below),
which strands every install until its admin re-trusts you.

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

Signing is **opt-in**, and it is a one-way door you may walk through **late**. An
entry without `authorPublicKey`/`signature` installs on `sha256` alone; **going
unsigned → signed later breaks nobody**, because nothing is pinned until a signed
version installs — adding a key at v1.4.0 is a real option, not a lost cause. The
registry does require every version signed once your key appears in the entry, and
the SDK handles that for you: your first signed update **retro-signs the older
versions** (each pinned artifact is downloaded, verified against its `sha256`, and
signed with the same key — a byte mismatch refuses, since that artifact no longer
matches its pin). What
you can never do is go back: once a plugin has shipped signed, an *unsigned* update
is refused (`SIGNATURE_MISSING`) on every instance that already has it, and a key
*rotation* needs a registry maintainer override (`allow-key-change`) plus an admin
re-trust on each instance — see the next section. So sign whenever you like — but
back the key up.

### Rotating your signing key

A rotation — lost key, compromised machine, planned hygiene — is the one signing
change with a sanctioned path, and since SDK 1.7.0 the SDK drives its whole
artifact half. Two flows, one rule: a rotated entry must have **every** version
re-signed with the new key, because TREK verifies whichever version it installs
against the entry's single `authorPublicKey`.

**Without shipping a version:**

```bash
npx trek-plugin-sdk rotate-key            # from the plugin dir; --id <plugin-id> from elsewhere
# --key <file> for a key not at ~/.trek-plugin/signing.key
# --out entry.json writes the rotated entry for a hand-made PR instead of opening one
```

It fetches your published registry entry, downloads every pinned artifact,
verifies each against its pinned `sha256`, re-signs all of them with the new key
(all-or-nothing — one unfetchable or tampered artifact aborts the whole rotation),
swaps `authorPublicKey`, and opens a registry PR titled as a rotation. (If the key
was merely *lost*, `keygen` first — the default path is free again. A
*compromised* key still on disk needs `--key` for the new one; `keygen` refuses to
overwrite.)

**As part of a release:**

```bash
npx trek-plugin-sdk publish --repo you/repo --tag v1.3.0 --sign --allow-key-change
```

Step 1 accepts the new key, the update merges onto your existing entry with the
older versions re-signed under the new key, and the PR title carries
"(key rotation)". The same `--allow-key-change` flag exists on
`entry`/`preflight`/`submit`/`release` for hand-assembled flows.

Either way, the SDK can only do the artifact half. The PR body says the rest out
loud, and neither step is a formality:

1. a **registry maintainer** must apply the `allow-key-change` label — CI refuses
   a changed `authorPublicKey` without it, and authors can't self-serve the label;
2. **every admin** who already installed the plugin sees `SIGNATURE_KEY_CHANGED`
   (with both key fingerprints, to verify the new one with you out of band) and
   must re-trust the new key before their instance receives another update.

Without `--allow-key-change`, a differing key is still refused everywhere —
deliberately, because the *accidental* version of this (publishing from a second
machine whose freshly-generated key isn't the one you published under) wants the
original key restored, not a rotation.

## Updating

Bump `version` in the manifest, commit, and run `publish` again with the new tag — it
detects the existing entry and prepends the new version, newest-first. By hand: re-`pack`,
cut a new `vX.Y.Z` release, then fold the new version onto your existing entry with
`--merge`:

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
