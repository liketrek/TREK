import { readEnv } from './env';

/**
 * The running TREK version: the image's VERSION file or APP_VERSION (both behind
 * `readEnv().app.appVersion`), else server/package.json. The websocket welcome
 * frame and the plugin host-compatibility checks both announce it, so it lives
 * here rather than inside either domain.
 */
export function runningVersion(): string {
  return readEnv().app.appVersion || (require('../../package.json') as { version: string }).version;
}
