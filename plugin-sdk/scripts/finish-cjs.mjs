// The package root says `"type": "module"`, so the CommonJS second build in
// dist/cjs needs its own scope marker or Node would parse those files as ESM.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'cjs');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"commonjs"}\n');
