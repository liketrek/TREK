import { Injectable } from '@nestjs/common';
import { readEnv, type AppEnv } from '../../app-config';

/**
 * DI-friendly access to the RUNTIME-TOGGLED env values (DEMO_MODE, NODE_ENV,
 * APP_VERSION, OIDC_*, …). Every method delegates to readEnv() at call time —
 * never snapshot a namespace into a field or the constructor, or the ~60 tests
 * that mutate process.env mid-lifetime break.
 *
 * Boot-stable values are NOT accessed through this service; inject their
 * registerAs token instead (see tokens.ts).
 */
@Injectable()
export class RuntimeEnvService {
  /** The full live-derived env — prefer the convenience getters where one exists. */
  env(): AppEnv {
    return readEnv();
  }

  isDemoMode(): boolean {
    return readEnv().demo.enabled;
  }

  /**
   * True when somebody other than this instance's admin owns its configuration.
   * Runtime-toggled like DEMO_MODE, so never cache the result in a field.
   */
  isManaged(): boolean {
    return readEnv().managed.enabled;
  }

  /** True only under exactly NODE_ENV='test' (case-sensitive, like the :memory: DB pick). */
  isTest(): boolean {
    return readEnv().app.isTest;
  }

  nodeEnv(): string | undefined {
    return readEnv().app.nodeEnv;
  }

  isProduction(): boolean {
    return readEnv().app.isProduction;
  }

  isDevelopment(): boolean {
    return readEnv().app.isDevelopment;
  }

  /** Raw APP_VERSION — call sites keep their own fallback ('0.0.0' vs package.json vs semver). */
  appVersion(): string | undefined {
    return readEnv().app.appVersion;
  }

  /** Raw APP_URL — call sites keep their own trailing-slash handling. */
  appUrl(): string | undefined {
    return readEnv().app.appUrl;
  }
}
