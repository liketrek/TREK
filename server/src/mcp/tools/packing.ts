import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { canAccessTrip } from '../../db/database';
import { isDemoUser } from '../../services/authService';
import {
  createItem as createPackingItem, updateItem as updatePackingItem,
  deleteItem as deletePackingItem,
  reorderItems as reorderPackingItems,
  listBags, createBag, updateBag, deleteBag, setBagMembers,
  getCategoryAssignees as getPackingCategoryAssignees,
  updateCategoryAssignees as updatePackingCategoryAssignees,
  applyTemplate, saveAsTemplate, listTemplates, bulkImport,
} from '../../services/packingService';
import {
  safeBroadcast, TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, noAccess, ok, hasTripPermission, permissionDenied,
  isAdminUser, adminRequired,
} from './_shared';
import { canRead, canWrite } from '../scopes';
import { isAddonEnabled, deletePackingTemplate } from '../../services/adminService';
import { ADDON_IDS } from '../../addons';

export function registerPackingTools(server: McpServer, userId: number, scopes: string[] | null): void {
  const R = canRead(scopes, 'packing');
  const W = canWrite(scopes, 'packing');

  if (!isAddonEnabled(ADDON_IDS.PACKING)) return;

  // --- PACKING ---

  if (W) server.registerTool(
    'create_packing_item',
    {
      description: 'Add an item to the packing checklist for a trip.',
      inputSchema: {
        tripId: z.number().int().positive(),
        name: z.string().min(1).max(200),
        category: z.string().max(100).optional().describe('Packing category (e.g. Clothes, Electronics)'),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, name, category }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('packing_edit', tripId, userId)) return permissionDenied();
      const item = createPackingItem(tripId, { name, category: category || 'General' });
      safeBroadcast(tripId, 'packing:created', { item });
      return ok({ item });
    }
  );

  if (W) server.registerTool(
    'toggle_packing_item',
    {
      description: 'Check or uncheck a packing item.',
      inputSchema: {
        tripId: z.number().int().positive(),
        itemId: z.number().int().positive(),
        checked: z.boolean(),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, itemId, checked }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('packing_edit', tripId, userId)) return permissionDenied();
      const item = updatePackingItem(tripId, itemId, { checked: checked ? 1 : 0 }, ['checked']);
      if (!item) return { content: [{ type: 'text' as const, text: 'Packing item not found.' }], isError: true };
      safeBroadcast(tripId, 'packing:updated', { item });
      return ok({ item });
    }
  );

  if (W) server.registerTool(
    'delete_packing_item',
    {
      description: 'Remove an item from the packing checklist.',
      inputSchema: {
        tripId: z.number().int().positive(),
        itemId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ tripId, itemId }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('packing_edit', tripId, userId)) return permissionDenied();
      const deleted = deletePackingItem(tripId, itemId);
      if (!deleted) return { content: [{ type: 'text' as const, text: 'Packing item not found.' }], isError: true };
      safeBroadcast(tripId, 'packing:deleted', { itemId });
      return ok({ success: true });
    }
  );

  // --- PACKING (update) ---

  if (W) server.registerTool(
    'update_packing_item',
    {
      description: 'Rename a packing item or change its category.',
      inputSchema: {
        tripId: z.number().int().positive(),
        itemId: z.number().int().positive(),
        name: z.string().min(1).max(200).optional(),
        category: z.string().max(100).optional(),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, itemId, name, category }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('packing_edit', tripId, userId)) return permissionDenied();
      const bodyKeys = ['name', 'category'].filter(k => k === 'name' ? name !== undefined : category !== undefined);
      const item = updatePackingItem(tripId, itemId, { name, category }, bodyKeys);
      if (!item) return { content: [{ type: 'text' as const, text: 'Packing item not found.' }], isError: true };
      safeBroadcast(tripId, 'packing:updated', { item });
      return ok({ item });
    }
  );

  // --- PACKING ADVANCED ---

  if (W) server.registerTool(
    'reorder_packing_items',
    {
      description: 'Set the display order of packing items within a trip.',
      inputSchema: {
        tripId: z.number().int().positive(),
        orderedIds: z.array(z.number().int().positive()).describe('Packing item IDs in desired order'),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, orderedIds }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('packing_edit', tripId, userId)) return permissionDenied();
      reorderPackingItems(tripId, orderedIds);
      safeBroadcast(tripId, 'packing:reordered', { orderedIds });
      return ok({ success: true });
    }
  );

  if (R) server.registerTool(
    'list_packing_bags',
    {
      description: 'List all packing bags for a trip.',
      inputSchema: {
        tripId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ tripId }) => {
      if (!canAccessTrip(tripId, userId)) return noAccess();
      const bags = listBags(tripId);
      return ok({ bags });
    }
  );

  if (W) server.registerTool(
    'create_packing_bag',
    {
      description: 'Create a new packing bag (e.g. "Carry-on", "Checked bag").',
      inputSchema: {
        tripId: z.number().int().positive(),
        name: z.string().min(1).max(100),
        color: z.string().optional(),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, name, color }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('packing_edit', tripId, userId)) return permissionDenied();
      // createBag returns a bare row; hydrate with the empty members array that
      // listBags and the schema always carry, so the client/AI consumer matches.
      const bag = { ...(createBag(tripId, { name, color }) as object), members: [] };
      safeBroadcast(tripId, 'packing:bag-created', { bag });
      return ok({ bag });
    }
  );

  if (W) server.registerTool(
    'update_packing_bag',
    {
      description: 'Rename or recolor a packing bag.',
      inputSchema: {
        tripId: z.number().int().positive(),
        bagId: z.number().int().positive(),
        name: z.string().optional(),
        color: z.string().optional(),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, bagId, name, color }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('packing_edit', tripId, userId)) return permissionDenied();
      const fields: Record<string, unknown> = {};
      const bodyKeys: string[] = [];
      if (name !== undefined) { fields.name = name; bodyKeys.push('name'); }
      if (color !== undefined) { fields.color = color; bodyKeys.push('color'); }
      const updated = updateBag(tripId, bagId, fields, bodyKeys);
      if (!updated) return { content: [{ type: 'text' as const, text: 'Bag not found.' }], isError: true };
      // Hydrate with the members array (matches create_packing_bag, listBags, and the schema).
      const bag = listBags(tripId).find(b => b.id === (updated as { id: number }).id) ?? { ...(updated as object), members: [] };
      safeBroadcast(tripId, 'packing:bag-updated', { bag });
      return ok({ bag });
    }
  );

  if (W) server.registerTool(
    'delete_packing_bag',
    {
      description: 'Delete a packing bag (items in the bag are unassigned, not deleted).',
      inputSchema: {
        tripId: z.number().int().positive(),
        bagId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ tripId, bagId }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('packing_edit', tripId, userId)) return permissionDenied();
      deleteBag(tripId, bagId);
      safeBroadcast(tripId, 'packing:bag-deleted', { id: bagId });
      return ok({ success: true });
    }
  );

  if (W) server.registerTool(
    'set_bag_members',
    {
      description: 'Assign trip members to a packing bag (determines who packs what bag).',
      inputSchema: {
        tripId: z.number().int().positive(),
        bagId: z.number().int().positive(),
        userIds: z.array(z.number().int().positive()),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, bagId, userIds }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('packing_edit', tripId, userId)) return permissionDenied();
      const members = setBagMembers(tripId, bagId, userIds);
      if (!members) return { content: [{ type: 'text' as const, text: 'Bag not found.' }], isError: true };
      safeBroadcast(tripId, 'packing:bag-members-updated', { bagId, members });
      return ok({ members });
    }
  );

  if (R) server.registerTool(
    'get_packing_category_assignees',
    {
      description: 'Get which trip members are assigned to each packing category.',
      inputSchema: {
        tripId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ tripId }) => {
      if (!canAccessTrip(tripId, userId)) return noAccess();
      const assignees = getPackingCategoryAssignees(tripId);
      return ok({ assignees });
    }
  );

  if (W) server.registerTool(
    'set_packing_category_assignees',
    {
      description: 'Assign trip members to a packing category.',
      inputSchema: {
        tripId: z.number().int().positive(),
        categoryName: z.string().min(1).max(100),
        userIds: z.array(z.number().int().positive()),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, categoryName, userIds }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('packing_edit', tripId, userId)) return permissionDenied();
      const assignees = updatePackingCategoryAssignees(tripId, categoryName, userIds);
      safeBroadcast(tripId, 'packing:assignees', { category: categoryName, assignees });
      return ok({ assignees });
    }
  );

  if (W) server.registerTool(
    'apply_packing_template',
    {
      description: 'Apply a packing template to a trip (adds items from the template).',
      inputSchema: {
        tripId: z.number().int().positive(),
        templateId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, templateId }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('packing_edit', tripId, userId)) return permissionDenied();
      const items = applyTemplate(tripId, templateId);
      if (items === null) return { content: [{ type: 'text' as const, text: 'Template not found.' }], isError: true };
      safeBroadcast(tripId, 'packing:template-applied', { items });
      return ok({ items, count: items.length });
    }
  );

  if (R) server.registerTool(
    'list_packing_templates',
    {
      description: 'List the reusable packing templates (id, name, item count) so one can be applied with apply_packing_template.',
      inputSchema: {
        tripId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ tripId }) => {
      if (!canAccessTrip(tripId, userId)) return noAccess();
      return ok({ templates: listTemplates() });
    }
  );

  if (W) server.registerTool(
    'save_packing_template',
    {
      description: 'Save the current packing list as a reusable template. Returns the new template (id, name, category/item counts). Admin only.',
      inputSchema: {
        tripId: z.number().int().positive(),
        templateName: z.string().min(1).max(100),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, templateName }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('packing_edit', tripId, userId)) return permissionDenied();
      // Templates are global; the REST route restricts saving to admins. Match it.
      if (!isAdminUser(userId)) return adminRequired();
      const template = saveAsTemplate(tripId, userId, templateName);
      if (!template) return { content: [{ type: 'text' as const, text: 'Nothing to save — the packing list is empty.' }], isError: true };
      return ok({ template });
    }
  );

  if (W) server.registerTool(
    'delete_packing_template',
    {
      description: 'Delete a reusable packing template. Templates are global, so deletion is admin only.',
      inputSchema: {
        templateId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ templateId }) => {
      if (isDemoUser(userId)) return demoDenied();
      // Templates are global; the REST route restricts management to admins. Match it.
      if (!isAdminUser(userId)) return adminRequired();
      const result = deletePackingTemplate(String(templateId));
      if ('error' in result) return { content: [{ type: 'text' as const, text: result.error }], isError: true };
      return ok({ success: true, name: result.name });
    }
  );

  if (W) server.registerTool(
    'bulk_import_packing',
    {
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
    },
    async ({ tripId, items }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('packing_edit', tripId, userId)) return permissionDenied();
      const created = bulkImport(tripId, items);
      for (const item of created) safeBroadcast(tripId, 'packing:created', { item });
      return ok({ items: created, count: created.length });
    }
  );
}
