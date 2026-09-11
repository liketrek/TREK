/**
 * Generates the Android status-bar notification icon from the master
 * white-silhouette SVG.
 *
 * Android renders the small notification icon as a mask: every non-transparent
 * pixel becomes the tint colour and everything else is dropped. Feeding it the
 * launcher icon (a full-bleed coloured square) therefore produces a solid white
 * blob, which is the single most common Capacitor push-notification complaint.
 * public/icons/icon-white.svg is already white-on-transparent, so we only have
 * to rasterise it at the five densities and flatten the colour to pure white so
 * any future edit to that SVG's fill cannot silently change the mask.
 *
 * Referenced from AndroidManifest.xml as @drawable/notification_icon.
 * Run: node scripts/generate-native-icons.mjs
 */
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDir = join(__dirname, '..');
const source = join(clientDir, 'public', 'icons', 'icon-white.svg');
const resDir = join(clientDir, 'android', 'app', 'src', 'main', 'res');

// Android notification icon sizes, in px, per density bucket (24dp baseline).
const densities = [
  { dir: 'drawable-mdpi', size: 24 },
  { dir: 'drawable-hdpi', size: 36 },
  { dir: 'drawable-xhdpi', size: 48 },
  { dir: 'drawable-xxhdpi', size: 72 },
  { dir: 'drawable-xxxhdpi', size: 96 },
];

for (const { dir, size } of densities) {
  const outDir = join(resDir, dir);
  mkdirSync(outDir, { recursive: true });

  // Inset the glyph slightly: Android's status bar clips tight to the 24dp box
  // and a mark that touches the edge reads as cropped.
  const glyph = Math.round(size * 0.86);

  const mask = await sharp(source, { density: 512 })
    .resize(glyph, glyph, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: Math.floor((size - glyph) / 2),
      bottom: Math.ceil((size - glyph) / 2),
      left: Math.floor((size - glyph) / 2),
      right: Math.ceil((size - glyph) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .toBuffer();

  // Keep the alpha, force every visible pixel to pure white. `dest-in` composites
  // the white plate through the glyph's alpha channel.
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, 'notification_icon.png'));

  console.log(`  ✓ ${dir}/notification_icon.png (${size}x${size})`);
}

console.log('Android notification icons generated.');
