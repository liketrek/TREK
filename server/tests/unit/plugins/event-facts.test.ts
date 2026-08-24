import { it, expect } from 'vitest';
import { SNAPSHOT_GRANT, ENTITY_ID_KEYS } from '../../../src/plugin-event-sink';
import { KNOWN_PERMISSIONS } from '../../../src/nest/plugins/protocol/envelope';

it('every snapshot grant is a known db:read permission', () => {
  for (const p of Object.values(SNAPSHOT_GRANT)) {
    expect(KNOWN_PERMISSIONS).toContain(p);
    expect(p).toMatch(/^db:read:/);
  }
});
it('every snapshot family has an id-key path', () => {
  for (const family of Object.keys(SNAPSHOT_GRANT)) {
    expect(Object.keys(ENTITY_ID_KEYS)).toContain(family);
  }
});
