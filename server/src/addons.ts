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
  LLM_PARSING: 'llm_parsing',
  COLLECTIONS: 'collections',
} as const;

export type AddonId = typeof ADDON_IDS[keyof typeof ADDON_IDS];
