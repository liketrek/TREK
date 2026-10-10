import { Controller, HttpCode, OnModuleDestroy, Param, Post, Req } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import type { Request } from 'express';
import crypto from 'crypto';
import { Public } from '../auth-core/public.decorator';
import { withRequestContext } from '../database/request-context';
import { WEBHOOK_NUDGE_DEBOUNCE_SECONDS } from './doc-sync.constants';
import { DocSyncConfigService, type LinkRow } from './doc-sync-config.service';
import { DocSyncService } from './doc-sync.service';
import { logError } from '../audit/audit-log.logger';

/**
 * `/api/docsync/webhook/:token`: the one endpoint a provider calls.
 *
 * Deliberately the thinnest thing in the domain. It answers 200 and schedules a
 * run; it never reads the body as truth. Every provider here has a different
 * payload, none of them signs it in a way all five share, Paperless gives its
 * webhook five seconds before it retries, and Nextcloud's payload carries a
 * path that is different for every member of a share. Treating any of that as
 * data would mean trusting an unauthenticated stranger's description of what
 * changed. So the webhook means exactly one thing: look now.
 *
 * `@Public` because a provider cannot hold a TREK session. The token in the URL
 * is the authentication, one per binding, so a leaked URL can only ever nudge
 * the one trip it belongs to, and nudging is all it can do. Where TREK
 * registered the subscription itself, the shared secret it handed over is
 * checked as well.
 */
@Controller('api/docsync/webhook')
export class DocSyncWebhookController implements OnModuleDestroy {
  /**
   * One pending run per binding, so a burst folds into a single pass.
   *
   * Providers fire per document: dropping twenty files into a watched Nextcloud
   * folder is twenty calls within a second or two. Each one used to start its
   * own run, which the service's in-flight guard then answered with `busy`,
   * so nineteen changes were announced and thrown away, and the one run that
   * did start had begun before most of them landed. Collecting them for a beat
   * and then running once is both less work and more correct.
   */
  private readonly pending = new Map<number, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly config: DocSyncConfigService,
    private readonly sync: DocSyncService,
    private readonly orm: MikroORM,
  ) {}

  /**
   * The same switches the scheduler obeys: the Documents addon, the binding's
   * provider, and the instance-wide kill switch.
   *
   * Without them "switch document sync off" meant "stop the poll", while every
   * provider holding a webhook kept driving full runs: an admin turning the
   * addon off would have watched it carry on. Checked when the timer fires as
   * well as on arrival, so a switch thrown during the debounce window still
   * takes effect.
   *
   * DSWH1 (R2 — moved off this controller): the kill-switch read now lives
   * on `DocSyncService.isSyncEnabled`, the same rule the job obeys.
   */
  private async syncIsOn(link: LinkRow): Promise<boolean> {
    if ((await this.sync.isSwitchedOff(link))) return false;
    return this.sync.isSyncEnabled();
  }

  onModuleDestroy(): void {
    for (const timer of this.pending.values()) clearTimeout(timer);
    this.pending.clear();
  }

  @Post(':token')
  @Public('A provider cannot hold a TREK session; the per-link token in the URL is the authentication, and the call can only ever trigger a sync run.')
  @HttpCode(200)
  async nudge(@Param('token') token: string, @Req() req: Request) {
    const link = await this.config.getLinkByToken(token);
    // Always 200, even for an unknown token: a 404 here would let anyone probe
    // which tokens exist, and a provider that gets an error will retry anyway.
    if (!link || link.sync_enabled !== 1) return { received: true };
    if (!(await this.syncIsOn(link))) return { received: true };

    // The secret is only known to a provider TREK subscribed at itself, so it
    // is only demanded there. A URL pasted into a store by hand (Papra, or a
    // Nextcloud without admin rights) carries the token and nothing else: the
    // secret is never shown to anybody, and Papra signs with a secret of its
    // own that TREK cannot know. Demanding it there meant every such call was
    // dropped and the binding ran on the timer while the screen promised
    // instant updates.
    const secret = link.webhook_subscription_id ? this.config.webhookSecret(link) : '';
    if (secret && !this.secretMatches(req, secret)) return { received: true };

    // Fire and forget. Paperless allows five seconds before it counts the call
    // as failed and retries, and a sync run takes longer than that whenever
    // there is anything to do, so the answer goes out now and the run happens
    // after the debounce window, by which time the rest of the burst has
    // arrived and been folded into this same timer.
    this.schedule(link.id, () => this.config.getLink(link.id));
    return { received: true };
  }

  /**
   * Start one run per binding per window, trailing rather than leading.
   *
   * Trailing on purpose: the first call of a burst is the least informed one,
   * because the provider is usually still writing the rest. The link is looked
   * up again when the timer fires, so a binding switched off or deleted in the
   * meantime does not get one last run out of a stale row.
   *
   * R9 (Plan 3h Task 5): the timer body forks its OWN fresh request context
   * via `withRequestContext` — the same shape
   * `StorageHealthNotifierService`'s listener (Plan 3f Task 4, R3) uses. This
   * `nudge()` handler already returned its `{received:true}` response before
   * this timer fires (`WEBHOOK_NUDGE_DEBOUNCE_SECONDS` later), so whatever
   * request-scoped `EntityManager` fork the original HTTP request forked is
   * long gone by the time this body runs — insurance, per 3f's own
   * measurement that `AsyncLocalStorage` survives a detached chain intact in
   * this codebase today, not a fix for an observed failure (the pre-conversion
   * code had no `EntityManager` to lose in the first place: raw
   * `better-sqlite3` calls have no request-scoping concept at all).
   */
  private schedule(linkId: number, reload: () => ReturnType<DocSyncConfigService['getLink']>, isRetry = false): void {
    if (this.pending.has(linkId)) return;
    // setTimeout cannot await its callback, so the now-async body runs in a
    // helper and its rejection is observed here rather than left unhandled
    // (recipe R1.5).
    const timer = setTimeout(() => {
      void withRequestContext(this.orm, async () => {
        this.pending.delete(linkId);
        const fresh = await reload();
        if (!fresh || fresh.sync_enabled !== 1) return;
        if (!(await this.syncIsOn(fresh))) return;
        const res = await this.sync.syncLink(fresh);
        // A run that was already in flight answers `busy`, and the changes this
        // nudge was about may have landed after that run read the folder. Ask
        // again once rather than waiting out a whole poll interval: once, and
        // only for `busy`, so this cannot become a loop.
        if (res?.state === 'busy' && !isRetry) this.schedule(linkId, reload, true);
      }).catch((err: unknown) => {
        logError(`Document sync webhook nudge failed for link ${linkId}: ${err instanceof Error ? err.message : String(err)}`);
      });
    }, WEBHOOK_NUDGE_DEBOUNCE_SECONDS * 1000);
    // A pending nudge must not hold the process open at shutdown.
    if (typeof timer.unref === 'function') timer.unref();
    this.pending.set(linkId, timer);
  }

  /**
   * Accept either a plain shared-secret header (Paperless workflows, Nextcloud
   * `authMethod: header`) or Papra's standard-webhooks HMAC. Compared in
   * constant time, and a mismatch is silently ignored rather than reported, so
   * the endpoint tells a prober nothing either way.
   */
  private secretMatches(req: Request, secret: string): boolean {
    const header = req.get('x-trek-docsync-secret');
    if (header && timingSafeEqualStr(header, secret)) return true;

    const sig = req.get('webhook-signature');
    const id = req.get('webhook-id');
    const ts = req.get('webhook-timestamp');
    if (sig && id && ts) {
      const raw = (req as Request & { rawBody?: Buffer }).rawBody;
      const body = raw ? raw.toString('utf8') : JSON.stringify(req.body ?? {});
      const expected = crypto
        .createHmac('sha256', Buffer.from(secret))
        .update(`${id}.${ts}.${body}`)
        .digest('base64');
      for (const part of sig.split(' ')) {
        const value = part.startsWith('v1,') ? part.slice(3) : part;
        if (timingSafeEqualStr(value, expected)) return true;
      }
    }
    return false;
  }
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
