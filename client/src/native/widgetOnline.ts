import { CONTINENT_MAP } from '@trek/shared';
import apiClient, { collabApi, packingApi } from '../api/client';
import type { PackingItem } from '../types';

/**
 * The widget parts that only the server knows: the packing bags with their
 * weights, the countries of the Atlas, and the trip's chat and polls. Each is
 * best effort, so offline or with the addon off the widget goes without it;
 * client/ios/App/TREKWidgets/WidgetSnapshot.swift reads the shapes.
 */

interface WidgetBag {
  name: string;
  color: string;
  grams: number;
  limit?: number;
  packed: number;
  total: number;
}

export interface WidgetPackingDetail {
  bags: WidgetBag[];
  missing: { name: string; category: string | null; color: string | null }[];
}

export interface WidgetAtlas {
  count: number;
  codes: string[];
  /** The latest visited, newest first, with their names in the user's language. */
  recent: { code: string; name: string }[];
  continents: { name: string; count: number }[];
  trips?: number;
  days?: number;
}

export interface WidgetCollab {
  members: { name: string; initials: string }[];
  messages: { author: string; initials: string; text: string; at: string | null; mine: boolean }[];
  poll?: { question: string; options: { label: string; votes: number }[]; voters: number };
  path: string;
}

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Server answers kept for a while: the widgets sync every quarter hour for up
 * to six trips, and bags, chat and polls do not change that fast.
 */
const NETWORK_TTL_MS = 10 * 60 * 1000;
const networkCache = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, read: () => Promise<T>): Promise<T> {
  const hit = networkCache.get(key);
  if (hit && Date.now() - hit.at < NETWORK_TTL_MS) return hit.value as T;
  const value = await read();
  networkCache.set(key, { at: Date.now(), value });
  return value;
}

function initials(name: string): string {
  const parts = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.trim().slice(0, 2);
  return letters.toUpperCase();
}

/** The bags with what is in them, and the items still to pack, those in a bag first. */
export async function packingDetail(
  tripId: number,
  items: PackingItem[],
  limit = 8
): Promise<WidgetPackingDetail | null> {
  if (items.length === 0) return null;
  let bags: {
    id: number;
    name: string;
    color: string;
    weight_limit_grams?: number | null;
    total_weight_grams?: number;
  }[] = [];
  try {
    const res = await cached(`bags:${tripId}`, () => packingApi.listBags(tripId) as Promise<{ bags?: typeof bags }>);
    bags = res.bags ?? [];
  } catch {
    // Offline or no bags: the widget shows the items without them.
    bags = [];
  }
  const byBag = new Map(bags.map((b) => [b.id, b]));
  const summaries = bags.map((b) => {
    const inBag = items.filter((i) => i.bag_id === b.id);
    const grams = b.total_weight_grams ?? inBag.reduce((sum, i) => sum + (i.weight_grams ?? 0) * (i.quantity ?? 1), 0);
    return {
      name: b.name,
      // Empty when the bag has no usable colour: the widget then uses its own blue.
      color: HEX.test(b.color) ? b.color : '',
      grams,
      ...(b.weight_limit_grams ? { limit: b.weight_limit_grams } : {}),
      packed: inBag.filter((i) => i.checked).length,
      total: inBag.length,
    };
  });
  const missing = items
    .filter((i) => !i.checked)
    .sort((a, b) => Number(b.bag_id != null) - Number(a.bag_id != null) || a.sort_order - b.sort_order)
    .slice(0, limit)
    .map((i) => {
      const bag = i.bag_id != null ? byBag.get(i.bag_id) : undefined;
      return { name: i.name, category: i.category ?? null, color: bag && HEX.test(bag.color) ? bag.color : null };
    });
  return { bags: summaries.filter((b) => b.total > 0), missing };
}

interface AtlasStats {
  countries?: { code: string; lastVisit?: string | null; firstVisit?: string | null }[];
  stats?: { totalCountries?: number; totalTrips?: number; totalDays?: number };
}

const ATLAS_TTL_MS = 60 * 60 * 1000;
let atlasCache: { at: number; language: string; value: WidgetAtlas | null } | null = null;

/** The countries of the Atlas, the latest ones named, and how they spread over the continents. */
export async function atlasSummary(language: string): Promise<WidgetAtlas | null> {
  if (atlasCache && atlasCache.language === language && Date.now() - atlasCache.at < ATLAS_TTL_MS)
    return atlasCache.value;
  const value = await readAtlas(language);
  atlasCache = { at: Date.now(), language, value };
  return value;
}

async function readAtlas(language: string): Promise<WidgetAtlas | null> {
  let data: AtlasStats;
  try {
    data = (await apiClient.get('/addons/atlas/stats', { timeout: 10_000 })).data as AtlasStats;
  } catch {
    // The addon is off or the server unreachable: no atlas widget data this time.
    return null;
  }
  const countries = (data.countries ?? []).filter((c) => /^[A-Z]{2}$/.test(c.code));
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([language], { type: 'region' });
  } catch {
    names = null;
  }
  const recent = [...countries]
    .sort((a, b) => (b.lastVisit ?? b.firstVisit ?? '').localeCompare(a.lastVisit ?? a.firstVisit ?? ''))
    .slice(0, 4)
    .map((c) => ({ code: c.code, name: names?.of(c.code) ?? c.code }));
  const perContinent = new Map<string, number>();
  for (const c of countries) {
    const continent = CONTINENT_MAP[c.code];
    if (continent) perContinent.set(continent, (perContinent.get(continent) ?? 0) + 1);
  }
  return {
    count: data.stats?.totalCountries ?? countries.length,
    codes: countries.map((c) => c.code),
    recent,
    continents: [...perContinent].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    ...(data.stats?.totalTrips ? { trips: data.stats.totalTrips } : {}),
    ...(data.stats?.totalDays ? { days: data.stats.totalDays } : {}),
  };
}

interface Message {
  user_id: number;
  username: string;
  text: string;
  created_at: string | null;
  deleted: number | null;
}

interface Poll {
  question: string;
  is_closed: boolean;
  options: { text: unknown; label: unknown; voters: { user_id: number }[] }[];
}

/** Who travels along, the latest messages in the trip chat, and the open poll. */
export async function collabSummary(
  tripId: number,
  path: string,
  members: string[],
  me: number | null
): Promise<WidgetCollab | null> {
  let messages: Message[] = [];
  let polls: Poll[] = [];
  try {
    const [m, p] = await Promise.all([
      cached(`messages:${tripId}`, () => collabApi.getMessages(tripId) as Promise<{ messages?: Message[] }>),
      cached(`polls:${tripId}`, () => collabApi.getPolls(tripId) as Promise<{ polls?: Poll[] }>),
    ]);
    messages = m.messages ?? [];
    polls = p.polls ?? [];
  } catch {
    // Offline or the collab addon is off: the widget shows the members only.
    if (members.length < 2) return null;
  }
  const latest = messages
    .filter((m) => !m.deleted && m.text.trim())
    .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
    .slice(-3)
    .map((m) => ({
      author: m.username,
      initials: initials(m.username),
      text: m.text.trim().slice(0, 140),
      at: m.created_at,
      mine: me != null && m.user_id === me,
    }));
  const open = polls.find((p) => !p.is_closed);
  const label = (o: Poll['options'][number]) => String(o.label ?? o.text ?? '');
  const poll = open
    ? {
        question: open.question,
        options: open.options.slice(0, 4).map((o) => ({ label: label(o), votes: o.voters.length })),
        voters: new Set(open.options.flatMap((o) => o.voters.map((v) => v.user_id))).size,
      }
    : undefined;
  if (members.length < 2 && latest.length === 0 && !poll) return null;
  return {
    members: members.slice(0, 6).map((name) => ({ name, initials: initials(name) })),
    messages: latest,
    ...(poll ? { poll } : {}),
    path,
  };
}
