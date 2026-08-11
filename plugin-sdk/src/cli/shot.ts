/**
 * trek-plugin shot — capture docs/screenshot.png.
 *
 * The screenshot is the one registry gate an author cannot fake, cannot satisfy by writing more
 * words, and — until now — could not do anything about from the CLI at all. The scaffold's README
 * linked `./docs/screenshot.png`, nothing created it, `validate` passed anyway (it only looked for
 * an image LINK), and the truth arrived from CI after the release was immutable.
 *
 * So: boot the dev server, render the plugin in the same themed, sandboxed frame TREK uses
 * (`/preview`), and write a 1600×900 PNG. One command, and the hardest gate is done.
 *
 * Playwright is NOT a dependency of this SDK — it is ~300 MB of browser and most authors never
 * run this. It is imported lazily, and if it is absent we say exactly how to get it rather than
 * failing with a module-resolution stack trace.
 */
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { readJsonFile } from './json.js';

/** The store card is 16:9 and crops the edges — 1600×900 leaves margin and stays under a MB. */
const WIDTH = 1600;
const HEIGHT = 900;

export interface ShotOptions {
  port?: number;
  out?: string;
  /** Screenshot an already-running dev server instead of booting one. */
  noServe?: boolean;
  /** Render in TREK's dark theme instead of light. */
  dark?: boolean;
}

export class ShotError extends Error {}

const portOpen = (port: number): Promise<boolean> =>
  new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1');
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => resolve(false));
  });

async function waitForPort(port: number, timeoutMs = 30_000): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await portOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

/**
 * Playwright, or a message that tells you how to get it.
 *
 * Resolved from the PLUGIN's directory first, not ours. A bare `import('playwright')` resolves
 * relative to this file — which works when the SDK is a devDependency of the plugin (node walks up
 * into the plugin's node_modules), and silently does not when the SDK is installed globally. The
 * author would have run exactly the `npm i -D playwright` we told them to and still be told it was
 * missing. So ask the plugin where its own modules live, and only then fall back to ours.
 */
async function loadChromium(pluginDir: string): Promise<{ launch: (o?: unknown) => Promise<Chromium> }> {
  type PW = { chromium: { launch: (o?: unknown) => Promise<Chromium> } };

  const fromPlugin = createRequire(path.join(pluginDir, 'package.json'));
  for (const resolve of [() => fromPlugin.resolve('playwright'), () => 'playwright']) {
    try {
      const specifier = resolve();
      const pw = (await import(specifier.startsWith('/') ? pathToFileURL(specifier).href : specifier)) as unknown as PW;
      if (pw.chromium) return pw.chromium;
    } catch {
      /* try the next resolution */
    }
  }

  throw new ShotError(
    'trek-plugin shot needs Playwright, which is not installed.\n\n' +
      '  npm i -D playwright && npx playwright install chromium\n\n' +
      'It is not a dependency of the SDK — it ships a whole browser, and most authors never run this.\n' +
      'If you would rather not install it: take a 16:9 screenshot yourself (1600×900 is ideal — the\n' +
      'store card crops the edges) and save it as docs/screenshot.png.',
  );
}

// Minimal structural types — we never import Playwright's, so it stays a soft dependency.
interface Page {
  goto(url: string, o?: unknown): Promise<unknown>;
  emulateMedia(o: { colorScheme: 'light' | 'dark' }): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
  screenshot(o: { path: string; fullPage?: boolean }): Promise<unknown>;
}
interface Browser {
  newPage(o?: unknown): Promise<Page>;
  close(): Promise<void>;
}
type Chromium = Browser;

export async function runShot(dir: string, opts: ShotOptions = {}): Promise<{ out: string; width: number; height: number }> {
  const root = path.resolve(dir);
  const manifestPath = path.join(root, 'trek-plugin.json');
  if (!fs.existsSync(manifestPath)) throw new ShotError(`no trek-plugin.json in ${dir} — is this a plugin directory?`);

  const manifest = readJsonFile<{ type?: string; id?: string }>(manifestPath);
  const type = String(manifest.type ?? '');

  // An integration plugin has no UI to render. Refusing outright would be unhelpful — it still
  // NEEDS a screenshot, it just isn't one we can take. Say what to shoot instead.
  if (type === 'integration') {
    throw new ShotError(
      'An integration plugin has no UI, so there is nothing for the dev server to render.\n\n' +
        'It still needs a screenshot — the registry requires one and the store card shows it. Capture the\n' +
        'TREK surface your plugin CHANGES: the notification it sends, the badge it adds to a place, the row\n' +
        'it contributes to a table, its settings page under Admin → Plugins.\n\n' +
        'Save it as docs/screenshot.png (16:9, 1600×900 is ideal — the card crops the edges).',
    );
  }

  const port = opts.port ?? 4317;
  const out = path.resolve(root, opts.out ?? path.join('docs', 'screenshot.png'));
  const chromium = await loadChromium(root);

  let dev: ChildProcess | undefined;
  let browser: Browser | undefined;
  try {
    if (!opts.noServe) {
      if (await portOpen(port)) {
        throw new ShotError(
          `port ${port} is already in use.\n` +
            `If that is your dev server, pass --no-serve to shoot it. Otherwise pick another port with --port.`,
        );
      }
      // Reuse the real dev server rather than reimplementing the preview frame — a screenshot of
      // something that isn't what `dev` serves would be worse than no screenshot at all.
      //
      // Spawn the CLI, not dev.js: dev.js only EXPORTS runDev, it has no entry block, so running
      // it as a script imports a module and exits — and the only symptom is a 30-second wait.
      dev = spawn(process.execPath, [path.join(import.meta.dirname, 'trek-plugin.js'), 'dev', root, '--port', String(port)], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
      // Keep the child's stderr. If it dies (a plugin that throws on load, a port clash), that
      // message is the whole diagnosis — swallowing it leaves the author staring at a timeout.
      let devErr = '';
      dev.stderr?.on('data', (b: Buffer) => { devErr += b.toString(); });

      if (!(await waitForPort(port))) {
        throw new ShotError(
          `the dev server did not come up on port ${port} within 30s.` +
            (devErr.trim() ? `\n\n${devErr.trim()}` : '\n\nRun `trek-plugin dev` yourself to see why.'),
        );
      }
    } else if (!(await portOpen(port))) {
      throw new ShotError(`--no-serve was passed but nothing is listening on port ${port}`);
    }

    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 2 });
    await page.emulateMedia({ colorScheme: opts.dark ? 'dark' : 'light' });
    // chrome=0 strips the dev toolbar and the "runs sandboxed at an opaque origin" note, and
    // centres the plugin. Without it the store card would show the theme picker of the tool that
    // took the screenshot, which is not a picture of anybody's plugin.
    const theme = opts.dark ? 'dark' : 'light';
    await page.goto(`http://localhost:${port}/preview?chrome=0&theme=${theme}`, { waitUntil: 'networkidle' });
    // The plugin's own UI loads inside a sandboxed iframe and then fetches. Give it a beat, or we
    // photograph a skeleton — a screenshot of a loading spinner passes every gate and helps nobody.
    await page.waitForTimeout(1200);

    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.screenshot({ path: out });
    return { out, width: WIDTH, height: HEIGHT };
  } finally {
    await browser?.close().catch(() => {});
    dev?.kill();
  }
}
