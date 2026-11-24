import { Injectable } from '@nestjs/common';

/**
 * The TREK Cloud control plane's queue of mails for this instance, as the
 * managed install reaches it with its instance token. The control plane's
 * mail server takes a forwarded mail for a contract's route key, keeps it
 * encrypted, and hands it over here; nothing of a person reaches it.
 */
export interface MailInboxRelay {
  /**
   * `GET /v1/instance/inbox?limit=n&after=<cursor>`: the waiting mails after
   * the cursor a previous page named (from the oldest without one), the
   * answer's JSON as parsed, checked by the caller. Null when the control
   * plane has no import for this instance (its 404), which is no failure.
   */
  list(limit: number, after: string | null): Promise<unknown>;
  /** `POST /v1/instance/inbox/:id/ack`: the mail is taken in (or never will be), and the relay drops it. */
  ack(id: string): Promise<void>;
}

/**
 * Where the managed install plugs its control-plane client in. This
 * repository has none: a self-hosted install has no relay, and the pull job
 * stays idle until a module of the managed build attaches one when it
 * starts, through the client it already talks to the control plane with.
 */
@Injectable()
export class MailIngestRelayHost {
  private relay: MailInboxRelay | null = null;

  attach(relay: MailInboxRelay): void {
    this.relay = relay;
  }

  current(): MailInboxRelay | null {
    return this.relay;
  }
}
