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
}

@Controller('api/plugins')
@UseGuards(JwtAuthGuard)
export class PluginsFeedController {
  @Get()
  list(): { plugins: ActivePlugin[] } {
    if (!pluginsEnabled()) return { plugins: [] };
    const rows = db
      .prepare("SELECT id, name, type, icon, capabilities FROM plugins WHERE status = 'active' ORDER BY sort_order, name")
      .all() as Array<Omit<ActivePlugin, 'slot' | 'tripPage'> & { capabilities: string }>;
    const plugins = rows.map(({ capabilities, ...p }) => {
      const tripPage = p.type === 'trip-page' ? tripPageOf(capabilities) : undefined;
      return {
        ...p,
        slot: slotOf(capabilities),
        ...(tripPage ? { tripPage } : {}),
        ...(settingsUiOf(capabilities) ? { settingsUi: true as const } : {}),
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
