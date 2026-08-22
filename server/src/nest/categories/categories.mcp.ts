import {
  McpController, Tool, Resource, type McpContext,
  TOOL_ANNOTATIONS_READONLY, ok,
} from '../../nest-mcp';
import { CategoriesService } from './categories.service';

/**
 * Categories MCP surface — ported 1:1 from the legacy registrars: the
 * list_categories tool from src/mcp/tools/places.ts (identical name,
 * description, annotations and places-read gating via the declarative access
 * marker + trekMcpAccessPolicy) and the trek://categories resource from
 * src/mcp/resources.ts (first production @Resource; intentionally ungated —
 * the legacy registration was unconditional, safe for any authenticated
 * session — and the payload reproduces the legacy jsonContent shape verbatim).
 */
@McpController()
export class CategoriesMcp {
  constructor(private readonly categories: CategoriesService) {}

  @Tool({
    name: 'list_categories',
    description: 'List all available place categories with their id, name, icon and color. Use category_id when creating or updating places.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'places', mode: 'read' },
  })
  async listCategories(_args: Record<string, never>, _ctx: McpContext) {
    const categories = this.categories.list();
    return ok({ categories });
  }

  @Resource({
    name: 'categories',
    uri: 'trek://categories',
    description: 'All available place categories (id, name, color, icon) for use when creating places',
    mimeType: 'application/json',
  })
  async categoriesResource(uri: URL, _ctx: McpContext) {
    const categories = this.categories.list();
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(categories, null, 2),
      }],
    };
  }
}
