import { Controller, Get } from '@nestjs/common';
import type { PublicConfig } from '@trek/shared';
import { DEFAULT_LANGUAGE } from '../../config';

/**
 * /api/config — public (unauthenticated) bootstrap config.
 *
 * Byte-identical to the legacy Express route (server/src/routes/publicConfig.ts):
 * no auth guard, returns the server's configured default language. Deliberately
 * has no service — it just surfaces a config constant, exactly like the original.
 */
@Controller('api/config')
export class ConfigController {
  @Get()
  getConfig(): PublicConfig {
    return { defaultLanguage: DEFAULT_LANGUAGE };
  }
}
