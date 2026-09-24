import { createZodDto } from 'nestjs-zod';
import {
  pluginActivateRequestSchema,
  pluginEgressHostsRequestSchema,
  pluginInstallRequestSchema,
  pluginInstanceConfigUpdateSchema,
  pluginLinkRequestSchema,
  pluginRetrustRequestSchema,
  pluginRouteRequestSchema,
  pluginUninstallRequestSchema,
  pluginUpdateRequestSchema,
  pluginUserSettingsUpdateRequestSchema,
} from '@trek/shared';

/**
 * Nest DTO classes for the plugin surfaces — thin wrappers over the shared
 * contracts in @trek/shared (plugins.schema.ts), which carry the schemas, the
 * inferred types both sides import, and the journey-contract doctrine notes
 * (#1842) explaining why each body stays loose. Nothing here may add or remove
 * validation: the schema of record lives in shared.
 */

export class PluginInstallDto extends createZodDto(pluginInstallRequestSchema) {}

export class PluginLinkDto extends createZodDto(pluginLinkRequestSchema) {}

export class PluginActivateDto extends createZodDto(pluginActivateRequestSchema) {}

export class PluginUninstallDto extends createZodDto(pluginUninstallRequestSchema) {}

export class PluginRetrustDto extends createZodDto(pluginRetrustRequestSchema) {}

export class PluginUpdateDto extends createZodDto(pluginUpdateRequestSchema) {}

export class PluginEgressHostsDto extends createZodDto(pluginEgressHostsRequestSchema) {}

export class PluginConfigDto extends createZodDto(pluginInstanceConfigUpdateSchema) {}

export class PluginUserSettingsUpdateDto extends createZodDto(pluginUserSettingsUpdateRequestSchema) {}

export class PluginRouteDto extends createZodDto(pluginRouteRequestSchema) {}
