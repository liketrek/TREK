/**
 * The interactive views (MCP Apps) TREK ships: one HTML document per widget,
 * built by the `mcp-apps` workspace and served by the server as a `ui://`
 * resource. The server's resources, the tools that point at them and the build
 * all read the names from here, so a widget cannot be built without being
 * served or pointed at without being built.
 */
export const MCP_APP_WIDGETS = ['trip-list'] as const;

export type McpAppWidget = (typeof MCP_APP_WIDGETS)[number];

/** The `ui://` resource a widget is served under. */
export function mcpAppUri(widget: McpAppWidget): string {
  return `ui://trek/${widget}.html`;
}

/**
 * The key a tool result's `_meta` carries the TREK address of what it shows
 * under, for the widget's "Open in TREK" link. Kept out of the text content,
 * which stays byte for byte what a host without views reads.
 */
export const MCP_APP_URL_META_KEY = 'trek/appUrl';
