import type { RoadtripSettingChange } from '@trek/shared';

/**
 * The road trip's driving settings as the planner's settings name them: the
 * label of each and how its value reads (a duration, a clock, a distance, a
 * switch, a choice). A table of literal keys, so the cards name a setting the
 * way the settings dialog does and the i18n check sees every key; a setting
 * this build does not know reads by its key.
 */

type SettingValue = RoadtripSettingChange['after'];

type ValueKind =
  | 'minutes'
  | 'clock'
  | 'km'
  | 'percent'
  | 'litres'
  | 'litresPer100'
  | 'kwh'
  | 'kwhPer100'
  | 'switch'
  | 'endMode'
  | 'vehicle'
  | 'avoid';

const SETTING_LOOK: Readonly<Record<string, { labelKey: string; kind: ValueKind }>> = {
  roadtrip_leg_minutes: { labelKey: 'roadtrip.limit.legLabel', kind: 'minutes' },
  roadtrip_day_minutes: { labelKey: 'roadtrip.limit.dayLabel', kind: 'minutes' },
  roadtrip_day_start: { labelKey: 'roadtrip.window.start', kind: 'clock' },
  roadtrip_day_end: { labelKey: 'roadtrip.window.end', kind: 'clock' },
  roadtrip_day_end_mode: { labelKey: 'roadtrip.window.endAt', kind: 'endMode' },
  roadtrip_range_km: { labelKey: 'roadtrip.limit.rangeLabel', kind: 'km' },
  roadtrip_vehicle: { labelKey: 'roadtrip.limit.vehicleLabel', kind: 'vehicle' },
  roadtrip_fill_percent: { labelKey: 'roadtrip.limit.fillLabel', kind: 'percent' },
  roadtrip_tank_litres: { labelKey: 'roadtrip.limit.tankLabel', kind: 'litres' },
  roadtrip_litres_per_100: { labelKey: 'roadtrip.limit.useLabel', kind: 'litresPer100' },
  roadtrip_battery_kwh: { labelKey: 'roadtrip.limit.batteryLabel', kind: 'kwh' },
  roadtrip_kwh_per_100: { labelKey: 'roadtrip.limit.useLabel', kind: 'kwhPer100' },
  roadtrip_battery_degradation: { labelKey: 'roadtrip.limit.wearLabel', kind: 'percent' },
  roadtrip_connect_days: { labelKey: 'roadtrip.line.connect', kind: 'switch' },
  roadtrip_service_stops_in_days: { labelKey: 'roadtrip.stops.inDays', kind: 'switch' },
  roadtrip_day_colors: { labelKey: 'roadtrip.line.dayColors', kind: 'switch' },
  roadtrip_show_hazards: { labelKey: 'roadtrip.hazards.show', kind: 'switch' },
  roadtrip_hotel_bookends: { labelKey: 'roadtrip.line.hotelBookends', kind: 'switch' },
  roadtrip_avoid: { labelKey: 'roadtrip.avoid.section', kind: 'avoid' },
};

const SWITCH: Readonly<Record<'on' | 'off', { labelKey: string }>> = {
  on: { labelKey: 'assistant.card.roadtrip.setting.on' },
  off: { labelKey: 'assistant.card.roadtrip.setting.off' },
};

const END_MODE: Readonly<Record<string, { labelKey: string }>> = {
  route: { labelKey: 'roadtrip.window.onRoute' },
  stop: { labelKey: 'roadtrip.window.atStop' },
};

const VEHICLE: Readonly<Record<string, { labelKey: string }>> = {
  '': { labelKey: 'roadtrip.limit.vehicleAny' },
  combustion: { labelKey: 'roadtrip.limit.vehicleCombustion' },
  electric: { labelKey: 'roadtrip.limit.vehicleElectric' },
};

const AVOID: Readonly<Record<string, { labelKey: string }>> = {
  toll: { labelKey: 'roadtrip.avoid.toll' },
  motorway: { labelKey: 'roadtrip.avoid.motorway' },
  ferry: { labelKey: 'roadtrip.avoid.ferry' },
};

/** What a setting's value is written with: the words, and the user's own numbers and units. */
export interface SettingWords {
  t: (key: string, params?: Record<string, string | number>) => string;
  minutes: (value: number) => string;
  clock: (value: string) => string;
  distance: (km: number) => string;
  number: (value: number) => string;
}

/** The name of a setting, its key when this build has none for it. */
export function settingLabel(key: string, t: SettingWords['t']): string {
  const look = SETTING_LOOK[key];
  return look ? t(look.labelKey) : key;
}

function chosen(table: Readonly<Record<string, { labelKey: string }>>, value: string, t: SettingWords['t']): string {
  const look = table[value];
  return look ? t(look.labelKey) : value;
}

/** A setting held as text: a clock, a choice, a list of road classes. */
function textValue(kind: ValueKind | undefined, value: string, words: SettingWords, off: string): string {
  const { t } = words;
  if (kind === 'clock') return value === '' ? off : words.clock(value);
  if (kind === 'endMode') return chosen(END_MODE, value, t);
  if (kind === 'vehicle') return chosen(VEHICLE, value, t);
  if (kind !== 'avoid') return value;
  const classes = value.split(',').filter((part) => part !== '');
  return classes.length === 0 ? off : classes.map((part) => chosen(AVOID, part, t)).join(', ');
}

/** A setting's value in words; "off" for a cleared one (an empty clock, a zero limit). */
export function settingValueText(key: string, value: SettingValue, words: SettingWords): string {
  const off = words.t(SWITCH.off.labelKey);
  const kind = SETTING_LOOK[key]?.kind;
  if (value === null) return off;
  if (typeof value === 'boolean') return words.t(value ? SWITCH.on.labelKey : SWITCH.off.labelKey);
  if (typeof value === 'string') return textValue(kind, value, words, off);
  if (value === 0 && (kind === 'minutes' || kind === 'km')) return off;
  if (kind === 'minutes') return words.minutes(value);
  if (kind === 'km') return words.distance(value);
  const unit: Partial<Record<ValueKind, string>> = {
    percent: '%',
    litres: 'l',
    litresPer100: 'l/100 km',
    kwh: 'kWh',
    kwhPer100: 'kWh/100 km',
  };
  const symbol = kind ? unit[kind] : undefined;
  return symbol ? `${words.number(value)} ${symbol}` : words.number(value);
}
