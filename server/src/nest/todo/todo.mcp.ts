import { ADDON_IDS } from '../../addons';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import {
  McpController,
  Tool,
  ResourceTemplate,
  type McpContext,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied,
  errorResult,
  ok,
} from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { AuthService } from '../auth/auth.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TodoService } from './todo.service';

import { z } from 'zod';

/** Legacy registrar gate: the whole todo surface rides the packing addon. */
const packingAddonOn = addonGate(ADDON_IDS.PACKING);

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Todo MCP surface — ported 1:1 from the legacy registrars: the eight tools
 * from src/mcp/tools/todos.ts and the trek://trips/{tripId}/todos resource
 * from src/mcp/resources.ts (identical names, descriptions, schemas,
 * annotations, error/payload shapes and broadcasts). The registration-time
 * gates map to `when` (the whole-registrar packing-addon early return) plus
 * the declarative todos read/write access markers (the legacy `if (R)` /
 * `if (W)` checks, resolved by trekMcpAccessPolicy).
 */
@McpController()
export class TodoMcp {
  constructor(
    private readonly todos: TodoService,
    private readonly auth: AuthService,
    readonly addons: AddonsService,
    private readonly guards: McpToolGuardsService,
  ) {}

  @Tool({
    name: 'list_todos',
    description: 'List all to-do items for a trip, ordered by position.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: packingAddonOn,
    access: { group: 'todos', mode: 'read' },
  })
  async listTodos({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.todos.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    const items = this.todos.listItems(tripId);
    return ok({ items });
  }

  @Tool({
    name: 'create_todo',
    description: 'Create a new to-do item for a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
      name: z.string().min(1).max(500).describe('To-do item name'),
      category: z.string().max(100).optional().describe('Category (e.g. "Logistics", "Booking")'),
      due_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Due date (YYYY-MM-DD)'),
      description: z.string().max(2000).optional().describe('Additional description'),
      assigned_user_id: z.number().int().positive().optional().describe('User ID to assign this task to'),
      priority: z.number().int().min(0).max(3).optional().describe('Priority: 0=none, 1=low, 2=medium, 3=high'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: packingAddonOn,
    access: { group: 'todos', mode: 'write' },
  })
  async createTodo(
    {
      tripId,
      name,
      category,
      due_date,
      description,
      assigned_user_id,
      priority,
    }: {
      tripId: number;
      name: string;
      category?: string;
      due_date?: string;
      description?: string;
      assigned_user_id?: number;
      priority?: number;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.todos.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const item = this.todos.createItem(tripId, { name, category, due_date, description, assigned_user_id, priority });
    this.guards.safeBroadcast(tripId, 'todo:created', { item });
    return ok({ item });
  }

  @Tool({
    name: 'update_todo',
    description:
      'Update an existing to-do item. Only provided fields are changed; omitted fields stay as-is. Pass null to clear a nullable field.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
      name: z.string().min(1).max(500).optional(),
      category: z.string().max(100).optional(),
      due_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional()
        .describe('Set to null to clear the due date'),
      description: z.string().max(2000).nullable().optional().describe('Set to null to clear'),
      assigned_user_id: z.number().int().positive().nullable().optional().describe('Set to null to unassign'),
      priority: z.number().int().min(0).max(3).nullable().optional(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'todos', mode: 'write' },
  })
  async updateTodo(
    {
      tripId,
      itemId,
      name,
      category,
      due_date,
      description,
      assigned_user_id,
      priority,
    }: {
      tripId: number;
      itemId: number;
      name?: string;
      category?: string;
      due_date?: string | null;
      description?: string | null;
      assigned_user_id?: number | null;
      priority?: number | null;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.todos.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    // Build bodyKeys to signal which nullable fields were explicitly provided
    const bodyKeys: string[] = [];
    if (due_date !== undefined) bodyKeys.push('due_date');
    if (description !== undefined) bodyKeys.push('description');
    if (assigned_user_id !== undefined) bodyKeys.push('assigned_user_id');
    if (priority !== undefined) bodyKeys.push('priority');
    const item = this.todos.updateItem(
      tripId,
      itemId,
      { name, category, due_date, description, assigned_user_id, priority },
      bodyKeys,
    );
    if (!item) return errorResult('To-do item not found.');
    this.guards.safeBroadcast(tripId, 'todo:updated', { item });
    return ok({ item });
  }

  @Tool({
    name: 'toggle_todo',
    description: 'Mark a to-do item as checked (done) or unchecked.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
      checked: z.boolean().describe('True to mark done, false to uncheck'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'todos', mode: 'write' },
  })
  async toggleTodo({ tripId, itemId, checked }: { tripId: number; itemId: number; checked: boolean }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.todos.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const item = this.todos.updateItem(tripId, itemId, { checked: checked ? 1 : 0 }, []);
    if (!item) return errorResult('To-do item not found.');
    this.guards.safeBroadcast(tripId, 'todo:updated', { item });
    return ok({ item });
  }

  @Tool({
    name: 'delete_todo',
    description: 'Delete a to-do item.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: packingAddonOn,
    access: { group: 'todos', mode: 'write' },
  })
  async deleteTodo({ tripId, itemId }: { tripId: number; itemId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.todos.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const deleted = this.todos.deleteItem(tripId, itemId);
    if (!deleted) return errorResult('To-do item not found.');
    this.guards.safeBroadcast(tripId, 'todo:deleted', { itemId });
    return ok({ success: true });
  }

  @Tool({
    name: 'reorder_todos',
    description: 'Reorder to-do items within a trip by providing a new ordered list of item IDs.',
    inputSchema: {
      tripId: z.number().int().positive(),
      orderedIds: z.array(z.number().int().positive()).min(1).describe('All item IDs in the desired order'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'todos', mode: 'write' },
  })
  async reorderTodos({ tripId, orderedIds }: { tripId: number; orderedIds: number[] }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.todos.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    this.todos.reorderItems(tripId, orderedIds);
    return ok({ success: true });
  }

  @Tool({
    name: 'get_todo_category_assignees',
    description: 'Get the default assignees configured per to-do category for a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: packingAddonOn,
    access: { group: 'todos', mode: 'read' },
  })
  async getTodoCategoryAssignees({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.todos.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    const assignees = this.todos.getCategoryAssignees(tripId);
    return ok({ assignees });
  }

  @Tool({
    name: 'set_todo_category_assignees',
    description: 'Set the default assignees for a to-do category on a trip. Pass an empty array to clear.',
    inputSchema: {
      tripId: z.number().int().positive(),
      categoryName: z.string().min(1).max(100).describe('Category name'),
      userIds: z.array(z.number().int().positive()).describe('User IDs to assign as defaults for this category'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'todos', mode: 'write' },
  })
  async setTodoCategoryAssignees(
    { tripId, categoryName, userIds }: { tripId: number; categoryName: string; userIds: number[] },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.todos.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const assignees = this.todos.updateCategoryAssignees(tripId, categoryName, userIds);
    this.guards.safeBroadcast(tripId, 'todo:assignees', { category: categoryName, assignees });
    return ok({ assignees });
  }

  @ResourceTemplate({
    name: 'trip-todos',
    uriTemplate: 'trek://trips/{tripId}/todos',
    description: 'To-do items for a trip, ordered by position',
    mimeType: 'application/json',
    when: packingAddonOn,
    access: { group: 'todos', mode: 'read' },
  })
  async tripTodosResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.todos.verifyTripAccess(id, ctx.userId)) {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({ error: 'Trip not found or access denied' }),
          },
        ],
      };
    }
    const items = this.todos.listItems(id);
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(items, null, 2),
        },
      ],
    };
  }
}
