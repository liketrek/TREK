import {
  McpController,
  McpRegistryService,
  renderToolHelp,
  Tool,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_HELP_PREFIX,
  toolHelpSlug,
  errorResult,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { getWikiIndex, getWikiPage, searchWiki, WikiNotFound, type WikiPage } from './wiki';

import { z } from 'zod';

/**
 * Help MCP surface over the bundled wiki, reading through the same functions
 * HelpController does (GET /api/help/index, GET /api/help/search, GET
 * /api/help/page/:slug).
 *
 * Neither tool declares an `access` marker, so both stay registered for every
 * session. Both routes are @Public and serve versioned product documentation
 * with no user data in it, so there is no permission to mirror; borrowing some
 * other domain's read scope would hide the manual from tokens that were never
 * meant to be denied it, and protect nothing. list_trips and get_trip_summary
 * are registered the same way, for the same reason: a client needs them to find
 * its bearings before it knows what else to ask for.
 *
 * The wiki itself is read through plain readers over the `wiki/` directory. The
 * one injection is the MCP registry: a tool that moved its long reference out of
 * tools/list (`detail`, src/nest-mcp/input-detail.ts) is served here as the
 * page `tool/<name>`, rendered from the tool's own Zod shape, and listed apart
 * from the wiki's sections as `tool_references`.
 *
 * GET /api/help/asset/* has no tool on purpose. It answers with image bytes for
 * an <img> tag, which is not something a tool result carries.
 */

/**
 * Plugin-Development.md alone is 100 KB, and a tool result lands directly in a
 * model's context window. Hand back a slice and let the caller ask for the rest
 * rather than deciding on its behalf that the tail does not matter.
 */
const HELP_PAGE_CHARS = 40_000;

@McpController()
export class HelpMcp {
  constructor(private readonly registry: McpRegistryService) {}

  /** The page by slug, or why there is none: a tool's reference (`tool/<name>`) or a page of the wiki. */
  private async loadPage(slug: string): Promise<WikiPage | string> {
    const toolPage = slug.startsWith(TOOL_HELP_PREFIX) ? this.toolPage(slug) : null;
    if (toolPage) return toolPage;
    try {
      return await getWikiPage(slug);
    } catch (err) {
      // The route collapses both into "Help page unavailable" with a 404/502
      // split in the status. A model cannot read the status, and only one of
      // the two is worth retrying with a different slug, so say which it is.
      if (err instanceof WikiNotFound)
        return `No help page named "${slug}". Call list_help_topics for the slugs this instance ships.`;
      return 'Help page unavailable.';
    }
  }

  /** The page `tool/<name>` for a tool with a reference, built like a wiki page. */
  private toolPage(slug: string): WikiPage | null {
    const topic = this.registry.toolHelpTopic(slug.slice(TOOL_HELP_PREFIX.length));
    return topic ? { slug, title: topic.title, markdown: renderToolHelp(topic) } : null;
  }

  @Tool({
    name: 'list_help_topics',
    title: 'List help topics',
    description:
      "List the table of contents of the TREK user manual bundled with this instance: sections, page titles, and the slugs get_help_page takes. Start here when the user asks how something in TREK works or how to do something in the app, then read the matching page. This is documentation about the product, never the user's own data: for that use list_trips or get_trip_summary.",
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
  })
  async listHelpTopics(_args: Record<string, never>, _ctx: McpContext) {
    try {
      const { sections } = await getWikiIndex();
      const tool_references = this.registry
        .toolHelpTopics()
        .map((topic) => ({ title: topic.title, slug: toolHelpSlug(topic.name) }));
      return ok(tool_references.length ? { sections, tool_references } : { sections });
    } catch {
      // The route lets this reach the global error envelope; a tool has to
      // answer, and a missing sidebar reads to a model like any other
      // unavailability.
      return errorResult('Help contents unavailable.');
    }
  }

  @Tool({
    name: 'get_help_page',
    title: 'Read help page',
    description:
      'Read one page of the bundled TREK user manual as markdown, addressed by a slug from list_help_topics. Prefer it over answering from memory whenever the user asks how a TREK feature behaves: the pages ship with the running version, so they describe this instance rather than some other release. Long pages arrive in chunks, so when the result says truncated, call again with next_offset.',
    inputSchema: {
      slug: z.string().min(1).max(120).describe('Page slug as reported by list_help_topics, e.g. "Quick-Start"'),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe('Character offset to resume from after a truncated result. Defaults to 0, the start of the page.'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
  })
  async getHelpPage({ slug, offset }: { slug: string; offset?: number }, _ctx: McpContext) {
    const from = offset ?? 0;
    const page = await this.loadPage(slug);
    if (typeof page === 'string') return errorResult(page);

    const full = page.markdown;
    if (from > 0 && from >= full.length)
      return errorResult(`Offset ${from} is past the end of "${page.slug}", which is ${full.length} characters long.`);

    const markdown = full.slice(from, from + HELP_PAGE_CHARS);
    const truncated = from + markdown.length < full.length;
    return ok({
      slug: page.slug,
      title: page.title,
      markdown,
      truncated,
      next_offset: truncated ? from + markdown.length : null,
    });
  }

  @Tool({
    name: 'search_help',
    title: 'Search help manual',
    description:
      "Full-text search across the bundled TREK user manual, the same search the in-app help panel uses. Returns the best-matching pages with the section heading the match sits under and a snippet, so a question like 'how do I split a cost' lands on the right page without reading the whole table of contents first. Follow up with get_help_page on a hit's slug.",
    inputSchema: {
      query: z.string().min(1).max(120).describe('Free text to search for, e.g. "cover image" or "invite link"'),
      limit: z.number().int().min(1).max(20).optional().describe('Maximum number of hits, default 8'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
  })
  async searchHelp({ query, limit }: { query: string; limit?: number }, _ctx: McpContext) {
    try {
      const hits = await searchWiki(query, limit);
      return ok({ hits });
    } catch {
      return errorResult('Help search unavailable.');
    }
  }
}
