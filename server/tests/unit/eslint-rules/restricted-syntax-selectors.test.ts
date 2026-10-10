import tsParser from '@typescript-eslint/parser';

import { ESLint, Linter } from 'eslint';
import fs from 'fs';
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';

// The outbound-timeout and raw-SQL guards are no-restricted-syntax selectors in
// eslint.config.mjs, and a selector that stops matching fails silently: the
// lint stays green and nothing is checked. This asks ESLint for the options it
// really applies to a given path (so the flat-config blocks and their ignores
// are part of what is tested) and runs those selectors over small snippets.

const serverRoot = path.resolve(__dirname, '../../..');
const eslint = new ESLint({ cwd: serverRoot });

type RuleEntry = [string, ...unknown[]];

async function selectorsFor(file: string): Promise<unknown[]> {
  const config = (await eslint.calculateConfigForFile(path.join(serverRoot, file))) as {
    rules?: Record<string, RuleEntry>;
  };
  const entry = config.rules?.['no-restricted-syntax'];
  if (!entry) throw new Error(`no-restricted-syntax is not configured for ${file}`);
  return entry.slice(1);
}

function messages(options: unknown[], code: string): string[] {
  const linter = new Linter({ configType: 'flat' });
  const result = linter.verify(
    code,
    [
      {
        files: ['**/*.ts'],
        languageOptions: { parser: tsParser },
        rules: { 'no-restricted-syntax': ['error', ...(options as object[])] },
      },
    ],
    'probe.ts',
  );
  return result.map((m) => m.message);
}

const PRELUDE = `
declare function fetch(url: string, init?: object): Promise<unknown>;
declare function safeFetch(url: string, init?: object, options?: object): Promise<unknown>;
declare function safeFetchFollow(url: string, init?: object, options?: object): Promise<unknown>;
declare function safeFetchAdminConfigured(url: string, init?: object): Promise<unknown>;
declare function safeFetchLlm(url: string, init?: object): Promise<unknown>;
declare const url: string;
declare const init: object;
declare const signal: AbortSignal;
`;

const TIMEOUT =
  'Outbound fetch needs a timeout: pass { signal: AbortSignal.timeout(ms) }, or { timeoutMs } in the options of safeFetch/safeFetchFollow.';

describe('outbound fetch timeout selectors', () => {
  let options: unknown[];
  beforeAll(async () => {
    options = await selectorsFor('src/nest/memories/probe.service.ts');
  });

  it.each([
    ['fetch(url)'],
    ["fetch(url, { method: 'POST' })"],
    ['safeFetch(url)'],
    ['safeFetch(url, undefined, { rejectUnauthorized: false })'],
    ['safeFetchFollow(url, undefined, { bypassInternalIpAllowed: true })'],
    ["safeFetchFollow(url, { headers: { a: 'b' } })"],
    ['safeFetchAdminConfigured(url, {})'],
    // Other spellings of "no init" must not slip past the undefined case.
    ['safeFetch(url, void 0, { rejectUnauthorized: false })'],
    ['safeFetch(url, null, { rejectUnauthorized: false })'],
    ['safeFetch(url, null as never, { maxBytes: 1024 })'],
    ['safeFetch(url, undefined as never, {})'],
    // A timeoutMs nested in the init is not the options deadline.
    ['safeFetch(url, { headers: { timeoutMs: 5 } })'],
    ['safeFetch(url, undefined, { maxBytes: 1024 }, { timeoutMs: 5000 })'],
  ])('flags %s', (call) => {
    expect(messages(options, `${PRELUDE}\nvoid ${call};`)).toEqual([TIMEOUT]);
  });

  it.each([
    ['fetch(url, init)'],
    ['fetch(url, { signal })'],
    ['safeFetch(url, { signal: AbortSignal.timeout(5000) })'],
    ['safeFetch(url, { ...init })'],
    ['safeFetch(url, init, { rejectUnauthorized: false })'],
    // The options object in third place carries no signal and must not be mistaken for the init.
    ['safeFetchFollow(url, { signal }, { bypassInternalIpAllowed: true })'],
    // safeFetchLlm takes its deadline from LLM_TIMEOUT_MS inside the wrapper.
    ["safeFetchLlm(url, { method: 'POST' })"],
    // timeoutMs in the options is a deadline over the whole exchange.
    ['safeFetch(url, undefined, { timeoutMs: 5000 })'],
    ['safeFetch(url, void 0, { timeoutMs: 5000, maxBytes: 1024 })'],
    ['safeFetch(url, { headers: {} }, { timeoutMs: 5000 })'],
    ['safeFetchFollow(url, undefined, { timeoutMs: 5000 })'],
    // A cast init is still an init: the "no init" casts must not match it.
    ['fetch(url, { ...init, signal } as object)'],
    ['safeFetch(url, init as object, { maxBytes: 1024 })'],
  ])('accepts %s', (call) => {
    expect(messages(options, `${PRELUDE}\nvoid ${call};`)).toEqual([]);
  });

  it('holds in the repositories too, whose block restates the selectors', async () => {
    const repo = await selectorsFor('src/db/repositories/Probe.repository.ts');
    expect(messages(repo, `${PRELUDE}\nvoid safeFetch(url, undefined, {});`)).toEqual([TIMEOUT]);
  });
});

describe('raw SQL string selectors', () => {
  const SQL = `
declare const connection: { execute(sql: string, params?: unknown[], mode?: string): Promise<unknown> };
declare const qb: { execute(mode: string): Promise<unknown> };
declare const repo: { run(sql: string, params?: unknown[]): Promise<unknown>; get(key: string): unknown };
`;
  const hits = (options: unknown[], code: string) =>
    messages(options, `${SQL}\n${code}`).filter((m) => m.startsWith('A SQL string handed to the connection'));

  it('flags a SQL string handed to the connection in a repository and in a seeder', async () => {
    for (const file of ['src/db/repositories/Probe.repository.ts', 'src/db/seeders/ProbeSeeder.ts']) {
      const options = await selectorsFor(file);
      expect(hits(options, "void connection.execute('INSERT OR IGNORE INTO t (a) VALUES (?)', [1]);")).toHaveLength(1);
      expect(hits(options, 'void connection.execute(`  select * from t where id = ?`, [1]);')).toHaveLength(1);
      expect(hits(options, "void repo.run('PRAGMA wal_checkpoint(TRUNCATE)');")).toHaveLength(1);
      // A result mode and a map lookup are not SQL.
      expect(hits(options, "void qb.execute('run'); void repo.get('key');")).toEqual([]);
    }
  });

  it('still forbids raw() and the sql tag in a repository', async () => {
    const options = await selectorsFor('src/db/repositories/Probe.repository.ts');
    const found = messages(options, "declare function raw(s: string): unknown;\nvoid raw('now()');");
    expect(found.some((m) => m.startsWith('Dialect SQL goes through'))).toBe(true);
  });

  // The files eslint.config.mjs exempts from the SQL string rule, with the SQL
  // strings each holds today. A count may only go down: a higher one is new SQL
  // text slipping in under the exemption, a lower one means the pin (and at 0
  // the ignores entry) has to follow.
  const EXEMPT_SQL_STRINGS: Record<string, number> = {
    'src/db/repositories/MaintenanceRepository.ts': 4,
    'src/db/seeders/AdminSeeder.ts': 2,
    'src/db/seeders/CategorySeeder.ts': 2,
  };
  const SQL_MESSAGE_PREFIX = 'A SQL string handed to the connection';

  function filesUnder(dir: string): string[] {
    return fs
      .readdirSync(path.join(serverRoot, dir), { recursive: true, encoding: 'utf8' })
      .filter((name) => name.endsWith('.ts'))
      .map((name) => `${dir}/${name.split(path.sep).join('/')}`);
  }

  it('exempts exactly the pinned files and keeps the rest of the guard on them', async () => {
    const exempt: string[] = [];
    for (const file of [...filesUnder('src/db/repositories'), ...filesUnder('src/db/seeders')]) {
      const options = (await selectorsFor(file)) as { message?: string }[];
      if (!options.some((o) => o.message?.startsWith(SQL_MESSAGE_PREFIX))) exempt.push(file);
    }
    expect(exempt.sort()).toEqual(Object.keys(EXEMPT_SQL_STRINGS).sort());
    for (const file of exempt) {
      const options = await selectorsFor(file);
      expect(hits(options, "void connection.execute('PRAGMA wal_checkpoint(TRUNCATE)');"), file).toEqual([]);
      expect(
        messages(
          options,
          `${PRELUDE}
void safeFetch(url);`,
        ),
        file,
      ).toContain(TIMEOUT);
    }
  });

  it('holds each exempt file to the SQL strings it has today', async () => {
    // The selectors of a file the rule does apply to, run over the exempt file's source.
    const options = await selectorsFor('src/db/repositories/Probe.repository.ts');
    const counts: Record<string, number> = {};
    for (const file of Object.keys(EXEMPT_SQL_STRINGS)) {
      const source = fs.readFileSync(path.join(serverRoot, file), 'utf8');
      counts[file] = messages(options, source).filter((m) => m.startsWith(SQL_MESSAGE_PREFIX)).length;
    }
    expect(counts, 'new SQL text in an exempt file fails; after removing some, lower its pin').toEqual(
      EXEMPT_SQL_STRINGS,
    );
    for (const [file, n] of Object.entries(counts)) {
      expect(n, `${file} holds no SQL string any more: drop it from the ignores in eslint.config.mjs`).toBeGreaterThan(
        0,
      );
    }
  });

  it('does not reach outside src/db', async () => {
    const options = await selectorsFor('src/nest/memories/probe.service.ts');
    expect(hits(options, "void connection.execute('SELECT 1');")).toEqual([]);
  });
});

describe('insertId selectors', () => {
  const INSERT = `
declare const result: { insertId: bigint | undefined };
declare const query: { executeTakeFirstOrThrow(): Promise<{ insertId: bigint | undefined }> };
`;
  const insertIdHits = (options: unknown[], code: string) =>
    messages(options, `${INSERT}\n${code}`).filter((m) => m.startsWith('InsertResult.insertId'));

  it('flags a read of insertId in every repository, the SQL-exempt one included, and in a seeder', async () => {
    for (const file of [
      'src/db/repositories/Probe.repository.ts',
      'src/db/repositories/MaintenanceRepository.ts',
      'src/db/seeders/ProbeSeeder.ts',
    ]) {
      const options = await selectorsFor(file);
      expect(insertIdHits(options, 'void Number(result.insertId);'), file).toHaveLength(1);
      expect(insertIdHits(options, 'void query.executeTakeFirstOrThrow().then(({ insertId }) => insertId);'), file).toHaveLength(1);
    }
  });

  it('leaves a returning() read alone', async () => {
    const options = await selectorsFor('src/db/repositories/Probe.repository.ts');
    expect(insertIdHits(options, 'declare const row: { id: number };\nvoid row.id;')).toEqual([]);
  });
});

describe('app setting selectors', () => {
  const APP_SETTING =
    "Read an app setting through readAppSetting()/resolveAppSetting() from src/nest/common/app-settings.registry.ts, not getValue('<key>'): the register types the key and owns its env override.";
  const PROBE = 'declare const repo: { getValue(key: string): Promise<string | null> };\ndeclare const key: string;\n';

  it('flags a literal key handed to getValue, quoted or as a template, in a service and in a repository', async () => {
    const service = await selectorsFor('src/nest/maps/probe.service.ts');
    expect(messages(service, `${PROBE}void repo.getValue('smtp_host');`)).toEqual([APP_SETTING]);
    expect(messages(service, `${PROBE}void repo.getValue(\`smtp_host\`);`)).toEqual([APP_SETTING]);
    const repo = await selectorsFor('src/db/repositories/Probe.repository.ts');
    expect(messages(repo, `${PROBE}void repo.getValue('smtp_host');`)).toEqual([APP_SETTING]);
  });

  it('leaves a key passed as a variable or built from parts alone', async () => {
    const service = await selectorsFor('src/nest/common/app-settings.registry.ts');
    expect(messages(service, `${PROBE}void repo.getValue(key);`)).toEqual([]);
    expect(messages(service, `${PROBE}void repo.getValue(\`pref_\${key}\`);`)).toEqual([]);
  });
});
