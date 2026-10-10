import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

/** The starter categories a fresh install gets, in display order. */
const DEFAULT_CATEGORIES: { name: string; color: string; icon: string }[] = [
  { name: 'Hotel', color: '#3b82f6', icon: '🏨' },
  { name: 'Restaurant', color: '#ef4444', icon: '🍽️' },
  { name: 'Attraction', color: '#8b5cf6', icon: '🏛️' },
  { name: 'Shopping', color: '#f59e0b', icon: '🛍️' },
  { name: 'Transport', color: '#6b7280', icon: '🚌' },
  { name: 'Activity', color: '#10b981', icon: '🎯' },
  { name: 'Bar/Cafe', color: '#f97316', icon: '☕' },
  { name: 'Beach', color: '#06b6d4', icon: '🏖️' },
  { name: 'Nature', color: '#84cc16', icon: '🌿' },
  { name: 'Other', color: '#6366f1', icon: '📍' },
];

/**
 * Seeds the default place categories.
 *
 * All-or-nothing on an empty table, exactly as `seeds.ts` did: once anything
 * exists the operator owns the list, and re-adding a category they deleted would
 * be the seeder overruling them.
 */
export class CategorySeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const connection = em.getConnection();
    const existing = (await connection.execute('SELECT COUNT(*) AS count FROM categories')) as { count: number }[];
    if (existing[0].count > 0) return;

    for (const category of DEFAULT_CATEGORIES) {
      await connection.execute('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)', [
        category.name,
        category.color,
        category.icon,
      ]);
    }
    console.log('Default categories seeded');
  }
}
