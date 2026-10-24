import { Migration } from '@mikro-orm/migrations';

/**
 * What else a photo's pixels say, for the assistant's book design: its main
 * colours (`palette`, JSON of up to five `"#rrggbb:share"`), where it is busy
 * and where calm (`busy`, an 8 x 8 grid of edge density, one hex digit per
 * cell, row by row) and where its detail gathers (`sal_x`, `sal_y`, 0 to 1 of
 * each side; an estimate, no face detection). Measured with the rest of the
 * signals; a row of an older measurement is measured again.
 */
export class Migration20200101046270_a_photo_knows_its_colours_and_calm_areas extends Migration {
  override name = 'Migration20200101046270_a_photo_knows_its_colours_and_calm_areas';

  override up(): void {
    this.addSql('ALTER TABLE trek_photo_signals ADD COLUMN palette TEXT');
    this.addSql('ALTER TABLE trek_photo_signals ADD COLUMN busy TEXT');
    this.addSql('ALTER TABLE trek_photo_signals ADD COLUMN sal_x REAL');
    this.addSql('ALTER TABLE trek_photo_signals ADD COLUMN sal_y REAL');
  }
}
