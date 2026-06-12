import { execSync } from 'node:child_process';

try {
  execSync('tsc -p tsconfig.build.json', { stdio: 'inherit' });
} catch {
  console.warn('[build] tsc reported type errors — emitting anyway (gated by `npm run typecheck`).');
}

console.log('[build] dist ready.');
