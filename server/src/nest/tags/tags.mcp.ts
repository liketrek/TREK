import {
  McpController, Tool, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, errorResult, ok,
} from '../../nest-mcp';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { TagsService } from './tags.service';

/**
 * Tags MCP tools — pilot for the decorator-driven registry. Ported 1:1 from
 * the legacy src/mcp/tools/tags.ts registrar: identical names, descriptions,
 * schemas, annotations, scope gating (places read/write via the declarative
 * access markers + trekMcpAccessPolicy) and error/payload shapes.
 */
@McpController()
export class TagsMcp {
  constructor(private readonly tags: TagsService, private readonly auth: AuthService) {}

  @Tool({
    name: 'list_tags',
    description: 'List all tags belonging to the current user.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'places', mode: 'read' },
  })
  async listTags(_args: Record<string, never>, ctx: McpContext) {
    const tags = this.tags.list(ctx.userId);
    return ok({ tags });
  }

  @Tool({
    name: 'create_tag',
    description: 'Create a new tag (user-scoped label for places).',
    inputSchema: {
      name: z.string().min(1).max(100),
      color: z.string().optional().describe('Hex color string e.g. #6366f1'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'places', mode: 'write' },
  })
  async createTag({ name, color }: { name: string; color?: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const tag = this.tags.create(ctx.userId, name, color);
    return ok({ tag });
  }

  @Tool({
    name: 'update_tag',
    description: 'Update the name or color of an existing tag.',
    inputSchema: {
      tagId: z.number().int().positive(),
      name: z.string().optional(),
      color: z.string().optional(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async updateTag({ tagId, name, color }: { tagId: number; name?: string; color?: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.tags.getByIdAndUser(tagId, ctx.userId)) return errorResult('Tag not found.');
    const tag = this.tags.update(tagId, name, color);
    if (!tag) return errorResult('Tag not found.');
    return ok({ tag });
  }

  @Tool({
    name: 'delete_tag',
    description: 'Delete a tag (removes it from all places it was attached to).',
    inputSchema: {
      tagId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'places', mode: 'write' },
  })
  async deleteTag({ tagId }: { tagId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.tags.getByIdAndUser(tagId, ctx.userId)) return errorResult('Tag not found.');
    this.tags.remove(tagId);
    return ok({ success: true });
  }
}
