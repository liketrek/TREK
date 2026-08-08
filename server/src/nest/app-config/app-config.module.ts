/**
 * Global binding of @nestjs/config onto TREK's app-config layer.
 *
 * INVARIANTS — breaking either silently breaks ~60 env-mutating tests:
 *  - `cache: false`, always. `cache: true` would freeze ConfigService lookups
 *    for the whole app lifetime; the runtime-toggled vars (DEMO_MODE, NODE_ENV,
 *    OIDC_*, …) must stay live via RuntimeEnvService/readEnv().
 *  - No `validate`/`validationSchema` here. Fail-fast validation runs exactly
 *    once, from the production entrypoint (src/app-config/boot-validate.ts) —
 *    buildApp() is invoked dozens of times per test run and must stay
 *    side-effect-free.
 *  - `ignoreEnvFile: true`, always. dotenv is loaded ONCE in index.ts; tests
 *    deliberately never load .env, and reading it here would leak a
 *    developer's local server/.env into every integration test.
 *
 * The framework's ConfigModule is aliased ONLY inside this file: app.module.ts
 * already imports a local `ConfigModule` (the /api/config endpoint module), so
 * the alias keeps the two from colliding anywhere else.
 */
import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { BOOT_STABLE_TOKENS } from './tokens';
import { RuntimeEnvService } from './runtime-env.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      cache: false,
      load: BOOT_STABLE_TOKENS,
    }),
  ],
  providers: [RuntimeEnvService],
  exports: [RuntimeEnvService],
})
export class AppConfigModule {}
