import { Injectable } from '@nestjs/common';
import type { Tag } from '@trek/shared';
import {
  listTags,
  createTag,
  getTagByIdAndUser,
  updateTag,
  deleteTag,
} from '../../services/tagService';

/**
 * Thin Nest wrapper around the existing tag service. Ownership scoping and the
 * default colour fallback stay in tagService, so behaviour is unchanged.
 */
@Injectable()
export class TagsService {
  list(userId: number): Tag[] {
    return listTags(userId) as Tag[];
  }

  getByIdAndUser(id: string | number, userId: number): Tag | undefined {
    return getTagByIdAndUser(id, userId) as Tag | undefined;
  }

  create(userId: number, name: string, color?: string): Tag {
    return createTag(userId, name, color) as Tag;
  }

  update(id: string | number, name?: string, color?: string): Tag {
    return updateTag(id, name, color) as Tag;
  }

  remove(id: string | number): void {
    deleteTag(id);
  }
}
