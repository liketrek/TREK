import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Document sync',
  'docsync.noProviders': 'No document providers are available',
  'docsync.noProvidersHint': 'An instance administrator switches these on under Admin, Addons, Documents.',
  'docsync.addProvider': 'Connect a provider',
  'docsync.test': 'Test connection',
  'docsync.connect.optional': 'Optional',
  'docsync.connected': 'Connected',
  'docsync.chooseFolder': 'Choose folder',
  'docsync.noFolders': 'Nothing found on this instance yet.',
  'docsync.newFolderPlaceholder': 'New folder name',
  'docsync.syncNow': 'Sync now',
  'docsync.unlink': 'Disconnect',
  'docsync.confirmUnlink': 'Documents stay in TREK and at the store. Only the pairing between them goes.',
  'docsync.syncEnabled': 'Sync automatically',
  'docsync.deletePolicy': 'When a document is deleted',
  'docsync.deleteUnlink': 'Keep both copies',
  'docsync.deleteTrash': 'Move to recycle bin',
  'docsync.conflictPolicy': 'When both sides changed',
  'docsync.onConflict.manual': 'Ask me',
  'docsync.onConflict.trek_wins': 'Keep the TREK copy',
  'docsync.onConflict.provider_wins': "Keep the store's copy",
  'docsync.webhookHint':
    'Paste this URL into your provider so changes arrive immediately. Without it, TREK checks on a timer.',

  // Connection form fields. The keys mirror the `label` column in
  // document_provider_fields, which stores a key suffix rather than text.
  'docsync.providerUrl': 'Address',
  'docsync.providerApiToken': 'API token',
  'docsync.providerApiKey': 'API key',
  'docsync.providerAppPassword': 'App password',
  'docsync.providerAppToken': 'App token',
  'docsync.providerUsername': 'Username',
  'docsync.providerPassword': 'Password',
  'docsync.providerOrganization': 'Organisation ID',
  'docsync.providerBasePath': 'Base folder',
  'docsync.providerOTP': 'Two-factor code',
  'docsync.allowInsecureTls': 'Accept a self-signed certificate',

  'docsync.hintPaperlessToken': "Create one under My Profile in Paperless. It carries that account's full rights.",
  'docsync.hintPapraKey':
    'Create one under API keys in Papra. Papra keys always reach every organisation you belong to.',
  'docsync.hintPapraOrg': 'The org_… id from the Papra address bar.',
  'docsync.hintNextcloudLogin': 'Your Nextcloud login name, not your email address.',
  'docsync.hintNextcloudAppPassword': 'Settings, Security, Create new app password. Never your account password.',
  'docsync.hintOpenCloudToken': 'Created under app tokens in OpenCloud.',
  'docsync.hintBasePath': 'Where TREK looks for trip folders. Defaults to /TREK.',
  'docsync.hintSynologyUrl': 'Include the port, for example https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Best a dedicated DSM account with access to just this shared folder.',
  'docsync.hintSynologyOtp': 'Only needed once, if the account uses two-factor authentication.',

  'docsync.linkState.never': 'Not synced yet',
  'docsync.linkState.ok': 'In sync',
  'docsync.linkState.partial': 'Partly synced',
  'docsync.linkState.failed': 'Failed',
  'docsync.linkState.needs_reauth': 'Sign in again',
  'docsync.linkState.scope_lost': 'Folder is gone',
  'docsync.linkState.orphaned': 'Owner left the trip',

  'docsync.state.pending': 'Waiting',
  'docsync.state.synced': 'Synced',
  'docsync.state.conflict': 'Conflict',
  'docsync.state.rejected_type': 'Type not allowed',
  'docsync.state.too_large': 'Too large',
  'docsync.state.error': 'Error',
  'docsync.state.remote_missing': 'Missing at the provider',
  'docsync.state.local_deleted': 'Deleted in TREK',
  'docsync.state.scope_drift': 'Moved out of the folder',

  'docsync.conflict.resolve': "Resolve {count}",

  'docsync.conflict.title': 'Both copies changed',
  'docsync.conflict.keepTrek': 'Keep the TREK version',
  'docsync.conflict.keepProvider': 'Keep the provider version',
  'docsync.conflict.keepBoth': 'Keep both',

  // Failure reasons travel as codes, never as upstream text: a provider answers
  // in English, or with a proxy's HTML login page, and neither belongs here.
  'docsync.error.unreachable': 'The provider could not be reached.',
  'docsync.error.tls_untrusted':
    'The certificate was rejected. Allow self-signed certificates if you trust this instance.',
  'docsync.error.unauthorized': 'The credentials were refused.',
  'docsync.error.forbidden': 'This account is not allowed to do that.',
  'docsync.error.not_found': 'Not found on the provider.',
  'docsync.error.scope_missing': 'The connected folder no longer exists.',
  'docsync.error.rate_limited': 'The provider is rate limiting us. TREK will try again later.',
  'docsync.error.too_large': 'The file is larger than the provider accepts.',
  'docsync.error.unsupported_type': 'The provider does not accept this file type.',
  'docsync.error.quota_exceeded': 'The provider is out of space.',
  'docsync.error.conflict': 'The document changed on both sides.',
  'docsync.error.checksum_mismatch': 'The transfer did not arrive intact.',
  'docsync.error.provider_error': 'The provider reported an error.',
  'docsync.error.timeout': 'The provider took too long to answer.',
  'docsync.error.ssrf_blocked': 'That address is not allowed.',
  'docsync.error.mass_delete_guard':
    'Most documents vanished at once, so nothing was changed. Check that the folder is still mounted.',
  'docsync.error.unknown': 'Something went wrong.',

  // ── The dialog ─────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'This trip',
  'docsync.addAnother': 'Add another',
  'docsync.syncing': 'Syncing',
  'docsync.card.pickFolder': 'Connected, pick a folder',

  'docsync.empty.title': 'Nothing connected yet',
  'docsync.empty.hintOwner':
    'Pick a store on the left. TREK keeps its own copy of everything, so nothing is lost if it goes away.',
  'docsync.empty.hintMember': 'The trip owner sets this up. Documents stay in TREK either way.',

  // How each product files things. Shown before anyone connects, because it is
  // what the next screen will ask for.
  'docsync.model.paperless': 'Files by tag',
  'docsync.model.papra': 'Files by tag, inside an organisation',
  'docsync.model.nextcloud': 'Files in a folder',
  'docsync.model.opencloud': 'Files in a space',
  'docsync.model.synologydrive': 'Files in a folder on the NAS',

  // ── The flow bar ───────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Out to the store',
  'docsync.flow.toTrek': 'In from the store',
  'docsync.flow.documents': 'documents',
  'docsync.flow.summary.both': 'Documents move both ways.',
  'docsync.flow.summary.pull': 'Documents only come in.',
  'docsync.flow.summary.push': 'Documents only go out.',
  'docsync.flow.summaryEditable.both': 'Moving both ways. Tap a lane to stop it.',
  'docsync.flow.summaryEditable.pull': 'Only coming in. Tap the other lane to send out too.',
  'docsync.flow.summaryEditable.push': 'Only going out. Tap the other lane to bring in too.',

  // ── One binding ────────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Settings',
  'docsync.binding.folder': 'Folder',
  'docsync.binding.lastRun': 'Last run',
  'docsync.binding.autoOff': 'Paused',
  'docsync.binding.neverRun': 'not run yet',
  'docsync.binding.deleteHint': 'What happens to the copy on the other side.',
  'docsync.binding.conflictHint': 'Which copy survives when a document was edited in both places.',
  'docsync.binding.autoHint': 'Check for changes in the background.',
  'docsync.binding.webhookTitle': 'Instant updates',
  'docsync.binding.copy': 'Copy',
  'docsync.binding.copied': 'Copied',

  // ── Connecting ─────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Connect',
  'docsync.connect.testing': 'Trying to reach it',
  'docsync.connect.okAs': 'Reached it, signed in as {account}',
  'docsync.connect.insecureHint': 'For an instance on your own network with a self-signed certificate.',
  'docsync.connect.about.paperless':
    'TREK files this trip under its own tag and never touches the rest of your archive.',
  'docsync.connect.about.papra':
    'Pick the organisation this trip belongs to. TREK files it under its own tag inside it.',
  'docsync.connect.about.nextcloud':
    'Use an app password, not your account password: it survives two-factor and you can revoke it on its own.',
  'docsync.connect.about.opencloud': 'TREK gets its own space for this trip, separate from everything else.',
  'docsync.connect.about.synologydrive': 'Best a DSM account that only reaches the shared folder this trip should use.',

  // ── Picking the container ──────────────────────────────────────────────────
  'docsync.scope.title': 'Where should this trip live in {provider}?',
  'docsync.scope.intro': 'Only what is in here is synced. Everything else in your store stays out of TREK.',
  'docsync.scope.createTitle': 'Make a new one',
  'docsync.scope.createAction': 'Create',
  'docsync.scope.pickTitle': 'Or use one you already have',
  'docsync.scope.search': 'Search',
  'docsync.scope.noMatch': 'Nothing matches that.',

  // ── Things a person has to decide ──────────────────────────────────────────
  'docsync.issues.title': 'Needs a look',
  'docsync.issues.conflict': 'Changed in both places. Pick which one to keep.',
  'docsync.issues.remote_missing': 'Gone from the store. The TREK copy is still here.',
  'docsync.issues.rejected_type': 'This file type is not allowed here.',
  'docsync.issues.too_large': 'Bigger than the limit.',
  'docsync.issues.error': 'The transfer did not go through.',

  'docsync.error.unknown_provider': 'This provider is not available on this instance.',
  'docsync.error.provider_disabled': 'Paused: an administrator has switched this provider off. Syncing resumes once it is back on.',
  'docsync.binding.reconnect': 'Reconnect',
};

export default docsync;
