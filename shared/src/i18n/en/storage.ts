import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  // Field labels/help — these keys are pinned by STORAGE_BACKEND_TYPES in
  // @trek/shared (labelKey/helpKey); renaming one breaks the admin form.
  'storage.field.root': 'Root directory',
  'storage.help.root': 'Absolute path on the server where this backend stores its objects.',
  'storage.field.endpoint': 'Endpoint URL',
  'storage.help.endpoint':
    'Base URL of the S3-compatible service, e.g. https://s3.example.com or http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': 'Access key ID',
  'storage.field.secretAccessKey': 'Secret access key',
  'storage.field.region': 'Region',
  'storage.help.region': 'Keep the default unless your provider requires a specific region.',
  'storage.field.keyPrefix': 'Key prefix',
  'storage.help.keyPrefix': 'Optional prefix added to every object key, e.g. trek/prod.',
  'storage.field.retries': 'Retries',
  'storage.field.timeoutMs': 'Timeout (ms)',
  'storage.field.primary': 'Primary backend',
  'storage.field.replicas': 'Replicas',

  // Panel chrome
  'storage.title': 'Storage',
  'storage.description': 'Where TREK keeps uploaded files, photos and backups. Nothing changes until you save.',
  'storage.loading': 'Loading…',
  'storage.saved': 'Storage configuration saved',
  'storage.save': 'Save changes',
  'storage.unsaved': 'Unsaved changes',

  'storage.saveConflict':
    'Storage settings changed since you loaded them, so your changes were not saved. Discard them and reload the saved settings to start over.',
  'storage.discardAndReload': 'Discard my changes and reload',
  'storage.configError.banner': 'Stored storage settings failed to load — saving will replace them: {error}',
  // Backends list
  'storage.backends.title': 'Backends',
  'storage.backends.add': 'Add backend',
  'storage.backends.usedBy': 'Used by: {categories}',
  'storage.backends.unused': 'Not assigned to any category',
  'storage.backends.envReadOnly': 'Defined by an environment variable — read-only',
  'storage.source.built-in': 'Built-in',
  'storage.source.env': 'Environment',
  'storage.source.settings': 'Settings',
  'storage.type.local': 'Local',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Mirror',
  'storage.actions.test': 'Test',
  'storage.actions.edit': 'Edit',
  'storage.actions.remove': 'Remove',

  // Test-connection results
  'storage.test.running': 'Testing…',
  'storage.test.ok': 'Connection OK',
  'storage.test.failed': 'Test failed',

  // Remove pre-check (friendly message; the server stays authoritative)
  'storage.remove.title': 'Remove backend',
  'storage.remove.body':
    'Remove {name} from the configuration? The server rejects the save if anything still depends on it.',
  'storage.remove.stillAssigned': 'Still assigned to: {categories}',

  // Backend form
  'storage.form.addTitle': 'Add backend',
  'storage.form.editTitle': 'Edit backend',
  'storage.form.name': 'Name',
  'storage.form.type': 'Type',
  'storage.form.apply': 'Apply',
  'storage.form.cancel': 'Cancel',
  'storage.form.duplicateName': 'A backend named {name} already exists',

  // Category map
  'storage.categories.title': 'Categories',
  'storage.categories.default': 'default',
  'storage.categories.reassignWarning':
    'Existing objects do not move: new objects go to the newly assigned backend, old ones stay where they are.',
  'storage.category.files': 'Trip documents',
  'storage.category.journey': 'Journey photos',
  'storage.category.covers': 'Cover images',
  'storage.category.avatars': 'Profile pictures',
  'storage.category.places': 'Place images',
  'storage.category.photos-google': 'Google photo cache',
  'storage.category.photos-trek': 'TREK photo cache',
  'storage.category.backups': 'Backups',

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'File attachments uploaded to trips — tickets, PDFs, booking confirmations, and files shared in trip chat.',
  'storage.categoryDesc.journey': 'Photos and thumbnails attached to journey entries.',
  'storage.categoryDesc.covers': 'Trip and collection cover images, including covers fetched from Unsplash.',
  'storage.categoryDesc.avatars': 'User account profile pictures.',
  'storage.categoryDesc.places': 'Images attached to places and collection places — uploaded or imported.',
  'storage.categoryDesc.photos-google': 'Cached copies of Google Places photos — re-fetchable, safe to lose.',
  'storage.categoryDesc.photos-trek':
    'Cached photos from the TREK photo service used by Memories — re-fetchable, safe to lose.',
  'storage.categoryDesc.backups': 'Server backup archives created by the Backup panel or schedule.',

  // Health strip
  'storage.health.title': 'Health',
  'storage.health.allClear': 'No replica failures recorded.',
  'storage.health.seedFile':
    'A storage-config.json seed file is present but ignored — configuration rows already exist. Manage storage here.',
  'storage.health.failureLine': '{op} of {key} on {backend} failed: {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Mirror targets',
  'storage.mirror.targetsHelp': 'Every write to this backend is also copied to each selected target.',
  'storage.mirror.latencyNote':
    'Replicas are written one after another during each upload — a slow or unreachable target slows every upload of every category on this backend.',
  'storage.mirror.mirroredTo': 'Mirrored to: {targets}',
  'storage.mirror.replicaOf': 'Replica of: {primaries}',
  'storage.mirror.cacheWarning':
    'Not recommended: this category holds re-fetchable content — replicating it is usually wasteful.',
  'storage.mirror.degenerate.duplicate-mirror':
    'A second mirror wraps {primary} — the panel manages only the first; remove this one to manage mirroring from {primary}.',
  'storage.mirror.degenerate.env-primary': 'Wraps an environment-defined backend — not editable here.',
  'storage.mirror.degenerate.missing-primary': 'References a backend that no longer exists.',
  'storage.remove.usedAsReplicaBy': 'Used as replica by: {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Sync now',
  'storage.sync.running': 'Syncing… {done}/{total}',
  'storage.sync.counts': '{copied} copied · {skipped} skipped · {failed} failed',
  'storage.sync.cancel': 'Cancel sync',
  'storage.sync.done': 'Sync finished: {copied} copied, {deleted} deleted, {failed} failed',
  'storage.sync.cancelled': 'Sync cancelled',
  'storage.sync.error': 'Sync failed: {error}',
  'storage.sync.prompt': 'Existing objects are not replicated yet — sync now?',
  'storage.sync.dismiss': 'Dismiss',
  'storage.usage.line': '{objects} objects · {size}',
  'storage.usage.computed': 'Usage computed {age}',
  'storage.usage.never': 'Usage not computed yet',
  'storage.usage.refresh': 'Refresh',
  'storage.usage.compute': 'Compute now',
  'storage.usage.legacyNote': 'includes the legacy photo library',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Move existing objects to the new backend?',
  'storage.migrate.promptLine': '{category}: {objects} objects ({size}) from {from} to {to}',
  'storage.migrate.promptLineUnknown': '{category}: unknown size (no usage scan yet) from {from} to {to}',
  'storage.migrate.move': 'Move existing objects',
  'storage.migrate.routeOnly': 'Just route new writes',
  'storage.migrate.running': 'Moving {category}… {done}/{total}',
  'storage.migrate.done': 'Move finished: {copied} copied, {skipped} skipped',
  'storage.migrate.doneFailures': '{failed} failed — those objects were not copied to the new backend',
  'storage.migrate.failed': 'Move failed: {error} — the category was not switched',
  'storage.migrate.cancelled': 'Move cancelled — nothing was switched',
  'storage.migrate.reclaimable': '{objects} objects ({size}) remain on {from} — reclaim manually',
  'storage.migrate.cancel': 'Cancel move',
  'storage.migrate.promptCancel': 'Cancel',
  'storage.migrate.queued': 'Queued: {categories}',
  'storage.migrate.queueDropped': 'Could not start the next migration — the remaining queue was cleared: {categories}',
};
export default storage;
