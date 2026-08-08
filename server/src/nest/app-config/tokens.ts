/**
 * registerAs tokens over the app-config derive functions, for the BOOT-STABLE
 * namespaces only (see src/app-config/README.md for the classification).
 *
 * A token's factory runs during NestFactory.create(), so the injected object is
 * a SNAPSHOT per built app — integration tests that mutate env and then rebuild
 * buildApp() get fresh values automatically. Runtime-toggled values (DEMO_MODE,
 * NODE_ENV, OIDC_*, …) must NOT get tokens here; they go through
 * RuntimeEnvService / readEnv() so mid-lifetime env mutations stay visible.
 *
 * Consumption pattern:
 *   constructor(@Inject(httpConfig.KEY) private readonly http: ConfigType<typeof httpConfig>) {}
 *
 * NOTE: today only httpConfig has a DI consumer (bootstrap.ts threads it into
 * the pre-init middleware); the migrated call sites otherwise read through
 * readEnv() because they live in classes whose unit tests instantiate them
 * directly. The full token set is provisioned deliberately — it is the
 * sanctioned pattern for NEW Nest consumers of boot-stable config, not dead
 * scaffolding to prune.
 */
import { registerAs } from '@nestjs/config';
import {
  deriveBackup,
  deriveDb,
  deriveHttp,
  deriveIntegrations,
  deriveMcp,
  deriveNet,
  derivePaths,
  deriveSession,
} from '../../app-config';

/**
 * http is snapshot-consumed only by the pre-init Express layer (bootstrap
 * threads it into applyGlobalMiddleware) — apply-time freeze per built app.
 * Request-time reads of the same vars (cookie.ts FORCE_HTTPS checks) stay live
 * via readEnv().
 */
export const httpConfig = registerAs('http', () => deriveHttp(process.env));
export const sessionConfig = registerAs('session', () => deriveSession(process.env));
export const mcpConfig = registerAs('mcp', () => deriveMcp(process.env));
export const integrationsConfig = registerAs('integrations', () => deriveIntegrations(process.env));
export const backupConfig = registerAs('backup', () => deriveBackup(process.env));
export const dbConfig = registerAs('db', () => deriveDb(process.env));
export const pathsConfig = registerAs('paths', () => derivePaths(process.env));
export const netConfig = registerAs('net', () => deriveNet(process.env));

export const BOOT_STABLE_TOKENS = [
  httpConfig,
  sessionConfig,
  mcpConfig,
  integrationsConfig,
  backupConfig,
  dbConfig,
  pathsConfig,
  netConfig,
];
