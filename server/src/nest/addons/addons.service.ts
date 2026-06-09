import { Injectable } from '@nestjs/common';
import { db } from '../../db/database';
import type { Addon } from '../../types';
import { getBagTracking, getCollabFeatures } from '../../services/adminService';
import { getPhotoProviderConfig } from '../../services/memories/helpersService';

/**
 * Thin wrapper around the enabled-addons + photo-provider read that the legacy
 * inline `GET /api/addons` handler performed (server/src/app.ts). The SQL,
 * ordering, boolean coercions and the merged photo-provider entries are
 * reproduced 1:1 so the body is byte-identical for the client.
 */
@Injectable()
export class AddonsService {
  list() {
    const addons = db
      .prepare('SELECT id, name, type, icon, enabled FROM addons WHERE enabled = 1 ORDER BY sort_order')
      .all() as Pick<Addon, 'id' | 'name' | 'type' | 'icon' | 'enabled'>[];
    const providers = db
      .prepare(
        `SELECT id, name, icon, enabled, sort_order
         FROM photo_providers
         WHERE enabled = 1
         ORDER BY sort_order, id`,
      )
      .all() as Array<{ id: string; name: string; icon: string; enabled: number; sort_order: number }>;
    const fields = db
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
      collabFeatures: getCollabFeatures(),
      bagTracking: getBagTracking().enabled,
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
