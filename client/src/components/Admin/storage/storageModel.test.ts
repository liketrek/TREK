import { describe, expect, it } from 'vitest';
import {
  MASKED_SETTING_VALUE,
  STORAGE_CATEGORIES,
  type StorageAdminState,
  type StorageBackend,
  type StorageCategory,
  type StorageConfig,
} from '@trek/shared';
import {
  categoriesPointingAt,
  computeMigrationCandidates,
  foldBackends,
  mirrorProbeTargets,
  mirrorsReferencing,
  primaryNameOf,
  removeBackend,
  removeBackendAndMirrors,
  renameBackendRefs,
  replicaCandidates,
  replicaOfPrimaries,
  setMirrorTargets,
  settingsDocumentOf,
  stripCategories,
  upsertBackend,
  usageByBackend,
} from './storageModel';

const STATE: StorageAdminState = {
  backends: [
    { name: 'uploads-local', type: 'local', source: 'built-in', options: { root: '/data/uploads' }, categories: ['files'] },
    { name: 'place-photos-local', type: 'local', source: 'env', options: { root: '/photos' }, categories: ['places'] },
    {
      name: 'off-box',
      type: 's3',
      source: 'settings',
      options: {
        endpoint: 'http://127.0.0.1:9000', bucket: 'trek', accessKeyId: 'ak',
        secretAccessKey: MASKED_SETTING_VALUE, region: 'us-east-1', keyPrefix: '', retries: 1, timeoutMs: 30000,
      },
      categories: ['covers'],
    },
  ],
  categories: {
    files: { backend: 'uploads-local', source: 'default' },
    journey: { backend: 'uploads-local', source: 'default' },
    covers: { backend: 'off-box', source: 'settings' },
    avatars: { backend: 'uploads-local', source: 'default' },
    places: { backend: 'place-photos-local', source: 'default' },
    'photos-google': { backend: 'place-photos-local', source: 'default' },
    'photos-trek': { backend: 'uploads-local', source: 'default' },
    backups: { backend: 'backups-local', source: 'default' },
  },
  health: { replicaFailures: [] },
  seedFilePresent: false,
  usage: null,
  backfills: [],
  migrations: [],
  version: 5,
  configError: null,
};

describe('settingsDocumentOf', () => {
  it('FE-ADMIN-STORM-001: carries ONLY settings-sourced backends and categories (the PUT contract)', () => {
    const doc = settingsDocumentOf(STATE);
    expect(doc.backends.map((b) => b.name)).toEqual(['off-box']);
    expect(doc.categories).toEqual({ covers: 'off-box' });
  });

  it('FE-ADMIN-STORM-001b: carries version from state (audit #7 — the PUT body\'s optimistic-concurrency check)', () => {
    expect(settingsDocumentOf(STATE).version).toBe(5);
    expect(settingsDocumentOf({ ...STATE, version: 12 }).version).toBe(12);
  });
});

describe('remove pre-check helpers', () => {
  const draft: StorageConfig = {
    backends: [
      { name: 'nas', type: 'local', options: { root: '/mnt/nas' } },
      { name: 'mir', type: 'mirror', options: { primary: 'backups-local', replicas: ['nas'] } },
    ],
    categories: { covers: 'nas', backups: 'mir' },
  };

  it('FE-ADMIN-STORM-002: lists categories pointing at a backend', () => {
    expect(categoriesPointingAt(draft, 'nas')).toEqual(['covers']);
    expect(categoriesPointingAt(draft, 'unused')).toEqual([]);
  });

  it('FE-ADMIN-STORM-003: lists mirrors referencing a backend (primary or replica)', () => {
    expect(mirrorsReferencing(draft, 'nas')).toEqual(['mir']);
    expect(mirrorsReferencing(draft, 'backups-local')).toEqual(['mir']);
    expect(mirrorsReferencing(draft, 'unused')).toEqual([]);
  });
});


describe('draft edits', () => {
  const draft: StorageConfig = {
    backends: [{ name: 'nas', type: 'local', options: { root: '/mnt/nas' } }],
    categories: {},
  };

  it('FE-ADMIN-STORM-005: upsert replaces by name in place, appends new ones, never mutates', () => {
    const edited = upsertBackend(draft, { name: 'nas', type: 'local', options: { root: '/mnt/nas2' } });
    expect(edited.backends).toEqual([{ name: 'nas', type: 'local', options: { root: '/mnt/nas2' } }]);
    const added = upsertBackend(draft, { name: 'other', type: 'local', options: { root: '/o' } });
    expect(added.backends.map((b) => b.name)).toEqual(['nas', 'other']);
    expect(draft.backends).toHaveLength(1); // untouched
  });

  it('FE-ADMIN-STORM-006: removeBackend filters by name', () => {
    expect(removeBackend(draft, 'nas').backends).toEqual([]);
    expect(removeBackend(draft, 'ghost').backends).toHaveLength(1);
  });
});

// Hoisted to module scope (not just the mirror-fold describe below) so the
// usageByBackend suite can reuse the same mirrored fixture the brief's test
// snippet assumes is in scope.
const MIRRORED_STATE: StorageAdminState = {
  ...STATE,
  backends: [
    ...STATE.backends,
    {
      name: 'mirror', type: 'mirror', source: 'settings',
      options: { primary: 'backups-local', replicas: ['off-box'] }, categories: ['backups'],
    },
    { name: 'backups-local', type: 'local', source: 'built-in', options: { root: '/data/backups' }, categories: [] },
  ],
  categories: { ...STATE.categories, backups: { backend: 'mirror', source: 'settings' } },
};
const mirroredDraft = (): StorageConfig => settingsDocumentOf(MIRRORED_STATE);

describe('mirror fold/synthesize (replicas-on-primary)', () => {
  it('FE-ADMIN-STORM-007: foldBackends hides the mirror, decorates primary and replica, unions categories', () => {
    const { rows, degenerate } = foldBackends(MIRRORED_STATE, mirroredDraft());
    expect(degenerate).toEqual([]);
    expect(rows.map((r) => r.name)).not.toContain('mirror');
    const primary = rows.find((r) => r.name === 'backups-local')!;
    expect(primary.mirrorTargets).toEqual(['off-box']);
    expect(primary.mirrorName).toBe('mirror');
    expect(primary.categories).toContain('backups'); // via the mirror
    const replica = rows.find((r) => r.name === 'off-box')!;
    expect(replica.replicaOf).toEqual(['backups-local']);
    expect(replica.categories).toContain('covers'); // its own direct assignment survives
  });

  it('FE-ADMIN-STORM-008: setMirrorTargets synthesizes a mirror and reroutes ALL effective categories of the primary, defaults included', () => {
    const draft = settingsDocumentOf(STATE); // no mirror yet; backups is default → backups-local
    const next = setMirrorTargets(STATE, draft, 'backups-local', ['off-box']);
    const mirror = next.backends.find((b) => b.type === 'mirror')!;
    expect(mirror.name).toBe('backups-local-mirror');
    expect(mirror.options).toEqual({ primary: 'backups-local', replicas: ['off-box'] });
    expect(next.categories.backups).toBe('backups-local-mirror'); // default-sourced category rewritten
    expect(next.categories.covers).toBe('off-box'); // categories of OTHER backends untouched
  });

  it('FE-ADMIN-STORM-009: setMirrorTargets adopts a foreign-named mirror in place', () => {
    const next = setMirrorTargets(MIRRORED_STATE, mirroredDraft(), 'backups-local', ['off-box', 'uploads-local']);
    const mirrors = next.backends.filter((b) => b.type === 'mirror');
    expect(mirrors).toHaveLength(1);
    expect(mirrors[0]!.name).toBe('mirror'); // adopted, not renamed
    expect(mirrors[0]!.options).toEqual({ primary: 'backups-local', replicas: ['off-box', 'uploads-local'] });
  });

  it('FE-ADMIN-STORM-010: empty targets dissolve the mirror and revert default-sourced categories', () => {
    // Build the synthesized state locally: default backups routed via a fresh mirror…
    const withMirror = setMirrorTargets(STATE, settingsDocumentOf(STATE), 'backups-local', ['off-box']);
    // …then dissolve it: the backups entry must DROP (state says its default is backups-local).
    const dissolved = setMirrorTargets(STATE, withMirror, 'backups-local', []);
    expect(dissolved.backends.some((b) => b.type === 'mirror')).toBe(false);
    expect(dissolved.categories).not.toHaveProperty('backups');
    // Against MIRRORED_STATE (backups already settings-sourced at the mirror), dissolve re-points instead of dropping.
    const repointed = setMirrorTargets(MIRRORED_STATE, mirroredDraft(), 'backups-local', []);
    expect(repointed.categories.backups).toBe('backups-local');
  });

  it('FE-ADMIN-STORM-011: degenerate mirrors are classified, never hidden', () => {
    const draft: StorageConfig = {
      backends: [
        { name: 'off-box', type: 's3', options: STATE.backends[2]!.options } as StorageBackend,
        { name: 'm1', type: 'mirror', options: { primary: 'uploads-local', replicas: ['off-box'] } },
        { name: 'm2', type: 'mirror', options: { primary: 'uploads-local', replicas: ['off-box'] } },
        { name: 'm-env', type: 'mirror', options: { primary: 'place-photos-local', replicas: ['off-box'] } },
        { name: 'm-ghost', type: 'mirror', options: { primary: 'nope', replicas: [] } },
      ],
      categories: {},
    };
    const { rows, degenerate } = foldBackends(STATE, draft);
    expect(rows.find((r) => r.name === 'uploads-local')!.mirrorName).toBe('m1'); // first wins
    expect(degenerate.map((d) => [d.backend.name, d.reason])).toEqual([
      ['m2', 'duplicate-mirror'],
      ['m-env', 'env-primary'],
      ['m-ghost', 'missing-primary'],
    ]);
  });

  it('FE-ADMIN-STORM-012: renameBackendRefs rewrites mirror primaries, replicas, and category entries', () => {
    const draft: StorageConfig = {
      backends: [
        { name: 'nas', type: 'local', options: { root: '/mnt/nas' } },
        { name: 'm', type: 'mirror', options: { primary: 'nas', replicas: ['nas'] } },
      ],
      categories: { covers: 'nas' },
    };
    const renamed = renameBackendRefs(draft, 'nas', 'nas2');
    const mirror = renamed.backends.find((b) => b.type === 'mirror')!;
    expect(mirror.options).toEqual({ primary: 'nas2', replicas: ['nas2'] });
    expect(renamed.categories.covers).toBe('nas2');
    expect(renamed.backends[0]!.name).toBe('nas'); // the backend row itself is the caller's job
  });

  it('FE-ADMIN-STORM-013: removeBackendAndMirrors cascades; replicaOfPrimaries phrases in primary names', () => {
    const draft = mirroredDraft();
    expect(replicaOfPrimaries(draft, 'off-box')).toEqual(['backups-local']);
    const removed = removeBackendAndMirrors(MIRRORED_STATE, draft, 'backups-local');
    expect(removed.backends.some((b) => b.name === 'mirror')).toBe(false);
    expect(removed.backends.some((b) => b.name === 'backups-local')).toBe(false);
  });

  it('FE-ADMIN-STORM-015: removing a replica strips it from remaining mirrors; a mirror stripped empty dissolves', () => {
    // Single-replica mirror: stripping off-box empties it → dissolve + re-point
    // (backups is settings-sourced at the mirror in MIRRORED_STATE, so it re-points, not drops).
    const dissolved = removeBackendAndMirrors(MIRRORED_STATE, mirroredDraft(), 'off-box');
    expect(dissolved.backends.some((b) => b.name === 'off-box')).toBe(false);
    expect(dissolved.backends.some((b) => b.type === 'mirror')).toBe(false);
    expect(dissolved.categories.backups).toBe('backups-local');
    // Multi-replica mirror: stripping one target keeps the mirror alive with the rest.
    const twoTargets = setMirrorTargets(MIRRORED_STATE, mirroredDraft(), 'backups-local', ['off-box', 'uploads-local']);
    const survived = removeBackendAndMirrors(MIRRORED_STATE, twoTargets, 'off-box');
    const mirror = survived.backends.find((b) => b.type === 'mirror')!;
    expect(mirror.options).toEqual({ primary: 'backups-local', replicas: ['uploads-local'] });
    expect(survived.categories.backups).toBe('mirror'); // still routed via the surviving mirror
  });

  it('FE-ADMIN-STORM-014: primaryNameOf maps mirror names (draft or state) to their primary; others pass through', () => {
    expect(primaryNameOf(MIRRORED_STATE, mirroredDraft(), 'mirror')).toBe('backups-local');
    expect(primaryNameOf(MIRRORED_STATE, { backends: [], categories: {} }, 'mirror')).toBe('backups-local'); // state fallback
    expect(primaryNameOf(STATE, settingsDocumentOf(STATE), 'uploads-local')).toBe('uploads-local');
  });
});

describe('replicaCandidates', () => {
  it('FE-ADMIN-STORM-020: offers only rows that serve no category, never the row being edited', () => {
    const { rows } = foldBackends(MIRRORED_STATE, mirroredDraft());
    // uploads-local/place-photos-local serve categories directly;
    // backups-local serves backups through the mirror it is the primary of;
    // off-box carries a direct `covers` assignment. Nothing is offerable.
    expect(replicaCandidates(rows, 'backups-local')).toEqual([]);
  });

  it('FE-ADMIN-STORM-021: keeps an already-selected target listed so it can be unchecked', () => {
    const { rows } = foldBackends(MIRRORED_STATE, mirroredDraft());
    expect(replicaCandidates(rows, 'backups-local', ['off-box'])).toEqual(['off-box']);
  });

  it('FE-ADMIN-STORM-022: an unassigned row is offered', () => {
    const state: StorageAdminState = {
      ...MIRRORED_STATE,
      backends: [
        ...MIRRORED_STATE.backends,
        { name: 'cold-store', type: 'local', source: 'settings', options: { root: '/data/cold' }, categories: [] },
      ],
    };
    const { rows } = foldBackends(state, settingsDocumentOf(state));
    expect(replicaCandidates(rows, 'backups-local')).toEqual(['cold-store']);
  });
});

describe('usageByBackend', () => {
  it('FE-ADMIN-STORM-016: sums categories onto their effective backend rows, mirrors onto the primary, legacy onto uploads-local', () => {
    const usage = {
      computedAt: 1,
      categories: Object.fromEntries(
        STORAGE_CATEGORIES.map((c) => [c, { objects: 1, bytes: 10 }]),
      ) as Record<StorageCategory, { objects: number; bytes: number }>,
      legacyPhotos: { objects: 5, bytes: 50 },
    };
    const state = { ...MIRRORED_STATE, usage };
    const sums = usageByBackend(state, mirroredDraft())!;
    // backups routes via the mirror → attributed to backups-local (the primary row).
    expect(sums['backups-local']).toEqual({ objects: 1, bytes: 10 });
    // uploads-local serves 4 direct categories (files, journey, avatars, photos-trek —
    // this fixture's `places` and `photos-google` default to the env-sourced
    // place-photos-local backend, not uploads-local) + legacy photos.
    expect(sums['uploads-local']).toEqual({ objects: 4 + 5, bytes: 40 + 50 });
    // places + photos-google both default to place-photos-local.
    expect(sums['place-photos-local']).toEqual({ objects: 2, bytes: 20 });
    // covers routes to off-box directly.
    expect(sums['off-box']).toEqual({ objects: 1, bytes: 10 });
  });

  it('FE-ADMIN-STORM-017: null usage yields null', () => {
    expect(usageByBackend({ ...STATE, usage: null }, settingsDocumentOf(STATE))).toBeNull();
  });
});

describe('computeMigrationCandidates', () => {
  it('FE-ADMIN-STORM-018: lists changed categories with usage counts; zero-object ones are excluded; null usage keeps them with null counts', () => {
    const state: StorageAdminState = {
      ...STATE,
      usage: {
        computedAt: 1,
        categories: {
          files: { objects: 3, bytes: 300 },
          journey: { objects: 0, bytes: 0 },
        } as Record<StorageCategory, { objects: number; bytes: number }>,
        legacyPhotos: { objects: 0, bytes: 0 },
      },
    };
    const base = settingsDocumentOf(state);
    const draft: StorageConfig = {
      ...base,
      categories: { ...base.categories, files: 'off-box', journey: 'off-box', avatars: 'off-box' },
    };
    const candidates = computeMigrationCandidates(draft, state);
    expect(candidates).toEqual([
      { category: 'files', from: 'uploads-local', to: 'off-box', toWire: 'off-box', objects: 3, bytes: 300 },
      { category: 'avatars', from: 'uploads-local', to: 'off-box', toWire: 'off-box', objects: null, bytes: null },
    ]);
  });

  it('FE-ADMIN-STORM-018b: reassigning onto a mirrored primary yields toWire = the mirror wire name while `to` stays the display primary', () => {
    const state: StorageAdminState = {
      ...STATE,
      backends: [
        ...STATE.backends,
        { name: 'nas', type: 'local', source: 'settings', options: { root: '/mnt/nas' }, categories: [] },
        {
          name: 'off-box-mirror',
          type: 'mirror',
          source: 'settings',
          options: { primary: 'off-box', replicas: ['nas'] },
          categories: [],
        },
      ],
      usage: {
        computedAt: 1,
        categories: { files: { objects: 3, bytes: 300 } } as Record<StorageCategory, { objects: number; bytes: number }>,
        legacyPhotos: { objects: 0, bytes: 0 },
      },
    };
    const base = settingsDocumentOf(state);
    // Reassign 'files' to the mirrored primary's WIRE name — the same value
    // setCategory() writes into the draft when the operator picks a mirrored
    // primary in the UI (adoptedMirrorFor(draft, 'off-box')?.name).
    const draft: StorageConfig = { ...base, categories: { ...base.categories, files: 'off-box-mirror' } };
    const candidates = computeMigrationCandidates(draft, state);
    expect(candidates).toEqual([
      { category: 'files', from: 'uploads-local', to: 'off-box', toWire: 'off-box-mirror', objects: 3, bytes: 300 },
    ]);
  });

  it('FE-ADMIN-STORM-019: stripCategories restores the saved assignment for exactly the named categories', () => {
    const base = settingsDocumentOf(STATE);
    const draft: StorageConfig = {
      ...base,
      categories: { ...base.categories, files: 'off-box', covers: 'uploads-local' },
    };

    const strippedFiles = stripCategories(draft, STATE, ['files']);
    expect(strippedFiles.categories.files).toBeUndefined(); // default-sourced: saved value is "no override"
    expect(strippedFiles.categories.covers).toBe('uploads-local'); // untouched — not in the strip list

    const strippedCovers = stripCategories(draft, STATE, ['covers']);
    expect(strippedCovers.categories.covers).toBe('off-box'); // settings-sourced saved value restored explicitly
    expect(strippedCovers.categories.files).toBe('off-box'); // untouched — not in the strip list
  });
});

describe('mirrorProbeTargets', () => {
  it('FE-ADMIN-STORM-020: a non-mirror candidate passes through unchanged', () => {
    const local: StorageBackend = { name: 'uploads-local', type: 'local', options: { root: '/data/uploads' } };
    expect(mirrorProbeTargets(settingsDocumentOf(STATE), STATE, local)).toEqual([local]);
  });

  it('FE-ADMIN-STORM-021: expands primary + replicas — draft override wins per name, falling back to state for names the draft never touched', () => {
    const mirror: StorageBackend = {
      name: 'mirror', type: 'mirror',
      options: { primary: 'uploads-local', replicas: ['off-box'] },
    };
    // The draft carries an EDITED off-box (unsaved endpoint change) but never
    // touches uploads-local (a built-in, never draft-owned).
    const editedOffBox = {
      name: 'off-box', type: 's3',
      options: { ...(STATE.backends[2]!.options as Record<string, unknown>), endpoint: 'http://edited:9000' },
    } as StorageBackend;
    const draft: StorageConfig = { backends: [editedOffBox, mirror], categories: {} };

    const targets = mirrorProbeTargets(draft, STATE, mirror);
    expect(targets.map((t) => t.name)).toEqual(['uploads-local', 'off-box']);
    // Primary: no draft entry — resolved from state (the live built-in).
    expect(targets[0]).toEqual({ name: 'uploads-local', type: 'local', options: { root: '/data/uploads' } });
    // Replica: draft override wins — the unsaved edit, not the saved options.
    expect((targets[1]!.options as Record<string, unknown>).endpoint).toBe('http://edited:9000');
  });

  it('FE-ADMIN-STORM-022: a name resolving to neither draft nor state is dropped, not thrown', () => {
    const mirror: StorageBackend = {
      name: 'mirror', type: 'mirror',
      options: { primary: 'uploads-local', replicas: ['ghost'] },
    };
    const targets = mirrorProbeTargets(settingsDocumentOf(STATE), STATE, mirror);
    expect(targets.map((t) => t.name)).toEqual(['uploads-local']);
  });
});
