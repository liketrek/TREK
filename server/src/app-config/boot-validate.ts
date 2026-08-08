/**
 * Side-effect module: validates the environment the moment it is imported.
 *
 * index.ts imports this immediately after `import 'dotenv/config'` — as a
 * side-effect import (not a function call) so validation runs BEFORE the rest
 * of the import graph executes its module-load side effects (config.ts key
 * resolution, db/database.ts initDb, ...). A plain call in index.ts's body
 * would run after all of those, because imports hoist.
 */
import { validateEnvAtBoot } from './env';

validateEnvAtBoot();
