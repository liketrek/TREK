import { Injectable } from '@nestjs/common';
import semver from 'semver';
import type { SystemNoticeDto } from '@trek/shared';
import { getActiveNoticesFor, dismissNotice, getCurrentAppVersion } from '../../systemNotices/service';
import { AddonsService } from '../addons/addons.service';
import { RuntimeEnvService } from '../app-config/runtime-env.service';

/**
 * Thin Nest wrapper around the existing system-notices service. The condition
 * evaluation, version gating, sorting and dismissal persistence all stay in the
 * upstream service — this only adapts it for DI (and threads the injected
 * addon-enablement check into the condition context, so the plain modules
 * underneath carry no bridge import), so behaviour is unchanged.
 */
@Injectable()
export class SystemNoticesService {
  constructor(
    private readonly addons: AddonsService,
    private readonly env: RuntimeEnvService,
  ) {}

  /**
   * `supports` names the layouts the calling bundle can draw, `uiVersion` the version
   * that bundle was built as. A notice with a release block goes only to a bundle that
   * names `release` AND was built for the version the server is running: after an
   * update the service worker keeps serving the previous bundle until the new one is
   * installed, and that bundle would draw the release notice with its own, older
   * texts (or as bare keys) and let the reader dismiss it for good, because the
   * dismissal is recorded against the server's version. The version match is what
   * makes this hold for every update, not only the one that introduced the
   * parameter: a 4.3.0 shell asking a 4.3.1 server is told nothing, and gets the
   * notice after the reload from the bundle that can draw it. A bundle that sends
   * neither loses only the notice it could not read anyway. Nothing is spent by
   * holding it back: a notice is used up by a dismissal and by nothing else.
   */
  getActiveFor(userId: number, supports: ReadonlySet<string> = new Set(), uiVersion?: string): SystemNoticeDto[] {
    const notices = getActiveNoticesFor(
      userId,
      (addonId) => this.addons.isAddonEnabled(addonId),
      this.env.isManaged(),
    ) as SystemNoticeDto[];
    return supports.has('release') && this.bundleMatchesServer(uiVersion)
      ? notices
      : notices.filter(n => !n.release);
  }

  /** Whether the bundle asking was built for the version this server runs. */
  private bundleMatchesServer(uiVersion: string | undefined): boolean {
    const ui = uiVersion ? semver.coerce(uiVersion)?.version : undefined;
    const app = semver.coerce(getCurrentAppVersion())?.version;
    return !!ui && !!app && ui === app;
  }

  dismiss(userId: number, noticeId: string): boolean {
    return dismissNotice(userId, noticeId);
  }
}
