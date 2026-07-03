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
  slot: 'sidebar' | 'hero';
}

@Controller('api/plugins')
@UseGuards(JwtAuthGuard)
export class PluginsFeedController {
  @Get()
  list(): { plugins: ActivePlugin[] } {
    if (!pluginsEnabled()) return { plugins: [] };
    const rows = db
      .prepare("SELECT id, name, type, icon, capabilities FROM plugins WHERE status = 'active' ORDER BY sort_order, name")
      .all() as Array<Omit<ActivePlugin, 'slot'> & { capabilities: string }>;
    const plugins = rows.map(({ capabilities, ...p }) => ({ ...p, slot: slotOf(capabilities) }));
    return { plugins };
  }
}

function slotOf(capabilities: string): 'sidebar' | 'hero' {
  try {
    const c = JSON.parse(capabilities || '{}') as { widget?: { slot?: string } };
    return c.widget?.slot === 'hero' ? 'hero' : 'sidebar';
  } catch {
    return 'sidebar';
  }
}
