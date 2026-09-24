/**
 * Advertises plugin-published tools on every MCP session, and dispatches the
 * calls back into the plugin that published them.
 *
 * Shaped like trip-warnings.mcp.ts, the other place the plugins domain meets
 * MCP: gate on the kill switch, fan out over providersOf, and let a failing
 * provider contribute nothing rather than fail the surface.
 *
 * The source runs inside the /mcp initialize request, so it is synchronous and
 * reads only state already in memory or in SQLite. Nothing here waits on a
 * child process.
 */
import { Injectable, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import { RuntimeEnvService } from '../../app-config/runtime-env.service';
import { isDemoUserId } from '../../common/demo-write';
import { pluginsEnabled } from '../kill-switch';
import { PluginHooks } from '../plugin-hooks.service';
import { PluginRuntimeService } from '../plugin-runtime.service';
import {
  MCP_TOOLS_MAX,
  MCP_TOOLS_TOTAL_MAX,
  buildToolInputSchema,
  clampToolAnnotations,
  mcpToolName,
} from '../mcp-tool-schema';
import { sanitiseAssistantText } from '../text-sanitize';
import { setPluginMcpToolSource } from '../../../plugin-mcp-tools';

import { demoDenied, errorResult, type McpContext, type McpDynamicTool, type McpTextResult } from '../../../nest-mcp';

/** The hook a plugin implements to publish tools. */
const HOOK = 'mcpToolProvider';

/**
 * Ceiling on a WHOLE tool result, in characters, across every content block.
 * A plugin must not be able to flood the assistant's context, and a result this
 * large is a bug on the plugin's side rather than something a model can use.
 */
const RESULT_MAX = 64 * 1024;

/**
 * Ceiling on content blocks in one result. Without it, the byte budget alone
 * still lets a plugin return tens of thousands of empty blocks.
 */
const RESULT_BLOCKS_MAX = 32;

/** Error text a plugin produced, bounded before it reaches the model. */
const RESULT_ERROR_MAX = 300;

@Injectable()
export class PluginMcpToolsService implements OnApplicationBootstrap, OnModuleDestroy {
  constructor(
    private readonly hooks: PluginHooks,
    private readonly runtime: PluginRuntimeService,
    private readonly env: RuntimeEnvService,
    private readonly dbs: DatabaseService,
  ) {}

  // The sink lives here rather than on PluginRuntimeService because the source
  // needs PluginHooks, and PluginHooks injects PluginRuntimeService: owning it
  // there would be a cycle. Cleared on destroy, or a torn-down buildApp() leaves
  // a live source closing over a dead runtime and bleeds into the next suite.
  onApplicationBootstrap(): void {
    setPluginMcpToolSource((ctx) => this.mcpTools(ctx));
  }

  onModuleDestroy(): void {
    setPluginMcpToolSource(null);
  }

  /**
   * Every plugin tool this session may see. Synchronous, and never throws:
   * nest-mcp contains a throwing source, but a per-plugin failure here should
   * cost that plugin's tools and nothing else.
   */
  mcpTools(_ctx: McpContext): McpDynamicTool[] {
    if (!pluginsEnabled()) return [];
    const out: McpDynamicTool[] = [];
    let dropped = 0;

    for (const id of this.hooks.providersOf(HOOK)) {
      let tools: McpDynamicTool[];
      try {
        tools = this.toolsOf(id);
      } catch {
        // One plugin's bad row contributes nothing; the others still advertise.
        continue;
      }
      for (const tool of tools) {
        if (out.length >= MCP_TOOLS_TOTAL_MAX) {
          dropped += 1;
          continue;
        }
        out.push(tool);
      }
    }

    if (dropped > 0) {
      // Never silent: a truncated surface reads exactly like a plugin that
      // published nothing.
      console.warn(`[plugins] MCP tool surface capped at ${MCP_TOOLS_TOTAL_MAX}; dropped ${dropped}`);
    }
    return out;
  }

  /**
   * One plugin's advertised tools: declared in the signed manifest AND reported
   * by the running build.
   *
   * The manifest half is what makes the text auditable, since the child composes
   * its loaded payload after onLoad and could otherwise change what it publishes
   * on every restart with no version bump. Same two-sided shape as callPlugin's
   * exports check.
   */
  private toolsOf(pluginId: string): McpDynamicTool[] {
    const declared = this.runtime.mcpToolCapabilities(pluginId);
    if (!declared.length) return [];
    const implemented = new Set(this.runtime.mcpToolsOf(pluginId));
    const grants = this.runtime.grantsOf(pluginId);

    const out: McpDynamicTool[] = [];
    for (const tool of declared.slice(0, MCP_TOOLS_MAX)) {
      if (!implemented.has(tool.name)) continue;
      out.push({
        options: {
          name: mcpToolName(pluginId, tool.name),
          // Re-sanitised even though parseCapabilities already did it: this blob
          // was written by whatever parser was current at install time. Same
          // reasoning as sanitizePluginChannels.
          ...(tool.title ? { title: sanitiseAssistantText(tool.title, 80) } : {}),
          description: sanitiseAssistantText(tool.description, 1024),
          inputSchema: buildToolInputSchema(tool.inputSchema),
          annotations: clampToolAnnotations(tool.annotations, grants),
          // No _meta: a plugin-authored channel straight into the client, that
          // nothing reads. No outputSchema either, or the SDK would start
          // demanding structuredContent the plugin never produces.
          access: { group: 'plugins', mode: 'use' },
        },
        owner: this,
        handler: (args, ctx) => this.invokeTool(pluginId, tool.name, args, ctx),
      });
    }
    return out;
  }

  /**
   * Run one tool and shape whatever comes back into an MCP result.
   *
   * The registry passes a handler's return value straight through and skips
   * output validation without an outputSchema, so a plugin returning
   * `{ ok: true, data }` would emit a result with no `content` key and every
   * conforming client would error. The envelope is built here, always.
   */
  private async invokeTool(pluginId: string, name: string, args: unknown, ctx: McpContext): Promise<McpTextResult> {
    if (!pluginsEnabled()) return errorResult('Plugins are disabled on this server.');
    // The plugins domain's first demo gate. The child has none of its own, and
    // the ~40 isDemoUser checks elsewhere are per-handler, so it belongs here.
    if (isDemoUserId(this.env, this.dbs, ctx.userId)) return demoDenied();

    try {
      const raw = await this.hooks.callMcpTool(pluginId, { name, args: args ?? {} }, ctx.userId);
      return toMcpTextResult(raw);
    } catch (e) {
      // A failed or timed-out invoke is a TOOL error, not a protocol one: the
      // model has to see it and be able to try something else.
      const message = e instanceof Error ? e.message : String(e);
      return errorResult(`Plugin "${pluginId}" could not run "${name}": ${sanitiseAssistantText(message, RESULT_ERROR_MAX)}`);
    }
  }
}

/** True for a value already shaped like an MCP result the SDK would accept. */
function isTextResult(v: unknown): v is McpTextResult {
  return (
    typeof v === 'object' &&
    v !== null &&
    Array.isArray((v as { content?: unknown }).content)
  );
}

/**
 * Trim a list of text blocks so the WHOLE result fits the budget.
 *
 * Per-block slicing is not a limit: a hundred blocks of the maximum size is a
 * hundred times the maximum. The budget is spent in order and the first block
 * that does not fit is truncated, so a plugin returning one huge blob and one
 * returning many small ones cost the assistant the same.
 */
function fitToBudget(blocks: Array<{ type: 'text'; text: string }>): Array<{ type: 'text'; text: string }> {
  const out: Array<{ type: 'text'; text: string }> = [];
  let left = RESULT_MAX;
  let dropped = 0;
  let cut = false;
  for (const block of blocks.slice(0, RESULT_BLOCKS_MAX)) {
    if (left <= 0) {
      dropped += 1;
      continue;
    }
    // A block that had to be shortened counts too. Without this, one 100 KB
    // block came back silently clipped and read to the model like the whole
    // answer — the same failure the dropped-block marker exists to prevent.
    if (block.text.length > left) cut = true;
    const text = block.text.length > left ? block.text.slice(0, left) : block.text;
    left -= text.length;
    out.push({ type: 'text', text });
  }
  dropped += Math.max(0, blocks.length - RESULT_BLOCKS_MAX);
  if (dropped > 0 || cut) {
    console.warn(`[plugins] MCP tool result truncated: ${dropped} block(s) omitted${cut ? ', one shortened' : ''}`);
    const omitted = dropped > 0 ? `${dropped} more content block(s) omitted` : 'the last block was cut short';
    out.push({ type: 'text', text: `[truncated: ${omitted}]` });
  }
  return out;
}

/**
 * Whatever the plugin returned, as a result the SDK and every client accept.
 * Exported for the tests, which is where the shapes are enumerated.
 */
export function toMcpTextResult(raw: unknown): McpTextResult {
  // Carried through every path below: a plugin that flagged an error and then
  // shaped its content oddly still reported an error, and dropping the flag
  // would present a failure to the model as a successful call.
  const flagged = isTextResult(raw) && raw.isError === true;
  const errorFlag = flagged ? { isError: true as const } : {};

  if (isTextResult(raw)) {
    const blocks = raw.content
      .filter((c): c is { type: 'text'; text: string } => !!c && (c as { type?: unknown }).type === 'text')
      .map((c) => ({ type: 'text' as const, text: String(c.text ?? '') }));
    // A content array we cannot read is worse than none: fall through and
    // serialise the whole thing rather than emit an empty result.
    if (blocks.length) {
      return { content: fitToBudget(blocks), ...errorFlag };
    }
  }
  if (typeof raw === 'string') return { content: fitToBudget([{ type: 'text', text: raw }]), ...errorFlag };
  if (raw === undefined) {
    // JSON.stringify(undefined) is undefined, which would otherwise reach the
    // model as the empty string — indistinguishable from a tool that answered.
    return { content: [{ type: 'text', text: '(the plugin returned no value)' }], ...errorFlag };
  }
  try {
    // Serialised with a budget rather than stringified whole and then sliced: a
    // plugin returning a 200 MB object should not cost the host that string
    // before the cap is applied.
    const { text, cut } = serialiseBounded(raw);
    const content = fitToBudget([{ type: 'text', text }]);
    if (cut) {
      // fitToBudget cannot see this one: the value was already trimmed on its
      // way out of JSON.stringify, so what arrives here is inside the budget.
      console.warn('[plugins] MCP tool result truncated while being serialised');
      content.push({ type: 'text', text: '[truncated: the result was cut to fit the size budget]' });
    }
    return { content, ...errorFlag };
  } catch {
    // JSON.stringify still throws on a cycle or a BigInt.
    return errorResult('The plugin returned a value that could not be serialised.');
  }
}

/**
 * JSON.stringify, abandoned once the output passes the budget.
 *
 * The replacer runs per value, so a runaway structure is cut off while it is
 * being built instead of after. Throws exactly like JSON.stringify on a cycle
 * or a BigInt, so the caller's catch still handles those.
 */
function serialiseBounded(value: unknown): { text: string; cut: boolean } {
  let budget = RESULT_MAX;
  let cut = false;
  const text = JSON.stringify(value, (_key, v: unknown) => {
    if (budget <= 0) {
      cut = true;
      return undefined;
    }
    if (typeof v === 'string') {
      budget -= v.length;
      if (budget <= 0) {
        cut = true;
        return v.slice(0, Math.max(0, v.length + budget));
      }
      return v;
    }
    budget -= 8; // rough cost of a number, boolean, or structural token
    return v;
  }, 2);
  return { text: text ?? '', cut };
}
