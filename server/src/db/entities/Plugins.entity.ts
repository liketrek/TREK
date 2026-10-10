import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { PluginsRepository } from '../repositories/Plugins.repository';
import { DbTimestampType } from '../types';

export class Plugins {
  [EntityRepositoryType]?: PluginsRepository;
  id?: string | null;
  name!: string;
  description?: string | null;
  type: string & Opt = 'integration';
  icon?: string | null = 'Blocks';
  version?: string | null;
  api_version?: number | null = 1;
  min_trek_version?: string | null;
  permissions?: string | null = '[]';
  granted_permissions?: string | null = '[]';
  status: string & Opt = 'inactive';
  config?: string | null = '{}';
  source_repo?: string | null;
  source_commit?: string | null;
  sha256?: string | null;
  crash_count: number & Opt = 0;
  last_error?: string | null;
  reviewed_at?: string | null;
  sort_order: number & Opt = 0;
  installed_at?: string | null;
  updated_at?: string | null;
  enabled: number & Opt = 0;
  capabilities: string & Opt = '{}';
  author_pubkey?: string | null;
  dependencies: string & Opt = '{}';
  operator_egress: number & Opt = 0;
  update_block_code?: string | null;
  update_block_detail?: string | null;
  update_block_version?: string | null;
  trek_range?: string | null;
  update_hold: number & Opt = 0;
}

export const PluginsSchema = defineEntity({
  class: Plugins,
  repository: () => PluginsRepository,
  properties: {
    id: p.text().primary().nullable(),
    name: p.text(),
    description: p.text().nullable(),
    type: p.text().default('integration'),
    icon: p.text().nullable(),
    version: p.text().nullable(),
    api_version: p.integer().nullable(),
    min_trek_version: p.text().nullable(),
    permissions: p.text().nullable(),
    granted_permissions: p.text().nullable(),
    status: p.text().default('inactive'),
    config: p.text().nullable(),
    source_repo: p.text().nullable(),
    source_commit: p.text().nullable(),
    sha256: p.text().nullable(),
    crash_count: p.integer().default(0),
    last_error: p.text().nullable(),
    reviewed_at: p.text().nullable(),
    sort_order: p.integer().default(0),
    installed_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    enabled: p.integer().default(0),
    capabilities: p.text().default('{}'),
    author_pubkey: p.text().nullable(),
    dependencies: p.text().default('{}'),
    operator_egress: p.integer().default(0),
    update_block_code: p.text().nullable(),
    update_block_detail: p.text().nullable(),
    update_block_version: p.text().nullable(),
    trek_range: p.text().nullable(),
    update_hold: p.integer().default(0),
  },
});
