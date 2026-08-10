/**
 * The registry is where a decorator argument is re-checked against
 * protocol/envelope.ts at runtime, and where the granted subset is bound into the
 * per-plugin dispatch map. Types evaporate under an `as` cast, so every compile-time
 * guarantee has a runtime twin here, and each one gets a test.
 */
import { describe, it, expect, vi } from 'vitest';
import { Controller } from '@nestjs/common';
import {
  PluginController,
  PluginHook,
  PluginMethod,
  PluginOpenMethod,
} from '../../../../src/nest/plugins/host/rpc-kit/decorators';
import { PluginRpcRegistry } from '../../../../src/nest/plugins/host/rpc-kit/registry';
import { createTestPluginRegistry } from '../../../../src/nest/plugins/host/rpc-kit/testing';
import type { PluginRpcContext } from '../../../../src/nest/plugins/host/rpc-kit/types';

const ctxFor = (actingUserId: number | undefined): PluginRpcContext => ({
  pluginId: 'p',
  actingUserId,
  data: {} as PluginRpcContext['data'],
  // No case below dispatches to a peer plugin, but the peers are a real collaborator
  // on the context, so they get a stub that fails loudly rather than an empty object
  // whose methods would be undefined the moment a handler reached for one.
  plugins: {
    call: () => Promise.reject(new Error('ctxFor: no peer plugin router in these cases')),
    emit: () => {
      throw new Error('ctxFor: no peer plugin router in these cases');
    },
  },
});

/** A well-formed controller: two tags methods with the permissions the table assigns. */
@PluginController()
class TagsRpc {
  @PluginMethod('tags.list', { permission: 'db:read:tags' })
  list(_params: Record<string, unknown>, ctx: PluginRpcContext) {
    return { calledBy: ctx.actingUserId };
  }

  @PluginMethod('tags.create', { permission: 'db:write:tags' })
  create(params: Record<string, unknown>, ctx: PluginRpcContext) {
    return { name: params.name, by: ctx.actingUserId };
  }
}

describe('PluginRpcRegistry — registration', () => {
  it('RPCKIT-REG-001 an undecorated class is rejected by name', () => {
    class NotAController {}
    expect(() => new PluginRpcRegistry().register(new NotAController())).toThrow(
      /NotAController is not decorated with @PluginController/,
    );
  });

  it('RPCKIT-REG-002 a Nest @Controller is rejected, because @Injectable rewrites its scope metadata', () => {
    @PluginController()
    @Controller('things')
    class HttpThing {
      @PluginMethod('tags.list', { permission: 'db:read:tags' })
      list() {
        return [];
      }
    }
    expect(() => new PluginRpcRegistry().register(new HttpThing())).toThrow(/is a Nest @Controller/);
  });

  it('RPCKIT-REG-003 only decorated methods are recorded', () => {
    @PluginController()
    class Mixed {
      @PluginMethod('tags.list', { permission: 'db:read:tags' })
      list() {
        return [];
      }
      helper() {
        return 1;
      }
    }
    const registry = createTestPluginRegistry([new Mixed()]);
    expect(registry.list()).toHaveLength(1);
    expect(registry.methodNames()).toEqual(new Set(['tags.list']));
  });

  it('RPCKIT-REG-004 an explicit method-name list narrows the scan', () => {
    const registry = new PluginRpcRegistry();
    registry.register(new TagsRpc(), ['list']);
    expect(registry.methodNames()).toEqual(new Set(['tags.list']));
  });

  it('RPCKIT-REG-005 inherited decorated methods are picked up', () => {
    @PluginController()
    class Base {
      @PluginMethod('tags.list', { permission: 'db:read:tags' })
      list() {
        return [];
      }
    }
    @PluginController()
    class Child extends Base {}
    const registry = createTestPluginRegistry([new Child()]);
    expect(registry.methodNames()).toEqual(new Set(['tags.list']));
  });

  it('RPCKIT-REG-006 list() reports kind, permission and the owning class', () => {
    const registry = createTestPluginRegistry([new TagsRpc()]);
    expect(registry.list()).toEqual(
      expect.arrayContaining([
        { kind: 'method', name: 'tags.list', permission: 'db:read:tags', className: 'TagsRpc', methodName: 'list' },
      ]),
    );
  });
});

describe('PluginRpcRegistry — validate', () => {
  it('RPCKIT-REG-007 a well-formed controller validates', () => {
    expect(() => createTestPluginRegistry([new TagsRpc()])).not.toThrow();
  });

  it('RPCKIT-REG-008 a permission the table does not assign is named with the expected literal', () => {
    @PluginController()
    class Wrong {
      // The cast is the point: this is exactly what a hand-emitted consumer or an
      // `as` cast would smuggle past tsc.
      @PluginMethod('tags.list', { permission: 'db:write:tags' as 'db:read:tags' })
      list() {
        return [];
      }
    }
    expect(() => createTestPluginRegistry([new Wrong()])).toThrow(
      /method "tags.list" \(Wrong.list\) declares "db:write:tags" but METHOD_PERMISSION says "db:read:tags"/,
    );
  });

  it('RPCKIT-REG-008b a permission that does not exist at all is reported as unknown, too', () => {
    @PluginController()
    class Typo {
      @PluginMethod('tags.list', { permission: 'db:read:tapps' as 'db:read:tags' })
      list() {
        return [];
      }
    }
    let error: Error | undefined;
    try {
      createTestPluginRegistry([new Typo()]);
    } catch (e) {
      error = e as Error;
    }
    // Both checks fire: it disagrees with the table AND names a permission the host
    // does not know. The second is what catches a permission invented out of thin air.
    expect(error?.message).toMatch(/but METHOD_PERMISSION says "db:read:tags"/);
    expect(error?.message).toMatch(
      /method "tags.list" \(Typo.list\) declares unknown permission "db:read:tapps"/,
    );
  });

  it('RPCKIT-REG-009 a method outside KNOWN_METHODS is named', () => {
    @PluginController()
    class Bogus {
      @PluginMethod('tags.lst' as 'tags.list', { permission: 'db:read:tags' })
      list() {
        return [];
      }
    }
    expect(() => createTestPluginRegistry([new Bogus()])).toThrow(
      /method "tags.lst" \(Bogus.list\) is not in KNOWN_METHODS/,
    );
  });

  it('RPCKIT-REG-010 an open method outside UNCONDITIONAL_METHODS is named', () => {
    @PluginController()
    class Bogus {
      @PluginOpenMethod('tags.list' as 'settings.get')
      get() {
        return {};
      }
    }
    expect(() => createTestPluginRegistry([new Bogus()])).toThrow(
      /open method "tags.list" \(Bogus.get\) is not in UNCONDITIONAL_METHODS/,
    );
  });

  it('RPCKIT-REG-011 two owners of the same method name both classes', () => {
    @PluginController()
    class Second {
      @PluginMethod('tags.list', { permission: 'db:read:tags' })
      list() {
        return [];
      }
    }
    expect(() => createTestPluginRegistry([new TagsRpc(), new Second()])).toThrow(
      /method "tags.list" is handled by TagsRpc.list and Second.list/,
    );
  });

  it('RPCKIT-REG-012 a hook permission that disagrees with HOOK_PERMISSION is named', () => {
    @PluginController()
    class Wrong {
      @PluginHook('warningProvider', {
        permission: 'hook:route-provider' as 'hook:trip-warning-provider',
        fn: 'getWarnings',
      })
      declare() {}
    }
    expect(() => createTestPluginRegistry([new Wrong()])).toThrow(
      /hook "warningProvider" \(Wrong.declare\) declares "hook:route-provider" but HOOK_PERMISSION says "hook:trip-warning-provider"/,
    );
  });

  it('RPCKIT-REG-013 a hook name that is not a HOOK_PERMISSION key is named', () => {
    @PluginController()
    class Wrong {
      @PluginHook('warningProvidr' as 'warningProvider', {
        permission: 'hook:trip-warning-provider',
        fn: 'x',
      })
      declare() {}
    }
    expect(() => createTestPluginRegistry([new Wrong()])).toThrow(
      /hook "warningProvidr" \(Wrong.declare\) is not a HOOK_PERMISSION key/,
    );
  });

  it('RPCKIT-REG-014 the same (hook, fn) pair declared twice is rejected', () => {
    @PluginController()
    class A {
      @PluginHook('warningProvider', { permission: 'hook:trip-warning-provider', fn: 'getWarnings' })
      declare() {}
    }
    @PluginController()
    class B {
      @PluginHook('warningProvider', { permission: 'hook:trip-warning-provider', fn: 'getWarnings' })
      declare() {}
    }
    expect(() => createTestPluginRegistry([new A(), new B()])).toThrow(
      /hook fn "warningProvider#getWarnings" is declared twice \(B.declare\)/,
    );
  });

  it('RPCKIT-REG-015 two fns of the SAME hook are allowed — the fan-out is not uniform', () => {
    @PluginController()
    class Calendar {
      @PluginHook('calendarSource', { permission: 'hook:calendar-source', fn: 'getName', timeoutMs: 3000 })
      name() {}
      @PluginHook('calendarSource', { permission: 'hook:calendar-source', fn: 'getEvents', timeoutMs: 5000 })
      events() {}
    }
    expect(() => createTestPluginRegistry([new Calendar()])).not.toThrow();
  });

  it('RPCKIT-REG-016 every problem is reported at once, not just the first', () => {
    @PluginController()
    class Wrong {
      @PluginMethod('tags.list', { permission: 'db:write:tags' as 'db:read:tags' })
      list() {
        return [];
      }
      @PluginOpenMethod('tags.create' as 'settings.get')
      get() {
        return {};
      }
    }
    expect(() => createTestPluginRegistry([new Wrong()])).toThrow(
      /METHOD_PERMISSION says "db:read:tags"; open method "tags.create"/,
    );
  });

  it('RPCKIT-REG-017 requireTotalCoverage off tolerates an incomplete registry', () => {
    expect(() => createTestPluginRegistry([new TagsRpc()], { requireTotalCoverage: false })).not.toThrow();
  });

  it('RPCKIT-REG-018 requireTotalCoverage on names an unhandled method and a consumerless hook', () => {
    let error: Error | undefined;
    try {
      createTestPluginRegistry([new TagsRpc()], { requireTotalCoverage: true });
    } catch (e) {
      error = e as Error;
    }
    expect(error?.message).toMatch(/method "db.query" has no handler/);
    expect(error?.message).toMatch(/method "plugins.call" has no handler/);
    expect(error?.message).toMatch(/hook "photoProvider" has no host-side consumer \(dead grant on the consent screen\)/);
    // tags.list IS handled, so it must not be listed.
    expect(error?.message).not.toMatch(/method "tags.list" has no handler/);
  });
});

describe('PluginRpcRegistry — bindInto', () => {
  const bind = (registry: PluginRpcRegistry, granted: string[]) => {
    const map = new Map<string, (p: Record<string, unknown>, uid: number | undefined) => unknown>();
    registry.bindInto(map, new Set(granted), ctxFor);
    return map;
  };

  it('RPCKIT-REG-019 registration is authorization: an ungranted method is ABSENT, not guarded', () => {
    const map = bind(createTestPluginRegistry([new TagsRpc()]), ['db:read:tags']);
    expect([...map.keys()]).toEqual(['tags.list']);
    expect(map.has('tags.create')).toBe(false);
  });

  it('RPCKIT-REG-020 no grants means an empty map', () => {
    expect(bind(createTestPluginRegistry([new TagsRpc()]), []).size).toBe(0);
  });

  it('RPCKIT-REG-021 the bound handler receives params and a context', () => {
    const map = bind(createTestPluginRegistry([new TagsRpc()]), ['db:write:tags']);
    expect(map.get('tags.create')!({ name: 'work' }, 42)).toEqual({ name: 'work', by: 42 });
  });

  it('RPCKIT-REG-022 the handler keeps its `this`', () => {
    @PluginController()
    class Stateful {
      private readonly answer = 7;
      @PluginMethod('tags.list', { permission: 'db:read:tags' })
      list() {
        return this.answer;
      }
    }
    const map = bind(createTestPluginRegistry([new Stateful()]), ['db:read:tags']);
    expect(map.get('tags.list')!({}, 42)).toBe(7);
  });

  it('RPCKIT-REG-022b a host-scoped http:outbound grant is honoured, not rejected as unknown', () => {
    // The check uses isKnownPermission, not a set lookup on KNOWN_PERMISSIONS. A naive
    // lookup would reject every host-scoped egress grant, because that family is
    // open-ended by design.
    const registry = createTestPluginRegistry([new TagsRpc()]);
    const map = bind(registry, ['db:read:tags', 'http:outbound:api.example.com']);
    expect(map.has('tags.list')).toBe(true);
  });

  it('RPCKIT-REG-023 an open method binds with no grant at all', () => {
    @PluginController()
    class Open {
      @PluginOpenMethod('settings.get')
      get() {
        return { value: undefined };
      }
    }
    expect([...bind(createTestPluginRegistry([new Open()]), []).keys()]).toEqual(['settings.get']);
  });

  it('RPCKIT-REG-024 hook declarations are never bound as methods', () => {
    @PluginController()
    class Hooks {
      @PluginHook('warningProvider', { permission: 'hook:trip-warning-provider', fn: 'getWarnings' })
      declare() {}
    }
    expect(bind(createTestPluginRegistry([new Hooks()]), ['hook:trip-warning-provider']).size).toBe(0);
  });

  it('RPCKIT-REG-025 a collision with a name the legacy router already owns throws', () => {
    const registry = createTestPluginRegistry([new TagsRpc()]);
    const map = new Map<string, (p: Record<string, unknown>, uid: number | undefined) => unknown>();
    map.set('tags.list', () => 'legacy');
    expect(() => registry.bindInto(map, new Set(['db:read:tags']), ctxFor)).toThrow(
      /plugin RPC method "tags.list" is registered twice \(TagsRpc.list and the legacy router\)/,
    );
  });

  it('RPCKIT-REG-026 the context is built per dispatch, not once per bind', () => {
    const makeCtx = vi.fn(ctxFor);
    const registry = createTestPluginRegistry([new TagsRpc()]);
    const map = new Map<string, (p: Record<string, unknown>, uid: number | undefined) => unknown>();
    registry.bindInto(map, new Set(['db:read:tags']), makeCtx);
    expect(makeCtx).not.toHaveBeenCalled();
    expect(map.get('tags.list')!({}, 1)).toEqual({ calledBy: 1 });
    expect(map.get('tags.list')!({}, 2)).toEqual({ calledBy: 2 });
    expect(makeCtx).toHaveBeenCalledTimes(2);
  });
});

describe('PluginRpcRegistry — hook contracts', () => {
  @PluginController()
  class Calendar {
    @PluginHook('calendarSource', { permission: 'hook:calendar-source', fn: 'getName', timeoutMs: 3000 })
    name() {}
    @PluginHook('calendarSource', { permission: 'hook:calendar-source', fn: 'getEvents' })
    events() {}
  }

  it('RPCKIT-REG-027 every declared pair is listed with its consumer', () => {
    const contracts = createTestPluginRegistry([new Calendar()]).hookContracts();
    expect([...contracts.keys()]).toEqual(['calendarSource#getName', 'calendarSource#getEvents']);
    expect(contracts.get('calendarSource#getName')).toEqual({
      hook: 'calendarSource',
      fn: 'getName',
      permission: 'hook:calendar-source',
      timeoutMs: 3000,
      consumer: 'Calendar.name',
    });
  });

  it('RPCKIT-REG-028 hookContract returns the budget a call site should use', () => {
    const registry = createTestPluginRegistry([new Calendar()]);
    expect(registry.hookContract('calendarSource', 'getEvents').timeoutMs).toBe(5000);
  });

  it('RPCKIT-REG-029 asking for an undeclared pair throws and names it', () => {
    const registry = createTestPluginRegistry([new Calendar()]);
    expect(() => registry.hookContract('calendarSource', 'getNothing')).toThrow(
      /no @PluginHook declaration for "calendarSource#getNothing"/,
    );
  });
});
