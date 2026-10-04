import {
  McpController, Tool, ResourceTemplate, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, errorResult, ok,
} from '../../nest-mcp';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { z } from 'zod';
import {
  shoppingCreateItemRequestSchema,
  shoppingUpdateItemRequestSchema,
  shoppingReorderRequestSchema,
} from '@trek/shared';
import { AuthService } from '../auth/auth.service';
import { ADDON_IDS } from '../../addons';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { ShoppingService } from './shopping.service';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';

/** The shopping list is a sub-tab of Lists, so it rides the packing addon. */
const packingAddonOn = addonGate(ADDON_IDS.PACKING);

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Shopping MCP surface — the parallel of the REST routes in
 * shopping.controller.ts. The input schemas come from the shared contract, so
 * REST and MCP validate the same body. A shopping list is a trip list like the
 * packing list and uses the same `packing_edit` permission, so it sits in the
 * packing scope group rather than adding a scope of its own.
 */
@McpController()
export class ShoppingMcp {
  constructor(
    private readonly shopping: ShoppingService,
    private readonly auth: AuthService,
    readonly addons: AddonsService,
    private readonly guards: McpToolGuardsService,
  ) {}

  @Tool({
    name: 'list_shopping_items',
    description: 'List all shopping list items for a trip, ordered by position.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'read' },
  })
  async listShoppingItems({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.shopping.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    const items = this.shopping.listItems(tripId);
    return ok({ items });
  }

  @Tool({
    name: 'create_shopping_item',
    description: 'Add an item to the shopping list of a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
      name: shoppingCreateItemRequestSchema.shape.name.describe('Item name'),
      quantity: shoppingCreateItemRequestSchema.shape.quantity.describe('Free-text quantity (e.g. "2", "500 g")'),
      category: shoppingCreateItemRequestSchema.shape.category.describe('Category (e.g. "Groceries", "Pharmacy")'),
      assigned_user_id: shoppingCreateItemRequestSchema.shape.assigned_user_id.describe('User ID who buys this item'),
      notes: shoppingCreateItemRequestSchema.shape.notes.describe('Additional notes'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async createShoppingItem(
    { tripId, name, quantity, category, assigned_user_id, notes }: {
      tripId: number; name: string; quantity?: string | null; category?: string | null; assigned_user_id?: number | null; notes?: string | null;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.shopping.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const item = this.shopping.createItem(tripId, { name, quantity, category, assigned_user_id, notes });
    this.guards.safeBroadcast(tripId, 'shopping:created', { item });
    return ok({ item });
  }

  @Tool({
    name: 'update_shopping_item',
    description: 'Update a shopping list item. Only provided fields are changed; omitted fields stay as-is. Pass null to clear a nullable field.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
      name: shoppingUpdateItemRequestSchema.shape.name,
      quantity: shoppingUpdateItemRequestSchema.shape.quantity.describe('Set to null to clear'),
      category: shoppingUpdateItemRequestSchema.shape.category.describe('Set to null to clear'),
      assigned_user_id: shoppingUpdateItemRequestSchema.shape.assigned_user_id.describe('Set to null to unassign'),
      notes: shoppingUpdateItemRequestSchema.shape.notes.describe('Set to null to clear'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async updateShoppingItem(
    { tripId, itemId, name, quantity, category, assigned_user_id, notes }: {
      tripId: number; itemId: number; name?: string; quantity?: string | null; category?: string | null; assigned_user_id?: number | null; notes?: string | null;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.shopping.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    // bodyKeys signals which nullable fields were explicitly provided
    const provided = { quantity, category, assigned_user_id, notes };
    const bodyKeys = Object.entries(provided).filter(([, v]) => v !== undefined).map(([k]) => k);
    const item = this.shopping.updateItem(tripId, itemId, { name, quantity, category, assigned_user_id, notes }, bodyKeys);
    if (!item) return errorResult('Shopping item not found.');
    this.guards.safeBroadcast(tripId, 'shopping:updated', { item });
    return ok({ item });
  }

  @Tool({
    name: 'toggle_shopping_item',
    description: 'Mark a shopping list item as bought (checked) or not.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
      checked: z.boolean().describe('True to mark bought, false to uncheck'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async toggleShoppingItem({ tripId, itemId, checked }: { tripId: number; itemId: number; checked: boolean }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.shopping.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const item = this.shopping.updateItem(tripId, itemId, { checked: checked ? 1 : 0 }, []);
    if (!item) return errorResult('Shopping item not found.');
    this.guards.safeBroadcast(tripId, 'shopping:updated', { item });
    return ok({ item });
  }

  @Tool({
    name: 'delete_shopping_item',
    description: 'Delete a shopping list item.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async deleteShoppingItem({ tripId, itemId }: { tripId: number; itemId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.shopping.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const deleted = this.shopping.deleteItem(tripId, itemId);
    if (!deleted) return errorResult('Shopping item not found.');
    this.guards.safeBroadcast(tripId, 'shopping:deleted', { itemId });
    return ok({ success: true });
  }

  @Tool({
    name: 'clear_checked_shopping_items',
    description: 'Delete every checked (bought) item from the shopping list of a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async clearCheckedShoppingItems({ tripId }: { tripId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.shopping.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const deletedIds = this.shopping.clearChecked(tripId);
    for (const itemId of deletedIds) this.guards.safeBroadcast(tripId, 'shopping:deleted', { itemId });
    return ok({ success: true, deletedIds });
  }

  @Tool({
    name: 'reorder_shopping_items',
    description: 'Reorder the shopping list of a trip by providing a new ordered list of item IDs.',
    inputSchema: {
      tripId: z.number().int().positive(),
      orderedIds: shoppingReorderRequestSchema.shape.orderedIds.describe('All item IDs in the desired order'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async reorderShoppingItems({ tripId, orderedIds }: { tripId: number; orderedIds: number[] }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.shopping.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    this.shopping.reorderItems(tripId, orderedIds);
    return ok({ success: true });
  }

  @ResourceTemplate({
    name: 'trip-shopping',
    uriTemplate: 'trek://trips/{tripId}/shopping',
    description: 'Shopping list items for a trip, ordered by position',
    mimeType: 'application/json',
    when: packingAddonOn,
    access: { group: 'packing', mode: 'read' },
  })
  async tripShoppingResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.shopping.verifyTripAccess(id, ctx.userId)) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Trip not found or access denied' }),
        }],
      };
    }
    const items = this.shopping.listItems(id);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(items, null, 2),
      }],
    };
  }
}
