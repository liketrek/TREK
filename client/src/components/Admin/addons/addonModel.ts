import { BarChart3, Link2, MessageCircle, Sparkles, StickyNote } from 'lucide-react';

export interface Addon {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface ProviderOption {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  toggle: () => Promise<void>;
}

export interface CollabFeatures {
  chat: boolean;
  notes: boolean;
  links?: boolean;
  polls: boolean;
  whatsnext: boolean;
}

export const COLLAB_SUB_FEATURES = [
  { key: 'chat', icon: MessageCircle, titleKey: 'admin.collab.chat.title', subtitleKey: 'admin.collab.chat.subtitle' },
  { key: 'notes', icon: StickyNote, titleKey: 'admin.collab.notes.title', subtitleKey: 'admin.collab.notes.subtitle' },
  { key: 'links', icon: Link2, titleKey: 'collab.tabs.links', subtitleKey: 'admin.collab.links.subtitle' },
  { key: 'polls', icon: BarChart3, titleKey: 'admin.collab.polls.title', subtitleKey: 'admin.collab.polls.subtitle' },
  {
    key: 'whatsnext',
    icon: Sparkles,
    titleKey: 'admin.collab.whatsnext.title',
    subtitleKey: 'admin.collab.whatsnext.subtitle',
  },
] as const;

/** A trip addon that is really about photos; those live under Journey and stay out of the trip list. */
export function isPhotosAddon(addon: Addon): boolean {
  const haystack = `${addon.id} ${addon.name} ${addon.description}`.toLowerCase();
  return (
    addon.type === 'trip' && (addon.icon === 'Image' || haystack.includes('photo') || haystack.includes('memories'))
  );
}

/** The catalog name and description for an addon, falling back to what the server sent. */
export function getAddonLabel(t: (key: string) => string, addon: Addon): { name: string; description: string } {
  const nameKey = `admin.addons.catalog.${addon.id}.name`;
  const descKey = `admin.addons.catalog.${addon.id}.description`;
  const translatedName = t(nameKey);
  const translatedDescription = t(descKey);

  return {
    name: translatedName !== nameKey ? translatedName : addon.name,
    description: translatedDescription !== descKey ? translatedDescription : addon.description,
  };
}

/** A stored API key comes back from the server as this mask. */
export const MASKED = '••••••••';
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434/v1';

/** What an empty Base URL stands for with each provider, shown as its placeholder. */
export const LLM_BASE_URL_PLACEHOLDER: Record<string, string> = {
  local: DEFAULT_OLLAMA_URL,
  openai: 'https://api.openai.com/v1',
  // The Anthropic client appends /v1/messages itself, so a gateway is given without /v1.
  anthropic: 'https://api.anthropic.com',
};

/** Under the Anthropic key: what only Anthropic can read, and what a gateway in its place needs (#2655). */
export const ANTHROPIC_HINT =
  'Anthropic reads PDFs (including scans) natively. Local and OpenAI models receive extracted text, so scanned PDFs need Anthropic. ' +
  'A gateway in place of api.anthropic.com goes in Base URL without /v1 and has to accept PDF document blocks and forced tool calls.';

/** Curated models the local extractor is tuned for, pullable via Ollama. The router drives
 *  one model per document via Ollama's grammar-constrained `format`; "thinking" is disabled
 *  automatically, so the Qwen3 family works without any tuning. A host only needs one. */
export const RECOMMENDED_MODELS: { id: string; label: string; note: string; recommended: boolean; vision: boolean }[] =
  [
    {
      id: 'qwen3.5:4b',
      label: 'Qwen3.5 — 4B',
      note: 'Recommended · small and quick on CPU, 3.4 GB download, 256K context (thinking auto-disabled) · Apache-2.0',
      recommended: true,
      vision: true,
    },
  ];
