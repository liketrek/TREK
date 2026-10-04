/**
 * Mailer e2e (#2507): the message a real POST /api/auth/forgot-password puts on
 * the wire, built by the real AuthModule, the real MailerService and nodemailer's
 * real MIME composer against a temp SQLite db. Only the socket is gone:
 * createTransport hands back nodemailer's stream transport, which produces the
 * exact bytes an SMTP relay would receive.
 *
 * The header logo used to be an SVG data: URI inside the HTML. Gmail strips
 * those, Outlook blocks them, and neither renders SVG, so the header showed a
 * broken image. These cases pin the replacement: a PNG part inside the message,
 * next to the HTML in multipart/related, that the HTML addresses by Content-ID.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => undefined,
    isOwner: () => false,
  };
});
vi.mock('../../src/websocket', () => ({ broadcastToUser: vi.fn(), broadcast: vi.fn() }));
vi.mock('../../src/nest/audit/audit-log.logger', () => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logDebug: vi.fn(), logError: vi.fn(), logWarn: vi.fn() }));
vi.mock('../../src/app-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/app-config')>();
  return { ...actual, getAppUrl: () => 'https://trek.example' };
});

const { wire } = vi.hoisted(() => ({ wire: [] as string[] }));
vi.mock('nodemailer', async (importOriginal) => {
  const real = (await importOriginal<{ default: typeof import('nodemailer') }>()).default;
  return {
    default: {
      ...real,
      createTransport: () => {
        const stream = real.createTransport({ streamTransport: true, buffer: true, newline: 'windows' });
        return {
          async sendMail(mail: Parameters<typeof stream.sendMail>[0]) {
            const info = await stream.sendMail(mail);
            wire.push(info.message.toString());
            return info;
          },
        };
      },
    },
  };
});

import { db } from '../../src/db/database';
import { createUser } from '../helpers/factories';
import { AuthModule } from '../../src/nest/auth/auth.module';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { createTestMikroOrmModule } from '../helpers/test-orm';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

interface MimePart {
  headers: string;
  body: string;
}

/** The leaf parts of a raw message, in order, with their header block and raw body. */
function leafParts(raw: string): MimePart[] {
  const split = raw.indexOf('\r\n\r\n');
  const headers = raw.slice(0, split);
  const body = raw.slice(split + 4);
  const boundary = /boundary="([^"]+)"/i.exec(headers.replace(/\r\n\s+/g, ' '))?.[1];
  if (!/^content-type:\s*multipart\//im.test(headers) || !boundary) return [{ headers, body }];
  return body
    .split(`--${boundary}`)
    .slice(1, -1)
    .flatMap(chunk => leafParts(chunk.replace(/^\r\n/, '')));
}

/** The decoded text of a text/* part, honouring its transfer encoding. */
function partText(part: MimePart): string {
  if (!/^Content-Transfer-Encoding: quoted-printable/im.test(part.headers)) return part.body;
  const bytes = part.body
    .replace(/=\r\n/g, '')
    .replace(/=([0-9A-F]{2})/g, (_m, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
  return Buffer.from(bytes, 'latin1').toString('utf8');
}

describe('Mailer e2e: the header logo in a mail on the wire (#2507)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let email: string;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), AuthModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    email = createUser(db as never, { username: 'mail-e2e', email: 'mail-e2e@example.test' }).user.email;
    const setting = db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)');
    setting.run('smtp_host', 'mail.internal.example');
    setting.run('smtp_port', '587');
    setting.run('smtp_from', 'trek@example.test');
    app = await build();
    server = app.getHttpServer();

    const res = await request(server).post('/api/auth/forgot-password').send({ email });
    expect(res.status).toBe(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('sends exactly one message, the HTML next to the logo in multipart/related', () => {
    expect(wire).toHaveLength(1);
    const raw = wire[0];
    expect(raw).toMatch(/^Content-Type: multipart\/alternative;/m);
    expect(raw).toMatch(/^Content-Type: multipart\/related; type="text\/html";/m);
  });

  it('the HTML addresses the logo by Content-ID and carries no data: URI', () => {
    const parts = leafParts(wire[0]);
    const htmlPart = parts.find(p => /^Content-Type: text\/html/im.test(p.headers))!;
    const html = partText(htmlPart);
    expect(html).not.toContain('data:');

    const cid = /<img src="cid:([^"]+)"/.exec(html)?.[1];
    expect(cid).toBeTruthy();

    const logo = parts.find(p => p.headers.includes(`Content-ID: <${cid}>`));
    expect(logo, `no MIME part with Content-ID <${cid}>`).toBeDefined();
    expect(logo!.headers).toMatch(/^Content-Type: image\/png/im);
    expect(logo!.headers).toMatch(/^Content-Disposition: inline/im);
    expect(logo!.headers).toMatch(/^Content-Transfer-Encoding: base64/im);
    const png = Buffer.from(logo!.body.replace(/\s+/g, ''), 'base64');
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  });

  it('the plain-text alternative stays first and untouched', () => {
    const parts = leafParts(wire[0]);
    expect(parts[0].headers).toMatch(/^Content-Type: text\/plain/im);
    expect(partText(parts[0])).toContain('https://trek.example/reset-password?token=');
  });
});
