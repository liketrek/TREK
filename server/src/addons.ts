export const ADDON_IDS = {
  MCP: 'mcp',
  PACKING: 'packing',
  BUDGET: 'budget',
  DOCUMENTS: 'documents',
  VACAY: 'vacay',
  ATLAS: 'atlas',
  COLLAB: 'collab',
  JOURNEY: 'journey',
  AIRTRAIL: 'airtrail',
} as const;

export type AddonId = typeof ADDON_IDS[keyof typeof ADDON_IDS];
