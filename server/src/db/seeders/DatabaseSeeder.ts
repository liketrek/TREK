import { AddonSeeder } from './AddonSeeder';
import { AdminSeeder } from './AdminSeeder';
import { CategorySeeder } from './CategorySeeder';
import { DocumentProviderSeeder } from './DocumentProviderSeeder';
import { PhotoProviderSeeder } from './PhotoProviderSeeder';
import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { SchemaVersionSeeder } from './SchemaVersionSeeder';

/**
 * The default seeder, replacing `db/seeds.ts::runSeeds()`.
 *
 * Order matters in one place only: `AdminSeeder` runs first because it is the
 * one that keys off an empty `users` table, and the provider seeders run after
 * `AddonSeeder` so the shelf exists before anything hangs off it.
 */
export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.call(em, [AdminSeeder, CategorySeeder, AddonSeeder, PhotoProviderSeeder, DocumentProviderSeeder, SchemaVersionSeeder]);
  }
}
