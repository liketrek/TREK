import { Cable, type LucideIcon, MessagesSquare, ScanText } from 'lucide-react';
import type { Addon } from './addonModel';

/**
 * The three addons that talk to a language model, shown as one AI tile in the
 * integration column: the assistant in the trip, AI parsing (booking import)
 * and MCP (TREK inside other AI apps). Their ids, rows and settings stay their
 * own; only the page groups them. Assistant and parsing share one connection.
 */
const AI_ADDON_IDS = ['ai_assistant', 'llm_parsing', 'mcp'] as const;
export type AiAddonId = (typeof AI_ADDON_IDS)[number];

/** Each one's glyph, keyed by id: the icon column of an existing install still holds what it was seeded with. */
export const AI_ADDON_ICONS: Record<AiAddonId, LucideIcon> = {
  ai_assistant: MessagesSquare,
  llm_parsing: ScanText,
  mcp: Cable,
};

export function isAiAddon(addon: Addon): boolean {
  return (AI_ADDON_IDS as readonly string[]).includes(addon.id);
}

/** The AI addons this install has, in the tile's order. */
export function aiAddonsOf(addons: Addon[]): Addon[] {
  return AI_ADDON_IDS.flatMap((id) => addons.find((a) => a.id === id) ?? []);
}

/** Whether the shared connection is used at all: the assistant or AI parsing is on. */
export function usesConnection(addons: Addon[]): boolean {
  return addons.some((a) => (a.id === 'ai_assistant' || a.id === 'llm_parsing') && a.enabled);
}
