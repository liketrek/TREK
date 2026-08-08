import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { UPLOADS_ROOT } from '../../../src/nest/memories/uploads-root';

/**
 * The anchor three separate `__dirname` joins used to duplicate. A wrong depth
 * does not throw — multer and mkdirSync would happily create the wrong tree and
 * every stored photo would land somewhere nobody serves from.
 */
describe('UPLOADS_ROOT', () => {
  it('UPLOADS-ROOT-001: resolves to <server>/uploads, whatever the process cwd is', () => {
    // tests run from server/, so the repo-relative answer is unambiguous
    expect(UPLOADS_ROOT).toBe(path.resolve(process.cwd(), 'uploads'));
    expect(path.basename(UPLOADS_ROOT)).toBe('uploads');
    expect(path.basename(path.dirname(UPLOADS_ROOT))).toBe('server');
  });
});
