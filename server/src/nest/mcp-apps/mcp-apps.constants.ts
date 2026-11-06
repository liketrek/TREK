import path from 'node:path';

/**
 * Where the built widgets live: `server/mcp-apps/<name>.html`, written by the
 * `mcp-apps` workspace's build (and copied there by the Docker image). The same
 * folder from `src/` under vitest and from `dist/` in production.
 */
export const MCP_APPS_DEFAULT_DIR = path.join(__dirname, '..', '..', '..', 'mcp-apps');

/** The injection token for that folder, so a test can point the service at one of its own. */
export const MCP_APPS_DIR = Symbol('MCP_APPS_DIR');
