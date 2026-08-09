import { Injectable } from '@nestjs/common';
import type { Tag } from '@trek/shared';
import { DatabaseService } from '../database/database.service';

/**
 * Tags domain service — owns the tag SQL (moved 1:1 from the legacy
 * services/tagService.ts: identical statements, the #10b981 default and the
 * COALESCE update semantics). All consumers are in-container now — the plugin
 * RPC surface injects this class into TagsRpc.
 */
@Injectable()
export class TagsService {
  constructor(private readonly db: DatabaseService) {}

  list(userId: number): Tag[] {
    return this.db.all<Tag>('SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC', userId);
  }

  getByIdAndUser(id: string | number, userId: number): Tag | undefined {
    return this.db.get<Tag>('SELECT * FROM tags WHERE id = ? AND user_id = ?', id, userId);
  }

  create(userId: number, name: string, color?: string): Tag {
    const result = this.db.run(
      'INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)',
      userId,
      name,
      color || '#10b981',
    );
    return this.db.get<Tag>('SELECT * FROM tags WHERE id = ?', result.lastInsertRowid) as Tag;
  }

  update(id: string | number, name?: string, color?: string): Tag {
    this.db.run(
      'UPDATE tags SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ?',
      name || null,
      color || null,
      id,
    );
    return this.db.get<Tag>('SELECT * FROM tags WHERE id = ?', id) as Tag;
  }

  remove(id: string | number): void {
    this.db.run('DELETE FROM tags WHERE id = ?', id);
  }
}
