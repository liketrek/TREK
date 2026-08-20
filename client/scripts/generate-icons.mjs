/**
 * Generates PNG icons for PWA from the approved 1024px PNG master.
 * Run: node scripts/generate-icons.mjs
 * Called automatically via the "prebuild" npm script.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');
const masterBuffer = readFileSync(join(iconsDir, 'icon-master-1024.png'));

const sizes = [
  { name: 'apple-touch-icon-polaroid-v1-180x180.png', size: 180 },
  { name: 'icon-polaroid-v1-192x192.png', size: 192 },
  { name: 'icon-polaroid-v1-512x512.png', size: 512 },
  { name: 'icon-polaroid-v1-maskable-512x512.png', size: 512 },
  { name: 'favicon-polaroid-v1-32x32.png', size: 32 },
];

for (const { name, size } of sizes) {
  await sharp(masterBuffer)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(join(iconsDir, name));
  console.log(`  \u2713 ${name} (${size}x${size})`);
}

console.log('PWA icons generated.');
