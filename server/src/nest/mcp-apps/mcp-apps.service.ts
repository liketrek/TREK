import { AddonsService } from '../addons/addons.service';
import { MCP_APPS_DIR } from './mcp-apps.constants';
import { Inject, Injectable } from '@nestjs/common';
import { MCP_APP_WIDGETS, type McpAppWidget } from '@trek/shared';

import fs from 'node:fs';
import path from 'node:path';

/**
 * The interactive views (MCP Apps) a session may advertise, and their HTML.
 * A widget is offered only when the admin's switch is on and its document was
 * built; a checkout that never ran the widget build serves the tools as text.
 */
@Injectable()
export class McpAppsService {
  private readonly cache = new Map<McpAppWidget, string>();

  constructor(
    private readonly addons: AddonsService,
    @Inject(MCP_APPS_DIR) private readonly dir: string,
  ) {}

  /** The widget's HTML document, or null when it was not built. Read once, then kept. */
  html(widget: McpAppWidget): string | null {
    const cached = this.cache.get(widget);
    if (cached !== undefined) return cached;
    const file = path.join(this.dir, `${widget}.html`);
    if (!fs.existsSync(file)) return null;
    const html = fs.readFileSync(file, 'utf8');
    this.cache.set(widget, html);
    return html;
  }

  /** Whether a session may offer the widget: the switch on and its document built. */
  async available(widget: McpAppWidget): Promise<boolean> {
    return (await this.addons.mcpAppsEnabled()) && this.html(widget) !== null;
  }

  /**
   * Whether a new session's tools may point a host at their views: the switch
   * on and every widget built, since the widget build writes them together and
   * a tool must never name a view the session cannot serve.
   */
  async offeredToSessions(): Promise<boolean> {
    return (await this.addons.mcpAppsEnabled()) && MCP_APP_WIDGETS.every((w) => this.html(w) !== null);
  }
}
