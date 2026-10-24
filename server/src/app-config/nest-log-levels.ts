import type { LogLevel } from '@nestjs/common';

/**
 * LOG_LEVEL → the Nest logger levels `NestFactory.create` should keep.
 *
 * Nest's built-in logger ignores LOG_LEVEL and prints everything, so every
 * boot wrote its full route map (`RouterExplorer`/`RoutesResolver`/
 * `InstanceLoader`, ~700 lines) no matter what the operator asked for — and
 * every e2e boot in the test suite did the same, which is most of what a
 * green CI log was made of. The file logger (`nest/audit/audit-log.logger.ts`)
 * already ranks error < warn < info < debug; this is the same ladder expressed
 * in Nest's vocabulary. Unset or unknown falls back to `info`, as index.ts does.
 */
export function nestLogLevels(logLevel: string | undefined): LogLevel[] {
  switch ((logLevel ?? 'info').toLowerCase()) {
    case 'error':
      return ['fatal', 'error'];
    case 'warn':
      return ['fatal', 'error', 'warn'];
    case 'debug':
      return ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'];
    default:
      return ['fatal', 'error', 'warn', 'log'];
  }
}
