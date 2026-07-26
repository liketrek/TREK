import { createTestRegistry, type McpRegistry } from '@trek/nest-mcp';
import { db } from '../../src/db/database';
import { trekMcpAccessPolicy } from '../../src/mcp/nest-mcp-policy';
import { DatabaseService } from '../../src/nest/database/database.service';
import { TagsMcp } from '../../src/nest/tags/tags.mcp';
import { TagsService } from '../../src/nest/tags/tags.service';

/**
 * Hand-wired counterpart of the boot-time discovery in McpRegistryService,
 * for the no-Nest MCP harness. One line per migrated domain — add the new
 * @McpController instance here when a domain moves off the legacy registrar
 * fan-out. Constructing against the `db` Proxy keeps per-file vi.mock's of
 * src/db/database flowing through (same pattern as tags.bridge.ts).
 */
export function createMcpTestRegistry(): McpRegistry {
  const dbService = new DatabaseService(db);
  return createTestRegistry(
    [
      new TagsMcp(new TagsService(dbService)),
    ],
    { accessPolicy: trekMcpAccessPolicy },
  );
}
