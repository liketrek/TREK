import { Migration } from '@mikro-orm/migrations';

/**
 * Tours imported from wanderer carry wanderer's own word for how hard they are
 * (`difficulty`: easy, moderate, difficult), and tours show one scale only, the
 * SAC grade in `max_hiking_difficulty`. An import now writes both; this gives
 * the imports made before that their grade the same way: easy is T1, moderate
 * T2, difficult T3. A grade someone already set is left as it is.
 */
export class Migration20200101043500_wanderer_difficulty_on_the_sac_scale extends Migration {
  override name = 'Migration20200101043500_wanderer_difficulty_on_the_sac_scale';

  override up(): void {
    this.addSql(`
      UPDATE tours
      SET max_hiking_difficulty = CASE difficulty WHEN 'easy' THEN 1 WHEN 'moderate' THEN 2 WHEN 'difficult' THEN 3 END
      WHERE wanderer_ref IS NOT NULL
        AND max_hiking_difficulty IS NULL
        AND difficulty IN ('easy', 'moderate', 'difficult')
    `);
  }
}
