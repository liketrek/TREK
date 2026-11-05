/**
 * Moves the store screenshots from e2e/.tmp/store/ (written by the Playwright
 * `store` project, `npm run store:shots`) into the folders fastlane uploads
 * from, flattened onto the app background: both stores refuse an image with an
 * alpha channel.
 *
 *   iphone69, ipad13    fastlane/screenshots/en-US/          (deliver, App Store)
 *   play-phone          fastlane/metadata/android/en-US/images/phoneScreenshots/
 *   play-7in            .../sevenInchScreenshots/
 *   play-10in           .../tenInchScreenshots/               (supply, Google Play)
 *
 * Every image is checked against the size its device must have, so a capture at
 * the wrong viewport never reaches a listing. `npm run store:check` checks the
 * committed files the same way.
 */
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const clientDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = join(clientDir, 'e2e', '.tmp', 'store');
const fastlane = join(clientDir, 'fastlane');
const playImages = join(fastlane, 'metadata', 'android', 'en-US', 'images');

const TARGETS = {
  iphone69: { dir: join(fastlane, 'screenshots', 'en-US'), size: [1320, 2868] },
  ipad13: { dir: join(fastlane, 'screenshots', 'en-US'), size: [2064, 2752] },
  'play-phone': { dir: join(playImages, 'phoneScreenshots'), size: [1080, 1920] },
  'play-7in': { dir: join(playImages, 'sevenInchScreenshots'), size: [1620, 2880] },
  'play-10in': { dir: join(playImages, 'tenInchScreenshots'), size: [1920, 1080] },
};

const BACKGROUND = '#09090b';

if (!existsSync(rawDir)) {
  console.error(`No captures in ${rawDir}. Run npm run store:shots first.`);
  process.exit(1);
}

let failed = false;
for (const [device, { dir, size }] of Object.entries(TARGETS)) {
  const from = join(rawDir, device);
  if (!existsSync(from)) {
    console.error(`missing captures for ${device}`);
    failed = true;
    continue;
  }
  mkdirSync(dir, { recursive: true });
  for (const file of readdirSync(from).filter((f) => f.endsWith('.png'))) {
    const image = sharp(join(from, file));
    const { width, height } = await image.metadata();
    if (width !== size[0] || height !== size[1]) {
      console.error(`${device}/${file}: ${width}x${height}, expected ${size[0]}x${size[1]}`);
      failed = true;
      continue;
    }
    // The App Store folder holds both devices; the prefix keeps them apart.
    const name = dir.endsWith(join('screenshots', 'en-US')) ? `${device}_${file}` : file;
    await image.flatten({ background: BACKGROUND }).removeAlpha().png().toFile(join(dir, name));
    console.log(`wrote ${join(dir, name)}`);
  }
}
process.exit(failed ? 1 : 0);
