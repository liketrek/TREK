/**
 * Legacy mutation handlers that still read @Body() without a createZodDto
 * class — grandfathered when the fail-closed boot gate landed
 * (validate-body-contracts.ts). Entries are `ControllerClass.methodName`.
 *
 * RATCHET ONLY: never add an entry. When a domain migrates, wrap its
 * @trek/shared schema in a colocated <domain>.dto.ts and DELETE the routes
 * here — the gate throws on stale entries, so removal is enforced too.
 */
export const BODY_CONTRACT_ALLOW_LIST: string[] = [
  'BookingImportController.confirm',
  'BookingImportController.preview',
  'BookingImportController.previewAsync',
  'LlmLocalController.pull',
  'OauthApiController.authorize',
  'OauthApiController.createClient',
  'PluginRoutesController.route',
  'PluginUserSettingsController.update',
  'PluginsController.activate',
  'PluginsController.install',
  'PluginsController.link',
  'PluginsController.retrust',
  'PluginsController.setEgressHosts',
  'PluginsController.uninstall',
  'PluginsController.updateConfig',
  'TagsController.create',
  'TagsController.update',
];
