/**
 * The Google Play listing graphics (`npm run store:graphic`):
 *
 *   featureGraphic.png  1024 x 500, the dark app background, the white TREK mark,
 *                       the name and the subtitle, and on the right a crop of the
 *                       first phone screenshot when one has been promoted
 *                       (`npm run store:promote`); without it, mark and text only.
 *   icon.png            512 x 512, from the same 1024 px tile as the app icon.
 *
 * Both are flattened: Play refuses an alpha channel in either.
 */
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const clientDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const imagesDir = join(clientDir, 'fastlane', 'metadata', 'android', 'en-US', 'images');
mkdirSync(imagesDir, { recursive: true });

const WIDTH = 1024;
const HEIGHT = 500;
const BACKGROUND = '#09090b';
const TITLE = 'TREK Travel Planner';
const SUBTITLE = readFileSync(join(clientDir, 'fastlane', 'metadata', 'en-US', 'subtitle.txt'), 'utf8').trim();

const escapeXml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const mark = await sharp(join(clientDir, 'public', 'icons', 'icon-white.svg'))
  .resize(120, 120)
  .png()
  .toBuffer();

const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <text x="72" y="300" fill="#fafafa" font-family="Helvetica, Arial, sans-serif" font-size="52" font-weight="700">${escapeXml(TITLE)}</text>
  <text x="72" y="352" fill="#a1a1aa" font-family="Helvetica, Arial, sans-serif" font-size="28">${escapeXml(SUBTITLE)}</text>
</svg>`);

const layers = [
  { input: mark, left: 72, top: 110 },
  { input: text, left: 0, top: 0 },
];

// The first phone screenshot, cut to the top of the screen and set at the right edge.
const phone = join(imagesDir, 'phoneScreenshots', '1_dashboard.png');
if (existsSync(phone)) {
  const crop = await sharp(phone)
    .resize({ width: 300 })
    .extract({ left: 0, top: 0, width: 300, height: 440 })
    .png()
    .toBuffer();
  const frame = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="440">
    <rect width="300" height="440" rx="28" ry="28" fill="#fff"/></svg>`);
  const rounded = await sharp(crop)
    .composite([{ input: frame, blend: 'dest-in' }])
    .png()
    .toBuffer();
  layers.push({ input: rounded, left: WIDTH - 300 - 64, top: 30 });
}

await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: BACKGROUND } })
  .composite(layers)
  .flatten({ background: BACKGROUND })
  .removeAlpha()
  .png()
  .toFile(join(imagesDir, 'featureGraphic.png'));

await sharp(join(clientDir, 'assets', 'icon-only.png'))
  .resize(512, 512)
  .flatten({ background: BACKGROUND })
  .removeAlpha()
  .png()
  .toFile(join(imagesDir, 'icon.png'));

console.log(`wrote ${join(imagesDir, 'featureGraphic.png')} and icon.png`);
