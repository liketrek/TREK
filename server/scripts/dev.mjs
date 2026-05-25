import { execSync, spawn } from 'node:child_process';

console.log('[dev] initial build...');
execSync('node scripts/build.mjs', { stdio: 'inherit' });

const children = [];
const stop = () => { children.forEach((c) => { try { c.kill(); } catch {} }); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

// Start tsc -w and wait for its first "Watching for file changes." before launching
// node --watch, so the initial tsc compilation doesn't trigger a spurious restart.
const tsc = spawn('npx', ['tsc', '-w', '-p', 'tsconfig.build.json', '--preserveWatchOutput'], {
  stdio: ['ignore', 'pipe', 'inherit'],
  shell: true,
});
children.push(tsc);

let nodeProc = null;
let ready = false;

tsc.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  if (!ready && chunk.toString().includes('Watching for file changes')) {
    ready = true;
    nodeProc = spawn('node', ['--require', 'tsconfig-paths/register', '--watch', 'dist/index.js'], {
      stdio: 'inherit',
      shell: true,
    });
    children.push(nodeProc);
  }
});
