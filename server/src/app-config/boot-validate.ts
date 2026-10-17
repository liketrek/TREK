/**
 * Side-effect module: normalizes and validates the environment the moment it
 * is imported.
 *
 * index.ts imports this immediately after `import 'dotenv/config'` — as a
 * side-effect import (not a function call) so validation runs BEFORE the rest
 * of the import graph executes its module-load side effects (config.ts key
 * resolution, ...). A plain call in index.ts's body
 * would run after all of those, because imports hoist. The trim runs first,
 * so everything after it, Express and the plugin children included, reads the
 * cleaned value.
 */
import { normalizeEnvAtBoot, validateEnvAtBoot } from './env';

normalizeEnvAtBoot();
validateEnvAtBoot();
