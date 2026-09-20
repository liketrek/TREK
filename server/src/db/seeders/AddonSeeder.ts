import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

interface AddonRow {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  enabled: 0 | 1;
  sort_order: number;
}

const DEFAULT_ADDONS: AddonRow[] = [
  {
    id: 'packing',
    name: 'Lists',
    description: 'Packing lists and to-do tasks for your trips',
    type: 'trip',
    icon: 'ListChecks',
    enabled: 1,
    sort_order: 0,
  },
  {
    id: 'budget',
    name: 'Costs',
    description: 'Track and split trip expenses',
    type: 'trip',
    icon: 'Wallet',
    enabled: 1,
    sort_order: 1,
  },
  {
    id: 'documents',
    name: 'Documents',
    description: 'Store and manage travel documents',
    type: 'trip',
    icon: 'FileText',
    enabled: 1,
    sort_order: 2,
  },
  {
    id: 'vacay',
    name: 'Vacay',
    description: 'Personal vacation day planner with calendar view',
    type: 'global',
    icon: 'CalendarDays',
    enabled: 1,
    sort_order: 10,
  },
  {
    id: 'atlas',
    name: 'Atlas',
    description: 'World map of your visited countries with travel stats',
    type: 'global',
    icon: 'Globe',
    enabled: 1,
    sort_order: 11,
  },
  {
    id: 'mcp',
    name: 'MCP',
    description: 'Model Context Protocol for AI assistant integration',
    type: 'integration',
    icon: 'Terminal',
    enabled: 0,
    sort_order: 12,
  },
  {
    id: 'naver_list_import',
    name: 'Naver List Import',
    description: 'Import places from a shared Naver Maps list',
    type: 'integration',
    icon: 'Link2',
    enabled: 1,
    sort_order: 13,
  },
  {
    id: 'collab',
    name: 'Collab',
    description: 'Notes, polls, and live chat for trip collaboration',
    type: 'trip',
    icon: 'Users',
    enabled: 1,
    sort_order: 6,
  },
  {
    id: 'roadtrip',
    name: 'Road trip',
    description: 'Drives with stops along the route, driving times, and arrival times that update themselves',
    type: 'trip',
    icon: 'Route',
    enabled: 0,
    sort_order: 7,
  },
  {
    id: 'journey',
    name: 'Journey',
    description: 'Trip tracking & travel journal — check-ins, photos, daily stories',
    type: 'global',
    icon: 'Compass',
    enabled: 0,
    sort_order: 35,
  },
  {
    id: 'airtrail',
    name: 'AirTrail',
    description: 'Sync flights from your AirTrail instance',
    type: 'integration',
    icon: 'Plane',
    enabled: 0,
    sort_order: 14,
  },
  {
    id: 'dawarich',
    name: 'Dawarich',
    description:
      'Read visits and recorded routes from your Dawarich instance — suggested journal entries, places and countries you confirm yourself',
    type: 'integration',
    icon: 'Dawarich',
    enabled: 0,
    sort_order: 17,
  },
  {
    id: 'llm_parsing',
    name: 'AI Parsing',
    description: 'LLM fallback for booking imports kitinerary cannot read',
    type: 'integration',
    icon: 'Sparkles',
    enabled: 0,
    sort_order: 15,
  },
  {
    id: 'collections',
    name: 'Collections',
    description:
      'Personal place library — save places across trips into named lists, copy into any trip, share with others',
    type: 'global',
    icon: 'Bookmark',
    enabled: 0,
    sort_order: 16,
  },
];

/**
 * Seeds the addon shelf.
 *
 * `INSERT OR IGNORE` per row, not a table-level emptiness check: an operator who
 * has toggled an addon keeps their choice, and a release that adds a new addon
 * still gets its tile on an existing install.
 */
export class AddonSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const connection = em.getConnection();
    for (const addon of DEFAULT_ADDONS) {
      await connection.execute(
        'INSERT OR IGNORE INTO addons (id, name, description, type, icon, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [addon.id, addon.name, addon.description, addon.type, addon.icon, addon.enabled, addon.sort_order],
      );
    }
    console.log('Default addons seeded');
  }
}
