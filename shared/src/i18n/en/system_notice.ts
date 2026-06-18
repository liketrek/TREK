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
  'system_notice.pager.prev': 'Previous notice',
  'system_notice.pager.next': 'Next notice',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Go to notice {n}',
  'system_notice.pager.position': 'Notice {current} of {total}',
};
export default system_notice;
