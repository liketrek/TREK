import type { User } from '../../types';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoryCreateDto, CategoryUpdateDto } from './categories.dto';
import { CategoriesService } from './categories.service';
import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, UseGuards } from '@nestjs/common';
import type { Category, CategoryListResponse } from '@trek/shared';

/**
 * /api/categories — place-category palette CRUD.
 *
 * Listing is open to any authenticated user; create/update/delete require admin
 * (JwtAuthGuard + AdminGuard). Status codes match the legacy Express route
 * (201 on create, 200 elsewhere) and the bespoke 404 body is reproduced exactly.
 *
 * Bodies now validate against the @trek/shared schemas through the DTO classes
 * and the global ZodValidationPipe. That replaced the hand-rolled 400 ("Category
 * name is required") with the pipe's envelope — the same trade the places, todo
 * and trips migrations made. It matters here because `color` was reaching a
 * style="…" attribute of hand-built marker HTML on both map renderers and on the
 * share page, which answers without a guard; `@Body('color')` carries no
 * metatype, so nothing validated it.
 */
@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(): Promise<CategoryListResponse> {
    return { categories: await this.categories.list() };
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@CurrentUser() user: User, @Body() body: CategoryCreateDto): Promise<{ category: Category }> {
    return { category: await this.categories.create(user.id, body.name, body.color, body.icon) };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() body: CategoryUpdateDto): Promise<{ category: Category }> {
    if (!(await this.categories.getById(id))) {
      throw new HttpException({ error: 'Category not found' }, 404);
    }
    return { category: await this.categories.update(id, body.name, body.color, body.icon) };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    if (!(await this.categories.getById(id))) {
      throw new HttpException({ error: 'Category not found' }, 404);
    }
    await this.categories.remove(id);
    return { success: true };
  }
}
