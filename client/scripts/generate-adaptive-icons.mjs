/**
 * Writes the Android adaptive icon layers at their full size, after
 * `npx @capacitor/assets generate` (see the icons:app script).
 *
 * The assets tool renders the foreground and background layers at the legacy
 * launcher size (192 px at xxxhdpi), while an adaptive icon layer is 108 dp
 * (432 px at xxxhdpi), so launchers that draw the icon large showed it soft.
 * The layers come from the same sources in assets/, and
 * mipmap-anydpi-v26/ic_launcher*.xml keeps placing them as before; it also uses
 * the foreground as the monochrome layer for themed icons, since the mark is
 * white on transparent.
 */
import { dirname, join } from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const clientDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const resDir = join(clientDir, 'android', 'app', 'src', 'main', 'res');

/** 108 dp in pixels for each density bucket. */
const DENSITIES = { ldpi: 81, mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
const LAYERS = { ic_launcher_foreground: 'icon-foreground.png', ic_launcher_background: 'icon-background.png' };

for (const [density, size] of Object.entries(DENSITIES)) {
  for (const [name, source] of Object.entries(LAYERS)) {
    const out = join(resDir, `mipmap-${density}`, `${name}.png`);
    await sharp(join(clientDir, 'assets', source))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`wrote ${out}`);
  }
}
