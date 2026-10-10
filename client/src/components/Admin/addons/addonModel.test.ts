import { describe, expect, it } from 'vitest';

import { type Addon, getAddonLabel, isPhotosAddon } from './addonModel';

// FE-ADDONMODEL-001 to FE-ADDONMODEL-003

function addon(over: Partial<Addon> = {}): Addon {
  return { id: 'todo', name: 'Todo', description: 'Tasks', icon: 'ListChecks', type: 'trip', enabled: true, ...over };
}

describe('addonModel', () => {
  it('FE-ADDONMODEL-001: a trip addon about photos is recognised by icon, id, name or description', () => {
    expect(isPhotosAddon(addon())).toBe(false);
    expect(isPhotosAddon(addon({ icon: 'Image' }))).toBe(true);
    expect(isPhotosAddon(addon({ id: 'photos' }))).toBe(true);
    expect(isPhotosAddon(addon({ description: 'Shared Memories' }))).toBe(true);
  });

  it('FE-ADDONMODEL-002: only trip addons count, whatever they mention', () => {
    expect(isPhotosAddon(addon({ type: 'global', icon: 'Image' }))).toBe(false);
    expect(isPhotosAddon(addon({ type: 'photo_provider', name: 'Photos' }))).toBe(false);
  });

  it('FE-ADDONMODEL-003: the catalog label wins, the server name and description are the fallback', () => {
    const catalog: Record<string, string> = {
      'admin.addons.catalog.todo.name': 'To-dos',
      'admin.addons.catalog.todo.description': 'Plan the tasks',
    };
    const t = (k: string) => catalog[k] ?? k;
    expect(getAddonLabel(t, addon())).toEqual({ name: 'To-dos', description: 'Plan the tasks' });
    expect(getAddonLabel(t, addon({ id: 'custom', name: 'Custom', description: 'Own' }))).toEqual({
      name: 'Custom',
      description: 'Own',
    });
  });
});
