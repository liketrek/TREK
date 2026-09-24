import {
  McpController, Tool, Resource, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, errorResult, ok,
} from '../../nest-mcp';
import { z } from 'zod';
import { createCategoryRequestSchema, updateCategoryRequestSchema } from '@trek/shared';
import { DatabaseService } from '../database/database.service';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { isDemoUserId } from '../common/demo-write';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { adminRequired } from '../../mcp/tools/_shared';
import { CategoriesService } from './categories.service';

/**
 * Categories MCP surface — ported 1:1 from the legacy registrars: the
 * list_categories tool from src/mcp/tools/places.ts (identical name,
 * description, annotations and places-read gating via the declarative access
 * marker + trekMcpAccessPolicy) and the trek://categories resource from
 * src/mcp/resources.ts (first production @Resource; intentionally ungated —
 * the legacy registration was unconditional, safe for any authenticated
 * session — and the payload reproduces the legacy jsonContent shape verbatim).
 *
 * The three write tools mirror POST/PUT/DELETE /api/categories, which sit
 * behind JwtAuthGuard + AdminGuard: the palette is instance-wide, not
 * trip-scoped, so there is no trip to check access against and the admin role
 * is the whole gate. Bodies reuse the same @trek/shared contracts the
 * controller's DTOs wrap, so `color` stays hex-only on both surfaces (it is
 * interpolated into a style="…" attribute of hand-built marker HTML).
 */
@McpController()
export class CategoriesMcp {
  constructor(
    private readonly categories: CategoriesService,
    private readonly db: DatabaseService,
    private readonly env: RuntimeEnvService,
    private readonly guards: McpToolGuardsService,
  ) {}

  /** The AuthService.isDemoUser check without the auth graph (demo-write.ts). */
  private isDemoUser(userId: number): boolean {
    return isDemoUserId(this.env, this.db, userId);
  }

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

  @Tool({
    name: 'create_category',
    description: 'Add a new place category to the instance-wide palette. Admin only. Prefer an existing category from list_categories: this mints one every trip on the instance will see, so only reach for it when nothing in the palette fits.',
    inputSchema: {
      name: createCategoryRequestSchema.shape.name.describe('Category label, e.g. "Street food"'),
      color: createCategoryRequestSchema.shape.color.describe('Hex colour for the map marker (defaults to #6366f1)'),
      icon: createCategoryRequestSchema.shape.icon.describe('Emoji shown on the marker (defaults to 📍)'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'places', mode: 'write' },
  })
  async createCategory({ name, color, icon }: { name: string; color?: string; icon?: string }, ctx: McpContext) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    // The palette is instance-wide; the REST route restricts management to admins. Match it.
    if (!this.guards.isAdminUser(ctx.userId)) return adminRequired();
    const category = this.categories.create(ctx.userId, name, color, icon);
    return ok({ category });
  }

  @Tool({
    name: 'update_category',
    description: 'Rename an existing place category or change its colour or icon. Admin only. Every place already carrying the category follows the change, so use this to fix a palette entry rather than to reclassify places.',
    inputSchema: {
      categoryId: z.number().int().positive().describe('Category ID from list_categories'),
      name: updateCategoryRequestSchema.shape.name,
      color: updateCategoryRequestSchema.shape.color.describe('Hex colour for the map marker'),
      icon: updateCategoryRequestSchema.shape.icon.describe('Emoji shown on the marker'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async updateCategory({ categoryId, name, color, icon }: { categoryId: number; name?: string; color?: string; icon?: string }, ctx: McpContext) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.guards.isAdminUser(ctx.userId)) return adminRequired();
    if (!this.categories.getById(categoryId)) return errorResult('Category not found');
    const category = this.categories.update(categoryId, name, color, icon);
    return ok({ category });
  }

  @Tool({
    name: 'delete_category',
    description: 'Remove a place category from the instance-wide palette. Admin only. Places keep their data but lose the category, across every trip on the instance. Use update_category when the entry only needs fixing.',
    inputSchema: {
      categoryId: z.number().int().positive().describe('Category ID from list_categories'),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'places', mode: 'write' },
  })
  async deleteCategory({ categoryId }: { categoryId: number }, ctx: McpContext) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.guards.isAdminUser(ctx.userId)) return adminRequired();
    if (!this.categories.getById(categoryId)) return errorResult('Category not found');
    this.categories.remove(categoryId);
    return ok({ success: true });
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
