import { afterAll, describe, expect, it, vi } from 'vitest';

const { vaultPath } = vi.hoisted(() => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-obsidian-'));
  const pluginDir = path.join(root, '.obsidian/plugins/yearly-glance');
  const dailyDir = path.join(root, 'Daily/Yearly Glance');
  fs.mkdirSync(pluginDir, { recursive: true });
  fs.mkdirSync(dailyDir, { recursive: true });
  fs.writeFileSync(path.join(pluginDir, 'data.json'), JSON.stringify({
    config: {
      dailyNoteSource: 'periodic-notes',
    },
    data: {
      customEvents: [
        { text: 'future vacation', emoji: '✈️', duration: 3, dateArr: ['2025-12-20'] },
        { text: 'ordinary flight', emoji: '✈️', duration: 1, dateArr: ['2025-12-23'] },
        { text: 'unrelated concert', emoji: '🎤', duration: 1, dateArr: ['2025-12-24'] },
      ],
    },
  }));
  const periodicDir = path.join(root, '.obsidian/plugins/periodic-notes');
  fs.mkdirSync(periodicDir, { recursive: true });
  fs.writeFileSync(path.join(periodicDir, 'data.json'), JSON.stringify({
    daily: {
      folder: 'Daily/Yearly Glance',
      format: 'YYYY-MM-DD',
      enabled: true,
    },
  }));
  // The global Daily Notes location intentionally differs. This verifies that
  // Yearly Glance follows the root-level Periodic Notes daily configuration.
  fs.writeFileSync(path.join(root, '.obsidian/daily-notes.json'), JSON.stringify({
    folder: 'Daily/Other',
    format: 'YYYY-MM-DD',
  }));
  fs.writeFileSync(path.join(dailyDir, '2025-01-01.md'), '---\n假期: [[放假/公共假期]]\n---\n');
  fs.writeFileSync(path.join(dailyDir, '2025-05-01.md'), '---\n"假期": ["#放假/PTO"]\n---\n');
  fs.writeFileSync(path.join(dailyDir, '2025-05-02.md'), '---\n假期:\n  - 放假/病假\n---\n');
  fs.writeFileSync(path.join(dailyDir, '2025-05-03.md'), '---\n假期: false\n---\n');
  fs.writeFileSync(path.join(root, '请假计划.md'), [
    '| Date | Type | Note |',
    '| --- | --- | --- |',
    '| 2025-08-27 | PTO | planned |',
    '| 2025-09-07 | 公共假期 | holiday |',
    '| 2025-10-01 | Meeting | ignored |',
  ].join('\n'));
  return { vaultPath: root };
});

vi.mock('../../../src/config', () => ({
  OBSIDIAN_VAULT_PATH: vaultPath,
  OBSIDIAN_DAILY_NOTES_FOLDER: '',
  OBSIDIAN_DAILY_NOTES_FORMAT: '',
}));

import {
  getObsidianHolidayNotes,
  getObsidianPublicHolidayNote,
  loadObsidianPublicHolidaysForYear,
} from '../../../src/services/obsidianYearlyGlanceService';

afterAll(() => require('node:fs').rmSync(vaultPath, { recursive: true, force: true }));

describe('loadObsidianPublicHolidaysForYear', () => {
  it('preserves each Yearly Glance 假期 category using root-level Periodic Notes settings', () => {
    expect(loadObsidianPublicHolidaysForYear(2025)).toEqual([
      { date: '2025-01-01', note: getObsidianPublicHolidayNote() },
      { date: '2025-05-01', note: 'Obsidian PTO' },
      { date: '2025-05-02', note: 'Obsidian 病假' },
      { date: '2025-08-27', note: 'Obsidian PTO' },
      { date: '2025-09-07', note: 'Obsidian 公共假期' },
      { date: '2025-12-20', note: 'Obsidian PTO' },
      { date: '2025-12-21', note: 'Obsidian PTO' },
      { date: '2025-12-22', note: 'Obsidian PTO' },
    ]);
    expect(getObsidianHolidayNotes()).toEqual([
      'Obsidian PTO',
      'Obsidian 病假',
      'Obsidian 公共假期',
    ]);
  });
});
