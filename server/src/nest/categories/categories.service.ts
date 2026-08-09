import { Injectable } from '@nestjs/common';
import type { Category } from '@trek/shared';
import { DatabaseService } from '../database/database.service';

/**
 * Categories domain service — owns the category SQL (moved 1:1 from the legacy
 * services/categoryService.ts: identical statements, the #6366f1/📍 defaults
 * and the COALESCE update semantics). All consumers are in-container now — the
 * plugin RPC surface injects this class into CategoriesRpc.
 */
@Injectable()
export class CategoriesService {
  constructor(private readonly db: DatabaseService) {}

  list(): Category[] {
    return this.db.all<Category>('SELECT * FROM categories ORDER BY name ASC');
  }

  getById(id: string | number): Category | undefined {
    return this.db.get<Category>('SELECT * FROM categories WHERE id = ?', id);
  }

  create(userId: number, name: string, color?: string, icon?: string): Category {
    const result = this.db.run(
      'INSERT INTO categories (name, color, icon, user_id) VALUES (?, ?, ?, ?)',
      name,
      color || '#6366f1',
      icon || '📍',
      userId,
    );
    return this.db.get<Category>(
      'SELECT * FROM categories WHERE id = ?',
      result.lastInsertRowid,
    ) as Category;
  }

  update(id: string | number, name?: string, color?: string, icon?: string): Category {
    this.db.run(
      `
    UPDATE categories SET
      name = COALESCE(?, name),
      color = COALESCE(?, color),
      icon = COALESCE(?, icon)
    WHERE id = ?
  `,
      name || null,
      color || null,
      icon || null,
      id,
    );
    return this.db.get<Category>('SELECT * FROM categories WHERE id = ?', id) as Category;
  }

  remove(id: string | number): void {
    this.db.run('DELETE FROM categories WHERE id = ?', id);
  }
}
