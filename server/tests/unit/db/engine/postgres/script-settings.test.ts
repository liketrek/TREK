/**
 * The settings a newer pg_restore writes at the start of a restore script
 * (src/db/engine/postgres/script-settings.ts): a server that does not know one
 * refuses the whole script under ON_ERROR_STOP, so the restore leaves it out
 * for that server and nowhere else.
 */
import { withoutUnknownSettings } from '../../../../../src/db/engine/postgres/script-settings';

import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';

/** The settings block pg_restore 18 writes, followed by the script's first objects and some COPY data. */
const SCRIPT = [
  '--',
  '-- PostgreSQL database dump',
  '--',
  '',
  '\\restrict k1',
  '',
  '-- Dumped from database version 16.4',
  '-- Dumped by pg_dump version 18.1',
  '',
  'SET statement_timeout = 0;',
  'SET lock_timeout = 0;',
  'SET idle_in_transaction_session_timeout = 0;',
  'SET transaction_timeout = 0;',
  "SET client_encoding = 'UTF8';",
  'SET standard_conforming_strings = on;',
  "SELECT pg_catalog.set_config('search_path', '', false);",
  'SET row_security = off;',
  '',
  'CREATE TABLE public.mikro_orm_migrations (',
  '    id integer NOT NULL',
  ');',
  'COPY public.notes (body) FROM stdin;',
  'SET transaction_timeout = 0;',
  'Grüße aus Köln',
  '\\.',
  '',
].join('\n');

/** What the filter makes of `text` for a server of major `major`, fed in chunks of `size` bytes. */
async function filtered(text: string, major: number, size: number): Promise<string> {
  const bytes = Buffer.from(text, 'utf8');
  const chunks: Buffer[] = [];
  for (let at = 0; at < bytes.length; at += size) chunks.push(bytes.subarray(at, at + size));
  const out: Buffer[] = [];
  for await (const chunk of Readable.from(chunks).pipe(withoutUnknownSettings(major))) out.push(chunk as Buffer);
  return Buffer.concat(out).toString('utf8');
}

describe('script-settings', () => {
  it.each([14, 15, 16])(
    'SCRIPTSET-001: a PostgreSQL %i server gets the script without SET transaction_timeout, and nothing else changes',
    async (major) => {
      const expected = SCRIPT.replace('SET transaction_timeout = 0;\n', '');
      for (const size of [1, 3, 7, 64, 1 << 20]) {
        expect(await filtered(SCRIPT, major, size), `chunks of ${size}`).toBe(expected);
      }
    },
  );

  it.each([17, 18])('SCRIPTSET-002: a PostgreSQL %i server gets the script as pg_restore wrote it', async (major) => {
    expect(await filtered(SCRIPT, major, 5)).toBe(SCRIPT);
  });

  it('SCRIPTSET-003: only the settings block is read, so a COPY row that looks like the setting stays', async () => {
    const out = await filtered(SCRIPT, 16, 1 << 20);
    expect(out.match(/^SET transaction_timeout = 0;$/gm)).toHaveLength(1);
    expect(out.indexOf('SET transaction_timeout')).toBeGreaterThan(out.indexOf('COPY public.notes'));
  });

  it('SCRIPTSET-004: a script that ends inside its settings block keeps its last line unless it is the setting', async () => {
    expect(await filtered('SET lock_timeout = 0;\nSET transaction_timeout = 0;', 16, 4)).toBe(
      'SET lock_timeout = 0;\n',
    );
    expect(await filtered('SET lock_timeout = 0;\nSET row_security = off;', 16, 4)).toBe(
      'SET lock_timeout = 0;\nSET row_security = off;',
    );
  });
});
