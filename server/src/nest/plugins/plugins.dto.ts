import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Body contracts for the plugin surfaces, written to DESCRIBE rather than to
 * tighten (the journey-contract doctrine, #1842).
 *
 * Every one of these handlers already owns its own rejection, and several of
 * them answer something other than 400 for a body they dislike: activate and
 * install answer 503 when plugins are disabled, and they check that BEFORE
 * looking at the body. A schema that rejected first would move a 503 to a 400
 * for an operator whose server has plugins off. So the fields stay optional and
 * the objects stay loose: the DTO pins the wire TYPES, and the handler keeps
 * every decision it already made, in the order it already made it.
 */

/** `id is required` stays the handler's answer, so id is optional here. */
export class PluginInstallDto extends createZodDto(
  z.looseObject({
    id: z.string().optional(),
    version: z.string().optional(),
    constraint: z.string().optional(),
    withDependencies: z.boolean().optional(),
  }),
) {}

/** `path is required` likewise, and dev-link answers 403 before reading it. */
export class PluginLinkDto extends createZodDto(
  z.looseObject({ path: z.string().optional() }),
) {}

export class PluginActivateDto extends createZodDto(
  z.looseObject({ consent: z.boolean().optional() }),
) {}

export class PluginUninstallDto extends createZodDto(
  z.looseObject({ deleteData: z.boolean().optional() }),
) {}

export class PluginRetrustDto extends createZodDto(
  z.looseObject({ version: z.string().optional(), publicKey: z.string().optional() }),
) {}

/**
 * `version` pins the exact version to install — the rollback path. Omitted, the
 * runtime resolves the newest TREK-compatible version itself (the classic update).
 */
export class PluginUpdateDto extends createZodDto(
  z.looseObject({ version: z.string().optional() }),
) {}

/**
 * `hosts` is deliberately unknown, not `string[]`.
 *
 * The handler reads `Array.isArray(body.hosts) ? body.hosts.map(String) : []`,
 * which means an omitted or non-array `hosts` CLEARS the operator egress list.
 * That is the documented way to reset it, so a schema demanding an array would
 * not tighten validation, it would remove a working admin action.
 */
export class PluginEgressHostsDto extends createZodDto(
  z.looseObject({ hosts: z.unknown().optional() }),
) {}

/**
 * Plugin instance config is defined by the plugin's own manifest, not by TREK,
 * so there is no shape to assert here beyond "a JSON object".
 */
export class PluginConfigDto extends createZodDto(z.looseObject({})) {}

/**
 * `config` is unknown rather than a record: the handler answers 200 with the
 * stored config for anything it cannot use, including a non-object, and a schema
 * that rejected first would turn that into a 400.
 */
export class PluginUserSettingsUpdateDto extends createZodDto(
  z.looseObject({ config: z.unknown().optional() }),
) {}

/**
 * The route hook answers `{ route: null }` at 200 for every input it dislikes:
 * a missing trip, a bad profile, unusable waypoints, a slow provider. The client
 * draws straight lines on a null and shows nothing on a 400, so a schema that
 * rejected a malformed body would turn a graceful fallback into a visible error.
 * Loose and fully optional on purpose.
 */
export class PluginRouteDto extends createZodDto(z.looseObject({})) {}
