/**
 * McpAppsService reads the built widget documents from disk, once each, and
 * offers them only while the admin's switch is on and every one was built.
 */
import { AddonsService } from '../../../../src/nest/addons/addons.service';
import { MCP_APPS_DIR } from '../../../../src/nest/mcp-apps/mcp-apps.constants';
import { McpAppsService } from '../../../../src/nest/mcp-apps/mcp-apps.service';
import { SettingsService } from '../../../../src/nest/settings/settings.service';
import { Test } from '@nestjs/testing';
import { MCP_APP_WIDGETS } from '@trek/shared';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let dir: string;
const mcpAppsEnabled = vi.fn(async () => true);
const getUserSettings = vi.fn(async (): Promise<Record<string, unknown>> => ({}));

async function service(): Promise<McpAppsService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      McpAppsService,
      { provide: AddonsService, useValue: { mcpAppsEnabled } },
      { provide: SettingsService, useValue: { getUserSettings } },
      { provide: MCP_APPS_DIR, useValue: dir },
    ],
  }).compile();
  return moduleRef.get(McpAppsService);
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-mcp-apps-'));
  mcpAppsEnabled.mockResolvedValue(true);
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('McpAppsService', () => {
  it('MCPAPPS-SVC-001: reads a built widget once and keeps it', async () => {
    fs.writeFileSync(path.join(dir, 'trip-list.html'), '<p>v1</p>');
    const apps = await service();
    expect(apps.html('trip-list')).toBe('<p>v1</p>');
    fs.writeFileSync(path.join(dir, 'trip-list.html'), '<p>v2</p>');
    expect(apps.html('trip-list')).toBe('<p>v1</p>');
  });

  it('MCPAPPS-SVC-002: answers null for a widget that was not built', async () => {
    expect((await service()).html('trip-list')).toBeNull();
  });

  it('MCPAPPS-SVC-003: offers a widget only while the switch is on and it was built', async () => {
    const apps = await service();
    expect(await apps.available('trip-list')).toBe(false);
    expect(await apps.offeredToSessions()).toBe(false);
    for (const widget of MCP_APP_WIDGETS) fs.writeFileSync(path.join(dir, `${widget}.html`), '<p></p>');
    const built = await service();
    expect(await built.available('trip-list')).toBe(true);
    expect(await built.offeredToSessions()).toBe(true);
    mcpAppsEnabled.mockResolvedValue(false);
    expect(await built.available('trip-list')).toBe(false);
    expect(await built.offeredToSessions()).toBe(false);
  });
  it('MCPAPPS-SVC-004: draws the map from the user’s own tile setting', async () => {
    getUserSettings.mockResolvedValueOnce({ map_tile_url: 'https://tiles.example.org/{z}/{x}/{y}.png' });
    const apps = await service();
    expect((await apps.mapTiles(7)).url).toBe('https://tiles.example.org/{z}/{x}/{y}.png');
    expect(getUserSettings).toHaveBeenCalledWith(7);
    expect((await apps.mapTiles(7)).url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
  });
});
