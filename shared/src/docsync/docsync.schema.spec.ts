import { docsyncLinkInputSchema, docsyncLinkUpdateSchema, docsyncScopeCreateSchema } from './docsync.schema';

import { describe, it, expect } from 'vitest';

describe('docsyncScopeCreateSchema', () => {
  it('takes only a name, because the connection is in the path', () => {
    expect(docsyncScopeCreateSchema.parse({ name: '  Norway  ' })).toEqual({ name: 'Norway' });
  });

  it('strips a connection id sent in the body instead of refusing the request', () => {
    expect(docsyncScopeCreateSchema.parse({ connectionId: 5, name: 'Norway' })).toEqual({ name: 'Norway' });
  });

  it('rejects a blank or oversized name', () => {
    expect(docsyncScopeCreateSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(docsyncScopeCreateSchema.safeParse({ name: 'x'.repeat(201) }).success).toBe(false);
    expect(docsyncScopeCreateSchema.safeParse({}).success).toBe(false);
  });
});

describe('docsyncLinkInputSchema', () => {
  it('needs the connection in the body, since POST /links has no connection in its path', () => {
    expect(docsyncLinkInputSchema.safeParse({ scopeKey: 'tag:1' }).success).toBe(false);
  });

  it('fills the safe defaults for everything the picker leaves out', () => {
    expect(docsyncLinkInputSchema.parse({ connectionId: 3, scopeKey: 'tag:1' })).toEqual({
      connectionId: 3,
      scopeKey: 'tag:1',
      remoteLabel: '',
      direction: 'both',
      deletePolicy: 'unlink',
      conflictPolicy: 'manual',
      syncEnabled: true,
    });
  });
});

describe('docsyncLinkUpdateSchema', () => {
  it('passes on only the fields the patch named, with no defaults filled in', () => {
    // Defaults here would reach updateLink as real values: pausing a pull-only
    // binding used to switch it to two-way and blank its label.
    expect(docsyncLinkUpdateSchema.parse({ syncEnabled: false })).toEqual({ syncEnabled: false });
    expect(docsyncLinkUpdateSchema.parse({})).toEqual({});
  });

  it('still checks the values it is given', () => {
    expect(docsyncLinkUpdateSchema.safeParse({ direction: 'sideways' }).success).toBe(false);
    expect(docsyncLinkUpdateSchema.safeParse({ syncEnabled: 'no' }).success).toBe(false);
  });

  it('drops the connection and the anchor, which are fixed once a binding exists', () => {
    const parsed = docsyncLinkUpdateSchema.parse({
      connectionId: 9,
      scopeKey: 'tag:2',
      remoteRootId: '2',
      remoteRootPath: '/elsewhere',
      deletePolicy: 'trash',
    });
    expect(parsed).toEqual({ deletePolicy: 'trash' });
  });
});
