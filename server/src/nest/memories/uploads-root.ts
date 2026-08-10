import path from 'node:path';

/**
 * `<server>/uploads`, the one anchor for everything the app stores on disk.
 *
 * `__dirname` moves with the file, and three separate copies of this join used
 * to live in services/memories/ — every one of them a silent breakage waiting
 * for the next move (multer would have created the wrong directory without a
 * word). One constant, one test (UPLOADS-ROOT-001), and the depth is stated
 * rather than counted by hand: `server/{src,dist}/nest/memories` sits three
 * levels under `server/`, the same depth `services/memories/` sat at — so the
 * resolved path is unchanged by the move.
 */
export const UPLOADS_ROOT = path.resolve(__dirname, '..', '..', '..', 'uploads');
