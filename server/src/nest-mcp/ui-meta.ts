/**
 * The `_meta` an MCP App needs, written once for every host.
 *
 * An MCP App (the `io.modelcontextprotocol/ui` extension) is a tool whose
 * `_meta.ui.resourceUri` names a `ui://` resource holding one HTML document;
 * a host that supports the extension reads that resource and draws it in a
 * sandboxed frame next to the tool result. Hosts read the same facts under
 * different keys: the standard `ui` object, the older `ui/resourceUri` key the
 * reference SDK still fills, and the `openai/*` keys ChatGPT reads. These
 * helpers emit all of them from one call, so no tool spells a key by hand.
 *
 * Kept free of the extension's own package (`@modelcontextprotocol/ext-apps`):
 * its server helper registers the tool itself, which the decorator registry
 * does. A parity test in tests/unit/nest-mcp/ checks the standard keys against
 * what that helper writes.
 */
import { createHash } from 'node:crypto';

/** The MIME type of an MCP App resource. */
export const MCP_APP_MIME_TYPE = 'text/html;profile=mcp-app';

/** The capability key a client announces MCP Apps support under, in `capabilities.extensions`. */
export const MCP_APP_EXTENSION_ID = 'io.modelcontextprotocol/ui';

/** The resource key older hosts read, which the reference SDK fills next to `ui.resourceUri`. */
const LEGACY_RESOURCE_URI_KEY = 'ui/resourceUri';

/** The vendor prefix of the keys ChatGPT reads. */
const OPENAI_PREFIX = 'openai/';

/** Who may call a tool: the model, the app drawn from it, or both (the default). */
type UiVisibility = 'model' | 'app';

export interface UiToolOptions {
  /** A few words a host shows while the tool runs ("Reading your trips…"). */
  invoking?: string;
  /** A few words a host shows once it answered ("Trips loaded"). */
  invoked?: string;
  /** Leave out for both; `['app']` keeps a tool only the widget calls out of the model's list. */
  visibility?: UiVisibility[];
}

/** A tool's `_meta`: the widget it draws, under every key a host reads it by. */
export function uiTool(resourceUri: string, options: UiToolOptions = {}): Record<string, unknown> {
  const { invoking, invoked, visibility } = options;
  return {
    ui: visibility ? { resourceUri, visibility } : { resourceUri },
    [LEGACY_RESOURCE_URI_KEY]: resourceUri,
    [`${OPENAI_PREFIX}outputTemplate`]: resourceUri,
    ...(invoking ? { [`${OPENAI_PREFIX}toolInvocation/invoking`]: invoking } : {}),
    ...(invoked ? { [`${OPENAI_PREFIX}toolInvocation/invoked`]: invoked } : {}),
    ...(visibility?.includes('app') ? { [`${OPENAI_PREFIX}widgetAccessible`]: true } : {}),
  };
}

/**
 * A tool's `_meta` when a widget calls it (a tick, a vote, a reorder) without
 * drawing one of its own: visible to the model and to the app, and to ChatGPT
 * under its own key, which it requires before a widget may call a tool.
 */
export function appCallable(): Record<string, unknown> {
  return { ui: { visibility: ['model', 'app'] }, [`${OPENAI_PREFIX}widgetAccessible`]: true };
}

/** Claude's sandbox domain for an MCP server: the first 32 hex of the SHA-256 of its exact URL. */
export function claudeUiDomain(serverUrl: string): string {
  return `${createHash('sha256').update(serverUrl).digest('hex').slice(0, 32)}.claudemcpcontent.com`;
}

/** Whether the client that introduced itself is one of Claude's apps (claude.ai, Desktop, mobile). */
export function isClaudeClient(name: string | null | undefined): boolean {
  return typeof name === 'string' && /^claude/i.test(name);
}

/** The origins a widget may reach: `connectDomains` for fetch, `resourceDomains` for images and fonts. */
interface UiResourceCsp {
  connectDomains?: string[];
  resourceDomains?: string[];
}

export interface UiResourceOptions {
  csp?: UiResourceCsp;
  /** Whether the host should draw a border and a background around the widget. */
  prefersBorder?: boolean;
  /** A dedicated sandbox origin, in the form the host asks for. */
  domain?: string;
}

/** A widget resource's `_meta`: its sandbox policy, under the standard and the ChatGPT keys. */
export function uiResource(options: UiResourceOptions = {}): Record<string, unknown> {
  const { csp, prefersBorder, domain } = options;
  return {
    ui: {
      ...(csp ? { csp } : {}),
      ...(prefersBorder === undefined ? {} : { prefersBorder }),
      ...(domain ? { domain } : {}),
    },
    [`${OPENAI_PREFIX}widgetCSP`]: {
      connect_domains: csp?.connectDomains ?? [],
      resource_domains: csp?.resourceDomains ?? [],
    },
    ...(prefersBorder === undefined ? {} : { [`${OPENAI_PREFIX}widgetPrefersBorder`]: prefersBorder }),
    ...(domain ? { [`${OPENAI_PREFIX}widgetDomain`]: domain } : {}),
  };
}

/**
 * A tool's `_meta` without anything that points a host at a widget: what a
 * session gets while the admin has the interactive apps switched off. Undefined
 * when nothing else was in it.
 */
export function withoutUiMeta(meta: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const rest = Object.entries(meta).filter(
    ([key]) => key !== 'ui' && key !== LEGACY_RESOURCE_URI_KEY && !key.startsWith(OPENAI_PREFIX),
  );
  return rest.length > 0 ? Object.fromEntries(rest) : undefined;
}
