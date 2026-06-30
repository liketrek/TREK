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
import type { User } from '../../types';
import { PackingService } from './packing.service';
import { isUpdateConflict } from '../../services/conflictResult';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

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
 */
@Controller('api/trips/:tripId/packing')
@UseGuards(JwtAuthGuard)
export class PackingController {
  constructor(private readonly packing: PackingService) {}

  /** Loads the trip or throws the legacy 404; returns it for the permission check. */
  private requireTrip(tripId: string, user: User) {
    const trip = this.packing.verifyTripAccess(tripId, user.id);
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    return trip;
  }

  private requireEdit(trip: ReturnType<PackingService['verifyTripAccess']>, user: User): void {
    if (!this.packing.canEdit(trip!, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
  }

  @Get()
  list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.requireTrip(tripId, user);
    // Pass the viewer so private items (#858) owned by other members are hidden.
    return { items: this.packing.listItems(tripId, user.id) };
  }

  @Post('import')
  importItems(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body('items') items: unknown,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!Array.isArray(items) || items.length === 0) {
      throw new HttpException({ error: 'items must be a non-empty array' }, 400);
    }
    const created = this.packing.bulkImport(tripId, items, user.id);
    for (const item of created) {
      this.packing.broadcastItem(tripId, 'packing:created', { item }, item, socketId);
    }
    return { items: created, count: created.length };
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: { name?: string; category?: string; checked?: boolean; is_private?: boolean; visibility?: 'common' | 'personal' | 'shared'; recipient_ids?: number[] },
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!body.name) {
      throw new HttpException({ error: 'Item name is required' }, 400);
    }
    const item = this.packing.createItem(tripId, { name: body.name, category: body.category, checked: body.checked, is_private: body.is_private, visibility: body.visibility, recipient_ids: body.recipient_ids }, user.id);
    this.emitToViewers(tripId, 'packing:created', { item }, item, socketId);
    return { item };
  }

  /** Deliver an item event to exactly the people who can see it (#858): the whole
   *  room for a Common item, or owner + recipients for a restricted one. */
  private emitToViewers(tripId: string, event: string, payload: Record<string, unknown>, item: PackingItemRow, socketId: string | undefined): void {
    const viewers = this.packing.viewersOf(item);
    if (viewers === null) {
      this.packing.broadcast(tripId, event, payload, socketId);
    } else {
      this.packing.broadcastToViewers(tripId, event, payload, viewers, socketId);
    }
  }

  @Put('reorder')
  reorder(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body('orderedIds') orderedIds: number[],
    @Headers('x-socket-id') _socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    this.packing.reorderItems(tripId, orderedIds);
    return { success: true };
  }

  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-socket-id') socketId?: string,
    @Headers('x-base-updated-at') ifMatch?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    // Privacy state before the change, so a public↔private toggle (#858) can route
    // the broadcast correctly instead of leaking a freshly-privatized item.
    const before = this.packing.getItemPrivacy(tripId, id);
    const { name, checked, category, weight_grams, bag_id, quantity, is_private } = body as Record<string, never>;
    const updated = this.packing.updateItem(tripId, id, { name, checked, category, weight_grams, bag_id, quantity, is_private }, Object.keys(body), ifMatch, user.id);
    if (!updated) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    // Stale offline overwrite — surface the conflict for client-side resolution (#1135).
    if (isUpdateConflict(updated)) {
      throw new HttpException({ error: 'conflict', server: updated.server }, 409);
    }
    this.broadcastUpdate(tripId, id, updated as PackingItemRow, !!before?.is_private, socketId);
    return { item: updated };
  }

  /**
   * Routes a packing-item update over WebSocket so private items (#858) stay
   * scoped to their owner across the four public↔private transitions:
   *  - stays private  → owner-only update
   *  - public→private → drop it from the whole room, re-add for the owner
   *  - private→public → create for members who lacked it, then update for all
   *  - stays public   → plain update to all
   */
  private broadcastUpdate(
    tripId: string,
    id: string,
    item: PackingItemRow,
    wasPrivate: boolean,
    socketId: string | undefined,
  ): void {
    const nowPrivate = !!item.is_private;
    if (nowPrivate) {
      if (wasPrivate) {
        this.packing.broadcastItem(tripId, 'packing:updated', { item }, item, socketId);
      } else {
        this.packing.broadcast(tripId, 'packing:deleted', { itemId: Number(id) }, socketId);
        this.packing.broadcastItem(tripId, 'packing:created', { item }, item, socketId);
      }
    } else {
      if (wasPrivate) {
        this.packing.broadcast(tripId, 'packing:created', { item }, socketId);
      }
      this.packing.broadcast(tripId, 'packing:updated', { item }, socketId);
    }
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const deleted = this.packing.deleteItem(tripId, id);
    if (!deleted) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    // Scope the delete to the people who could see it (owner + recipients, #858).
    this.emitToViewers(tripId, 'packing:deleted', { itemId: Number(id) }, deleted as PackingItemRow, socketId);
    return { success: true };
  }

  @Put(':id/sharing')
  setSharing(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: { visibility?: 'common' | 'personal' | 'shared'; recipient_ids?: number[] },
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (body.visibility !== 'common' && body.visibility !== 'personal' && body.visibility !== 'shared') {
      throw new HttpException({ error: 'Invalid visibility' }, 400);
    }
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
    this.emitToViewers(tripId, 'packing:created', { item: updated }, updated as PackingItemRow, socketId);
    return { item: updated };
  }

  @Post(':id/clone')
  @HttpCode(201)
  clone(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const item = this.packing.cloneItem(tripId, id, user.id);
    if (!item) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    // The clone is personal to the caller — only their sockets need it.
    this.emitToViewers(tripId, 'packing:created', { item }, item, socketId);
    return { item };
  }

  @Post(':id/contributors')
  addContributor(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const item = this.packing.addContributor(tripId, id, user.id);
    if (!item) {
      throw new HttpException({ error: 'Item not found or not a shared list item' }, 404);
    }
    // Common item — visible to all, so the contributor change broadcasts to the room.
    this.packing.broadcast(tripId, 'packing:updated', { item }, socketId);
    return { item };
  }

  @Delete(':id/contributors/:userId')
  removeContributor(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    // You can drop your own pledge; the owner can remove anyone's.
    const target = parseInt(userId);
    const item = this.packing.removeContributor(tripId, id, target);
    if (!item) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    this.packing.broadcast(tripId, 'packing:updated', { item }, socketId);
    return { item };
  }

  @Get('bags')
  listBags(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.requireTrip(tripId, user);
    return { bags: this.packing.listBags(tripId) };
  }

  @Post('bags')
  createBag(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: { name?: string; color?: string },
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!body.name?.trim()) {
      throw new HttpException({ error: 'Name is required' }, 400);
    }
    const bag = this.packing.createBag(tripId, { name: body.name, color: body.color });
    this.packing.broadcast(tripId, 'packing:bag-created', { bag }, socketId);
    return { bag };
  }

  @Put('bags/:bagId')
  updateBag(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('bagId') bagId: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const { name, color, weight_limit_grams, user_id } = body as Record<string, never>;
    const updated = this.packing.updateBag(tripId, bagId, { name, color, weight_limit_grams, user_id }, Object.keys(body));
    if (!updated) {
      throw new HttpException({ error: 'Bag not found' }, 404);
    }
    this.packing.broadcast(tripId, 'packing:bag-updated', { bag: updated }, socketId);
    return { bag: updated };
  }

  @Delete('bags/:bagId')
  deleteBag(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('bagId') bagId: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!this.packing.deleteBag(tripId, bagId)) {
      throw new HttpException({ error: 'Bag not found' }, 404);
    }
    this.packing.broadcast(tripId, 'packing:bag-deleted', { bagId: Number(bagId) }, socketId);
    return { success: true };
  }

  @Get('templates')
  listTemplates(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.requireTrip(tripId, user);
    return { templates: this.packing.listTemplates() };
  }

  @Post('apply-template/:templateId')
  @HttpCode(200)
  applyTemplate(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('templateId') templateId: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const added = this.packing.applyTemplate(tripId, templateId);
    if (!added) {
      throw new HttpException({ error: 'Template not found or empty' }, 404);
    }
    this.packing.broadcast(tripId, 'packing:template-applied', { items: added }, socketId);
    return { items: added, count: added.length };
  }

  @Put('bags/:bagId/members')
  setBagMembers(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('bagId') bagId: string,
    @Body('user_ids') userIds: unknown,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const members = this.packing.setBagMembers(tripId, bagId, Array.isArray(userIds) ? userIds : []);
    if (!members) {
      throw new HttpException({ error: 'Bag not found' }, 404);
    }
    this.packing.broadcast(tripId, 'packing:bag-members-updated', { bagId: Number(bagId), members }, socketId);
    return { members };
  }

  @Post('save-as-template')
  saveAsTemplate(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body('name') name?: string,
  ) {
    this.requireTrip(tripId, user);
    if (user.role !== 'admin') {
      throw new HttpException({ error: 'Admin access required' }, 403);
    }
    if (!name?.trim()) {
      throw new HttpException({ error: 'Template name is required' }, 400);
    }
    const template = this.packing.saveAsTemplate(tripId, user.id, name.trim());
    if (!template) {
      throw new HttpException({ error: 'No items to save' }, 400);
    }
    return { template };
  }

  @Get('category-assignees')
  categoryAssignees(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.requireTrip(tripId, user);
    return { assignees: this.packing.getCategoryAssignees(tripId) };
  }

  @Put('category-assignees/:categoryName')
  updateCategoryAssignees(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('categoryName') categoryName: string,
    @Body('user_ids') userIds: number[],
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const category = decodeURIComponent(categoryName);
    const rows = this.packing.updateCategoryAssignees(tripId, category, userIds);
    this.packing.broadcast(tripId, 'packing:assignees', { category, assignees: rows }, socketId);
    this.packing.notifyTagged(tripId, user, category, userIds);
    return { assignees: rows };
  }
}
