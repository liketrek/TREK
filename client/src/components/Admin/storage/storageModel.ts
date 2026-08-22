import {
  STORAGE_CATEGORIES,
  type StorageAdminState,
  type StorageBackend,
  type StorageCategory,
  type StorageConfig,
  type StorageConfigPut,
} from '@trek/shared'

/** One entry of the effective world (GET state), as the panels render it. */
export type StateBackend = StorageAdminState['backends'][number]

/**
 * The settings-owned document the PUT carries: settings-sourced backends and
 * settings-sourced category assignments ONLY — built-ins and env backends are
 * never in the body unless the operator overrides one by name (in which case
 * the override already reports source 'settings'). Carries `version` from
 * the state it was built at (audit #7 — optimistic concurrency): the hook
 * re-attaches this same version on every subsequent local edit, so a PUT
 * always submits the version the operator's form was loaded at, not
 * whatever the server currently holds.
 */
export function settingsDocumentOf(state: StorageAdminState): StorageConfigPut {
  return {
    backends: state.backends.filter((b) => b.source === 'settings').map(asWireBackend),
    categories: Object.fromEntries(
      Object.entries(state.categories)
        .filter(([, entry]) => entry.source === 'settings')
        .map(([category, entry]) => [category, entry.backend]),
    ) as StorageConfig['categories'],
    version: state.version,
  }
}

/**
 * State options are already schema-shaped (the wire contract guarantees it;
 * secret fields carry the mask, which the server unmasks by name on PUT/test) —
 * the cast re-attaches the discriminated-union type the loose state record dropped.
 */
export function asWireBackend(backend: Pick<StateBackend, 'name' | 'type' | 'options'>): StorageBackend {
  return { name: backend.name, type: backend.type, options: backend.options } as StorageBackend
}

/** Draft categories pointing at a backend name (the friendly remove pre-check). */
export function categoriesPointingAt(draft: StorageConfig, name: string): StorageCategory[] {
  return (Object.entries(draft.categories) as Array<[StorageCategory, string]>)
    .filter(([, backend]) => backend === name)
    .map(([category]) => category)
}

/** Draft mirrors referencing a backend name as primary or replica (remove pre-check). */
export function mirrorsReferencing(draft: StorageConfig, name: string): string[] {
  return draft.backends
    .filter((b) => b.type === 'mirror' && (b.options.primary === name || b.options.replicas.includes(name)))
    .map((b) => b.name)
}

/** Replace by name in place, or append. Never mutates. */
export function upsertBackend(draft: StorageConfig, backend: StorageBackend): StorageConfig {
  const exists = draft.backends.some((b) => b.name === backend.name)
  return {
    ...draft,
    backends: exists
      ? draft.backends.map((b) => (b.name === backend.name ? backend : b))
      : [...draft.backends, backend],
  }
}

export function removeBackend(draft: StorageConfig, name: string): StorageConfig {
  return { ...draft, backends: draft.backends.filter((b) => b.name !== name) }
}

// ── Mirror fold/synthesize (replicas-on-primary spec) ─────────────────────────
// The draft stays the wire document; folding is a view rule, synthesis a set
// of pure draft operations. Mirror NAMES never reach the UI — every helper
// that renders phrases mirrors as their primary.

type MirrorBackend = Extract<StorageBackend, { type: 'mirror' }>
const isMirror = (b: StorageBackend): b is MirrorBackend => b.type === 'mirror'

export interface FoldedBackendRow {
  name: string
  type: 'local' | 's3'
  source: 'built-in' | 'env' | 'settings'
  backend: StorageBackend
  /** Direct assignments ∪ assignments routed via the adopted mirror. */
  categories: StorageCategory[]
  /** Adopted mirror's replicas — [] when unmirrored. */
  mirrorTargets: string[]
  /** Adopted mirror's wire name — needed by draft ops, hidden from the UI. */
  mirrorName: string | null
  /** Primaries whose adopted mirror lists this backend as a replica. */
  replicaOf: string[]
}

export interface DegenerateMirror {
  backend: StorageBackend
  reason: 'duplicate-mirror' | 'env-primary' | 'missing-primary'
  categories: StorageCategory[]
}

/**
 * Re-fetchable content — replicating it is usually wasteful. photos-google is
 * the Google photo cache (place-photo-cache.service.ts); places is mostly
 * provider-derived imagery.
 */
export const CACHE_CATEGORIES: readonly StorageCategory[] = ['photos-google', 'places']

/** The configurable categories resolved draft-over-state (draft entries win; defaults fill the rest). */
export function effectiveCategoryMap(state: StorageAdminState, draft: StorageConfig): Record<StorageCategory, string> {
  const map = {} as Record<StorageCategory, string>
  for (const category of STORAGE_CATEGORIES) {
    // The admin state's category record is exhaustive by schema contract.
    map[category] = draft.categories[category] ?? state.categories[category]!.backend
  }
  return map
}

/** First draft mirror wrapping the named primary — the one the UI manages. */
export function adoptedMirrorFor(draft: StorageConfig, primaryName: string): MirrorBackend | undefined {
  return draft.backends.filter(isMirror).find((m) => m.options.primary === primaryName)
}

/**
 * Client-side mirror expansion for the test probe (audit fix — the server's
 * `testBackend` resolves a mirror candidate's primary/replicas against its
 * OWN live snapshot by name, so probing a mirrored row with unsaved draft
 * edits to those targets would silently test the SAVED options instead of
 * what's on the form). Draft overrides win per name, falling back to state
 * (built-in/env); a name that resolves to neither is dropped — that
 * primary/replica no longer exists, and the row already renders as
 * degenerate in that case.
 */
export function mirrorProbeTargets(
  draft: StorageConfig,
  state: StorageAdminState,
  mirror: StorageBackend,
): StorageBackend[] {
  if (mirror.type !== 'mirror') return [mirror]
  const names = [mirror.options.primary, ...mirror.options.replicas]
  return names
    .map((name): StorageBackend | null => {
      const draftMatch = draft.backends.find((b) => b.name === name)
      if (draftMatch) return draftMatch
      const stateMatch = state.backends.find((b) => b.name === name)
      return stateMatch ? asWireBackend(stateMatch) : null
    })
    .filter((b): b is StorageBackend => b !== null)
}

export function foldBackends(
  state: StorageAdminState,
  draft: StorageConfig,
): { rows: FoldedBackendRow[]; degenerate: DegenerateMirror[] } {
  const draftNames = draft.backends.map((b) => b.name)
  const effective = effectiveCategoryMap(state, draft)
  const categoriesOf = (name: string): StorageCategory[] =>
    STORAGE_CATEGORIES.filter((category) => effective[category] === name)

  // Base (non-mirror) rows, slice-2 precedence: built-ins/env from the state
  // unless a draft row overrides the name; settings rows from the draft.
  const base: Array<Pick<FoldedBackendRow, 'name' | 'type' | 'source' | 'backend'>> = []
  for (const b of state.backends) {
    if (b.type === 'mirror') continue // mirrors fold below; the draft owns them
    if (draftNames.includes(b.name)) continue
    if (b.source === 'settings') continue // removed from the draft, pending save
    base.push({ name: b.name, type: b.type, source: b.source, backend: asWireBackend(b) })
  }
  for (const b of draft.backends) {
    if (isMirror(b)) continue
    base.push({ name: b.name, type: b.type, source: 'settings', backend: b })
  }

  // Adoption: the first mirror per editable primary; the rest are degenerate —
  // rendered unfolded with a reason, never silently dropped.
  const adopted = new Map<string, MirrorBackend>()
  const degenerate: DegenerateMirror[] = []
  for (const mirror of draft.backends.filter(isMirror)) {
    const primary = base.find((row) => row.name === mirror.options.primary)
    if (!primary) degenerate.push({ backend: mirror, reason: 'missing-primary', categories: categoriesOf(mirror.name) })
    else if (primary.source === 'env') degenerate.push({ backend: mirror, reason: 'env-primary', categories: categoriesOf(mirror.name) })
    else if (adopted.has(primary.name)) degenerate.push({ backend: mirror, reason: 'duplicate-mirror', categories: categoriesOf(mirror.name) })
    else adopted.set(primary.name, mirror)
  }

  const rows = base.map((row): FoldedBackendRow => {
    const mirror = adopted.get(row.name)
    return {
      ...row,
      categories: [...categoriesOf(row.name), ...(mirror ? categoriesOf(mirror.name) : [])],
      mirrorTargets: mirror ? [...mirror.options.replicas] : [],
      mirrorName: mirror?.name ?? null,
      replicaOf: [...adopted.values()]
        .filter((m) => m.options.replicas.includes(row.name))
        .map((m) => m.options.primary),
    }
  })
  return { rows, degenerate }
}

/**
 * The rows offerable as mirror replicas (the "Mirror targets" picker).
 *
 * A backend that already serves a category — directly, or as the primary of a
 * mirror a category routes to, which is exactly what `row.categories` unions —
 * can never also be a replica: the mirror's sync sweep makes each replica
 * MATCH the primary, deleting whatever the primary doesn't hold, and `backups`
 * sweeps the replica's entire root. The server refuses such a config outright
 * (storage-registry.service.ts, assertNoSharedReplicas); the picker simply
 * never offers one, so the operator can't walk into the refusal.
 *
 * Targets already selected on this mirror stay listed regardless — they must
 * remain visible to be unchecked (and a config that predates this rule is
 * repaired here, not hidden).
 */
export function replicaCandidates(
  rows: FoldedBackendRow[],
  selfName: string | null,
  currentTargets: readonly string[] = [],
): string[] {
  return rows
    .filter((row) => row.name !== selfName)
    .filter((row) => row.categories.length === 0 || currentTargets.includes(row.name))
    .map((row) => row.name)
}

function uniqueMirrorName(state: StorageAdminState, draft: StorageConfig, primaryName: string): string {
  const taken = new Set([...draft.backends.map((b) => b.name), ...state.backends.map((b) => b.name)])
  const base = `${primaryName}-mirror`
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) {
    if (!taken.has(`${base}-${n}`)) return `${base}-${n}`
  }
}

/**
 * targets non-empty: update the adopted mirror in place (or synthesize one)
 * and route every category that effectively resolves to the primary —
 * default-sourced included — through it. targets empty: dissolve, re-pointing
 * the mirror's categories at the primary and dropping entries that revert to
 * their built-in default.
 */
export function setMirrorTargets(
  state: StorageAdminState,
  draft: StorageConfig,
  primaryName: string,
  targets: string[],
): StorageConfig {
  const adopted = adoptedMirrorFor(draft, primaryName)

  if (targets.length === 0) {
    if (!adopted) return draft
    const categories = { ...draft.categories }
    for (const category of STORAGE_CATEGORIES) {
      if (categories[category] !== adopted.name) continue
      const stateEntry = state.categories[category]! // exhaustive by schema contract
      if (stateEntry.source === 'default' && stateEntry.backend === primaryName) delete categories[category]
      else categories[category] = primaryName
    }
    return { backends: draft.backends.filter((b) => b.name !== adopted.name), categories }
  }

  const effective = effectiveCategoryMap(state, draft)
  const mirror: StorageBackend = {
    name: adopted?.name ?? uniqueMirrorName(state, draft, primaryName),
    type: 'mirror',
    options: { primary: primaryName, replicas: [...targets] },
  }
  const backends = adopted
    ? draft.backends.map((b) => (b.name === adopted.name ? mirror : b))
    : [...draft.backends, mirror]
  const categories = { ...draft.categories }
  for (const category of STORAGE_CATEGORIES) {
    if (effective[category] === primaryName) categories[category] = mirror.name
  }
  return { backends, categories }
}

/** Rewrite every reference to a renamed backend: mirror primaries, replicas, category entries. */
export function renameBackendRefs(draft: StorageConfig, oldName: string, newName: string): StorageConfig {
  return {
    backends: draft.backends.map((b) => {
      if (!isMirror(b)) return b
      return {
        ...b,
        options: {
          primary: b.options.primary === oldName ? newName : b.options.primary,
          replicas: b.options.replicas.map((r) => (r === oldName ? newName : r)),
        },
      }
    }),
    categories: Object.fromEntries(
      Object.entries(draft.categories).map(([category, backend]) => [category, backend === oldName ? newName : backend]),
    ) as StorageConfig['categories'],
  }
}

/**
 * Remove a backend, every mirror wrapping it as primary, and every replica
 * reference to it in the remaining mirrors — a mirror stripped of its last
 * replica dissolves (with the same category re-pointing as an explicit
 * dissolve), so the draft never carries a phantom reference the composer
 * cannot render or repair.
 */
export function removeBackendAndMirrors(
  state: StorageAdminState,
  draft: StorageConfig,
  name: string,
): StorageConfig {
  const stripped = draft.backends
    .filter((b) => b.name !== name && !(isMirror(b) && b.options.primary === name))
    .map((b) =>
      isMirror(b) && b.options.replicas.includes(name)
        ? { ...b, options: { ...b.options, replicas: b.options.replicas.filter((r) => r !== name) } }
        : b,
    )
  let next: StorageConfig = { ...draft, backends: stripped }
  for (const mirror of stripped.filter(isMirror)) {
    if (mirror.options.replicas.length > 0) continue
    if (adoptedMirrorFor(next, mirror.options.primary)?.name === mirror.name) {
      next = setMirrorTargets(state, next, mirror.options.primary, [])
    } else {
      // A degenerate duplicate stripped empty: drop it and re-point its categories.
      const categories = { ...next.categories }
      for (const category of STORAGE_CATEGORIES) {
        if (categories[category] === mirror.name) categories[category] = mirror.options.primary
      }
      next = { backends: next.backends.filter((b) => b.name !== mirror.name), categories }
    }
  }
  return next
}

/** Primaries whose mirrors use the named backend as a replica — pre-check copy stays in primary names. */
export function replicaOfPrimaries(draft: StorageConfig, name: string): string[] {
  return draft.backends
    .filter(isMirror)
    .filter((m) => m.options.replicas.includes(name))
    .map((m) => m.options.primary)
}

/** Map a mirror name (draft first, then state) to its primary; anything else passes through. */
export function primaryNameOf(state: StorageAdminState, draft: StorageConfig, backendName: string): string {
  const draftMirror = draft.backends.filter(isMirror).find((m) => m.name === backendName)
  if (draftMirror) return draftMirror.options.primary
  const stateMirror = state.backends.find((b) => b.name === backendName && b.type === 'mirror')
  if (stateMirror) return String((stateMirror.options as Record<string, unknown>).primary)
  return backendName
}

/**
 * Usage sums per VISIBLE backend row: each category's numbers land on the row
 * that serves it (a mirror-routed category on the mirror's PRIMARY row), and
 * the legacy photos directory lands on uploads-local — the only backend the
 * served-legacy `photos` category ever resolves to.
 */
export function usageByBackend(
  state: StorageAdminState,
  draft: StorageConfig,
): Record<string, { objects: number; bytes: number }> | null {
  if (!state.usage) return null
  const sums: Record<string, { objects: number; bytes: number }> = {}
  const add = (row: string, entry: { objects: number; bytes: number }) => {
    const current = (sums[row] ??= { objects: 0, bytes: 0 })
    current.objects += entry.objects
    current.bytes += entry.bytes
  }
  const effective = effectiveCategoryMap(state, draft)
  for (const category of STORAGE_CATEGORIES) {
    const entry = state.usage.categories[category]
    if (entry) add(primaryNameOf(state, draft, effective[category]), entry)
  }
  // The served-legacy `photos` directory always resolves to uploads-local —
  // hardcoded, not derived, because it is not one of the configurable categories.
  add(primaryNameOf(state, draft, 'uploads-local'), state.usage.legacyPhotos)
  return sums
}

// ── Category migration (copy → flip → delta sweep) ────────────────────────────

/** One reassigned category the operator might want to move existing objects for. */
export interface MigrationCandidate {
  category: StorageCategory
  from: string
  /** Display primary — never a hidden mirror name; used by the prompt lines and comparisons. */
  to: string
  /**
   * The RAW effective draft backend name for this category — possibly a
   * mirror's wire name when `to` is a mirrored primary. The migration POST
   * must carry this, not `to`: posting the bare primary would silently drop
   * replication for a category that was just routed onto a mirror.
   */
  toWire: string
  /** null when usage was never scanned — the prompt still fires, with an unknown-size line. */
  objects: number | null
  bytes: number | null
}

/**
 * Every category whose effective (draft-over-state) PRIMARY backend differs
 * from what's currently saved — normalized through `primaryNameOf` so simply
 * wrapping (or unwrapping) a mirror around the same primary never counts as
 * a candidate; mirroring is the existing sync/backfill flow, not a category
 * migration. Zero-object categories (usage present, 0 objects) are excluded —
 * nothing to move; null usage (never scanned) keeps the category as a
 * candidate with null counts, per spec ("unknown still prompts").
 */
export function computeMigrationCandidates(draft: StorageConfig, state: StorageAdminState): MigrationCandidate[] {
  const effective = effectiveCategoryMap(state, draft)
  const candidates: MigrationCandidate[] = []
  for (const category of STORAGE_CATEGORIES) {
    const from = primaryNameOf(state, draft, state.categories[category]!.backend) // exhaustive by schema contract
    const toWire = effective[category]
    const to = primaryNameOf(state, draft, toWire)
    if (from === to) continue
    const usage = state.usage?.categories[category]
    candidates.push({ category, from, to, toWire, objects: usage ? usage.objects : null, bytes: usage ? usage.bytes : null })
  }
  return candidates.filter((c) => c.objects !== 0)
}

/**
 * Revert exactly the named categories in `draft` back to what's currently
 * saved in `saved` — same default/settings convention as the rest of this
 * file (drop the override when the saved entry is default-sourced, write the
 * explicit backend name otherwise). Every other draft edit is untouched.
 */
export function stripCategories(
  draft: StorageConfig,
  saved: StorageAdminState,
  categories: StorageCategory[],
): StorageConfig {
  const next = { ...draft.categories }
  for (const category of categories) {
    const savedEntry = saved.categories[category]! // exhaustive by schema contract
    if (savedEntry.source === 'default') delete next[category]
    else next[category] = savedEntry.backend
  }
  return { ...draft, categories: next }
}
