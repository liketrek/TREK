import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Builds ONE widget (named by MCP_APP_WIDGET) into a single self-contained HTML
 * file: scripts, styles and translations inlined, since a host serves the
 * document from a sandbox that may load nothing else. scripts/build.mjs runs
 * this once per widget and moves the result into server/mcp-apps/.
 */
const widget = process.env.MCP_APP_WIDGET ?? '';
const root = path.resolve(import.meta.dirname, 'src/widgets', widget);

export default defineConfig({
  root,
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist', widget),
    emptyOutDir: true,
    target: 'es2022',
  },
});
