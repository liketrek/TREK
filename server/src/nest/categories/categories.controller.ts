import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, UseGuards } from '@nestjs/common';
import type { Category, CategoryListResponse } from '@trek/shared';
import type { User } from '../../types';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';

/**
 * /api/categories — place-category palette CRUD.
 *
 * Byte-identical to the legacy Express route (server/src/routes/categories.ts):
 * listing is open to any authenticated user; create/update/delete require admin
 * (JwtAuthGuard + AdminGuard). Status codes match the Nest defaults the legacy
 * route also used (201 on create, 200 elsewhere), and the bespoke 400/404 bodies
 * are reproduced exactly.
 */
@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(): CategoryListResponse {
    return { categories: this.categories.list() };
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(
    @CurrentUser() user: User,
    @Body('name') name?: string,
    @Body('color') color?: string,
    @Body('icon') icon?: string,
  ): { category: Category } {
    if (!name) {
      throw new HttpException({ error: 'Category name is required' }, 400);
    }
    return { category: this.categories.create(user.id, name, color, icon) };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('color') color?: string,
    @Body('icon') icon?: string,
  ): { category: Category } {
    if (!this.categories.getById(id)) {
      throw new HttpException({ error: 'Category not found' }, 404);
    }
    return { category: this.categories.update(id, name, color, icon) };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string): { success: boolean } {
    if (!this.categories.getById(id)) {
      throw new HttpException({ error: 'Category not found' }, 404);
    }
    this.categories.remove(id);
    return { success: true };
  }
}
