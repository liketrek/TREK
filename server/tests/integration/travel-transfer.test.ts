import { getMcpSafeUrl } from '../../src/app-config';
import { buildApp } from '../../src/bootstrap';
import { OauthTokens } from '../../src/db/entities/OauthTokens.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { closeMcpSessions } from '../../src/mcp/index';
import { withRequestContext } from '../../src/nest/database/request-context';
import { OauthService } from '../../src/nest/oauth/oauth.service';
import { canonical, sha, FORMAT, CHUNK } from '../../src/nest/travel-transfer/transfer-wire';
import { deleteRows, countRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeMcpToken } from '../helpers/factories/tokens';
import { makeUser } from '../helpers/factories/users';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('travel transfer through real OAuth MCP HTTP transport', () => {
  let app: INestApplication, orm: MikroORM, oauth: OauthService;
  let userId: number, token: string, session: string;
  let rpc = 0;
  function result(response: request.Response) {
    const frame = response.text.split('\n').find((l) => l.startsWith('data:'));
    if (!frame) throw new Error('Missing MCP SSE result');
    return JSON.parse(frame.slice(5)).result;
  }
  async function call(method: string, params: unknown, credential = token, sid = session) {
    const query = request(app.getHttpServer())
      .post('/mcp')
      .set('Authorization', 'Bearer ' + credential)
      .set('Accept', 'application/json, text/event-stream');
    if (sid) query.set('Mcp-Session-Id', sid);
    return query.send({ jsonrpc: '2.0', id: ++rpc, method, params });
  }
  async function initialize(credential: string) {
    const response = await call(
      'initialize',
      {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'Synthetic transfer test', version: '1' },
      },
      credential,
      '',
    );
    expect(response.status).toBe(200);
    return String(response.headers['mcp-session-id']);
  }
  async function tool(name: string, args: unknown) {
    const response = await call('tools/call', { name: 'travel_transfer_' + name, arguments: args });
    expect(response.status).toBe(200);
    const value = result(response);
    expect(value.isError).not.toBe(true);
    return JSON.parse(value.content[0].text);
  }
  beforeAll(async () => {
    app = await buildApp();
    orm = app.get(MikroORM);
    oauth = app.get(OauthService);
    const { user } = await makeUser(orm);
    userId = user.id;
    await setAddonEnabled(orm, 'mcp', true);
    token = await withRequestContext(orm, async () => {
      const scopes = ['transfer:read', 'transfer:write'];
      const created = await oauth.createOAuthClient(
        userId,
        'Synthetic transfer',
        ['https://client.example.test/cb'],
        scopes,
      );
      return (
        await oauth.issueTokens(
          String(created.client.client_id),
          userId,
          scopes,
          null,
          getMcpSafeUrl().replace(/\/+$/, '') + '/mcp',
        )
      ).access_token;
    });
    session = await initialize(token);
  });
  afterAll(async () => {
    closeMcpSessions();
    await app?.close();
  });
  it('advertises eight scoped tools, while static full-access tokens receive none', async () => {
    const tools = result(await call('tools/list', {})).tools.filter((t: { name: string }) =>
      t.name.startsWith('travel_transfer_'),
    );
    expect(tools).toHaveLength(8);
    const legacy = await makeMcpToken(orm, userId),
      legacySession = await initialize(legacy.rawToken);
    const oldTools = result(await call('tools/list', {}, legacy.rawToken, legacySession)).tools;
    expect(oldTools.some((t: { name: string }) => t.name.startsWith('travel_transfer_'))).toBe(false);
    expect((await tool('capabilities', {})).features).toContain('complete-snapshots');
  });
  it('stages, applies, reads back and reconciles a lost acknowledgment through real endpoints', async () => {
    const graph = {
      format: FORMAT,
      trip: 'source',
      revision: 'r1',
      complete: true,
      originals: [],
      records: [
        {
          id: 'trip',
          kind: 'trip',
          visibility: 'trip',
          references: {},
          fields: { title: 'Synthetic HTTP transfer', notes: null, start_date: null, end_date: null },
          source: { fields: { title: 'present', notes: 'present', start_date: 'present', end_date: 'present' } },
        },
      ],
    };
    const original = Buffer.alloc(CHUNK + 3, 0x80);
    original[0] = 0;
    original[CHUNK] = 255;
    Object.assign(graph, {
      originals: [{ id: 'http-original', record: 'trip', size: original.length, sha256: sha(original) }],
    });
    const bytes = Buffer.from(canonical(graph)),
      payload_digest = sha(bytes);
    const common = { trip_id: null, operation_id: 'http-transfer', include_private: false, payload_digest };
    expect((await tool('list_trips', { cursor: null, limit: 100 })).trips).toEqual([]);
    async function upload(offset: number) {
      const part = original.subarray(offset, offset + CHUNK);
      return tool('write_original', {
        trip_id: null,
        operation_id: 'http-transfer',
        id: 'http-original',
        include_private: false,
        offset,
        total: original.length,
        sha256: sha(original),
        chunk_sha256: sha(part),
        data: part.toString('base64'),
      });
    }
    expect((await upload(0)).next_offset).toBe(CHUNK);
    expect((await upload(CHUNK)).next_offset).toBe(original.length);
    expect(
      await tool('stage_graph', {
        ...common,
        offset: 0,
        total: bytes.length,
        chunk_sha256: sha(bytes),
        data: bytes.toString('base64'),
      }),
    ).toEqual({ next_offset: bytes.length, payload_digest });
    const applied = await tool('apply', { ...common, expected_revision: null, original_ids: ['http-original'] });
    expect(await tool('receipt', common)).toEqual(applied);
    expect(await tool('apply', { ...common, expected_revision: null, original_ids: ['http-original'] })).toEqual(
      applied,
    );
    const snapshot = await tool('snapshot', {
      trip_id: applied.trip_id,
      revision: null,
      cursor: null,
      include_private: false,
    });
    expect(snapshot.records).toEqual(graph.records);
    const read = await tool('read_original', {
      trip_id: applied.trip_id,
      revision: snapshot.revision,
      id: 'http-original',
      offset: 0,
      limit: CHUNK,
    });
    expect(Buffer.from(read.data, 'base64')).toEqual(original.subarray(0, CHUNK));
    const boundary = await tool('read_original', {
      trip_id: applied.trip_id,
      revision: snapshot.revision,
      id: 'http-original',
      offset: CHUNK - 1,
      limit: CHUNK,
    });
    expect(Buffer.from(boundary.data, 'base64')).toEqual(original.subarray(CHUNK - 1));
    expect(boundary.sha256).toBe(sha(original));
    expect(boundary.chunk_sha256).toBe(sha(original.subarray(CHUNK - 1)));
    expect(await countRows(orm, Trips, { user: userId })).toBe(1);
    await deleteRows(orm, OauthTokens, { user: userId });
    expect((await call('tools/call', { name: 'travel_transfer_receipt', arguments: common })).status).toBe(401);
  });
});
