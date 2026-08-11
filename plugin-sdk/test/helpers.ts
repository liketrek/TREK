import fs from 'node:fs';
import path from 'node:path';

/**
 * Take a scaffolded plugin and do to it what a real author does before publishing: write the
 * README and commit a screenshot.
 *
 * This is exactly the set of things the registry demands and the scaffold deliberately leaves
 * undone, so it doubles as executable documentation of the gap between "it runs" and "it ships".
 * A test that needs a PUBLISHABLE plugin calls this; a test that needs a FRESH one does not, and
 * the difference between them is the contract.
 *
 * Every permission in the manifest gets a line, because the registry requires each one to be
 * explained by name, and the prose has to clear 400 real characters (headings, tables, links and
 * code fences are stripped before it is measured, so a big table will not carry you).
 */
export function makePublishable(dir: string): void {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'trek-plugin.json'), 'utf8')) as {
    name?: string;
    permissions?: unknown;
  };
  const permissions: string[] = Array.isArray(manifest.permissions) ? manifest.permissions.map(String) : [];

  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
  // A 1×1 PNG. The gate is "the file the README links actually exists", not "it is beautiful".
  fs.writeFileSync(
    path.join(dir, 'docs', 'screenshot.png'),
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
  );

  fs.writeFileSync(
    path.join(dir, 'README.md'),
    `# ${manifest.name ?? 'Plugin'}\n\n` +
      '![screenshot](./docs/screenshot.png)\n\n' +
      '## What it does\n\n' +
      'This plugin adds a genuinely useful capability to TREK, and this paragraph exists to clear the four hundred\n' +
      'character floor the registry puts on real prose. It explains, in ordinary sentences, what a traveller gets\n' +
      'out of installing it and why they might want to. The registry strips headings, tables, links and code fences\n' +
      'before it measures, so padding the file out with a permissions table will not help; it has to be words.\n\n' +
      '## Screenshots\n\n' +
      'The image above shows the plugin running inside a trip.\n\n' +
      '## Permissions\n\n' +
      '| Permission | Why |\n|---|---|\n' +
      permissions.map((p) => `| \`${p}\` | Needed so the plugin can do its job. |`).join('\n') +
      '\n\n## Setup\n\nInstall it from the plugin store and enable it. There is nothing else to configure.\n\n' +
      '## License\n\nMIT.\n',
  );
}
