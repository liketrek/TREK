/**
 * Doc-sync webhook request-context ratchet (Plan 3h Task 5, R9).
 *
 * `DocSyncWebhookController#schedule()`'s `setTimeout` callback runs fully
 * detached from the HTTP request that triggered it: `nudge()` already
 * answered `{received:true}` before the debounce window
 * (`WEBHOOK_NUDGE_DEBOUNCE_SECONDS`) elapses, so whatever request-scoped
 * `EntityManager` fork the triggering request held is long gone by the time
 * the timer body runs. Per 3f's own R3 precedent (measured: `AsyncLocalStorage`
 * survives a detached chain intact in this codebase today), the timer body
 * now forks its OWN fresh request context via `withRequestContext` — insurance,
 * not a fix for an observed failure.
 *
 * Plan 3h Task 7 review, M3: the original version of this test drove the
 * REAL `DocSyncWebhookController.nudge()` through a real HTTP request, on the
 * theory that only the timer body — not `nudge()` itself — was the "bare
 * context" under test. That theory was wrong in a way that made the ratchet
 * non-load-bearing: the HTTP request driving `nudge()` gives Nest's own
 * middleware an `EntityManager` fork, and `AsyncLocalStorage` carries that
 * fork into the `setTimeout` callback regardless of whether `schedule()`
 * wraps it in its own `withRequestContext` — so unwrapping it left the test
 * green (proven; recorded in the review's mutation log as MD3). The request
 * was never gone by the time the timer fired; it just felt that way because
 * the response had already been sent.
 *
 * The fix: call the controller's `schedule()` directly from the test's own
 * top-level async function body, which sits in NO `AsyncLocalStorage`
 * context at all — a genuinely bare one. `schedule()` itself needs no
 * `EntityManager` (it only touches the in-memory `pending` map and
 * `setTimeout`), so this call is safe outside any request; the `reload`
 * callback it schedules (`() => config.getLink(linkId)`) is what needs the
 * fork, and it only runs once the timer fires, inside `schedule()`'s own
 * `withRequestContext` — exactly the wrap under test. The link id comes from
 * the fixture `beforeAll` seeds, whose factory calls each open and close a
 * request context of their own, rather than through
 * `nudge()`/`getLinkByToken`, so nothing in the test body before the
 * `schedule()` call ever touches the EntityManager.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { createUser, createTrip } from '../helpers/factories';
import { insertRow, updateRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { DocumentConnections } from '../../src/db/entities/DocumentConnections.entity';
import { DocumentProviders } from '../../src/db/entities/DocumentProviders.entity';
import { TripDocumentLinks } from '../../src/db/entities/TripDocumentLinks.entity';
import { WEBHOOK_NUDGE_DEBOUNCE_SECONDS } from '../../src/nest/doc-sync/doc-sync.constants';
import { DocSyncWebhookController } from '../../src/nest/doc-sync/doc-sync-webhook.controller';
import { DocSyncConfigService } from '../../src/nest/doc-sync/doc-sync-config.service';

describe('DocSyncWebhookController#schedule() runs its detached timer body inside its own request context', () => {
  let app: INestApplication;
  let controller: DocSyncWebhookController;
  let config: DocSyncConfigService;
  let linkId: number;

  beforeAll(async () => {
    app = await buildApp();
    controller = app.get(DocSyncWebhookController);
    config = app.get(DocSyncConfigService);

    // The addon gate and the provider both have to be genuinely on: schedule()'s
    // own reload callback (`syncIsOn`) skips the run otherwise, before ever
    // reaching the assertion below.
    const orm = app.get(MikroORM);
    await setAddonEnabled(orm, 'documents', true);
    await updateRows(orm, DocumentProviders, { id: 'paperless' }, { enabled: 1 });

    const owner = createUser(testDb, { username: 'docsync-webhook-ctx', email: 'docsync-webhook-ctx@test.local' }).user;
    const trip = createTrip(testDb, owner.id, { title: 'Japan' });
    const connectionId = await insertRow(orm, DocumentConnections, {
      trip: trip.id,
      provider: 'paperless',
      ownerUser: owner.id,
      base_url: 'https://paperless.example.com',
      secrets: null,
      settings: '{}',
    });
    // Each factory call above closed its own request context before returning,
    // so the test body below starts with no EntityManager fork around it.
    linkId = await insertRow(orm, TripDocumentLinks, {
      trip: trip.id,
      connection: connectionId,
      provider_id: 'paperless',
      remote_scope_key: 'tag:1',
      remote_label: 'Japan',
      direction: 'both',
      delete_policy: 'unlink',
      conflict_policy: 'manual',
      sync_enabled: 1,
      webhook_token: 'webhook-ctx-ratchet-token',
      createdByRef: owner.id,
    });
  });

  afterAll(async () => {
    await app.close();
    testDb.close();
  });

  it(
    'WEBHOOK-CTX-001: schedule(), called from a genuinely bare (non-request) context, never logs cannotUseGlobalContext once its debounce timer fires',
    async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        // Calling the controller's own private `schedule()` directly, bracket
        // notation only (no `any`/`as unknown as`): this test function body is
        // not inside ANY AsyncLocalStorage context, unlike a real HTTP request
        // through Nest's middleware — so the timer this starts is the real
        // thing the docstring above describes, not one riding a caller's fork.
        controller['schedule'](linkId, () => config.getLink(linkId));

        // Let the real debounce timer fire, then drain the microtasks its
        // async body queues (real timers here — the detached body is a
        // genuine `setTimeout`, not something fake timers can fast-forward
        // through a real HTTP-free integration boot safely).
        await new Promise((resolve) => setTimeout(resolve, (WEBHOOK_NUDGE_DEBOUNCE_SECONDS + 2) * 1000));

        const suspicious = errSpy.mock.calls
          .map((args) => args.map(String).join(' '))
          .filter((line) => /cannotUseGlobalContext|global EntityManager/i.test(line));
        expect(suspicious).toEqual([]);
      } finally {
        errSpy.mockRestore();
      }
    },
    20_000,
  );
});
