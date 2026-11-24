import { createRequire } from 'node:module';
import path from 'node:path';

/**
 * Plyr's icon sprite. The package publishes its JS and CSS entries and nothing
 * else, so `plyr/dist/plyr.svg` is refused by the resolver although the file is
 * right there. Resolving the entry it does publish and stepping across keeps this
 * working wherever npm hoists the package.
 *
 * Shared by vite.config.js and vitest.config.ts: the build needs it to emit the
 * asset, and the test run needs it because a component reaches the same
 * specifier. The pattern is a regex so a `?url` suffix survives the rewrite. The player has to point at a copy on this origin
 * (#2341): its default is the sprite on cdn.plyr.io, which the CSP refuses.
 */
export const plyrSpriteAlias = {
  find: /^plyr\/dist\/plyr\.svg/,
  replacement: path.join(
    path.dirname(createRequire(import.meta.url).resolve('plyr')),
    'plyr.svg',
  ),
};
