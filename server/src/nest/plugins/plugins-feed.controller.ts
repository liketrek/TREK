import { Controller, Get, UseGuards } from '@nestjs/common';
import { db } from '../../db/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';

/**
 * GET /api/plugins — the authenticated feed of ACTIVE plugins the client renders
 * (#plugins, M3): page plugins become nav entries, widget plugins become
 * dashboard widgets. Empty when the runtime is disabled. Distinct from the
 * admin surface (/api/admin/plugins) and the per-plugin proxy
 * (/api/plugins/:id/*) — this is the exact /api/plugins path.
 */
interface ActivePlugin {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  slot: 'sidebar' | 'hero' | 'place-detail' | 'day-detail' | 'reservation-detail';
  /** How a trip-page plugin sits in the planner tab bar (replaced core tabs + position). */
  tripPage?: { replaces?: string[]; position?: number };
  /** The plugin ships a settings.html the user-settings page frames. */
  settingsUi?: true;
  /** Routing profiles the planner's route toggle offers (routeProvider hook, granted only). */
  routeProfiles?: Array<{ id: string; label: string; icon?: string }>;
  /** The plugin holds the geolocation:read grant — its frames may request the
   * browser position over the host bridge (the browser prompt still applies). */
  geolocation?: true;
}

@Controller('api/plugins')
@UseGuards(JwtAuthGuard)
export class PluginsFeedController {
  @Get()
  list(): { plugins: ActivePlugin[] } {
    if (!pluginsEnabled()) return { plugins: [] };
    const rows = db
      .prepare("SELECT id, name, type, icon, capabilities, granted_permissions FROM plugins WHERE status = 'active' ORDER BY sort_order, name")
      .all() as Array<Omit<ActivePlugin, 'slot' | 'tripPage'> & { capabilities: string; granted_permissions: string }>;
    const plugins = rows.map(({ capabilities, granted_permissions, ...p }) => {
      const tripPage = p.type === 'trip-page' ? tripPageOf(capabilities) : undefined;
      const routeProfiles = routeProfilesOf(capabilities, granted_permissions);
      return {
        ...p,
        slot: slotOf(capabilities),
        ...(tripPage ? { tripPage } : {}),
        ...(settingsUiOf(capabilities) ? { settingsUi: true as const } : {}),
        ...(routeProfiles ? { routeProfiles } : {}),
        ...(hasGrant(granted_permissions, 'geolocation:read') ? { geolocation: true as const } : {}),
      };
    });
    return { plugins };
  }
}

function slotOf(capabilities: string): ActivePlugin['slot'] {
  try {
    const c = JSON.parse(capabilities || '{}') as { widget?: { slot?: string } };
    const slot = c.widget?.slot;
    return slot === 'hero' || slot === 'place-detail' || slot === 'day-detail' || slot === 'reservation-detail' ? slot : 'sidebar';
  } catch {
    return 'sidebar';
  }
}

// Re-validated here even though the manifest parser already gated the values —
// the capabilities column is a JSON blob, and the tab list the client hides
// must never be steerable by a hand-edited row ('plan' stays unhideable).
const REPLACEABLE_TABS: ReadonlySet<string> = new Set(['transports', 'buchungen', 'listen', 'finanzplan', 'dateien', 'collab']);

function settingsUiOf(capabilities: string): boolean {
  try {
    const c = JSON.parse(capabilities || '{}') as { settingsUi?: unknown };
    return c.settingsUi === true;
  } catch {
    return false;
  }
}

function hasGrant(granted: string, permission: string): boolean {
  try {
    return (JSON.parse(granted || '[]') as unknown[]).includes(permission);
  } catch {
    return false;
  }
}

// Same re-validation rationale as the tab list: the profiles the client offers in
// the route picker must never be steerable by a hand-edited capabilities row, and
// an un-granted routeProvider must not surface profiles it can never serve.
const PROFILE_RE = /^[a-z][a-z0-9-]{0,23}$/;

function routeProfilesOf(capabilities: string, granted: string): ActivePlugin['routeProfiles'] {
  try {
    if (!(JSON.parse(granted || '[]') as unknown[]).includes('hook:route-provider')) return undefined;
    const c = JSON.parse(capabilities || '{}') as { routeProfiles?: unknown };
    if (!Array.isArray(c.routeProfiles)) return undefined;
    const out: NonNullable<ActivePlugin['routeProfiles']> = [];
    for (const v of c.routeProfiles.slice(0, 3)) {
      if (!v || typeof v !== 'object') continue;
      const p = v as { id?: unknown; label?: unknown; icon?: unknown };
      if (typeof p.id !== 'string' || !PROFILE_RE.test(p.id) || typeof p.label !== 'string' || !p.label.trim()) continue;
      out.push({
        id: p.id,
        label: p.label.trim().slice(0, 40),
        ...(typeof p.icon === 'string' && p.icon ? { icon: p.icon.slice(0, 40) } : {}),
      });
    }
    return out.length ? out : undefined;
  } catch {
    return undefined;
  }
}

function tripPageOf(capabilities: string): ActivePlugin['tripPage'] {
  try {
    const c = JSON.parse(capabilities || '{}') as { tripPage?: { replaces?: unknown; position?: unknown } };
    const tp = c.tripPage;
    if (!tp || typeof tp !== 'object') return undefined;
    const replaces = Array.isArray(tp.replaces) ? tp.replaces.filter((t): t is string => typeof t === 'string' && REPLACEABLE_TABS.has(t)) : [];
    const position = typeof tp.position === 'number' && Number.isInteger(tp.position) && tp.position >= 0 && tp.position <= 50 ? tp.position : undefined;
    if (!replaces.length && position === undefined) return undefined;
    return { ...(replaces.length ? { replaces } : {}), ...(position !== undefined ? { position } : {}) };
  } catch {
    return undefined;
  }
}
