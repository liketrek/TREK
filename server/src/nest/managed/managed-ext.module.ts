import { Module } from '@nestjs/common';

/**
 * The attachment point for server surfaces that only exist on a centrally
 * administered install.
 *
 * Empty here, and empty in every build of this repository: no controllers, no
 * providers, no routes. An installation whose operator ships additional
 * endpoints replaces this file at build time.
 *
 * app.module.ts imports it unconditionally, which is the point. A conditional
 * import would make the module graph depend on an environment variable, and the
 * graph is built once per app while TREK_MANAGED is read live — the two do not
 * belong in the same expression (see app-config/README.md on the boot-stable vs
 * runtime-toggled split). An empty module costs nothing to import, so the flag
 * never has to reach this far.
 *
 * Anything added here follows the same rules as the rest of src/nest: a real
 * module with a controller and a provider, bodies through the Zod pipe, routes
 * covered by the global guards, and its own tests. Being outside this repository
 * is not a reason to be outside its standards.
 */
@Module({})
export class ManagedExtModule {}
