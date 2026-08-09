/**
 * The four plugin RPC decorators. The compile-time half of their contract is
 * enforced by tsc and cannot be asserted here; what these tests pin is what each
 * decorator RECORDS, because that is what validate() and bindInto() later read.
 */
import { describe, it, expect } from 'vitest';
import { SCOPE_OPTIONS_METADATA } from '@nestjs/common/constants';
import {
  PluginController,
  PluginHook,
  PluginMethod,
  PluginOpenMethod,
} from '../../../../src/nest/plugins/host/rpc-kit/decorators';
import { getEntry, isPluginController, type ClassRef } from '../../../../src/nest/plugins/host/rpc-kit/metadata';

const entryOf = (ctor: unknown, methodName: string) => getEntry(ctor as ClassRef, methodName);

describe('rpc-kit decorators', () => {
  it('RPCKIT-DEC-001 @PluginController marks the class', () => {
    @PluginController()
    class Sample {}
    expect(isPluginController(Sample)).toBe(true);
  });

  it('RPCKIT-DEC-002 @PluginController implies @Injectable', () => {
    @PluginController()
    class Sample {}
    // What Injectable() writes. Nest resolves the class as a provider off this.
    expect(Reflect.getMetadata(SCOPE_OPTIONS_METADATA, Sample)).toBeUndefined();
    expect(Reflect.hasMetadata(SCOPE_OPTIONS_METADATA, Sample)).toBe(true);
  });

  it('RPCKIT-DEC-003 @PluginMethod records the wire method and its permission', () => {
    @PluginController()
    class Sample {
      @PluginMethod('tags.list', { permission: 'db:read:tags' })
      list() {
        return [];
      }
    }
    expect(entryOf(Sample, 'list')).toEqual({
      kind: 'method',
      methodName: 'list',
      method: 'tags.list',
      permission: 'db:read:tags',
    });
  });

  it('RPCKIT-DEC-004 the class method name and the wire method are independent', () => {
    @PluginController()
    class Sample {
      @PluginMethod('tags.delete', { permission: 'db:write:tags' })
      removeTheTag() {
        return { deleted: true };
      }
    }
    const entry = entryOf(Sample, 'removeTheTag');
    expect(entry).toMatchObject({ methodName: 'removeTheTag', method: 'tags.delete' });
  });

  it('RPCKIT-DEC-005 @PluginOpenMethod records no permission at all', () => {
    @PluginController()
    class Sample {
      @PluginOpenMethod('settings.get')
      get() {
        return { value: undefined };
      }
    }
    expect(entryOf(Sample, 'get')).toEqual({ kind: 'open', methodName: 'get', method: 'settings.get' });
  });

  it('RPCKIT-DEC-006 @PluginHook records hook, fn and permission', () => {
    @PluginController()
    class Sample {
      @PluginHook('warningProvider', { permission: 'hook:trip-warning-provider', fn: 'getWarnings' })
      declare() {}
    }
    expect(entryOf(Sample, 'declare')).toMatchObject({
      kind: 'hook',
      hook: 'warningProvider',
      fn: 'getWarnings',
      permission: 'hook:trip-warning-provider',
    });
  });

  it('RPCKIT-DEC-007 @PluginHook defaults the budget to 5000ms', () => {
    @PluginController()
    class Sample {
      @PluginHook('mapMarkerProvider', { permission: 'hook:map-marker-provider', fn: 'getMarkers' })
      declare() {}
    }
    expect(entryOf(Sample, 'declare')).toMatchObject({ timeoutMs: 5000 });
  });

  it('RPCKIT-DEC-008 an explicit timeout wins over the default', () => {
    @PluginController()
    class Sample {
      @PluginHook('routeProvider', { permission: 'hook:route-provider', fn: 'getRoute', timeoutMs: 20_000 })
      declare() {}
    }
    expect(entryOf(Sample, 'declare')).toMatchObject({ timeoutMs: 20_000 });
  });

  it('RPCKIT-DEC-009 several decorated methods on one class are all recorded', () => {
    @PluginController()
    class Sample {
      @PluginMethod('tags.list', { permission: 'db:read:tags' })
      list() {
        return [];
      }
      @PluginMethod('tags.create', { permission: 'db:write:tags' })
      create() {
        return {};
      }
      undecorated() {
        return null;
      }
    }
    expect(entryOf(Sample, 'list')).toMatchObject({ method: 'tags.list' });
    expect(entryOf(Sample, 'create')).toMatchObject({ method: 'tags.create' });
    expect(entryOf(Sample, 'undecorated')).toBeUndefined();
  });

  it('RPCKIT-DEC-010 a method decorator alone does not mark the class', () => {
    class Sample {
      @PluginMethod('tags.list', { permission: 'db:read:tags' })
      list() {
        return [];
      }
    }
    // The entry is recorded, but register() will still reject the class. That split
    // is deliberate: listing the class in providers: [] must stay an explicit opt-in.
    expect(entryOf(Sample, 'list')).toBeDefined();
    expect(isPluginController(Sample)).toBe(false);
  });
});
