/**
 * registerAs tokens for the BOOT-STABLE values Nest injects, one per namespace
 * in `BOOT_DERIVERS` (src/app-config/boot-derive.ts).
 *
 * A token's factory runs during NestFactory.create(), so the injected object is
 * a SNAPSHOT per built app: integration tests that set env and then build an
 * app get fresh values automatically.
 *
 * Every environment variable has exactly one owner. The variables a token
 * derives are read nowhere else, and `readEnv()` never derives them
 * (tests/unit/app-config/config-ownership.test.ts records both sides and fails
 * on an overlap, and on a token nothing injects). A value that code outside
 * the container needs, or that tests mutate mid-lifetime, stays on
 * `readEnv()` / `RuntimeEnvService` instead.
 *
 * Consumption pattern:
 *   constructor(@Inject(storageConfig.KEY) private readonly storage: ConfigType<typeof storageConfig>) {}
 * or, for the pre-init Express layer in bootstrap.ts, `app.get(httpConfig.KEY)`.
 */
import { BOOT_DERIVERS } from '../../app-config/boot-derive';
import { registerAs } from '@nestjs/config';

/**
 * The pre-init Express layer (trust proxy, HSTS) reads this once per built app
 * through `app.get(httpConfig.KEY)` in bootstrap.ts.
 */
export const httpConfig = registerAs('http', () => BOOT_DERIVERS.http(process.env));
/** The storage registry's conditional place-photo backend (TREK_PLACE_PHOTO_DIR). */
export const storageConfig = registerAs('storage', () => BOOT_DERIVERS.storage(process.env));
/** TransitService's upstream (TRANSIT_API_URL). */
export const transitConfig = registerAs('transit', () => BOOT_DERIVERS.transit(process.env));
/** KitineraryExtractorService's binary probe (KITINERARY_EXTRACTOR_PATH, then PATH). */
export const kitineraryConfig = registerAs('kitinerary', () => BOOT_DERIVERS.kitinerary(process.env));

export const BOOT_STABLE_TOKENS = [httpConfig, storageConfig, transitConfig, kitineraryConfig];
