import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../../database/database.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { pluginsEnabled } from '../kill-switch';
import { PluginHooks } from '../plugin-hooks.service';
import { stripEmoji } from '../text-sanitize';

/**
 * GET /api/day-tints/:tripId — the colours the planner paints into a day card in the
 * Plan sidebar (and into the mobile day chips) via the `dayTintProvider` hook. A trip
 * split into colour-coded legs — Tokyo, Kanazawa, Kyoto — becomes readable at a
 * glance while scrolling the itinerary.
 *
 * The card exposes three separately tintable regions — the day-number badge, the
 * header row, and the expanded activity list — so a plugin can mark the leg boldly on
 * the badge while leaving the dense activity list plain. `tone` / `color` are the
 * shorthands that fill every region a contribution does not name.
 *
 * A region is painted by a tone from the fixed palette or by the plugin's own
 * `#rrggbb` — four tones cannot keep a twenty-leg trip's days apart. The split of
 * control is: the plugin picks the hue, the host picks how strongly it lands (alpha
 * per theme and per region) and clamps it into a readable lightness band, so no
 * contribution can produce an unreadable card in either theme.
 *
 * Why this is its own hook rather than one dayScheduleProvider item per day: that
 * hook is capped at MAX_ITEMS = 60 per provider, so a six-month trip would tint its
 * first 60 days and silently stop — failing exactly the long multi-destination trips
 * this is for. Here the natural bound is the trip's own day count, because a day
 * gets at most one tint.
 *
 * Same contract as the other provider hooks: additive + fail-safe, declarative data
 * only, strings sanitized + capped. dayIds are checked against the trip so a
 * stale/hand-edited contribution can never tint another trip's day.
 */
type Tone = 'default' | 'success' | 'warn' | 'danger';

export interface DayTint {
  pluginId: string;
  dayId: number;
  /** Per-region paint, already resolved against the contribution's shorthands. Each
   * region carries EITHER a tone or a `#rrggbb` colour, never both — one region, one
   * paint instruction, so the client never has to break a tie. An absent region is not
   * tinted and renders exactly as it does without plugins. */
  badgeTone?: Tone;
  badgeColor?: string;
  headerTone?: Tone;
  headerColor?: string;
  activityTone?: Tone;
  activityColor?: string;
  /** Optional tooltip on the tinted day ("Kanazawa leg"). */
  label?: string;
}

const TONES: ReadonlySet<string> = new Set(['default', 'success', 'warn', 'danger']);
const cap = (v: unknown, n: number): string => stripEmoji(String(v ?? '')).slice(0, n);

/**
 * A plugin's own colour, or undefined for anything that is not exactly six hex digits.
 *
 * This is a security boundary, not input tidying. The client interpolates the value
 * into a `color-mix()` inside an inline `background`, and `background` is a shorthand
 * that takes a comma-separated layer list — a string closing the `color-mix(` paren
 * early could append a `url(...)` layer and turn everyone viewing the trip into a
 * beacon for the plugin's own server. Nothing but `#rrggbb` gets through.
 */
const HEX = /^#[0-9a-fA-F]{6}$/;
const hex = (v: unknown): string | undefined =>
  typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : undefined;

// Bound the work, not just the output: an all-invalid raw array (no entry ever
// reaching `out`) would otherwise be iterated in full. Slice up front, well above
// any legitimate payload — a trip has one tint per day, and 2000 days is 5½ years.
const MAX_RAW_TINTS = 2000;

/**
 * One region's tone. `undefined` means the region was not named, so the caller falls
 * back to the shorthand; naming a region with a bogus value still tints it (as
 * `default`) rather than silently doing nothing, because the plugin clearly asked for
 * a tint there — same "unknown enum degrades, never fails the item" rule the other
 * hooks use for `tone`.
 */
const region = (v: unknown): Tone | undefined =>
  v === undefined || v === null ? undefined : (TONES.has(v as string) ? (v as Tone) : 'default');

const named = (v: unknown): boolean => v !== undefined && v !== null;

/** One region of the card, resolved whole — a colour, a tone, or nothing. */
interface RegionTint { tone?: Tone; color?: string }

/**
 * Resolve one region against the contribution's `tone` / `color` shorthands, in one
 * order: what the region names beats the shorthand, and a colour beats a tone at the
 * same level. A colour wins because it is the more specific request — and emitting
 * only the winner keeps a tie out of the payload for the client to break.
 *
 * A region that names a colour the host cannot use (`badgeColor: 'chartreuse'`) and
 * nothing else degrades to `default` rather than letting the shorthand answer for it —
 * exactly what a bogus `badgeTone` already does. The plugin overrode the shorthand on
 * purpose here; it just sent junk, and a silently untinted region is the harder
 * failure for a plugin author to notice.
 */
function resolveRegion(
  rawTone: unknown,
  rawColor: unknown,
  toneShorthand: Tone | undefined,
  colorShorthand: string | undefined,
): RegionTint {
  const color = named(rawColor) ? hex(rawColor) : undefined;
  if (color) return { color };
  const tone = region(rawTone);
  if (tone) return { tone };
  if (named(rawColor)) return { tone: 'default' };
  if (colorShorthand) return { color: colorShorthand };
  if (toneShorthand) return { tone: toneShorthand };
  return {};
}

function normalize(pluginId: string, tripDayIds: ReadonlySet<number>, raw: unknown): DayTint[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>).slice(0, MAX_RAW_TINTS) : [];
  const out: DayTint[] = [];
  // One tint per day per provider — a plugin that contradicts itself gets its first
  // answer taken, not its last, so the day never depends on array order downstream.
  const seen = new Set<number>();
  for (const it of list) {
    if (!it || typeof it !== 'object') continue;
    const dayId = Number(it.dayId);
    // A day outside this trip, or one already tinted by this provider — drop it.
    if (!Number.isInteger(dayId) || !tripDayIds.has(dayId) || seen.has(dayId)) continue;
    seen.add(dayId);
    const label = cap(it.label, 60);
    const shTone = region(it.tone);
    const shColor = hex(it.color);
    const badge = resolveRegion(it.badgeTone, it.badgeColor, shTone, shColor);
    const header = resolveRegion(it.headerTone, it.headerColor, shTone, shColor);
    const activity = resolveRegion(it.activityTone, it.activityColor, shTone, shColor);
    // An entry that names no region and carries no usable shorthand still means "tint
    // this day" — the dayId is the payload, the colour is decoration. Give it the
    // default tone everywhere rather than returning a contribution that paints nothing.
    const painted = [badge, header, activity].filter((r) => r.tone || r.color);
    if (painted.length === 0) badge.tone = header.tone = activity.tone = 'default';
    const tint: DayTint = { pluginId, dayId };
    if (badge.tone) tint.badgeTone = badge.tone;
    if (badge.color) tint.badgeColor = badge.color;
    if (header.tone) tint.headerTone = header.tone;
    if (header.color) tint.headerColor = header.color;
    if (activity.tone) tint.activityTone = activity.tone;
    if (activity.color) tint.activityColor = activity.color;
    if (label) tint.label = label;
    out.push(tint);
  }
  return out;
}

@Controller('api/day-tints')
@UseGuards(JwtAuthGuard)
export class DayTintsController {
  constructor(
    private readonly hooks: PluginHooks,
    private readonly dbs: DatabaseService,
  ) {}

  @Get(':tripId')
  async get(
    @Param('tripId') tripIdRaw: string,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ tints: DayTint[] }> {
    if (!pluginsEnabled()) return { tints: [] };
    const tripId = Number(tripIdRaw);
    const userId = req.user?.id;
    if (!Number.isFinite(tripId) || userId == null || !this.dbs.canAccessTrip(tripId, userId)) return { tints: [] };

    const ids = this.hooks.providersOf('dayTintProvider');
    if (ids.length === 0) return { tints: [] };
    const dayRows = this.dbs.connection.prepare('SELECT id FROM days WHERE trip_id = ?').all(tripId) as Array<{ id: number }>;
    const tripDayIds: ReadonlySet<number> = new Set(dayRows.map((d) => d.id));

    const perProvider = await Promise.all(
      ids.map(async (id): Promise<DayTint[]> => {
        try {
          const raw = await this.hooks.dayTints(id, tripId, userId);
          return normalize(id, tripDayIds, raw);
        } catch {
          return []; // a slow / failing provider contributes nothing
        }
      }),
    );

    // Precedence across plugins: the first GRANTED provider wins a contested day.
    // Promise.all preserves input order, so the flattened array is already in
    // providersOf() order — keeping the first occurrence is the whole rule. This is
    // deterministic, so a day can never flicker between two plugins' colours.
    const claimed = new Set<number>();
    const tints: DayTint[] = [];
    for (const t of perProvider.flat()) {
      if (claimed.has(t.dayId)) continue;
      claimed.add(t.dayId);
      tints.push(t);
    }
    return { tints };
  }
}
