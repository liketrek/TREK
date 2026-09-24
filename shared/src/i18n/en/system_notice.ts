import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.v3_photos.title': 'Photos have moved in 3.0',
  'system_notice.v3_photos.body':
    '**Photos** in the Trip Planner have been removed. Your photos are safe — TREK never modified your Immich or Synology library.\n\nPhotos now live in the **Journey** addon. Journey is optional — if it is not yet available, ask your admin to enable it under Admin → Addons.',
  'system_notice.v3_journey.title': 'Meet Journey — travel journal',
  'system_notice.v3_journey.body':
    'Document your trips as rich travel stories with timelines, photo galleries, and interactive maps.',
  'system_notice.v3_journey.cta_label': 'Open Journey',
  'system_notice.v3_journey.highlight_timeline': 'Day-by-day timeline & gallery',
  'system_notice.v3_journey.highlight_photos': 'Import from Immich or Synology',
  'system_notice.v3_journey.highlight_share': 'Share publicly — no login needed',
  'system_notice.v3_journey.highlight_export': 'Export as a PDF photo book',
  'system_notice.v3_features.title': 'More highlights in 3.0',
  'system_notice.v3_features.body': 'A few more things worth knowing about this release.',
  'system_notice.v3_features.highlight_dashboard': 'Mobile-first dashboard redesign',
  'system_notice.v3_features.highlight_offline': 'Full offline mode as a PWA',
  'system_notice.v3_features.highlight_search': 'Real-time place search autocomplete',
  'system_notice.v3_features.highlight_import': 'Import places from KMZ/KML files',
  'system_notice.v3_mcp.title': 'MCP: OAuth 2.1 upgrade',
  'system_notice.v3_mcp.body':
    'The MCP integration has been fully overhauled. OAuth 2.1 is now the recommended auth method. Legacy static tokens (trek_…) are deprecated and will be removed in a future release.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 recommended (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 fine-grained permission scopes',
  'system_notice.v3_mcp.highlight_deprecated': 'Static trek_ tokens deprecated',
  'system_notice.v3_mcp.highlight_tools': 'Expanded toolset & prompts',
  'system_notice.v3_thankyou.title': 'A personal note from me',
  'system_notice.v3_thankyou.body':
    "Before you go — I want to take a moment.\n\nTREK started as a side project I built for my own trips. I never imagined it would grow into something that 4,000 of you now trust to plan your adventures. Every star, every issue, every feature request — I read them all, and they keep me going through late nights between a full-time job and university.\n\nI want you to know: TREK will always be open source, always self-hosted, always yours. No tracking, no subscriptions, no strings attached. Just a tool built by someone who loves traveling as much as you do.\n\nSpecial thanks to [jubnl](https://github.com/jubnl) — you have become an incredible collaborator. So much of what makes 3.0 great carries your fingerprints. Thank you for believing in this project when it was still rough around the edges.\n\nAnd to every single one of you who filed a bug, translated a string, shared TREK with a friend, or simply used it to plan a trip — **thank you**. You are the reason this exists.\n\nHere's to many more adventures together.\n\n— Maurice\n\n---\n\n[Join the community on Discord](https://discord.gg/7Q6M6jDwzf)\n\nIf TREK makes your travels better, a [small coffee](https://ko-fi.com/mauriceboe) always keeps the lights on.",
  'system_notice.v3014_whitespace_collision.title': 'Action required: user account conflict',
  'system_notice.v3014_whitespace_collision.body':
    'The 3.0.14 upgrade detected one or more username or email collisions caused by leading/trailing whitespace in stored accounts. Affected accounts were renamed automatically. Check the server logs for lines starting with **[migration] WHITESPACE COLLISION** to identify which accounts need review.',
  'system_notice.welcome_v1.title': 'Welcome to TREK',
  'system_notice.welcome_v1.body':
    'Your all-in-one travel planner. Build itineraries, share trips with friends, and stay organized — online or offline.',
  'system_notice.welcome_v1.cta_label': 'Plan a trip',
  'system_notice.welcome_v1.hero_alt': 'A scenic travel destination with TREK planning UI overlay',
  'system_notice.welcome_v1.highlight_plan': 'Day-by-day itineraries for any trip',
  'system_notice.welcome_v1.highlight_share': 'Collaborate with travel partners',
  'system_notice.welcome_v1.highlight_offline': 'Works offline on mobile',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  // Thank-you + support the project (shown once per install and once per upgrade)
  'system_notice.thank_you_support.title': 'Thank you for using TREK',
  'system_notice.thank_you_support.body':
    "A quick thank-you for installing TREK — it genuinely means a lot.\n\nI'm a solo developer and I build TREK in my spare time. It started as a little tool just for my own trips, and I'm honestly blown away by the support and interest from the community since then. TREK is made with a lot of heart on my side — but also thanks to the many amazing external contributors who've helped shape it.\n\n**TREK is open source and completely free — and it will stay that way forever. No paid tiers, no subscriptions, no catch. I promise.**\n\nIf TREK is useful to you and you'd like to support its development, a small coffee genuinely helps me keep building — no pressure at all, but every cup keeps the late nights going.\n\nThank you for being here.\n\n— Maurice",
  'system_notice.thank_you_support.highlight_opensource': '100% open source on GitHub',
  'system_notice.thank_you_support.highlight_free': 'Free forever — never any paid tiers',
  'system_notice.thank_you_support.highlight_community': 'Built together with the community',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Support on Ko-fi',
  // The release modal. One stable set of keys: each big release swaps the copy in place.
  'system_notice.release_notes.eyebrow': 'Update installed',
  'system_notice.release_notes.headline': 'Four things TREK now does on its own.',
  'system_notice.release_notes.intro': 'Its own place API, road trips planned end to end, your location history back in your hands, and your documents in sync.',
  'system_notice.release_notes.features_label': 'The headliners',
  'system_notice.release_notes.features_aside': 'Far from everything',
  'system_notice.release_notes.feature_places_title': 'TREK Places API',
  'system_notice.release_notes.feature_places_body': 'The first open source travel planner with its own place API. 73.6 million places, no key, no quota.',
  'system_notice.release_notes.feature_roadtrip_title': 'Roadtrip Addon',
  'system_notice.release_notes.feature_roadtrip_body': 'Plans the drive itself: route, distance, hours and stops. Off until an admin turns it on.',
  'system_notice.release_notes.feature_dawarich_title': 'Dawarich Integration',
  'system_notice.release_notes.feature_dawarich_body': 'The self-hosted answer to Google Timeline, now readable inside TREK. TREK reads, and only reads.',
  'system_notice.release_notes.footnote': 'Plus a long list of smaller changes across the rest of TREK.',
  'system_notice.release_notes.notes_label': 'Release notes',
  'system_notice.release_notes.note_eyebrow': 'A note from the maintainer',
  'system_notice.release_notes.note_title': 'You are the reason I keep building TREK.',
  'system_notice.release_notes.note_body':
    'TREK began as a small tool for my own trips, written after work because I wanted a better way to plan them. It never really stopped growing. Almost everything you use was built late at night, on weekends, on trains, next to a full-time job, and there were plenty of evenings I quietly wondered whether anyone out there would ever open it.',
  'system_notice.release_notes.promise_label': 'The promise',
  'system_notice.release_notes.promise_lead': 'TREK stays free, forever.',
  'system_notice.release_notes.promise_text':
    'Every feature, every update, for everyone. No paid tiers, no subscriptions, no catch.',
  'system_notice.release_notes.note_body_after':
    'Then you did. Within a few months there were thousands of you: stars, bug reports, translations into languages I do not speak, pull requests from people I have never met. I still check the repository first thing every morning, and it still does not quite feel real.',
  'system_notice.release_notes.note_closing': 'Thank you for being here, from Maurice.',
  'system_notice.release_notes.support_lead':
    'TREK is free and always will be, but servers, domains and a lot of late nights are not.',
  'system_notice.release_notes.support_text':
    'If it has earned a place in your trips, buy me a coffee and help keep the next release coming.',
  'system_notice.release_notes.cta_bmc': 'Buy me a coffee',
  'system_notice.release_notes.cta_kofi': 'Support on Ko-fi',
  'system_notice.pager.prev': 'Previous notice',
  'system_notice.pager.next': 'Next notice',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Go to notice {n}',
  'system_notice.pager.position': 'Notice {current} of {total}',
  'system_notice.release_notes.feature_docsync_title': 'Document Sync',
  'system_notice.release_notes.feature_docsync_body': 'Paperless-ngx, Papra, Nextcloud, OpenCloud and Synology Drive. A trip’s documents flow both ways with the store you already run.',
};
export default system_notice;
