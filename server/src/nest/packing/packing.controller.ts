import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import type { User } from '../../types';
import { PackingService, isInvalidBagRef } from './packing.service';
import { isUpdateConflict } from '../common/conflictResult';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { toRowId } from '../common/row-id';
import {
  PackingApplyTemplateDto,
  PackingBagMembersDto,
  PackingCategoryAssigneesDto,
  PackingCreateBagDto,
  PackingCreateItemDto,
  PackingImportDto,
  PackingReorderDto,
  PackingSaveTemplateDto,
  PackingSetSharingDto,
  PackingUpdateBagDto,
  PackingUpdateItemDto,
} from './packing.dto';

/** A packing item row carrying the privacy fields (#858) used to scope broadcasts. */
type PackingItemRow = { is_private?: number; owner_id?: number | null; recipients?: { user_id: number }[]; [key: string]: unknown };

/**
 * /api/trips/:tripId/packing — trip-scoped packing list (items, bags, templates,
 * assignees).
 *
 * Byte-identical to the legacy Express route (server/src/routes/packing.ts):
 * every handler verifies trip access (404 "Trip not found"); mutations check the
 * 'packing_edit' permission (403 "No permission"); status codes match (201 on the
 * creates, 200 elsewhere — note POST /apply-template stays 200); and the bespoke
 * 400/404 bodies are reproduced. Mutations broadcast over WebSocket with the
 * forwarded X-Socket-Id. /reorder is declared before /:id so it wins over the param.
 *
 * Bodies validate via the @trek/shared Zod contracts (packing.dto.ts + the
 * global ZodValidationPipe). The pipe's 400 envelope replaced the legacy
 * bespoke name checks that the schemas now enforce (missing item name, invalid
 * visibility); checks the schemas cannot express (whitespace-only names, empty
 * import arrays, the admin template gate) keep their exact legacy strings.
 */
@Controller('api/trips/:tripId/packing')
// TripAccessGuard resolves :tripId and 404s a trip the user cannot reach; mutations
// add @RequirePermission('packing_edit'), the same action string the service's canEdit
// passes, so the HTTP and MCP paths cannot demand different rights.
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class PackingController {
  constructor(private readonly packing: PackingService) {}

  /** Loads the trip or throws the legacy 404; returns it for the permission check. */


  @Get()
  async list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    // Pass the viewer so private items (#858) owned by other members are hidden.
    return { items: await this.packing.listItems(tripId, user.id) };
  }

  @RequirePermission('packing_edit')
  @Post('import')
  async importItems(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: PackingImportDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // The schema guarantees an array; the empty-array rejection stays a bespoke 400.
    if (body.items.length === 0) {
      throw new HttpException({ error: 'items must be a non-empty array' }, 400);
    }
    const created = await this.packing.bulkImport(tripId, body.items, user.id);
    for (const item of created) {
      this.packing.broadcastItem(tripId, 'packing:created', { item }, item, socketId);
    }
    this.packing.broadcastBagTotals(tripId);
    return { items: created, count: created.length };
  }

  @RequirePermission('packing_edit')
  @Post()
  async create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: PackingCreateItemDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // checked arrives as boolean or legacy 0/1 — the service coerces by truthiness.
    const item = await this.packing.createItem(tripId, { name: body.name, category: body.category, checked: body.checked === undefined ? undefined : !!body.checked, weight_grams: body.weight_grams, bag_id: body.bag_id, quantity: body.quantity, is_private: body.is_private, visibility: body.visibility, recipient_ids: body.recipient_ids }, user.id);
    // A bag referenced in the body must exist on this trip (#2154). The payload
    // is at fault, so 400 — the 404 'Bag not found' stays with the path routes.
    if (isInvalidBagRef(item)) {
      throw new HttpException({ error: 'Bag not found' }, 400);
    }
    this.packing.emitToViewers(tripId, 'packing:created', { item }, item, socketId);
    this.packing.broadcastBagTotals(tripId);
    return { item };
  }

  @RequirePermission('packing_edit')
  @Put('reorder')
  async reorder(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: PackingReorderDto,
    @Headers('x-socket-id') _socketId?: string,
  ) {
    await this.packing.reorderItems(tripId, body.orderedIds);
    return { success: true };
  }

  @RequirePermission('packing_edit')
  @Put(':id')
  async update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: PackingUpdateItemDto,
    @Headers('x-socket-id') socketId?: string,
    @Headers('x-base-updated-at') ifMatch?: string,
  ) {
    // Plan 4 Task 8b (U6) — :id is parsed ONCE here (toRowId, not Number():
    // rule 15's NaN-into-SQL trap), and the parsed number is what flows into
    // the service instead of the raw route string reaching the repository.
    // A malformed id never matched under the legacy affinity CAST either,
    // so it 404s with the same body this handler's own not-found branch
    // already produces below.
    const itemId = toRowId(id);
    if (itemId === null) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    // Privacy state before the change, so a public↔private toggle (#858) can route
    // the broadcast correctly instead of leaking a freshly-privatized item.
    const before = await this.packing.getItemPrivacy(tripId, itemId);
    const { name, checked, category, weight_grams, bag_id, quantity, packed_quantity, is_private } = body;
    // bodyKeys carries which keys the request actually provided (the presence-
    // sentinel protocol); the parsed body only ever holds known schema keys.
    // checked arrives as boolean or legacy 0/1 — normalize to the 0/1 the SQL binds.
    const updated = await this.packing.updateItem(tripId, itemId, { name, checked: checked === undefined ? undefined : checked ? 1 : 0, category, weight_grams, bag_id, quantity, packed_quantity, is_private }, Object.keys(body), ifMatch, user.id);
    if (!updated) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    // Stale offline overwrite — surface the conflict for client-side resolution (#1135).
    if (isUpdateConflict(updated)) {
      throw new HttpException({ error: 'conflict', server: updated.server }, 409);
    }
    // A bag referenced in the body must exist on this trip (#2154) — see create.
    if (isInvalidBagRef(updated)) {
      throw new HttpException({ error: 'Bag not found' }, 400);
    }
    this.packing.broadcastUpdate(tripId, itemId, updated as PackingItemRow, !!before?.is_private, socketId);
    // Only when the write could actually move a weight. Checking an item off is
    // the most frequent packing write there is, and every ping costs every
    // connected client a listBags round trip.
    if (['weight_grams', 'quantity', 'bag_id'].some(k => Object.keys(body).includes(k))) {
      this.packing.broadcastBagTotals(tripId);
    }
    return { item: updated };
  }

  @RequirePermission('packing_edit')
  @Delete(':id')
  async remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — same single gate-level parse as update above.
    const itemId = toRowId(id);
    if (itemId === null) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    const deleted = await this.packing.deleteItem(tripId, itemId, user.id);
    if (!deleted) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    // Scope the delete to the people who could see it (owner + recipients, #858).
    // `deleted` is already a concretely-typed `PackingItemRow` (Plan 3e Task 3's
    // `PackingItemsRepository`, via `PackingService.deleteItem`'s return type) —
    // no cast needed, unlike `updated` above (that one's inferred as `unknown`).
    this.packing.emitToViewers(tripId, 'packing:deleted', { itemId }, deleted, socketId);
    this.packing.broadcastBagTotals(tripId);
    return { success: true };
  }

  @RequirePermission('packing_edit')
  @Put(':id/sharing')
  async setSharing(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: PackingSetSharingDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — same single gate-level parse as update above.
    const itemId = toRowId(id);
    if (itemId === null) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    const updated = await this.packing.setItemSharing(tripId, itemId, user.id, body.visibility, Array.isArray(body.recipient_ids) ? body.recipient_ids : []);
    if (!updated) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    if ((updated as { forbidden?: boolean }).forbidden) {
      throw new HttpException({ error: 'Only the owner can change sharing' }, 403);
    }
    // The viewer set just changed: drop the item from the whole room, then re-add
    // it for whoever can now see it (owner + recipients, or everyone if Common).
    this.packing.broadcast(tripId, 'packing:deleted', { itemId }, socketId);
    this.packing.emitToViewers(tripId, 'packing:created', { item: updated }, updated as PackingItemRow, socketId);
    return { item: updated };
  }

  @RequirePermission('packing_edit')
  @Post(':id/clone')
  @HttpCode(201)
  async clone(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — same single gate-level parse as update above.
    const itemId = toRowId(id);
    if (itemId === null) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    const item = await this.packing.cloneItem(tripId, itemId, user.id);
    if (!item) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    // The clone is personal to the caller — only their sockets need it.
    this.packing.emitToViewers(tripId, 'packing:created', { item }, item, socketId);
    this.packing.broadcastBagTotals(tripId);
    return { item };
  }

  @RequirePermission('packing_edit')
  @Post(':id/contributors')
  async addContributor(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — :id parsed ONCE here (toRowId). #858's
    // contributors/sharing routes are native Nest code with no pre-ORM
    // Express precedent (introduced in 7eabf6066, after the migration), so
    // there is no legacy affinity-seam behavior to match — a malformed id
    // just 404s the same way an unknown one already does below.
    const itemId = toRowId(id);
    if (itemId === null) {
      throw new HttpException({ error: 'Item not found or not a shared list item' }, 404);
    }
    const item = await this.packing.addContributor(tripId, itemId, user.id);
    if (!item) {
      throw new HttpException({ error: 'Item not found or not a shared list item' }, 404);
    }
    // Common item — visible to all, so the contributor change broadcasts to the room.
    this.packing.broadcast(tripId, 'packing:updated', { item }, socketId);
    return { item };
  }

  @RequirePermission('packing_edit')
  @Delete(':id/contributors/:userId')
  async removeContributor(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — :id/:userId both parsed ONCE here (toRowId, not
    // Number.parseInt(): the NaN-into-SQL trap row-id.ts documents — a
    // malformed userId used to reach contributorsRepo.deleteOne as a bare
    // NaN parameter). Same "no legacy precedent" note as addContributor above.
    const itemId = toRowId(id);
    const target = toRowId(userId);
    if (itemId === null || target === null) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    // You can drop your own pledge; the owner can remove anyone's.
    const item = await this.packing.removeContributor(tripId, itemId, target);
    if (!item) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    this.packing.broadcast(tripId, 'packing:updated', { item }, socketId);
    return { item };
  }

  @Get('bags')
  async listBags(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    // unassigned_weight_grams rides along so the "no bag" pile and the grand
    // total follow the same rule as the bags themselves (#2191) — a screen
    // mixing true totals with per-viewer ones would be worse than either.
    return await this.packing.listBagsWithWeights(tripId);
  }

  @RequirePermission('packing_edit')
  @Post('bags')
  async createBag(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: PackingCreateBagDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // The schema requires a non-empty name; whitespace-only still 400s here.
    if (!body.name.trim()) {
      throw new HttpException({ error: 'Name is required' }, 400);
    }
    const bag = await this.packing.createBag(tripId, { name: body.name, color: body.color, weight_limit_grams: body.weight_limit_grams });
    this.packing.broadcast(tripId, 'packing:bag-created', { bag }, socketId);
    return { bag };
  }

  @RequirePermission('packing_edit')
  @Put('bags/:bagId')
  async updateBag(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('bagId') bagId: string,
    @Body() body: PackingUpdateBagDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — :bagId is parsed ONCE here (toRowId, not
    // Number(): rule 15's NaN-into-SQL trap). A malformed id never matched
    // under the legacy affinity CAST either, so it 404s with the same body
    // this handler's own not-found branch already produces below.
    const bagIdNum = toRowId(bagId);
    if (bagIdNum === null) {
      throw new HttpException({ error: 'Bag not found' }, 404);
    }
    const { name, color, weight_limit_grams, user_id } = body;
    // bodyKeys carries which keys the request actually provided (the presence-
    // sentinel protocol); the parsed body only ever holds known schema keys.
    const updated = await this.packing.updateBag(tripId, bagIdNum, { name, color, weight_limit_grams, user_id }, Object.keys(body));
    if (!updated) {
      throw new HttpException({ error: 'Bag not found' }, 404);
    }
    this.packing.broadcast(tripId, 'packing:bag-updated', { bag: updated }, socketId);
    return { bag: updated };
  }

  @RequirePermission('packing_edit')
  @Delete('bags/:bagId')
  async deleteBag(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('bagId') bagId: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — same single gate-level parse as updateBag above.
    const bagIdNum = toRowId(bagId);
    if (bagIdNum === null) {
      throw new HttpException({ error: 'Bag not found' }, 404);
    }
    if (!(await this.packing.deleteBag(tripId, bagIdNum))) {
      throw new HttpException({ error: 'Bag not found' }, 404);
    }
    this.packing.broadcast(tripId, 'packing:bag-deleted', { bagId: bagIdNum }, socketId);
    // bag_id is ON DELETE SET NULL, so everything that was in it just landed in
    // the unassigned pile — both figures moved.
    this.packing.broadcastBagTotals(tripId);
    return { success: true };
  }

  @Get('templates')
  async listTemplates(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { templates: await this.packing.listTemplates() };
  }

  @RequirePermission('packing_edit')
  @Post('apply-template/:templateId')
  @HttpCode(200)
  async applyTemplate(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('templateId') templateId: string,
    @Body() body: PackingApplyTemplateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — :templateId is parsed ONCE here (toRowId, not
    // Number(): rule 15's NaN-into-SQL trap). A malformed id never matched
    // under the legacy affinity CAST either, so it 404s with the same body
    // this handler's own not-found branch already produces below.
    const templateIdNum = toRowId(templateId);
    if (templateIdNum === null) {
      throw new HttpException({ error: 'Template not found or empty' }, 404);
    }
    const visibility = body?.visibility === 'personal' ? 'personal' : 'common';
    const added = await this.packing.applyTemplate(tripId, templateIdNum, visibility, user.id);
    if (!added) {
      throw new HttpException({ error: 'Template not found or empty' }, 404);
    }
    this.packing.broadcastItem(tripId, 'packing:template-applied', { items: added }, added[0], socketId);
    this.packing.broadcastBagTotals(tripId);
    return { items: added, count: added.length };
  }

  @RequirePermission('packing_edit')
  @Put('bags/:bagId/members')
  async setBagMembers(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('bagId') bagId: string,
    @Body() body: PackingBagMembersDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — same single gate-level parse as updateBag above.
    const bagIdNum = toRowId(bagId);
    if (bagIdNum === null) {
      throw new HttpException({ error: 'Bag not found' }, 404);
    }
    const members = await this.packing.setBagMembers(tripId, bagIdNum, body.user_ids);
    if (!members) {
      throw new HttpException({ error: 'Bag not found' }, 404);
    }
    this.packing.broadcast(tripId, 'packing:bag-members-updated', { bagId: bagIdNum, members }, socketId);
    return { members };
  }

  @RequirePermission('packing_edit')
  @Post('save-as-template')
  async saveAsTemplate(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: PackingSaveTemplateDto,
  ) {
    if (user.role !== 'admin') {
      throw new HttpException({ error: 'Admin access required' }, 403);
    }
    // The schema requires a non-empty name; whitespace-only still 400s here.
    if (!body.name.trim()) {
      throw new HttpException({ error: 'Template name is required' }, 400);
    }
    const template = await this.packing.saveAsTemplate(tripId, user.id, body.name.trim());
    if (!template) {
      throw new HttpException({ error: 'No items to save' }, 400);
    }
    return { template };
  }

  @Get('category-assignees')
  async categoryAssignees(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { assignees: await this.packing.getCategoryAssignees(tripId) };
  }

  @RequirePermission('packing_edit')
  @Put('category-assignees/:categoryName')
  async updateCategoryAssignees(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('categoryName') categoryName: string,
    @Body() body: PackingCategoryAssigneesDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const category = decodeURIComponent(categoryName);
    const rows = await this.packing.updateCategoryAssignees(tripId, category, body.user_ids);
    this.packing.broadcast(tripId, 'packing:assignees', { category, assignees: rows }, socketId);
    await this.packing.notifyTagged(tripId, user, category, body.user_ids);
    return { assignees: rows };
  }
}
