import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { Addon } from '../../types';
import { getPhotoProviderConfig } from '../memories/memories.helpers';

/**
 * Thin wrapper around the enabled-addons + photo-provider read that the legacy
 * inline `GET /api/addons` handler performed (server/src/app.ts). The SQL,
 * ordering, boolean coercions and the merged photo-provider entries are
 * reproduced 1:1 so the body is byte-identical for the client.
 *
 * Also the single owner of addon/feature-flag enablement state (moved verbatim
 * from services/adminService.ts, finding `admin-1`): isAddonEnabled plus the
 * bag-tracking and collab-features flags. The boolean polarities differ on
 * purpose — bag tracking is opt-in (`=== 'true'`, default OFF), the collab
 * sub-features are opt-out (`!== 'false'`, default ON). Reads are uncached
 * per-call queries so admin toggles stay immediately visible; out-of-container
 * consumers go through addons.bridge.ts.
 */
@Injectable()
export class AddonsService {
  constructor(private readonly dbs: DatabaseService) {}

  private get db() {
    return this.dbs.connection;
  }

  isAddonEnabled(addonId: string): boolean {
    const addon = this.db.prepare('SELECT enabled FROM addons WHERE id = ?').get(addonId) as
      | { enabled: number }
      | undefined;
    return !!addon?.enabled;
  }

  getBagTracking() {
    const row = this.db.prepare("SELECT value FROM app_settings WHERE key = 'bag_tracking_enabled'").get() as
      | { value: string }
      | undefined;
    return { enabled: row?.value === 'true' };
  }

  updateBagTracking(enabled: boolean) {
    this.db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('bag_tracking_enabled', ?)").run(
      enabled ? 'true' : 'false',
    );
    return { enabled: !!enabled };
  }

  getCollabFeatures() {
    const rows = this.db
      .prepare(
        "SELECT key, value FROM app_settings WHERE key IN ('collab_chat_enabled', 'collab_notes_enabled', 'collab_polls_enabled', 'collab_whatsnext_enabled')",
      )
      .all() as { key: string; value: string }[];
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return {
      chat: map['collab_chat_enabled'] !== 'false',
      notes: map['collab_notes_enabled'] !== 'false',
      polls: map['collab_polls_enabled'] !== 'false',
      whatsnext: map['collab_whatsnext_enabled'] !== 'false',
    };
  }

  updateCollabFeatures(features: { chat?: boolean; notes?: boolean; polls?: boolean; whatsnext?: boolean }) {
    const mapping: Record<string, string> = {
      chat: 'collab_chat_enabled',
      notes: 'collab_notes_enabled',
      polls: 'collab_polls_enabled',
      whatsnext: 'collab_whatsnext_enabled',
    };
    const before = this.getCollabFeatures();
    const stmt = this.db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)');
    for (const [feat, key] of Object.entries(mapping)) {
      if (features[feat] !== undefined) stmt.run(key, features[feat] ? 'true' : 'false');
    }
    const after = this.getCollabFeatures();
    // Collab flags gate MCP tool/resource registration, so callers must know
    // whether anything actually flipped — a no-op save must not tear down every
    // live MCP session (#1414).
    const changed = (Object.keys(after) as Array<keyof typeof after>).some((k) => after[k] !== before[k]);
    return { features: after, changed };
  }

  list() {
    const addons = this.db
      .prepare('SELECT id, name, type, icon, enabled FROM addons WHERE enabled = 1 ORDER BY sort_order')
      .all() as Pick<Addon, 'id' | 'name' | 'type' | 'icon' | 'enabled'>[];
    const providers = this.db
      .prepare(
        `SELECT id, name, icon, enabled, sort_order
         FROM photo_providers
         WHERE enabled = 1
         ORDER BY sort_order, id`,
      )
      .all() as Array<{ id: string; name: string; icon: string; enabled: number; sort_order: number }>;
    const fields = this.db
      .prepare(
        `SELECT provider_id, field_key, label, input_type, placeholder, hint, required, secret, settings_key, payload_key, sort_order
         FROM photo_provider_fields
         ORDER BY sort_order, id`,
      )
      .all() as Array<{
      provider_id: string;
      field_key: string;
      label: string;
      input_type: string;
      placeholder?: string | null;
      hint?: string | null;
      required: number;
      secret: number;
      settings_key?: string | null;
      payload_key?: string | null;
      sort_order: number;
    }>;

    const fieldsByProvider = new Map<string, typeof fields>();
    for (const field of fields) {
      const arr = fieldsByProvider.get(field.provider_id) || [];
      arr.push(field);
      fieldsByProvider.set(field.provider_id, arr);
    }

    return {
      collabFeatures: this.getCollabFeatures(),
      bagTracking: this.getBagTracking().enabled,
      addons: [
        ...addons.map((a) => ({ ...a, enabled: !!a.enabled })),
        ...providers.map((p) => ({
          id: p.id,
          name: p.name,
          type: 'photo_provider',
          icon: p.icon,
          enabled: !!p.enabled,
          config: getPhotoProviderConfig(p.id),
          fields: (fieldsByProvider.get(p.id) || []).map((f) => ({
            key: f.field_key,
            label: f.label,
            input_type: f.input_type,
            placeholder: f.placeholder || '',
            hint: f.hint || null,
            required: !!f.required,
            secret: !!f.secret,
            settings_key: f.settings_key || null,
            payload_key: f.payload_key || null,
            sort_order: f.sort_order,
          })),
        })),
      ],
    };
  }
}
