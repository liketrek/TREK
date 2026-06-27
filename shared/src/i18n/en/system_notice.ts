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
  'system_notice.pager.prev': 'Previous notice',
  'system_notice.pager.next': 'Next notice',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Go to notice {n}',
  'system_notice.pager.position': 'Notice {current} of {total}',
};
export default system_notice;
