import { useEffect, useRef, useState } from 'react';

import type {
  StorageAdminState,
  StorageBackend,
  StorageCategory,
  StorageConfig,
  StorageConfigPut,
  StorageMigrationStatus,
} from '@trek/shared';

import { useTranslation } from '../../../i18n';
import { formatBytes } from '../../../utils/formatBytes';
import { useToast } from '../../shared/Toast';
import {
  adoptedMirrorFor,
  computeMigrationCandidates,
  effectiveCategoryMap,
  foldBackends,
  mirrorProbeTargets,
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
  type FoldedBackendRow,
  type MigrationCandidate,
} from './storageModel';
import { useStorageAdmin } from './useStorageAdmin';

/** Display-name mapper for joined category lists: the raw id renders only in the badge. */
export const categoryNames = (t: (key: string) => string, ids: readonly string[]): string =>
  ids.map((id) => t(`storage.category.${id}`)).join(', ');

/**
 * One line of the migrate prompt for a category whose backend changes. A category the
 * usage scan has not counted yet (`objects` null) gets the line without count and size.
 */
export const migrationPromptLine = (
  t: (key: string, params?: Record<string, string | number>) => string,
  candidate: MigrationCandidate
): string => {
  const category = t(`storage.category.${candidate.category}`);
  if (candidate.objects === null) {
    return t('storage.migrate.promptLineUnknown', { category, from: candidate.from, to: candidate.to });
  }
  return t('storage.migrate.promptLine', {
    category,
    count: candidate.objects,
    size: formatBytes(candidate.bytes ?? 0),
    from: candidate.from,
    to: candidate.to,
  });
};

/** The backend the editor is open on, and what its Mirror-targets composer offers. */
interface StorageEditing {
  initial: StorageBackend | null;
  originalName: string | null;
  mirror: { candidates: string[]; initialTargets: string[] };
}

/**
 * The storage admin panel behind both shells (the desktop sections and the phone cards
 * render their own markup over it): the backend editor, the removal confirm, the
 * replica sync prompt, the save with its migrate prompt, and the queue that starts the
 * accepted category migrations one at a time. Everything that needs the loaded state
 * and draft sits under `loaded`, which is null until both exist.
 */
export function useStoragePanel() {
  const { t } = useTranslation();
  const toast = useToast();
  const admin = useStorageAdmin(t('common.error'), t('storage.saveConflict'));
  const [editing, setEditing] = useState<StorageEditing | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ name: string; degenerate: boolean } | null>(null);
  const [syncPrompt, setSyncPrompt] = useState<string | null>(null);
  // The candidates the save found, as they were when the prompt opened. The phone
  // lists and moves exactly these; the desktop only reads whether the prompt is
  // open and recomputes the candidates on every render and again at confirm time.
  const [migratePrompt, setMigratePrompt] = useState<MigrationCandidate[] | null>(null);
  const [migrationQueue, setMigrationQueue] = useState<MigrationCandidate[]>([]);
  // Set by `save` right before it calls admin.save(): the pre-save mirror
  // target count per row name. Consumed (and cleared) by the effect below the
  // first time `admin.state` changes afterward, never touched otherwise, so
  // unrelated state changes (the backfill poll included) are no-ops here.
  const pendingPromptCheck = useRef<Map<string, number> | null>(null);
  // Synchronous single-flight lock for the queue effect below: `admin.state`
  // only reflects a just-started migration once startMigration's awaited
  // refreshState() resolves, so `setMigrationQueue(rest)` re-firing the
  // effect synchronously (still against the pre-POST `admin.state`) would
  // otherwise dequeue and POST the next candidate before the server has
  // confirmed the first. A ref (not state) so the guard is visible on that
  // very next synchronous re-render, not just after a state-driven one.
  const migrationStartInFlight = useRef(false);

  useEffect(() => {
    if (!pendingPromptCheck.current || !admin.state) return;
    const before = pendingPromptCheck.current;
    pendingPromptCheck.current = null;
    const { rows: afterRows } = foldBackends(admin.state, settingsDocumentOf(admin.state));
    const grown = afterRows.find((r) => r.mirrorTargets.length > (before.get(r.name) ?? 0));
    if (grown) setSyncPrompt(grown.name);
  }, [admin.state]);

  // Queued category migrations run strictly sequentially: once a slot opens
  // (no migration currently running), dequeue the next candidate and start
  // it. Depends on admin.state so a poll landing a terminal status re-fires
  // this without any user interaction. The in-flight lock closes the race
  // where setMigrationQueue(rest) re-fires this effect synchronously while
  // admin.state still shows the pre-POST world; without it, the next
  // candidate could dequeue and POST before the first is server-confirmed.
  // Also waits out a running BACKFILL: the server's one-storage-job-at-a-time
  // rule spans backfills and migrations alike, so starting while one runs
  // would 409, and the queued candidate would be lost (no retry).
  //
  // A failed startMigration POST does not strand
  // `rest`: it was already dequeued into local state before the POST, so on
  // failure nothing would change `migrationQueue` or `admin.state` again and
  // the remaining candidates would sit invisibly, never migrated. The whole
  // remaining queue is then explicitly cleared (never retried: the operator
  // re-triggers via Save), named in a toast, and admin.state is refreshed so
  // the panel reflects whatever the failed attempt's category ended up as
  // server-side.
  useEffect(() => {
    if (migrationQueue.length === 0 || !admin.state) return;
    if (migrationStartInFlight.current) return;
    if (admin.storageBusy()) return;
    const [next, ...rest] = migrationQueue;
    migrationStartInFlight.current = true;
    setMigrationQueue(rest);
    void admin.startMigration(next!.category, next!.toWire).then((error) => {
      migrationStartInFlight.current = false;
      if (error) {
        toast.error(error);
        if (rest.length > 0) {
          toast.error(
            t('storage.migrate.queueDropped', {
              categories: categoryNames(
                t,
                rest.map((c) => c.category)
              ),
            })
          );
          setMigrationQueue([]);
        }
        void admin.refreshState().catch(() => {});
      }
    });
  }, [migrationQueue, admin.state]);

  const closeMigratePrompt = () => setMigratePrompt(null);

  const handleCancelMigration = async (m: StorageMigrationStatus) => {
    const error = await admin.cancelMigration(m.category);
    if (error) toast.error(error);
  };

  const handleRefreshStats = async () => {
    const error = await admin.refreshStats();
    if (error) toast.error(error);
  };

  const handleStartBackfill = async (row: FoldedBackendRow) => {
    if (!row.mirrorName) return;
    setSyncPrompt((prev) => (prev === row.name ? null : prev));
    const error = await admin.startBackfill(row.mirrorName);
    if (error) toast.error(error);
  };

  const handleCancelBackfill = async (row: FoldedBackendRow) => {
    if (!row.mirrorName) return;
    const error = await admin.cancelBackfill(row.mirrorName);
    if (error) toast.error(error);
  };

  const loadedPanel = (state: StorageAdminState, draft: StorageConfigPut) => {
    // Pure/cheap: recomputed every render so the desktop migrate-prompt dialog
    // never shows a stale candidate set while it's open. moveAndSave recomputes
    // independently at confirm time rather than reading this render-scoped
    // value, since the click handler and the render that produced it are not
    // guaranteed to be the same one.
    const migrationCandidates = computeMigrationCandidates(draft, state);

    // Duplicate pre-check needs EVERY wire name (hidden mirror names included);
    // mirror-target candidates are the visible primaries only.
    const backendNames = [...new Set([...state.backends.map((b) => b.name), ...draft.backends.map((b) => b.name)])];
    const { rows, degenerate } = foldBackends(state, draft);
    const effective = effectiveCategoryMap(state, draft);
    const usageSums = usageByBackend(state, draft);

    const startAdd = () =>
      setEditing({
        initial: null,
        originalName: null,
        mirror: { candidates: replicaCandidates(rows, null), initialTargets: [] },
      });

    const startEdit = (row: FoldedBackendRow) => {
      // Editing a built-in creates a settings override row bearing its name:
      // the first-class relocation path (merge-by-name).
      setEditing({
        initial: row.backend,
        originalName: row.name,
        mirror: {
          candidates: replicaCandidates(rows, row.name, row.mirrorTargets),
          initialTargets: row.mirrorTargets,
        },
      });
    };

    const commitBackend = (backend: StorageBackend, mirrorTargets?: string[]) => {
      const renamedFrom = editing?.originalName && editing.originalName !== backend.name ? editing.originalName : null;
      // Widened to StorageConfig: these edit helpers are version-blind (they
      // return plain StorageConfig), and admin.setDraft re-attaches the
      // draft's own `version` regardless of what shape it's handed.
      let next: StorageConfig | null = draft;
      if (renamedFrom) next = renameBackendRefs(removeBackend(next, renamedFrom), renamedFrom, backend.name);
      next = upsertBackend(next, backend);
      if (mirrorTargets !== undefined) next = setMirrorTargets(state, next, backend.name, mirrorTargets);
      admin.setDraft(next);
      setEditing(null);
    };

    // A mirrored row probes its primary and each replica one by one, with the draft
    // options of each: the server would resolve a mirror stub against its SAVED
    // backends by name, so unsaved edits (or a replica not saved yet) would be missed.
    // row.mirrorName only exists when foldBackends adopted a draft mirror for this
    // row, so the draft lookup cannot miss.
    const testRow = (row: FoldedBackendRow) => {
      if (!row.mirrorName) return admin.test(row.backend);
      const mirror = draft.backends.find((b) => b.name === row.mirrorName)!;
      return admin.testMirror(row.mirrorName, mirrorProbeTargets(draft, state, mirror));
    };

    const removeMessage = (name: string, isDegenerate: boolean): string => {
      const row = rows.find((r) => r.name === name);
      const assigned = isDegenerate
        ? (degenerate.find((d) => d.backend.name === name)?.categories ?? [])
        : (row?.categories ?? []);
      const usedAsReplicaBy = isDegenerate ? [] : replicaOfPrimaries(draft, name);
      return [
        t('storage.remove.body', { name }),
        assigned.length > 0 ? t('storage.remove.stillAssigned', { categories: categoryNames(t, assigned) }) : '',
        usedAsReplicaBy.length > 0
          ? t('storage.remove.usedAsReplicaBy', { primaries: usedAsReplicaBy.join(', ') })
          : '',
      ]
        .filter(Boolean)
        .join(' ');
    };

    /** The removal confirm's yes: drops the backend (and a primary's mirrors) from the draft. */
    const confirmRemoval = () => {
      if (confirmRemove) {
        admin.setDraft(
          confirmRemove.degenerate
            ? removeBackend(draft, confirmRemove.name)
            : removeBackendAndMirrors(state, draft, confirmRemove.name)
        );
      }
      setConfirmRemove(null);
    };

    const setCategory = (category: StorageCategory, primaryName: string) => {
      // Picking a mirrored primary routes through its adopted mirror silently.
      const target = adoptedMirrorFor(draft, primaryName)?.name ?? primaryName;
      // The admin state's category record is exhaustive by schema contract.
      const stateEntry = state.categories[category]!;
      const categories = { ...draft.categories };
      if (stateEntry.source === 'default' && target === stateEntry.backend) {
        delete categories[category]; // back to the default, so no longer settings-owned
      } else {
        categories[category] = target;
      }
      admin.setDraft({ ...draft, categories });
    };

    // Snapshot the LAST-CONFIRMED (pre-save `state`'s own fold, not the
    // in-progress `draft`) mirror target counts; the effect above compares
    // them against the fresh post-save state to detect newly-added
    // replicas. Folding `draft` here would already include the unsaved
    // edit and mask the very growth this is meant to detect.
    const snapshotMirrorTargets = (): Map<string, number> => {
      const { rows: beforeRows } = foldBackends(state, settingsDocumentOf(state));
      return new Map(beforeRows.map((r) => [r.name, r.mirrorTargets.length]));
    };

    const doPlainSave = async () => {
      pendingPromptCheck.current = snapshotMirrorTargets();
      if (await admin.save()) toast.success(t('storage.saved'));
      else pendingPromptCheck.current = null;
    };

    // Without an argument it recomputes the candidate set at confirm time and
    // never trusts whatever was true when the dialog opened: the operator can
    // edit categories (or a background poll can land a fresher usage scan)
    // while the dialog is on screen. The set it uses drives both
    // stripCategories (what gets reverted from the PUT body) and the queue
    // (what gets POSTed), so the two can never diverge.
    const moveAndSave = async (candidates = computeMigrationCandidates(draft, state)) => {
      pendingPromptCheck.current = snapshotMirrorTargets();
      const ok = await admin.save(
        stripCategories(
          draft,
          state,
          candidates.map((c) => c.category)
        )
      );
      if (ok) {
        setMigrationQueue(candidates);
        toast.success(t('storage.saved'));
      } else {
        pendingPromptCheck.current = null;
      }
      setMigratePrompt(null);
    };

    const routeOnlySave = async () => {
      setMigratePrompt(null);
      await doPlainSave();
    };

    const save = async () => {
      const candidates = computeMigrationCandidates(draft, state);
      if (candidates.length > 0) {
        setMigratePrompt(candidates);
        return;
      }
      await doPlainSave();
    };

    return {
      state,
      draft,
      migrationCandidates,
      backendNames,
      rows,
      degenerate,
      effective,
      usageSums,
      startAdd,
      startEdit,
      testRow,
      commitBackend,
      removeMessage,
      confirmRemoval,
      setCategory,
      save,
      moveAndSave,
      routeOnlySave,
    };
  };

  const loaded = admin.state && admin.draft ? loadedPanel(admin.state, admin.draft) : null;

  return {
    admin,
    editing,
    setEditing,
    confirmRemove,
    setConfirmRemove,
    syncPrompt,
    setSyncPrompt,
    migratePrompt,
    closeMigratePrompt,
    migrationQueue,
    handleCancelMigration,
    handleRefreshStats,
    handleStartBackfill,
    handleCancelBackfill,
    loaded,
  };
}
