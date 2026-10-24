import {
  BookOpenText,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Eye,
  EyeOff,
  Frown,
  Globe,
  Lock,
  type LucideIcon,
  MapPinCheck,
  Meh,
  PenLine,
  Route,
  Smile,
  SmilePlus,
  Snowflake,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';

/**
 * How the states of a journal entry read in the chat, the way the journal
 * draws them: its moods with the glyphs of its tiles, its weathers, and the
 * words for what an update sets beyond the text (who sees the entry, its
 * kind, a draft, the route, a waved-away suggestion).
 */

/** How a state is drawn: its glyph and the key of its name. */
interface EntryTone {
  Icon: LucideIcon;
  labelKey: string;
}

/**
 * The four moods the journal's editors write, with the glyphs its tiles draw
 * them in; the colour is the theme's mood token of the same name. Any other
 * id is left out, the way the journal leaves it out.
 */
const MOODS: Readonly<Record<string, EntryTone & { color: string }>> = {
  amazing: { Icon: SmilePlus, labelKey: 'journey.mood.amazing', color: 'var(--mood-amazing)' },
  good: { Icon: Smile, labelKey: 'journey.mood.good', color: 'var(--mood-good)' },
  neutral: { Icon: Meh, labelKey: 'journey.mood.neutral', color: 'var(--mood-neutral)' },
  rough: { Icon: Frown, labelKey: 'journey.mood.rough', color: 'var(--mood-rough)' },
};

/** The six weathers the journal offers. `cold` is the id it stores for snow, and its name says so. */
const WEATHERS: Readonly<Record<string, EntryTone>> = {
  sunny: { Icon: Sun, labelKey: 'journey.weather.sunny' },
  partly: { Icon: CloudSun, labelKey: 'journey.weather.partly' },
  cloudy: { Icon: Cloud, labelKey: 'journey.weather.cloudy' },
  rainy: { Icon: CloudRain, labelKey: 'journey.weather.rainy' },
  stormy: { Icon: CloudLightning, labelKey: 'journey.weather.stormy' },
  cold: { Icon: Snowflake, labelKey: 'journey.weather.cold' },
};

const VISIBILITIES: Readonly<Record<string, EntryTone>> = {
  private: { Icon: Lock, labelKey: 'journey.visibility.private' },
  shared: { Icon: Users, labelKey: 'journey.visibility.shared' },
  public: { Icon: Globe, labelKey: 'journey.visibility.public' },
};

const TYPES: Readonly<Record<string, EntryTone>> = {
  entry: { Icon: BookOpenText, labelKey: 'assistant.card.journey.typeEntry' },
  checkin: { Icon: MapPinCheck, labelKey: 'assistant.card.journey.typeCheckin' },
  skeleton: { Icon: Sparkles, labelKey: 'journey.entry.suggestion' },
};

/** The flags an update sets, each by what it reads as when on (✓) and when off (✗). */
const FLAGS: Readonly<Record<string, { on: EntryTone; off: EntryTone }>> = {
  is_draft: {
    on: { Icon: PenLine, labelKey: 'journey.entry.draft' },
    off: { Icon: PenLine, labelKey: 'assistant.card.journey.notDraft' },
  },
  stats_excluded: {
    on: { Icon: Route, labelKey: 'journey.editor.statsExcluded' },
    off: { Icon: Route, labelKey: 'assistant.card.journey.onRoute' },
  },
  dismissed: {
    on: { Icon: EyeOff, labelKey: 'journey.suggestions.dismissed' },
    off: { Icon: Eye, labelKey: 'assistant.card.journey.restored' },
  },
};

/** How a flag comes on a change row, the way the server writes a boolean. */
const FLAG_ON = '✓';

/** An own entry of a table only, so `toString` and the like name nothing. */
function own<T>(table: Readonly<Record<string, T>>, id: string | null | undefined): T | null {
  if (!id || !Object.prototype.hasOwnProperty.call(table, id)) return null;
  return table[id] ?? null;
}

/** A mood the journal knows; null for any other. */
export function moodOf(id: string | null): (EntryTone & { color: string }) | null {
  return own(MOODS, id);
}

/** A weather the journal offers; null for a free word the traveller wrote. */
export function weatherOf(id: string | null): EntryTone | null {
  return own(WEATHERS, id);
}

/** A flag of a change row: what it reads as now; null for a field that is no flag. */
export function flagOf(field: string | undefined, value: string): EntryTone | null {
  const flag = own(FLAGS, field);
  if (!flag) return null;
  return value === FLAG_ON ? flag.on : flag.off;
}

/**
 * A state of a change row by the field it sets (the tool's own name) and a
 * value as stored: its glyph and name, or null where the card has no name for
 * it (a weather the traveller wrote in their words, which reads as it is).
 */
export function stateOf(field: string | undefined, value: string | null): EntryTone | null {
  if (field === 'mood') return moodOf(value);
  if (field === 'weather') return weatherOf(value);
  if (field === 'visibility') return own(VISIBILITIES, value);
  if (field === 'type') return own(TYPES, value);
  return null;
}
