import {
  PLUGIN_POI_CATEGORY_ID_RE,
  PLUGIN_POI_COLOR_RE,
  PLUGIN_POI_ICONS,
  PLUGIN_POI_LABEL_MAX,
  PLUGIN_POI_MAX_CATEGORIES,
  SUPPORTED_LANGUAGE_CODES,
  isPluginPoiIcon,
  pluginPoiCategorySchema,
  type PluginPoiCategory,
} from '@trek/shared';
import { sanitiseAssistantText } from './text-sanitize';

/**
 * Reading a plugin's `capabilities.poiCategories` (#1781), in one place for the three
 * readers that need it: the manifest parser at install, the GET /api/plugins feed, and
 * the plugin-pois route deciding whether a category is a real declaration.
 *
 * One reader with two callers' strictness rather than two readers, because the feed
 * re-validates the stored JSON (a hand-edited capabilities row must never surface a
 * value the parser would have refused) and the two sets of rules drifting apart is
 * exactly how such a value would get through. The install path turns a refusal into a
 * manifest error; the other two skip the entry.
 */

export const POI_CATEGORY_PERMISSION = 'hook:poi-category-provider';

// Shaped like a language tag ('de', 'zh-TW'). A well-formed tag for a language TREK
// does not ship is dropped rather than refused, so a plugin that already carries a
// label for a language added in a later TREK still installs on this one.
const LANGUAGE_KEY_RE = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;
const LANGUAGES: ReadonlySet<string> = new Set(SUPPORTED_LANGUAGE_CODES);

export type PoiCategoryRead = { ok: true; value: PluginPoiCategory } | { ok: false; reason: string };

/**
 * A label as TREK draws it: control characters and emoji gone, whitespace flattened.
 * The same cleaning as MCP tool text, because a category label is shown in the pill,
 * in the admin panel and to an assistant listing the categories.
 */
function cleanLabel(raw: string): string {
  return sanitiseAssistantText(raw, PLUGIN_POI_LABEL_MAX);
}

/** The author's text, checked the way the SDK checks it: present and not too long. */
function rawLabel(v: unknown): string | null {
  const label = typeof v === 'string' ? v.trim() : '';
  return label && label.length <= PLUGIN_POI_LABEL_MAX ? label : null;
}

function readLabels(raw: unknown): { ok: true; value?: Record<string, string> } | { ok: false; reason: string } {
  if (raw === undefined) return { ok: true };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'labels must be an object of language code to label' };
  }
  const out: Record<string, string> = {};
  for (const [code, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!LANGUAGE_KEY_RE.test(code)) return { ok: false, reason: `labels: "${code.slice(0, 20)}" is not a language code` };
    const label = rawLabel(value);
    if (!label) return { ok: false, reason: `labels.${code} is required (max ${PLUGIN_POI_LABEL_MAX} chars)` };
    const clean = cleanLabel(label);
    if (LANGUAGES.has(code) && clean) out[code] = clean;
  }
  return { ok: true, value: Object.keys(out).length ? out : undefined };
}

/** One declared category, or the reason it is not one. */
export function readPoiCategory(raw: unknown): PoiCategoryRead {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, reason: 'entries must be objects' };
  const p = raw as Record<string, unknown>;
  const id = typeof p.id === 'string' ? p.id : '';
  if (!PLUGIN_POI_CATEGORY_ID_RE.test(id)) return { ok: false, reason: 'id must be lowercase [a-z][a-z0-9-], max 24 chars' };
  const label = rawLabel(p.label);
  if (!label) return { ok: false, reason: `"${id}" label is required (max ${PLUGIN_POI_LABEL_MAX} chars)` };
  if (!isPluginPoiIcon(p.icon)) {
    return { ok: false, reason: `"${id}" icon must be one of ${PLUGIN_POI_ICONS.join(', ')}` };
  }
  if (typeof p.color !== 'string' || !PLUGIN_POI_COLOR_RE.test(p.color)) {
    return { ok: false, reason: `"${id}" color must be a #rrggbb hex colour` };
  }
  const labels = readLabels(p.labels);
  if ('reason' in labels) return { ok: false, reason: `"${id}" ${labels.reason}` };
  const parsed = pluginPoiCategorySchema.safeParse({
    id,
    // An all-emoji label cleans to nothing; the id is still a readable name.
    label: cleanLabel(label) || id,
    ...(labels.value ? { labels: labels.value } : {}),
    icon: p.icon,
    color: p.color.toLowerCase(),
  });
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false, reason: `"${id}" is not a valid category` };
}

/**
 * The declared categories that survive re-validation, in declaration order: entries
 * the parser would refuse are skipped, as is a repeated id and anything past the cap.
 */
export function poiCategoriesFrom(raw: unknown): PluginPoiCategory[] {
  if (!Array.isArray(raw)) return [];
  const out: PluginPoiCategory[] = [];
  for (const v of raw.slice(0, PLUGIN_POI_MAX_CATEGORIES)) {
    const read = readPoiCategory(v);
    if (read.ok && !out.some((c) => c.id === read.value.id)) out.push(read.value);
  }
  return out;
}

/** The same, read off a plugins.capabilities JSON column. */
export function poiCategoriesOf(capabilities: string | null | undefined): PluginPoiCategory[] {
  try {
    const c = JSON.parse(capabilities || '{}') as { poiCategories?: unknown } | null;
    return poiCategoriesFrom(c?.poiCategories);
  } catch {
    return [];
  }
}
