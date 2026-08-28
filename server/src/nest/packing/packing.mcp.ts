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
import {
  packingCreateItemRequestSchema,
  packingSetSharingRequestSchema,
  packingUpdateBagRequestSchema,
  packingUpdateItemRequestSchema,
  type PackingVisibility,
} from '@trek/shared';
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
 *
 * set_packing_item_sharing is the one tool with no legacy ancestor: PUT
 * /:id/sharing had no counterpart here, so the whole three-tier sharing model
 * (#858) was invisible to an assistant.
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
    description: 'Add an item to the packing checklist for a trip. It lands on the common list everyone shares unless visibility says otherwise; use set_packing_item_sharing to move an existing item between those tiers.',
    inputSchema: {
      tripId: z.number().int().positive(),
      name: z.string().min(1).max(200),
      category: z.string().max(100).optional().describe('Packing category (e.g. Clothes, Electronics)'),
      checked: packingCreateItemRequestSchema.shape.checked.describe('Create the item already ticked off'),
      is_private: packingCreateItemRequestSchema.shape.is_private.describe('Keep the item to yourself; visibility says the same thing with more nuance'),
      visibility: packingCreateItemRequestSchema.shape.visibility.describe("Which list the item belongs to: 'common' (the group pool, the default), 'personal' (yours alone), or 'shared' (yours plus recipient_ids)"),
      recipient_ids: packingCreateItemRequestSchema.shape.recipient_ids.describe("For visibility 'shared': the trip members the item is brought for. Ignored otherwise, and ids outside the trip roster are dropped"),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async createPackingItem(
    { tripId, name, category, checked, is_private, visibility, recipient_ids }: { tripId: number; name: string; category?: string; checked?: boolean | number; is_private?: boolean; visibility?: PackingVisibility; recipient_ids?: number[] },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const item = this.packing.createItem(tripId, {
      name,
      category: category || 'General',
      // checked takes a boolean or the legacy 0/1, exactly as the REST body does.
      checked: checked === undefined ? undefined : !!checked,
      is_private,
      visibility,
      recipient_ids,
    }, ctx.userId);
    // A restricted item (#858) reaches its owner and recipients only; a Common
    // one answers null here and goes to the whole room.
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
    description: 'Change a packing item: rename it, recategorise it, move it into a bag, set how many are needed, record its weight, or flip it between the common list and your own. Ticking it off is toggle_packing_item; choosing who a private item is shared with is set_packing_item_sharing.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
      name: z.string().min(1).max(200).optional(),
      category: z.string().max(100).optional(),
      bag_id: packingUpdateItemRequestSchema.shape.bag_id.describe('Bag to pack the item into (ids come from list_packing_bags); null takes it out of its bag'),
      quantity: packingUpdateItemRequestSchema.shape.quantity.describe('How many to pack, clamped to 1-999'),
      weight_grams: packingUpdateItemRequestSchema.shape.weight_grams.describe('Weight in grams, which feeds the bag fill bar; null clears it'),
      is_private: packingUpdateItemRequestSchema.shape.is_private.describe('true takes the item off the common list and onto the caller\'s own'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async updatePackingItem(
    { tripId, itemId, name, category, bag_id, quantity, weight_grams, is_private }: { tripId: number; itemId: number; name?: string; category?: string; bag_id?: number | null; quantity?: number; weight_grams?: number | null; is_private?: boolean },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const fields = { name, category, bag_id, quantity, weight_grams, is_private };
    // The service reads presence from bodyKeys, so a field has to be named there
    // for an explicit null to clear it rather than read as "leave it alone".
    const bodyKeys = Object.keys(fields).filter(k => fields[k as keyof typeof fields] !== undefined);
    // Privacy state before the write, so a public↔private flip routes the
    // broadcast the way the REST route does instead of leaking a freshly
    // privatized item (or leaving a stale copy on everyone else's screen).
    const wasPrivate = !!this.packing.getItemPrivacy(tripId, itemId)?.is_private;
    const item = this.packing.updateItem(tripId, itemId, fields, bodyKeys, undefined, ctx.userId);
    if (!item) return errorResult('Packing item not found.');
    this.broadcastItemUpdate(tripId, itemId, item, wasPrivate);
    return ok({ item });
  }

  /**
   * The four privacy transitions of an item update (#858), as
   * PackingService.broadcastUpdate does them for REST, but over safeBroadcast so
   * the events keep the MCP marker and the tool survives a broadcast failure.
   */
  private broadcastItemUpdate(tripId: number, itemId: number, item: { is_private?: number; owner_id?: number | null; recipients?: { user_id: number }[] }, wasPrivate: boolean) {
    const viewers = this.packing.viewersOf(item);
    if (item.is_private) {
      // Newly restricted: take it off the room's screens first, then hand it
      // back to the people who may still see it.
      if (!wasPrivate) this.guards.safeBroadcast(tripId, 'packing:deleted', { itemId });
      this.guards.safeBroadcast(tripId, wasPrivate ? 'packing:updated' : 'packing:created', { item }, viewers);
      return;
    }
    // Newly common: the members who never had the row need it created, not updated.
    if (wasPrivate) this.guards.safeBroadcast(tripId, 'packing:created', { item });
    this.guards.safeBroadcast(tripId, 'packing:updated', { item });
  }

  @Tool({
    name: 'set_packing_item_sharing',
    description: 'Move an existing packing item between the three sharing tiers: the common list the whole trip pools into, the owner\'s own list, or shared with named trip members. Only the item\'s owner may change this. Everything else about an item is update_packing_item.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
      visibility: packingSetSharingRequestSchema.shape.visibility.describe("'common' puts the item in the group pool, 'personal' keeps it to the owner, 'shared' covers the people in recipient_ids"),
      recipient_ids: packingSetSharingRequestSchema.shape.recipient_ids.describe("For 'shared': the trip members the item is brought for. Ids outside the trip roster are dropped, and any previous recipients are replaced"),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async setPackingItemSharing(
    { tripId, itemId, visibility, recipient_ids }: { tripId: number; itemId: number; visibility: PackingVisibility; recipient_ids?: number[] },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const item = this.packing.setItemSharing(tripId, itemId, ctx.userId, visibility, recipient_ids ?? []);
    if (!item) return errorResult('Packing item not found.');
    if ((item as { forbidden?: boolean }).forbidden) return errorResult('Only the owner can change sharing.');
    // The viewer set just changed: drop the item from the whole room, then hand
    // it back to whoever may see it now, as the REST route does.
    this.guards.safeBroadcast(tripId, 'packing:deleted', { itemId });
    this.guards.safeBroadcast(tripId, 'packing:created', { item }, this.packing.viewersOf(item));
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
    description: 'Rename or recolor a packing bag, give it a weight limit, or hand it to one traveller. Who else packs into it is set_bag_members.',
    inputSchema: {
      tripId: z.number().int().positive(),
      bagId: z.number().int().positive(),
      name: z.string().optional(),
      color: z.string().optional(),
      weight_limit_grams: packingUpdateBagRequestSchema.shape.weight_limit_grams.describe('Allowance in grams the bag is measured against (the fill bar); null lifts the limit'),
      user_id: packingUpdateBagRequestSchema.shape.user_id.describe('Trip member the bag belongs to; null leaves it unassigned, and an id outside the trip roster unassigns it too'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async updatePackingBag(
    { tripId, bagId, name, color, weight_limit_grams, user_id }: { tripId: number; bagId: number; name?: string; color?: string; weight_limit_grams?: number | null; user_id?: number | null },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('packing_edit', tripId, ctx.userId)) return permissionDenied();
    const fields: { name?: string; color?: string; weight_limit_grams?: number | null; user_id?: number | null } = {};
    const bodyKeys: string[] = [];
    if (name !== undefined) { fields.name = name; bodyKeys.push('name'); }
    if (color !== undefined) { fields.color = color; bodyKeys.push('color'); }
    // Both follow the presence protocol: an omitted key leaves the value alone,
    // an explicit null clears it.
    if (weight_limit_grams !== undefined) { fields.weight_limit_grams = weight_limit_grams; bodyKeys.push('weight_limit_grams'); }
    if (user_id !== undefined) { fields.user_id = user_id; bodyKeys.push('user_id'); }
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
