import type { DemoAddonStates, DemoRepository } from '../db/repositories/DemoRepository';

/**
 * What a demo instance offers, whatever its admin switched during the hour.
 *
 * The demo shows everything TREK can do on its own: every trip, global and
 * integration addon is on. What stays off is what needs a server of the
 * visitor's own, which a public demo has no address for and no business
 * reaching: the document sync providers, the wanderer connection under Tours,
 * the photo providers under Journey, AirTrail and Dawarich. The AI features
 * (the assistant, AI parsing) and the MCP server stay off as well: they spend
 * the instance's AI credit or hand out tokens to a shared account, so they are
 * a feature of a self-hosted install, not of the public demo. So does the
 * legacy `memories` row, which nothing reads any more.
 *
 * Each list names its rows outright instead of "everything but", so a release
 * that adds an addon has to decide where it goes: the policy test fails on a
 * seeded row that is in neither list. The demo seed applies this on every boot
 * and after every reopen, and the hourly reset applies it once more after the
 * swap, so the baseline cannot bring back an admin's toggle.
 */
export const DEMO_ADDON_POLICY = {
  /** Rows of the `addons` table. */
  addons: {
    on: [
      // Trip addons
      'packing',
      'budget',
      'documents',
      'collab',
      'roadtrip',
      'tours',
      // Global addons
      'vacay',
      'atlas',
      'journey',
      'collections',
      // Integrations TREK runs by itself
      'naver_list_import',
    ],
    off: [
      'airtrail',
      'dawarich',
      'mcp',
      'llm_parsing',
      'ai_assistant',
      // The trip Photos addon of old releases. Its migration seeds the row
      // switched off and nothing removes it; the client reads Photos from the
      // photo providers (addonStore's isEnabled) and the admin panel keeps the
      // row out of its trip list, so it switches nothing.
      'memories',
    ],
  },
  /** Rows of `photo_providers`, Journey's shelf. */
  photoProviders: {
    on: [],
    off: ['immich', 'synologyphotos'],
  },
  /** Rows of `document_providers`, the Documents addon's shelf. */
  documentProviders: {
    on: [],
    off: ['paperless', 'papra', 'nextcloud', 'opencloud', 'synologydrive'],
  },
  /**
   * The switches that sit under an addon in the admin panel, stored in
   * `app_settings`. wanderer is the one under Tours that reaches a server of
   * the visitor's own; the rest are on.
   */
  appSettings: {
    tours_wanderer_enabled: 'false',
    tours_hiking_map_enabled: 'true',
    tours_cycle_map_enabled: 'true',
    ski_routing_enabled: 'true',
    mcp_apps_enabled: 'true',
    bag_tracking_enabled: 'true',
    collab_chat_enabled: 'true',
    collab_notes_enabled: 'true',
    collab_links_enabled: 'true',
    collab_polls_enabled: 'true',
    collab_whatsnext_enabled: 'true',
  },
} as const satisfies DemoAddonStates;

/** Puts the instance's addon states to the demo set, in one transaction. A row the database does not hold is skipped. */
export async function applyDemoAddonPolicy(
  demo: DemoRepository,
  policy: DemoAddonStates = DEMO_ADDON_POLICY,
): Promise<void> {
  await demo.applyAddonStates(policy);
}
