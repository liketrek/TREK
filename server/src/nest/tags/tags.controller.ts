import type { User } from '../../types';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { TagWritesService } from './tag-writes.service';
import { TagCreateDto, TagUpdateDto } from './tags.dto';
import { TagsService } from './tags.service';
import { Body, Controller, Delete, Get, Headers, HttpException, Param, Post, Put, UseGuards } from '@nestjs/common';
import type { Tag, TagListResponse } from '@trek/shared';

/**
 * /api/tags — per-user place-tag CRUD.
 *
 * Byte-identical to the legacy Express route (server/src/routes/tags.ts): every
 * endpoint requires auth and is scoped to the caller's own tags. Update/delete
 * verify ownership via getTagByIdAndUser and 404 otherwise. Status codes match
 * the Nest defaults the legacy route used (201 on create, 200 elsewhere); the
 * bespoke 400/404 bodies are reproduced exactly.
 */
@Controller('api/tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(
    private readonly tags: TagsService,
    // The writes, which tell the user's other tabs that their tags changed.
    private readonly writes: TagWritesService,
  ) {}

  @Get()
  async list(@CurrentUser() user: User): Promise<TagListResponse> {
    return { tags: await this.tags.list(user.id) };
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() body: TagCreateDto,
    @Headers('x-socket-id') socketId?: string,
  ): Promise<{ tag: Tag }> {
    // Cast rather than validate: the legacy route bound whatever arrived
    // straight into SQLite, and a contract that rejected a numeric name here
    // would be a new 400 for anything already sending one.
    const { name, color } = body as { name?: string; color?: string };
    if (!name) {
      throw new HttpException({ error: 'Tag name is required' }, 400);
    }
    return { tag: await this.writes.create(user.id, name, color, socketId) };
  }

  @Put(':id')
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: TagUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ): Promise<{ tag: Tag }> {
    const { name, color } = body as { name?: string; color?: string };
    if (!(await this.tags.getByIdAndUser(id, user.id))) {
      throw new HttpException({ error: 'Tag not found' }, 404);
    }
    return { tag: await this.writes.update(user.id, id, { name, color }, socketId) };
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ): Promise<{ success: boolean }> {
    if (!(await this.tags.getByIdAndUser(id, user.id))) {
      throw new HttpException({ error: 'Tag not found' }, 404);
    }
    await this.writes.remove(user.id, id, socketId);
    return { success: true };
  }
}
