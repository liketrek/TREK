import { Controller, HttpCode, OnModuleDestroy, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import crypto from 'crypto';
import { Public } from '../auth/public.decorator';
import { DatabaseService } from '../database/database.service';
import { SETTING_SYNC_ENABLED, WEBHOOK_NUDGE_DEBOUNCE_SECONDS } from './doc-sync.constants';
import { DocSyncConfigService, type LinkRow } from './doc-sync-config.service';
import { DocSyncService } from './doc-sync.service';

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
    private readonly db: DatabaseService,
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
   */
  private syncIsOn(link: LinkRow): boolean {
    if (this.sync.isSwitchedOff(link)) return false;
    const killSwitch = this.db.get<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?', SETTING_SYNC_ENABLED,
    )?.value;
    // Unrecognised values mean ON: the setting is absent by default, and only an
    // explicit 'false' stops the sync. Same rule as the job.
    return killSwitch !== 'false';
  }

  onModuleDestroy(): void {
    for (const timer of this.pending.values()) clearTimeout(timer);
    this.pending.clear();
  }

  @Post(':token')
  @Public('A provider cannot hold a TREK session; the per-link token in the URL is the authentication, and the call can only ever trigger a sync run.')
  @HttpCode(200)
  nudge(@Param('token') token: string, @Req() req: Request) {
    const link = this.config.getLinkByToken(token);
    // Always 200, even for an unknown token: a 404 here would let anyone probe
    // which tokens exist, and a provider that gets an error will retry anyway.
    if (!link || link.sync_enabled !== 1) return { received: true };
    if (!this.syncIsOn(link)) return { received: true };

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
   */
  private schedule(linkId: number, reload: () => ReturnType<DocSyncConfigService['getLink']>, isRetry = false): void {
    if (this.pending.has(linkId)) return;
    const timer = setTimeout(() => {
      this.pending.delete(linkId);
      const fresh = reload();
      if (!fresh || fresh.sync_enabled !== 1) return;
      if (!this.syncIsOn(fresh)) return;
      void this.sync.syncLink(fresh).then((res) => {
        // A run that was already in flight answers `busy`, and the changes this
        // nudge was about may have landed after that run read the folder. Ask
        // again once rather than waiting out a whole poll interval: once, and
        // only for `busy`, so this cannot become a loop.
        if (res?.state === 'busy' && !isRetry) this.schedule(linkId, reload, true);
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
