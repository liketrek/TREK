import type { APIRequestContext } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { day } from '../dates';
import { seededTrip } from './fixtures';

/**
 * What the receipts guide of the Costs tab needs beyond the shared fixtures: an
 * expense of its own to attach a receipt to, and the receipt itself. Nothing in
 * the repository may carry a real person's paperwork, so the till slip is drawn
 * here, the way `fixtures.ts` draws its documents: a white strip of thermal
 * paper with the shop, the lines and the total, which is what a phone photo of
 * a receipt cropped to the paper looks like.
 */

/** The expense the receipt belongs to; its total is the slip's total. */
export const RAMEN = {
  name: 'Ichiran ramen in Shibuya',
  category: 'food',
  total_price: 4450,
  currency: 'JPY',
  expense_date: day(-6),
};

/** The file the guide attaches, by the name the editor and the preview show. */
export const RECEIPT_FILE = 'ichiran-receipt.png';

const LINES: [string, string, string][] = [
  ['Ramen, classic', '3', '2,940'],
  ['Kaedama (extra noodles)', '2', '420'],
  ['Matcha almond tofu', '2', '700'],
  ['Soft-boiled egg', '3', '390'],
];

const tmpDir = (): string => {
  const dir = path.join(process.cwd(), 'e2e', '.tmp');
  mkdirSync(dir, { recursive: true });
  return dir;
};

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * The till slip as a PNG in `e2e/.tmp`. Drawn on every call: the receipt names
 * its day, which is relative to the picture day, so a file left over from an
 * earlier run would carry that run's date.
 */
export async function receiptFixture(): Promise<string> {
  const stamp = RAMEN.expense_date.replace(/-/g, '/');
  const file = path.join(tmpDir(), RECEIPT_FILE);

  const W = 1000;
  const H = 1500;
  const paperX = 200;
  const paperW = 600;
  const left = paperX + 48;
  const right = paperX + paperW - 48;
  const mono = 'font-family="\'Courier New\', Courier, monospace"';
  const text = (x: number, y: number, s: string, opts = '') =>
    `<text x="${x}" y="${y}" ${mono} ${opts.includes('font-size') ? '' : 'font-size="24"'} fill="#1f2328" ${opts}>${esc(s)}</text>`;
  const rule = (y: number) =>
    `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#1f2328" stroke-width="2" stroke-dasharray="8 6"/>`;

  const rows: string[] = [];
  let y = 560;
  for (const [name, qty, price] of LINES) {
    rows.push(text(left, y, name));
    rows.push(text(left + 330, y, `x${qty}`));
    rows.push(text(right, y, price, 'text-anchor="end"'));
    y += 52;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#d9dce1"/>
  <rect x="${paperX + 10}" y="70" width="${paperW}" height="${H - 140}" fill="#000" opacity="0.12" rx="4"/>
  <rect x="${paperX}" y="60" width="${paperW}" height="${H - 140}" fill="#fcfcfa" rx="4"/>
  ${text(W / 2, 170, 'ICHIRAN', 'font-size="46" font-weight="bold" text-anchor="middle"')}
  ${text(W / 2, 214, 'Shibuya store', 'text-anchor="middle"')}
  ${text(W / 2, 252, '1-22-7 Jinnan, Shibuya-ku, Tokyo', 'font-size="20" text-anchor="middle"')}
  ${text(W / 2, 284, 'Tel 03-3463-3667', 'font-size="20" text-anchor="middle"')}
  ${rule(330)}
  ${text(left, 380, `${stamp}  13:42`)}
  ${text(right, 380, 'No. 0418', 'text-anchor="end"')}
  ${text(left, 424, 'Booth 14-16')}
  ${text(right, 424, 'Guests 3', 'text-anchor="end"')}
  ${rule(470)}
  ${rows.join('\n  ')}
  ${rule(y)}
  ${text(left, y + 60, 'TOTAL', 'font-size="32" font-weight="bold"')}
  ${text(right, y + 60, '¥4,450', 'font-size="32" font-weight="bold" text-anchor="end"')}
  ${text(left, y + 104, '(incl. 10% tax)', 'font-size="20"')}
  ${text(right, y + 104, '¥404', 'font-size="20" text-anchor="end"')}
  ${text(left, y + 160, 'Paid by card')}
  ${text(right, y + 160, '¥4,450', 'text-anchor="end"')}
  ${rule(y + 206)}
  ${text(W / 2, y + 260, 'Thank you, please come again', 'font-size="20" text-anchor="middle"')}
  ${text(W / 2, y + 296, 'Open 24 hours', 'font-size="20" text-anchor="middle"')}
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(file);
  return file;
}

type ApiFile = { id: number; original_name: string };

/**
 * The receipt off the trip again, trash included. Remove receipt in the editor
 * only unlinks it, and deleting the expense leaves it too, so without this the
 * Files tab of every later picture would carry a ramen receipt.
 */
export async function removeReceiptFiles(api: APIRequestContext): Promise<void> {
  const { tripId } = seededTrip();
  const res = await api.get(`/api/trips/${tripId}/files`);
  if (!res.ok()) throw new Error(`could not list the trip's files: ${res.status()}`);
  const { files = [] } = (await res.json()) as { files?: ApiFile[] };
  for (const file of files.filter((f) => f.original_name === RECEIPT_FILE)) {
    await api.delete(`/api/trips/${tripId}/files/${file.id}`);
    await api.delete(`/api/trips/${tripId}/files/${file.id}/permanent`);
  }
}
