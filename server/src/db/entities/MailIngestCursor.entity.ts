import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { MailIngestCursorRepository } from '../repositories/MailIngestCursor.repository';
import { DbTimestampType } from '../types';

export class MailIngestCursor {
  [EntityRepositoryType]?: MailIngestCursorRepository;
  id!: number & Opt;
  transport!: string;
  mailbox!: string;
  uid_validity?: number | null;
  last_uid?: number | null;
  last_ok_at?: string | null;
  last_error?: string | null;
  lease_owner?: string | null;
  lease_until?: string | null;
}

export const MailIngestCursorSchema = defineEntity({
  class: MailIngestCursor,
  repository: () => MailIngestCursorRepository,
  uniques: [{ properties: ['transport', 'mailbox'] }],
  properties: {
    id: p.integer().primary(),
    transport: p.text(),
    mailbox: p.text(),
    uid_validity: p.integer().nullable(),
    last_uid: p.integer().nullable(),
    last_ok_at: p.type(DbTimestampType).nullable(),
    last_error: p.text().nullable(),
    lease_owner: p.text().nullable(),
    lease_until: p.type(DbTimestampType).nullable(),
  },
});
