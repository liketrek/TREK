import {
  McpController, Tool, ResourceTemplate, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, errorResult, ok,
} from '../../nest-mcp';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { ADDON_IDS } from '../../addons';
import { noAccess, permissionDenied, adminRequired } from '../../mcp/tools/_shared';
import { PackingService } from './packing.service';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';

/** Legacy registrar gate: the whole packing surface rides the packing addon. */
const packingAddonOn = addonGate(ADDON_IDS.PACKING);

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Packing MCP surface — ported from the legacy registrars: the seventeen
 * tools from src/mcp/tools/packing.ts and the trek://trips/{tripId}/packing +
 * trek://trips/{tripId}/packing/bags resources from src/mcp/resources.ts
 * (identical names, descriptions, schemas, annotations and error/payload
 * shapes; the one deviation is the packing:bag-deleted payload, aligned with
 * the REST route). The registration-time gates map to `when` (the
 * whole-registrar packing-addon early return) plus the declarative packing
 * read/write access markers (the legacy `if (R)` / `if (W)` checks, resolved
 * by trekMcpAccessPolicy). The two template-management tools keep their inline
 * admin gate (isAdminUser), matching the REST routes.
 */
@McpController()
export class PackingMcp {
  constructor(
    private readonly packing: PackingService,
    private readonly auth: AuthService,
    readonly addons: AddonsService,
    private readonly guards: McpToolGuardsService,
  ) {}

  // --- PACKING ---

  @Tool({
    name: 'create_packing_item',
    description: 'Add an item to the packing checklist for a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
      name: z.string().min(1).max(200),
      category: z.string().max(100).optional().describe('Packing category (e.g. Clothes, Electronics)'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async createPackingItem({ tripId, name, category }: { tripId: number; name: string; category?: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const item = this.packing.createItem(tripId, { name, category: category || 'General' }, ctx.userId);
    // A tool-made item is Common today, so this asks the room. Routed through
    // viewersOf anyway, so the day createItem learns to make a restricted one
    // this does not have to be remembered a second time.
    this.guards.safeBroadcast(tripId, 'packing:created', { item }, this.packing.viewersOf(item));
    return ok({ item });
  }

  @Tool({
    name: 'toggle_packing_item',
    description: 'Check or uncheck a packing item.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
      checked: z.boolean(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async togglePackingItem({ tripId, itemId, checked }: { tripId: number; itemId: number; checked: boolean }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const item = this.packing.updateItem(tripId, itemId, { checked: checked ? 1 : 0 }, ['checked'], undefined, ctx.userId);
    if (!item) return errorResult('Packing item not found.');
    // Scoped to the people who may see it, exactly as the REST route does
    // (#858, #1976). A Common item answers null here and goes to the room.
    this.guards.safeBroadcast(tripId, 'packing:updated', { item }, this.packing.viewersOf(item));
    return ok({ item });
  }

  @Tool({
    name: 'delete_packing_item',
    description: 'Remove an item from the packing checklist.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async deletePackingItem({ tripId, itemId }: { tripId: number; itemId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const deleted = this.packing.deleteItem(tripId, itemId, ctx.userId);
    if (!deleted) return errorResult('Packing item not found.');
    // deleteItem hands back the row it removed, so the delete can be scoped to
    // the same people the item was ever visible to (#1976).
    this.guards.safeBroadcast(tripId, 'packing:deleted', { itemId }, this.packing.viewersOf(deleted));
    return ok({ success: true });
  }

  // --- PACKING (update) ---

  @Tool({
    name: 'update_packing_item',
    description: 'Rename a packing item or change its category.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
      name: z.string().min(1).max(200).optional(),
      category: z.string().max(100).optional(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async updatePackingItem({ tripId, itemId, name, category }: { tripId: number; itemId: number; name?: string; category?: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const bodyKeys = ['name', 'category'].filter(k => k === 'name' ? name !== undefined : category !== undefined);
    const item = this.packing.updateItem(tripId, itemId, { name, category }, bodyKeys, undefined, ctx.userId);
    if (!item) return errorResult('Packing item not found.');
    this.guards.safeBroadcast(tripId, 'packing:updated', { item }, this.packing.viewersOf(item));
    return ok({ item });
  }

  // --- PACKING ADVANCED ---

  @Tool({
    name: 'reorder_packing_items',
    description: 'Set the display order of packing items within a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
      orderedIds: z.array(z.number().int().positive()).describe('Packing item IDs in desired order'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async reorderPackingItems({ tripId, orderedIds }: { tripId: number; orderedIds: number[] }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    this.packing.reorderItems(tripId, orderedIds);
    this.guards.safeBroadcast(tripId, 'packing:reordered', { orderedIds });
    return ok({ success: true });
  }

  @Tool({
    name: 'list_packing_bags',
    description: 'List all packing bags for a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'read' },
  })
  async listPackingBags({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    const bags = this.packing.listBags(tripId);
    return ok({ bags });
  }

  @Tool({
    name: 'create_packing_bag',
    description: 'Create a new packing bag (e.g. "Carry-on", "Checked bag").',
    inputSchema: {
      tripId: z.number().int().positive(),
      name: z.string().min(1).max(100),
      color: z.string().optional(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async createPackingBag({ tripId, name, color }: { tripId: number; name: string; color?: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    // createBag returns a bare row; hydrate with the empty members array that
    // listBags and the schema always carry, so the client/AI consumer matches.
    const bag = { ...(this.packing.createBag(tripId, { name, color }) as object), members: [] };
    this.guards.safeBroadcast(tripId, 'packing:bag-created', { bag });
    return ok({ bag });
  }

  @Tool({
    name: 'update_packing_bag',
    description: 'Rename or recolor a packing bag.',
    inputSchema: {
      tripId: z.number().int().positive(),
      bagId: z.number().int().positive(),
      name: z.string().optional(),
      color: z.string().optional(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async updatePackingBag({ tripId, bagId, name, color }: { tripId: number; bagId: number; name?: string; color?: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const fields: Record<string, unknown> = {};
    const bodyKeys: string[] = [];
    if (name !== undefined) { fields.name = name; bodyKeys.push('name'); }
    if (color !== undefined) { fields.color = color; bodyKeys.push('color'); }
    const updated = this.packing.updateBag(tripId, bagId, fields, bodyKeys);
    if (!updated) return errorResult('Bag not found.');
    // Hydrate with the members array (matches create_packing_bag, listBags, and the schema).
    const bag = this.packing.listBags(tripId).find(b => b.id === (updated as { id: number }).id) ?? { ...(updated as object), members: [] };
    this.guards.safeBroadcast(tripId, 'packing:bag-updated', { bag });
    return ok({ bag });
  }

  @Tool({
    name: 'delete_packing_bag',
    description: 'Delete a packing bag (items in the bag are unassigned, not deleted).',
    inputSchema: {
      tripId: z.number().int().positive(),
      bagId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async deletePackingBag({ tripId, bagId }: { tripId: number; bagId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    this.packing.deleteBag(tripId, bagId);
    // { bagId } matches the REST route and the plugin host (the legacy
    // registrar's { id } was the odd one out).
    this.guards.safeBroadcast(tripId, 'packing:bag-deleted', { bagId });
    return ok({ success: true });
  }

  @Tool({
    name: 'set_bag_members',
    description: 'Assign trip members to a packing bag (determines who packs what bag).',
    inputSchema: {
      tripId: z.number().int().positive(),
      bagId: z.number().int().positive(),
      userIds: z.array(z.number().int().positive()),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async setBagMembers({ tripId, bagId, userIds }: { tripId: number; bagId: number; userIds: number[] }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const members = this.packing.setBagMembers(tripId, bagId, userIds);
    if (!members) return errorResult('Bag not found.');
    this.guards.safeBroadcast(tripId, 'packing:bag-members-updated', { bagId, members });
    return ok({ members });
  }

  @Tool({
    name: 'get_packing_category_assignees',
    description: 'Get which trip members are assigned to each packing category.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'read' },
  })
  async getPackingCategoryAssignees({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    const assignees = this.packing.getCategoryAssignees(tripId);
    return ok({ assignees });
  }

  @Tool({
    name: 'set_packing_category_assignees',
    description: 'Assign trip members to a packing category.',
    inputSchema: {
      tripId: z.number().int().positive(),
      categoryName: z.string().min(1).max(100),
      userIds: z.array(z.number().int().positive()),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async setPackingCategoryAssignees({ tripId, categoryName, userIds }: { tripId: number; categoryName: string; userIds: number[] }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const assignees = this.packing.updateCategoryAssignees(tripId, categoryName, userIds);
    this.guards.safeBroadcast(tripId, 'packing:assignees', { category: categoryName, assignees });
    return ok({ assignees });
  }

  @Tool({
    name: 'apply_packing_template',
    description: 'Apply a packing template to a trip (adds items from the template).',
    inputSchema: {
      tripId: z.number().int().positive(),
      templateId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async applyPackingTemplate({ tripId, templateId }: { tripId: number; templateId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const items = this.packing.applyTemplate(tripId, templateId);
    if (items === null) return errorResult('Template not found.');
    this.guards.safeBroadcast(tripId, 'packing:template-applied', { items });
    return ok({ items, count: items.length });
  }

  @Tool({
    name: 'list_packing_templates',
    description: 'List the reusable packing templates (id, name, item count) so one can be applied with apply_packing_template.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'read' },
  })
  async listPackingTemplates({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    return ok({ templates: this.packing.listTemplates() });
  }

  @Tool({
    name: 'save_packing_template',
    description: 'Save the current packing list as a reusable template. Returns the new template (id, name, category/item counts). Admin only.',
    inputSchema: {
      tripId: z.number().int().positive(),
      templateName: z.string().min(1).max(100),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async savePackingTemplate({ tripId, templateName }: { tripId: number; templateName: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    // Templates are global; the REST route restricts saving to admins. Match it.
    if (!this.guards.isAdminUser(ctx.userId)) return adminRequired();
    const template = this.packing.saveAsTemplate(tripId, ctx.userId, templateName);
    if (!template) return errorResult('Nothing to save — the packing list is empty.');
    return ok({ template });
  }

  @Tool({
    name: 'delete_packing_template',
    description: 'Delete a reusable packing template. Templates are global, so deletion is admin only.',
    inputSchema: {
      templateId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async deletePackingTemplate({ templateId }: { templateId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    // Templates are global; the REST route restricts management to admins. Match it.
    if (!this.guards.isAdminUser(ctx.userId)) return adminRequired();
    const result = this.packing.deletePackingTemplate(String(templateId));
    if ('error' in result) return errorResult(result.error);
    return ok({ success: true, name: result.name });
  }

  @Tool({
    name: 'bulk_import_packing',
    description: 'Import multiple packing items at once from a list. Optionally assign each to a bag (by name — created if missing), set its weight, or pre-check it.',
    inputSchema: {
      tripId: z.number().int().positive(),
      items: z.array(z.object({
        name: z.string().min(1).max(200),
        category: z.string().optional(),
        quantity: z.number().int().positive().optional(),
        bag: z.string().max(100).optional().describe('Bag name to assign the item to; created if it does not exist'),
        weight_grams: z.number().nonnegative().optional(),
        checked: z.boolean().optional(),
      })).min(1),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async bulkImportPacking(
    { tripId, items }: { tripId: number; items: { name: string; category?: string; quantity?: number; bag?: string; weight_grams?: number; checked?: boolean }[] },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const created = this.packing.bulkImport(tripId, items, ctx.userId);
    for (const item of created) {
      this.guards.safeBroadcast(tripId, 'packing:created', { item }, this.packing.viewersOf(item));
    }
    return ok({ items: created, count: created.length });
  }

  @ResourceTemplate({
    name: 'trip-packing',
    uriTemplate: 'trek://trips/{tripId}/packing',
    description: 'Packing checklist for a trip',
    mimeType: 'application/json',
    when: packingAddonOn,
    access: { group: 'packing', mode: 'read' },
  })
  async tripPackingResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.packing.verifyTripAccess(id, ctx.userId)) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Trip not found or access denied' }),
        }],
      };
    }
    // Hide other members' private items (#858) from the requesting user.
    const items = this.packing.listItems(id, ctx.userId);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(items, null, 2),
      }],
    };
  }

  @ResourceTemplate({
    name: 'trip-packing-bags',
    uriTemplate: 'trek://trips/{tripId}/packing/bags',
    description: 'All packing bags for a trip with their members',
    mimeType: 'application/json',
    when: packingAddonOn,
    access: { group: 'packing', mode: 'read' },
  })
  async tripPackingBagsResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.packing.verifyTripAccess(id, ctx.userId)) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Trip not found or access denied' }),
        }],
      };
    }
    const bags = this.packing.listBags(id);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(bags, null, 2),
      }],
    };
  }

  // The packing-list prompt moved to trips/trip-prompts.mcp.ts: it reads the
  // whole-trip summary for the title, and the read model lives above this
  // module (the fold that deleted trips.bridge).
}
