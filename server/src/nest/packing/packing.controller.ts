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
import { PackingService } from './packing.service';
import { isUpdateConflict } from '../common/conflictResult';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
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
  list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    // Pass the viewer so private items (#858) owned by other members are hidden.
    return { items: this.packing.listItems(tripId, user.id) };
  }

  @RequirePermission('packing_edit')
  @Post('import')
  importItems(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: PackingImportDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // The schema guarantees an array; the empty-array rejection stays a bespoke 400.
    if (body.items.length === 0) {
      throw new HttpException({ error: 'items must be a non-empty array' }, 400);
    }
    const created = this.packing.bulkImport(tripId, body.items, user.id);
    for (const item of created) {
      this.packing.broadcastItem(tripId, 'packing:created', { item }, item, socketId);
    }
    return { items: created, count: created.length };
  }

  @RequirePermission('packing_edit')
  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: PackingCreateItemDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // checked arrives as boolean or legacy 0/1 — the service coerces by truthiness.
    const item = this.packing.createItem(tripId, { name: body.name, category: body.category, checked: body.checked === undefined ? undefined : !!body.checked, is_private: body.is_private, visibility: body.visibility, recipient_ids: body.recipient_ids }, user.id);
    this.packing.emitToViewers(tripId, 'packing:created', { item }, item, socketId);
    return { item };
  }

  @RequirePermission('packing_edit')
  @Put('reorder')
  reorder(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: PackingReorderDto,
    @Headers('x-socket-id') _socketId?: string,
  ) {
    this.packing.reorderItems(tripId, body.orderedIds);
    return { success: true };
  }

  @RequirePermission('packing_edit')
  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: PackingUpdateItemDto,
    @Headers('x-socket-id') socketId?: string,
    @Headers('x-base-updated-at') ifMatch?: string,
  ) {
    // Privacy state before the change, so a public↔private toggle (#858) can route
    // the broadcast correctly instead of leaking a freshly-privatized item.
    const before = this.packing.getItemPrivacy(tripId, id);
    const { name, checked, category, weight_grams, bag_id, quantity, is_private } = body;
    // bodyKeys carries which keys the request actually provided (the presence-
    // sentinel protocol); the parsed body only ever holds known schema keys.
    // checked arrives as boolean or legacy 0/1 — normalize to the 0/1 the SQL binds.
    const updated = this.packing.updateItem(tripId, id, { name, checked: checked === undefined ? undefined : checked ? 1 : 0, category, weight_grams, bag_id, quantity, is_private }, Object.keys(body), ifMatch, user.id);
    if (!updated) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    // Stale offline overwrite — surface the conflict for client-side resolution (#1135).
    if (isUpdateConflict(updated)) {
      throw new HttpException({ error: 'conflict', server: updated.server }, 409);
    }
    this.packing.broadcastUpdate(tripId, id, updated as PackingItemRow, !!before?.is_private, socketId);
    return { item: updated };
  }

  @RequirePermission('packing_edit')
  @Delete(':id')
  remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const deleted = this.packing.deleteItem(tripId, id, user.id);
    if (!deleted) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    // Scope the delete to the people who could see it (owner + recipients, #858).
    this.packing.emitToViewers(tripId, 'packing:deleted', { itemId: Number(id) }, deleted as PackingItemRow, socketId);
    return { success: true };
  }

  @RequirePermission('packing_edit')
  @Put(':id/sharing')
  setSharing(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: PackingSetSharingDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const updated = this.packing.setItemSharing(tripId, id, user.id, body.visibility, Array.isArray(body.recipient_ids) ? body.recipient_ids : []);
    if (!updated) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    if ((updated as { forbidden?: boolean }).forbidden) {
      throw new HttpException({ error: 'Only the owner can change sharing' }, 403);
    }
    // The viewer set just changed: drop the item from the whole room, then re-add
    // it for whoever can now see it (owner + recipients, or everyone if Common).
    this.packing.broadcast(tripId, 'packing:deleted', { itemId: Number(id) }, socketId);
    this.packing.emitToViewers(tripId, 'packing:created', { item: updated }, updated as PackingItemRow, socketId);
    return { item: updated };
  }

  @RequirePermission('packing_edit')
  @Post(':id/clone')
  @HttpCode(201)
  clone(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const item = this.packing.cloneItem(tripId, id, user.id);
    if (!item) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    // The clone is personal to the caller — only their sockets need it.
    this.packing.emitToViewers(tripId, 'packing:created', { item }, item, socketId);
    return { item };
  }

  @RequirePermission('packing_edit')
  @Post(':id/contributors')
  addContributor(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const item = this.packing.addContributor(tripId, id, user.id);
    if (!item) {
      throw new HttpException({ error: 'Item not found or not a shared list item' }, 404);
    }
    // Common item — visible to all, so the contributor change broadcasts to the room.
    this.packing.broadcast(tripId, 'packing:updated', { item }, socketId);
    return { item };
  }

  @RequirePermission('packing_edit')
  @Delete(':id/contributors/:userId')
  removeContributor(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // You can drop your own pledge; the owner can remove anyone's.
    const target = Number.parseInt(userId);
    const item = this.packing.removeContributor(tripId, id, target);
    if (!item) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    this.packing.broadcast(tripId, 'packing:updated', { item }, socketId);
    return { item };
  }

  @Get('bags')
  listBags(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { bags: this.packing.listBags(tripId) };
  }

  @RequirePermission('packing_edit')
  @Post('bags')
  createBag(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: PackingCreateBagDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // The schema requires a non-empty name; whitespace-only still 400s here.
    if (!body.name.trim()) {
      throw new HttpException({ error: 'Name is required' }, 400);
    }
    const bag = this.packing.createBag(tripId, { name: body.name, color: body.color });
    this.packing.broadcast(tripId, 'packing:bag-created', { bag }, socketId);
    return { bag };
  }

  @RequirePermission('packing_edit')
  @Put('bags/:bagId')
  updateBag(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('bagId') bagId: string,
    @Body() body: PackingUpdateBagDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const { name, color, weight_limit_grams, user_id } = body;
    // bodyKeys carries which keys the request actually provided (the presence-
    // sentinel protocol); the parsed body only ever holds known schema keys.
    const updated = this.packing.updateBag(tripId, bagId, { name, color, weight_limit_grams, user_id }, Object.keys(body));
    if (!updated) {
      throw new HttpException({ error: 'Bag not found' }, 404);
    }
    this.packing.broadcast(tripId, 'packing:bag-updated', { bag: updated }, socketId);
    return { bag: updated };
  }

  @RequirePermission('packing_edit')
  @Delete('bags/:bagId')
  deleteBag(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('bagId') bagId: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!this.packing.deleteBag(tripId, bagId)) {
      throw new HttpException({ error: 'Bag not found' }, 404);
    }
    this.packing.broadcast(tripId, 'packing:bag-deleted', { bagId: Number(bagId) }, socketId);
    return { success: true };
  }

  @Get('templates')
  listTemplates(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { templates: this.packing.listTemplates() };
  }

  @RequirePermission('packing_edit')
  @Post('apply-template/:templateId')
  @HttpCode(200)
  applyTemplate(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('templateId') templateId: string,
    @Body() body: PackingApplyTemplateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const visibility = body?.visibility === 'personal' ? 'personal' : 'common';
    const added = this.packing.applyTemplate(tripId, templateId, visibility, user.id);
    if (!added) {
      throw new HttpException({ error: 'Template not found or empty' }, 404);
    }
    this.packing.broadcastItem(tripId, 'packing:template-applied', { items: added }, added[0], socketId);
    return { items: added, count: added.length };
  }

  @RequirePermission('packing_edit')
  @Put('bags/:bagId/members')
  setBagMembers(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('bagId') bagId: string,
    @Body() body: PackingBagMembersDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const members = this.packing.setBagMembers(tripId, bagId, body.user_ids);
    if (!members) {
      throw new HttpException({ error: 'Bag not found' }, 404);
    }
    this.packing.broadcast(tripId, 'packing:bag-members-updated', { bagId: Number(bagId), members }, socketId);
    return { members };
  }

  @RequirePermission('packing_edit')
  @Post('save-as-template')
  saveAsTemplate(
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
    const template = this.packing.saveAsTemplate(tripId, user.id, body.name.trim());
    if (!template) {
      throw new HttpException({ error: 'No items to save' }, 400);
    }
    return { template };
  }

  @Get('category-assignees')
  categoryAssignees(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { assignees: this.packing.getCategoryAssignees(tripId) };
  }

  @RequirePermission('packing_edit')
  @Put('category-assignees/:categoryName')
  updateCategoryAssignees(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('categoryName') categoryName: string,
    @Body() body: PackingCategoryAssigneesDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const category = decodeURIComponent(categoryName);
    const rows = this.packing.updateCategoryAssignees(tripId, category, body.user_ids);
    this.packing.broadcast(tripId, 'packing:assignees', { category, assignees: rows }, socketId);
    this.packing.notifyTagged(tripId, user, category, body.user_ids);
    return { assignees: rows };
  }
}
