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
  'BackupController.updateAutoSettings',
  'BookingImportController.confirm',
  'BookingImportController.preview',
  'BookingImportController.previewAsync',
  'JourneyController.addContributor',
  'JourneyController.addTrip',
  'JourneyController.create',
  'JourneyController.createEntry',
  'JourneyController.galleryProviderPhotos',
  'JourneyController.linkPhoto',
  'JourneyController.preferences',
  'JourneyController.providerPhotos',
  'JourneyController.reorderEntries',
  'JourneyController.setShareLink',
  'JourneyController.update',
  'JourneyController.updateContributor',
  'JourneyController.updateEntry',
  'JourneyController.updatePhoto',
  'JourneyController.uploadEntryPhotos',
  'JourneyController.uploadGalleryVideo',
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
