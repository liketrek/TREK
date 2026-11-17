import type { User } from '../../types';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { TripTagCreateDto, TripTagUpdateDto } from './tags.dto';
import { TripTagsService } from './trip-tags.service';
import { Body, Controller, Delete, Get, Headers, Param, Post, Put, UseGuards } from '@nestjs/common';
import { successResponseSchema, tripTagListResponseSchema, tripTagResponseSchema } from '@trek/shared';

/**
 * /api/trips/:tripId/tags — the tags a trip owns, shared by everybody on it.
 *
 * Reading takes trip access (404 otherwise); the writes add the `place_edit`
 * permission (403), the one a tag is put on a place with. Bodies validate against
 * the @trek/shared trip tag contracts through the Zod pipe. Create answers 201 with
 * the tag of that name, which is the trip's existing one when it has it already;
 * a rename onto another tag's name is a 409. Every write tells the trip's other
 * sockets `tripTags:changed`.
 */
@Controller('api/trips/:tripId/tags')
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class TripTagsController {
  constructor(private readonly tripTags: TripTagsService) {}

  @Get()
  @ResponseContract(tripTagListResponseSchema)
  async list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { tags: await this.tripTags.list(tripId, user.id) };
  }

  @RequirePermission('place_edit')
  @Post()
  @ResponseContract(tripTagResponseSchema)
  async create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: TripTagCreateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const writer = this.tripTags.restWriter(tripId, user, socketId);
    return { tag: await this.tripTags.create(tripId, { name: body.name, color: body.color }, writer) };
  }

  @RequirePermission('place_edit')
  @Put(':id')
  @ResponseContract(tripTagResponseSchema)
  async update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: TripTagUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const writer = this.tripTags.restWriter(tripId, user, socketId);
    return { tag: await this.tripTags.update(tripId, id, { name: body.name, color: body.color }, writer) };
  }

  @RequirePermission('place_edit')
  @Delete(':id')
  @ResponseContract(successResponseSchema)
  async remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    await this.tripTags.remove(tripId, id, this.tripTags.restWriter(tripId, user, socketId));
    return { success: true };
  }
}
