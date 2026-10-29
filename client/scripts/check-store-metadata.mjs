/**
 * Checks the store listings in fastlane/ before anything is uploaded
 * (`npm run store:check`, and the metadata job in .github/workflows/native.yml):
 *
 * - every text both stores require exists and fits its limit (App Store: name and
 *   subtitle 30, keywords 100, promotional text 170, description 4000; Google
 *   Play: title 30, short description 80, full description 4000, changelog 500);
 * - the URL files hold one https URL each;
 * - every screenshot and listing graphic that is present has the exact size its
 *   slot takes and no alpha channel, which both stores refuse.
 *
 * Plain Node, no dependencies: a PNG's size and colour type are in its header.
 */
import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const fastlane = join(dirname(fileURLToPath(import.meta.url)), '..', 'fastlane');
const meta = join(fastlane, 'metadata');
const problems = [];

/** [file, max length] the listing needs. */
const TEXTS = [
  ['en-US/name.txt', 30],
  ['en-US/subtitle.txt', 30],
  ['en-US/keywords.txt', 100],
  ['en-US/promotional_text.txt', 170],
  ['en-US/description.txt', 4000],
  ['en-US/release_notes.txt', 4000],
  ['android/en-US/title.txt', 30],
  ['android/en-US/short_description.txt', 80],
  ['android/en-US/full_description.txt', 4000],
  ['android/en-US/changelogs/default.txt', 500],
  ['review_information/notes.txt', 4000],
];
const URLS = ['en-US/support_url.txt', 'en-US/marketing_url.txt', 'en-US/privacy_url.txt'];

function read(rel) {
  const path = join(meta, rel);
  if (!existsSync(path)) {
    problems.push(`${rel}: missing`);
    return null;
  }
  return readFileSync(path, 'utf8').trim();
}

for (const [rel, max] of TEXTS) {
  const text = read(rel);
  if (text === null) continue;
  if (!text) problems.push(`${rel}: empty`);
  // Code points, as the stores count them, not UTF-16 units.
  const length = [...text].length;
  if (length > max) problems.push(`${rel}: ${length} characters, the limit is ${max}`);
}
for (const rel of URLS) {
  const url = read(rel);
  if (url !== null && !/^https:\/\/\S+$/.test(url)) problems.push(`${rel}: not a single https URL`);
}

/** Width, height and whether the PNG carries alpha (colour types 4 and 6), from its header. */
function pngInfo(path) {
  const head = readFileSync(path).subarray(0, 26);
  if (head.toString('latin1', 1, 4) !== 'PNG') return null;
  return { width: head.readUInt32BE(16), height: head.readUInt32BE(20), alpha: head[25] === 4 || head[25] === 6 };
}

/** [folder or file, accepted sizes] for every image slot. */
const IMAGES = [
  [join(fastlane, 'screenshots', 'en-US'), ['1320x2868', '2064x2752']],
  [join(meta, 'android', 'en-US', 'images', 'phoneScreenshots'), ['1080x1920']],
  [join(meta, 'android', 'en-US', 'images', 'sevenInchScreenshots'), ['1620x2880']],
  [join(meta, 'android', 'en-US', 'images', 'tenInchScreenshots'), ['1920x1080']],
  [join(meta, 'android', 'en-US', 'images', 'featureGraphic.png'), ['1024x500']],
  [join(meta, 'android', 'en-US', 'images', 'icon.png'), ['512x512']],
];

for (const [target, sizes] of IMAGES) {
  if (!existsSync(target)) continue;
  const files = target.endsWith('.png')
    ? [target]
    : readdirSync(target)
        .filter((f) => f.endsWith('.png'))
        .map((f) => join(target, f));
  for (const file of files) {
    const info = pngInfo(file);
    const rel = file.slice(fastlane.length + 1);
    if (!info) {
      problems.push(`${rel}: not a PNG`);
      continue;
    }
    if (!sizes.includes(`${info.width}x${info.height}`)) {
      problems.push(`${rel}: ${info.width}x${info.height}, expected ${sizes.join(' or ')}`);
    }
    if (info.alpha) problems.push(`${rel}: has an alpha channel`);
  }
}

if (problems.length) {
  for (const problem of problems) console.error(`FAIL  ${problem}`);
  process.exit(1);
}
console.log('store metadata: every text fits, every image has its size and no alpha');
