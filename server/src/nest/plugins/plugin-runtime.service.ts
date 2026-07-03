import { Injectable, type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
import { db } from '../../db/database';
import { pluginsEnabled } from './kill-switch';
import { decrypt_api_key } from '../../services/apiKeyCrypto';
import { PluginSupervisor, type PluginRouteInfo } from './supervisor/plugin-supervisor';
import { createRealRpcHost, closePluginDataDb } from './host/create-rpc-host';
import { isKnownPermission } from './protocol/envelope';

/**
 * Owns the isolated-plugin runtime lifecycle inside NestJS (#plugins, M2).
 * Bridges the DB registry (`plugins` rows) to the process supervisor: activate
 * spawns the child with its granted permissions + decrypted instance config,
 * deactivate kills it, and status/errors are persisted back to the DB. Boots all
 * `active` plugins on startup when the runtime is enabled.
 */

interface PluginRow {
  id: string;
  status: string;
  permissions: string;
  granted_permissions: string;
  config: string;
}

@Injectable()
export class PluginRuntimeService implements OnModuleInit, OnModuleDestroy {
  private readonly supervisor = new PluginSupervisor(createRealRpcHost, {
    onStatus: (id, status, error) => {
      db.prepare('UPDATE plugins SET status = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        status,
        error ?? null,
        id,
      );
    },
    onLog: (id, level, msg) => {
      if (level === 'error' || level === 'warn') {
        db.prepare('INSERT INTO plugin_error_log (plugin_id, level, message) VALUES (?, ?, ?)').run(id, level, msg);
      }
    },
  });

  onModuleInit(): void {
    if (!pluginsEnabled()) return;
    const active = db.prepare("SELECT id FROM plugins WHERE status = 'active'").all() as Array<{ id: string }>;
    for (const { id } of active) {
      this.activate(id).catch(() => {
        /* status is persisted as error by the supervisor hook */
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.supervisor.shutdownAll();
  }

  /** Spawn a plugin from its DB row (granted permissions + decrypted config). */
  async activate(id: string): Promise<void> {
    const row = db.prepare('SELECT id, status, permissions, granted_permissions, config FROM plugins WHERE id = ?').get(id) as
      | PluginRow
      | undefined;
    if (!row) throw new Error(`plugin ${id} not found`);

    const granted = new Set(parseArray(row.granted_permissions).filter(isKnownPermission));
    const config = decryptConfig(parseObject(row.config));
    await this.supervisor.activate(id, granted, config);
  }

  async deactivate(id: string): Promise<void> {
    await this.supervisor.disable(id);
    closePluginDataDb(id);
    db.prepare("UPDATE plugins SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  }

  isActive(id: string): boolean {
    return this.supervisor.isActive(id);
  }
  routesOf(id: string): PluginRouteInfo[] {
    return this.supervisor.routesOf(id);
  }
  invoke(id: string, method: string, params: Record<string, unknown>): Promise<unknown> {
    return this.supervisor.invoke(id, method, params);
  }
}

function parseArray(json: string): string[] {
  try {
    const v = JSON.parse(json || '[]');
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
function parseObject(json: string): Record<string, unknown> {
  try {
    const v = JSON.parse(json || '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
/** Decrypt secret config values transparently (decrypt_api_key passes plaintext through). */
function decryptConfig(config: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    out[k] = typeof v === 'string' ? decrypt_api_key(v) : v;
  }
  return out;
}
