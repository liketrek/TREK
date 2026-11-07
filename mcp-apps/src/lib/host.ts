import type { App } from '@modelcontextprotocol/ext-apps';

type CallResult = Awaited<ReturnType<App['callServerTool']>>;

/**
 * Calls a TREK tool through the host's own MCP session, so TREK checks the
 * permission and writes the audit row as for any other call. Resolves the
 * answer, or null when there is no host yet, the call failed, or TREK refused.
 */
export async function callTrekTool(
  app: App | null,
  name: string,
  args: Record<string, unknown>
): Promise<CallResult | null> {
  if (!app) return null;
  try {
    const answer = await app.callServerTool({ name, arguments: args });
    return answer.isError ? null : answer;
  } catch {
    return null;
  }
}

/** Whether TREK carried out the call: a write the widget showed at once keeps it, or puts it back. */
export async function trekToolSucceeded(app: App | null, name: string, args: Record<string, unknown>) {
  return (await callTrekTool(app, name, args)) !== null;
}

/** A further read's structured result; throws when there was none, so the caller can say the read failed. */
export async function readTrekTool(app: App | null, name: string, args: Record<string, unknown>): Promise<unknown> {
  const answer = await callTrekTool(app, name, args);
  if (!answer) throw new Error(`${name} gave no result`);
  return answer.structuredContent;
}

/**
 * What a widget asks of the host besides tools: open a TREK link, and the
 * whole screen. A host that refuses either (no browser, no fullscreen mode)
 * leaves the widget where it is, so a refusal is not an error.
 */
export function hostActions(app: App | null) {
  return {
    open: (url: string) => void app?.openLink({ url }).catch(() => undefined),
    /** Resolves whether the host gave the whole screen. */
    expand: async () => {
      const granted = await app?.requestDisplayMode({ mode: 'fullscreen' }).catch(() => null);
      return granted?.mode === 'fullscreen';
    },
  };
}
