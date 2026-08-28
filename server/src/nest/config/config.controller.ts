import { readEnv } from '../../app-config';
import { DEFAULT_LANGUAGE } from '../../config';
import { Public } from '../auth/public.decorator';
import { Controller, Get } from '@nestjs/common';
import type { PublicConfig } from '@trek/shared';

/**
 * /api/config — public (unauthenticated) bootstrap config.
 *
 * Byte-identical to the legacy Express route (server/src/routes/publicConfig.ts):
 * no auth guard, returns the server's configured default language. Deliberately
 * has no service — it just surfaces a config constant, exactly like the original.
 */
@Public('public bootstrap config the login screen reads before any session exists')
@Controller('api/config')
export class ConfigController {
  @Get()
  getConfig(): PublicConfig {
    const version: string = readEnv().app.appVersion ?? require('../../../package.json').version;
    return {
      defaultLanguage: DEFAULT_LANGUAGE,
      sourceCodeUrl: readEnv().app.sourceCodeUrl || 'https://github.com/mnlauaa/TREK',
      version,
    };
  }
}
