import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, UseGuards } from '@nestjs/common';
import type { Tag, TagListResponse } from '@trek/shared';
import type { User } from '../../types';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

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
  constructor(private readonly tags: TagsService) {}

  @Get()
  list(@CurrentUser() user: User): TagListResponse {
    return { tags: this.tags.list(user.id) };
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body('name') name?: string,
    @Body('color') color?: string,
  ): { tag: Tag } {
    if (!name) {
      throw new HttpException({ error: 'Tag name is required' }, 400);
    }
    return { tag: this.tags.create(user.id, name, color) };
  }

  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('color') color?: string,
  ): { tag: Tag } {
    if (!this.tags.getByIdAndUser(id, user.id)) {
      throw new HttpException({ error: 'Tag not found' }, 404);
    }
    return { tag: this.tags.update(id, name, color) };
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string): { success: boolean } {
    if (!this.tags.getByIdAndUser(id, user.id)) {
      throw new HttpException({ error: 'Tag not found' }, 404);
    }
    this.tags.remove(id);
    return { success: true };
  }
}
