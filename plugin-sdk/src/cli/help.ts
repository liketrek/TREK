/**
 * Help, tiered.
 *
 * The old help was eleven commands in one flat list, one line each, with no order and no
 * per-command detail — `trek-plugin dev --help` fell through to the same flat list. So the only
 * description of any command was that one line, and nothing anywhere said which to run first.
 *
 * Two changes. The top-level lists THE PATH (create → dev → status → publish) and pushes the
 * other seven to an "Also" line: they are real commands, and an author who knows what `entry`
 * is can still reach for it, but nobody has to learn eleven things to publish a plugin. And
 * every command now has its own page, with what it does, when you would reach for it, and its
 * flags.
 */

export const VERSION_LINE = (v: string): string => `trek-plugin-sdk ${v}`;

/** The four commands that ARE the job. Everything else is a step one of these already does. */
export const PATH_COMMANDS = ['create', 'dev', 'status', 'publish'] as const;

/** Real, supported, and not what a newcomer needs to see first. */
export const OTHER_COMMANDS = ['validate', 'pack', 'shot', 'keygen', 'sign', 'entry', 'preflight', 'submit', 'release'] as const;

export interface CommandHelp {
  /** One line, for the top-level list. */
  summary: string;
  /** Usage line. */
  usage: string;
  /** What it does and — more usefully — when you would reach for it. */
  body: string;
}

export const COMMAND_HELP: Record<string, CommandHelp> = {
  create: {
    summary: 'scaffold a new plugin',
    usage: 'trek-plugin create [name] [--type integration|page|widget|trip-page] [--template blank|notification-channel]',
    body: `Scaffolds a plugin: manifest, server entry, README, and a client UI for anything that is not
an integration. With no name it runs a wizard that asks for the id, type, icon, permissions,
egress hosts and required addons.

The plugin it gives you RUNS immediately — \`dev\` and \`pack\` work — but it is not publishable
yet: the README is a template and there is no screenshot. That is deliberate, and \`status\` will
tell you exactly what is left.

  --type          integration  server-only: routes, hooks, background work
                  page         a full navigation page (sandboxed iframe UI)
                  widget       a dashboard widget (sandboxed iframe UI)
                  trip-page    a tab inside every trip (sandboxed iframe UI)
  --template      blank | notification-channel
  --author        author name for the manifest
  --description   one-line description (5-200 chars; the registry requires it)
  --permissions   "db:own db:read:trips"
  --egress        api.example.com,api.other.com
  --required-addons  budget,packing
  --interactive   force the wizard even when a name is given`,
  },

  dev: {
    summary: 'run it locally, hot-reloaded',
    usage: 'trek-plugin dev [dir] [--port 4317]',
    body: `Runs the plugin against a mock TREK host, with hot reload. It enforces the SAME permissions
your manifest declares, so an ungranted call throws PERMISSION_DENIED here exactly as it would in
production, and \`db:own\` is backed by a real SQLite file under .trek-dev/.

  /           a dashboard: your routes, your grants, what is wired up
  /preview    your UI in the themed, sandboxed frame TREK actually renders it in
  /ui         your UI raw, unframed
  /api/*      your routes
  /__dev/fire/<kind>   fire a job, a scheduled run, an event or a hook by hand

Binds 127.0.0.1 only. Editing server/ or client/ reloads.`,
  },

  status: {
    summary: "where am I? what's left?",
    usage: 'trek-plugin status [dir]',
    body: `The command to run when you are not sure what to do next.

Runs every check the TREK-Plugins registry enforces that can be answered without a network — which
is nearly all of them — and prints the whole journey as a checklist: what passes, what does not,
what is still to come, and the ONE command to run next.

It never fails. It is for orientation, not for gating; \`validate\` is the gate. Run it as often as
you like.`,
  },

  publish: {
    summary: 'release + open the registry PR',
    usage: 'trek-plugin publish [dir] --repo <owner/name> --tag <vX.Y.Z> [--sign]',
    body: `The whole release, in order:

  1. check       every registry gate that can be checked locally
  2. pack        build plugin.zip
  3. release     git tag, push, and cut the GitHub release with the artifact
  4. preflight   the gates that need the tag and the release to exist
  5. submit      open the PR against the TREK-Plugins registry

Step 1 comes first for a reason: a GitHub release is effectively immutable, because the registry
pins its sha256. If a check fails, NOTHING is packed, tagged, pushed or released — so you can fix
it and re-run against the same version.

In a terminal it OFFERS TO SIGN, and creates a key for you if you have none. A signature proves the
artifact came from you, not just that its bytes match what the registry saw. You can add signing
later — publishing unsigned now and signing at v1.4.0 breaks nobody — but you can never take it
back: once a plugin has shipped signed, TREK refuses an unsigned update to it. So back the key up.
Scripts are never prompted; pass --sign.

Needs git and an authenticated \`gh\`.

  --sign [key]      sign the artifact (default key: ~/.trek-plugin/signing.key)
  --registry o/n    a registry other than liketrek/TREK-Plugins
  --notes           release notes
  --draft           open the registry PR as a draft
  --force           overwrite an existing release's artifact. Breaks the sha256 pin for
                    everyone who already installed that version — only for a release that
                    was never merged into the registry.
  --no-checks       skip step 1. An escape hatch for a re-run; never right on a first publish.
  --no-preflight    skip step 4.`,
  },

  validate: {
    summary: 'check it against the registry gates',
    usage: 'trek-plugin validate [dir]',
    body: `The gate. Runs the same offline checks as \`status\` and exits non-zero if any of them would
be rejected by the registry. This is the form for scripts and CI; \`status\` is the form for humans.

A plugin that passes \`validate\` will pass every registry gate that does not require the tag and
the release to exist. Those four run in \`preflight\`.`,
  },

  pack: {
    summary: 'build plugin.zip',
    usage: 'trek-plugin pack [dir] [--out plugin.zip] [--json]',
    body: `Builds the exact plugin.zip the TREK installer expects, and prints its sha256 and byte size.

It refuses to pack a plugin that could not LOAD — a broken manifest, a missing server entry, a
native binary. It does not enforce the registry's publish gates (an unwritten README, a missing
screenshot), because packing is how you install a plugin into a local TREK to try it, and the docs
only matter when you ship.

  --json   the PackResult on stdout, for scripts`,
  },

  shot: {
    summary: 'capture docs/screenshot.png',
    usage: 'trek-plugin shot [dir] [--port 4317] [--out docs/screenshot.png] [--dark] [--no-serve]',
    body: `Boots the dev server, renders your plugin in the themed frame TREK uses, and writes a 1600×900
docs/screenshot.png.

The registry requires a screenshot that resolves to a real image, and the store card shows it. This
is the fastest way to have one.

Needs Playwright, which is NOT a dependency of this SDK (it ships a browser):

  npm i -D playwright && npx playwright install chromium

An \`integration\` plugin has no UI to render, so \`shot\` cannot help — screenshot the TREK surface
your plugin changes instead.

  --dark       render in TREK's dark theme
  --no-serve   shoot a dev server you are already running`,
  },

  keygen: {
    summary: 'create an Ed25519 signing key',
    usage: 'trek-plugin keygen [--key file]',
    body: `Generates a signing key at ~/.trek-plugin/signing.key. One key for all your plugins.

BACK IT UP. Signing is a one-way door: once a plugin has shipped signed, TREK refuses an unsigned
update — and one signed with a different key — on every instance that already has it. Losing the
key means you cannot ship an update to your own plugin without a maintainer override.`,
  },

  sign: {
    summary: 'print a signature for an artifact',
    usage: 'trek-plugin sign [zip] [--key file]',
    body: 'Prints the signature and public key for an artifact. Usually you want `publish --sign` instead.',
  },

  entry: {
    summary: 'print the registry entry JSON',
    usage: 'trek-plugin entry --repo <owner/name> --tag <vX.Y.Z> [--zip plugin.zip] [--merge entry.json] [--out file]',
    body: `Builds the TREK-Plugins registry entry from your manifest, your packed artifact and your git tag —
so the sha256, size, commitSha and downloadUrl all come out of one command instead of being
computed by hand.

\`publish\` does this for you. Reach for it directly only when you are assembling a PR by hand.

  --merge entry.json   prepend this version onto an existing entry (the update case)
  --sign [key]         sign the artifact and pin the author key
  --out file           write it instead of printing it`,
  },

  preflight: {
    summary: 'run the registry CI checks locally',
    usage: 'trek-plugin preflight [dir] --repo <owner/name> --tag <vX.Y.Z> [--entry file.json] [--all]',
    body: `Runs the registry's checks — including the ones that need the network: that your tag resolves to
the commit the entry pins, that the released artifact downloads and hashes to the pinned sha256,
that your plugin id is not bound to another GitHub owner, and that an update does not drop or
rotate a signing key you already published under.

\`publish\` runs this for you as step 4. Reach for it directly to check an entry you assembled by
hand, or to re-check a release you have already cut.

  --all   check every version in the entry, not just the newest`,
  },

  submit: {
    summary: 'open the registry PR',
    usage: 'trek-plugin submit [dir] --repo <owner/name> --tag <vX.Y.Z> [--registry o/n] [--draft]',
    body: `Forks the registry, writes registry/plugins/<id>.json, and opens the PR. Needs an authenticated
\`gh\`. \`publish\` does this for you as step 5.`,
  },

  release: {
    summary: 'pack + cut the GitHub release',
    usage: 'trek-plugin release [dir] --repo <owner/name> --tag <vX.Y.Z> [--sign] [--merge entry.json]',
    body: `Packs, cuts the GitHub release, and prints the registry entry — but does NOT open the registry PR.
For when you want to release now and submit later. \`publish\` is the whole thing.`,
  },
};

export function topLevelHelp(version: string): string {
  const pad = (s: string) => s.padEnd(9);
  const path = PATH_COMMANDS.map((c) => `    ${pad(c)}  ${COMMAND_HELP[c].summary}`).join('\n');
  return `${VERSION_LINE(version)} — build a plugin for TREK

  The path
${path}

  Also: ${OTHER_COMMANDS.join(' ')}
        \`trek-plugin help <command>\` for any of them

  New here?  trek-plugin create
  Lost?      trek-plugin status`;
}

export function commandHelp(command: string): string | undefined {
  const h = COMMAND_HELP[command];
  if (!h) return undefined;
  return `${h.usage}\n\n${h.body}`;
}
