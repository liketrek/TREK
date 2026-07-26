import type { Tag } from '@trek/shared';
import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { TagsService } from './tags.service';

/**
 * Non-Nest entry point for the tags domain — for code running OUTSIDE the Nest
 * container (currently only the plugin RPC host; the MCP tools moved to the
 * DI-discovered tags.mcp.ts). Exports the legacy services/tagService function
 * names 1:1 so repointing a consumer is an import-path-only diff. Inside the
 * container, inject TagsService instead.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton (same pattern as
 * plugins/host/create-rpc-host.ts).
 */
const tags = new TagsService(new DatabaseService(db));

export function listTags(userId: number): Tag[] {
  return tags.list(userId);
}

export function createTag(userId: number, name: string, color?: string): Tag {
  return tags.create(userId, name, color);
}

export function getTagByIdAndUser(tagId: number | string, userId: number): Tag | undefined {
  return tags.getByIdAndUser(tagId, userId);
}

export function updateTag(tagId: number | string, name?: string, color?: string): Tag | undefined {
  return tags.update(tagId, name, color);
}

export function deleteTag(tagId: number | string): void {
  tags.remove(tagId);
}
