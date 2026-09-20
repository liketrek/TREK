import { type Opt, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class Plugins {
  id?: string | null;
  name!: string;
  description?: string | null;
  type: string & Opt = 'integration';
  icon?: string | null = 'Blocks';
  version?: string | null;
  apiVersion?: number | null = 1;
  minTrekVersion?: string | null;
  permissions?: string | null = '[]';
  grantedPermissions?: string | null = '[]';
  status: string & Opt = 'inactive';
  config?: string | null = '{}';
  sourceRepo?: string | null;
  sourceCommit?: string | null;
  sha256?: string | null;
  crashCount: number & Opt = 0;
  lastError?: string | null;
  reviewedAt?: string | null;
  sortOrder: number & Opt = 0;
  installedAt?: Date | null;
  updatedAt?: Date | null;
  enabled: number & Opt = 0;
  capabilities: string & Opt = '{}';
  authorPubkey?: string | null;
  dependencies: string & Opt = '{}';
  operatorEgress: number & Opt = 0;
  updateBlockCode?: string | null;
  updateBlockDetail?: string | null;
  updateBlockVersion?: string | null;
  trekRange?: string | null;
  updateHold: number & Opt = 0;
}

export class PluginsRepository extends EntityRepository<Plugins> {}

export const PluginsSchema = defineEntity({
  class: Plugins,
  repository: () => PluginsRepository,
  properties: {
    id: p.text().primary().nullable(),
    name: p.text(),
    description: p.text().nullable(),
    type: p.text(),
    icon: p.text().nullable(),
    version: p.text().nullable(),
    apiVersion: p.integer().nullable(),
    minTrekVersion: p.text().nullable(),
    permissions: p.text().nullable(),
    grantedPermissions: p.text().nullable(),
    status: p.text(),
    config: p.text().nullable(),
    sourceRepo: p.text().nullable(),
    sourceCommit: p.text().nullable(),
    sha256: p.text().nullable(),
    crashCount: p.integer(),
    lastError: p.text().nullable(),
    reviewedAt: p.text().nullable(),
    sortOrder: p.integer(),
    installedAt: p.datetime().nullable().onCreate(() => new Date()),
    updatedAt: p.datetime().nullable().onCreate(() => new Date()),
    enabled: p.integer(),
    capabilities: p.text(),
    authorPubkey: p.text().nullable(),
    dependencies: p.text(),
    operatorEgress: p.integer(),
    updateBlockCode: p.text().nullable(),
    updateBlockDetail: p.text().nullable(),
    updateBlockVersion: p.text().nullable(),
    trekRange: p.text().nullable(),
    updateHold: p.integer(),
  },
});
