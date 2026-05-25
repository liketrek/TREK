import { execSync } from 'node:child_process';

// tsc emits JS even with type errors (noEmitOnError:false), but still exits
// non-zero to report them. We must run tsc-alias regardless, so run tsc in a
// try/catch and always proceed to the path-rewrite step.
// Type correctness is enforced separately via `npm run typecheck`.
try {
  execSync('tsc -p tsconfig.build.json', { stdio: 'inherit' });
} catch {
  console.warn('[build] tsc reported type errors — emitting anyway (gated by `npm run typecheck`).');
}

execSync('tsc-alias -p tsconfig.build.json', { stdio: 'inherit' });
console.log('[build] dist ready (path aliases rewritten).');
