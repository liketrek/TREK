import { Injectable } from '@nestjs/common';
import type { Category } from '@trek/shared';
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/categoryService';

/**
 * Thin Nest wrapper around the existing category service. The SQL and the
 * default colour/icon fallbacks stay in categoryService, so behaviour is
 * unchanged.
 */
@Injectable()
export class CategoriesService {
  list(): Category[] {
    return listCategories() as Category[];
  }

  getById(id: string | number): Category | undefined {
    return getCategoryById(id) as Category | undefined;
  }

  create(userId: number, name: string, color?: string, icon?: string): Category {
    return createCategory(userId, name, color, icon) as Category;
  }

  update(id: string | number, name?: string, color?: string, icon?: string): Category {
    return updateCategory(id, name, color, icon) as Category;
  }

  remove(id: string | number): void {
    deleteCategory(id);
  }
}
