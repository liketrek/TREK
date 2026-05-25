import { execSync, spawn } from 'node:child_process';

// Dev runtime for the co-hosted NestJS + legacy Express server.
// NestJS DI needs decorator metadata, which the old tsx/esbuild runtime does not
// emit — so dev runs the tsc build with watchers (same toolchain as prod `dist`).
// Initial build first so `node --watch dist/index.js` has something to start.
console.log('[dev] initial build...');
execSync('node scripts/build.mjs', { stdio: 'inherit' });

const watchers = [
  ['npx', ['tsc', '-w', '-p', 'tsconfig.build.json', '--preserveWatchOutput']],
  ['npx', ['tsc-alias', '-w', '-p', 'tsconfig.build.json']],
  ['node', ['--watch', 'dist/index.js']],
];

const children = watchers.map(([cmd, args]) =>
  spawn(cmd, args, { stdio: 'inherit', shell: true }),
);

const stop = () => { children.forEach((c) => { try { c.kill(); } catch {} }); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
