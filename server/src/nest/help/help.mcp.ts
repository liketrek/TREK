import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, errorResult, ok, type McpContext } from '../../nest-mcp';
import { z } from 'zod';
import { getWikiIndex, getWikiPage, WikiNotFound, type WikiPage } from './wiki';

/**
 * Help MCP surface over the bundled wiki, reading through the same functions
 * HelpController does (GET /api/help/index, GET /api/help/page/:slug).
 *
 * Neither tool declares an `access` marker, so both stay registered for every
 * session. Both routes are @Public and serve versioned product documentation
 * with no user data in it, so there is no permission to mirror; borrowing some
 * other domain's read scope would hide the manual from tokens that were never
 * meant to be denied it, and protect nothing. list_trips and get_trip_summary
 * are registered the same way, for the same reason: a client needs them to find
 * its bearings before it knows what else to ask for.
 *
 * No injected service, like airports.mcp.ts: the help domain is a set of plain
 * readers over the `wiki/` directory rather than a provider.
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
  @Tool({
    name: 'list_help_topics',
    description:
      'List the table of contents of the TREK user manual bundled with this instance: sections, page titles, and the slugs get_help_page takes. Start here when the user asks how something in TREK works or how to do something in the app, then read the matching page. This is documentation about the product, never the user\'s own data: for that use list_trips or get_trip_summary.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
  })
  async listHelpTopics(_args: Record<string, never>, _ctx: McpContext) {
    try {
      const { sections } = await getWikiIndex();
      return ok({ sections });
    } catch {
      // The route lets this reach the global error envelope; a tool has to
      // answer, and a missing sidebar reads to a model like any other
      // unavailability.
      return errorResult('Help contents unavailable.');
    }
  }

  @Tool({
    name: 'get_help_page',
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
    let page: WikiPage;
    try {
      page = await getWikiPage(slug);
    } catch (err) {
      // The route collapses both into "Help page unavailable" with a 404/502
      // split in the status. A model cannot read the status, and only one of
      // the two is worth retrying with a different slug, so say which it is.
      if (err instanceof WikiNotFound)
        return errorResult(`No help page named "${slug}". Call list_help_topics for the slugs this instance ships.`);
      return errorResult('Help page unavailable.');
    }

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
}
