/**
 * Builds every widget TREK ships into server/mcp-apps/<name>.html, where the
 * server reads them (src/nest/mcp-apps/mcp-apps.service.ts). The names come
 * from @trek/shared, the list the server serves and the tools point at, so a
 * widget is never served without being built. Needs shared built first.
 */
import { MCP_APP_WIDGETS } from '@trek/shared/mcp-apps';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(here, '..');
const target = path.resolve(workspace, '../server/mcp-apps');

fs.mkdirSync(target, { recursive: true });
for (const widget of MCP_APP_WIDGETS) {
  process.env.MCP_APP_WIDGET = widget;
  // One widget per build: the single-file plugin inlines exactly one entry.
  await build({ configFile: path.join(workspace, 'vite.config.ts'), logLevel: 'warn' });
  fs.copyFileSync(path.join(workspace, 'dist', widget, 'index.html'), path.join(target, `${widget}.html`));
  console.log(`[mcp-apps] ${widget}.html`);
}
