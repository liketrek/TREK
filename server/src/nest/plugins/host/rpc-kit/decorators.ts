import { Injectable } from '@nestjs/common';
import { addEntry, markController, type ClassRef } from './metadata';
import type { HookKey, KnownMethod, MethodPermission, UnconditionalMethod } from '../../protocol/envelope';
import type { PluginHookOptions, PluginRpcEntry } from './types';

/**
 * Marks a class as a plugin RPC controller. Implies `@Injectable()`.
 *
 * The class MUST be listed in its domain module's `providers: []`. Discovery scans
 * only marked PROVIDERS (explicit opt-in), so a decorated class nobody registered
 * contributes nothing and every call to its methods comes back PERMISSION_DENIED
 * with no other symptom. The coverage ledger test catches that in CI, and
 * `requireTotalCoverage` turns it into a boot failure once the rollout is done.
 *
 * NEVER put this on a Nest `@Controller`: `Injectable()` rewrites
 * SCOPE_OPTIONS_METADATA and would clobber a `@Controller({ scope })` option.
 * register() rejects it.
 */
export function PluginController(): ClassDecorator {
  return (target) => {
    Injectable()(target);
    markController(target as unknown as ClassRef);
  };
}

function pluginMethodDecorator(entry: (methodName: string) => PluginRpcEntry): MethodDecorator {
  return (target, propertyKey) => {
    addEntry((target as { constructor: unknown }).constructor as ClassRef, entry(String(propertyKey)));
  };
}

/**
 * Registers the method as the handler for RPC method `method`.
 * Handler signature: `(params, ctx: PluginRpcContext) => unknown`.
 *
 *     @PluginMethod('tags.list', { permission: 'db:read:tags' })
 *
 * Both arguments are checked against protocol/envelope.ts at COMPILE time: a name
 * outside KNOWN_METHODS does not typecheck, and a permission other than the one
 * METHOD_PERMISSION assigns to that method fails with the expected literal named in
 * the error. That is the binding the whole kit exists for.
 */
export function PluginMethod<M extends KnownMethod>(
  method: M,
  options: { permission: MethodPermission<M> },
): MethodDecorator {
  return pluginMethodDecorator((methodName) => ({
    kind: 'method',
    methodName,
    method,
    permission: options.permission,
  }));
}

/**
 * The carve-out: a method registered with NO grant check, matching the three the
 * router registers outside every has() block.
 *
 * A separate decorator rather than an option on @PluginMethod, so that "I forgot the
 * permission" can never look like the carve-out. It also sidesteps a trap specific to
 * this package: server/tsconfig.json has "strict": false, so a `permission: null`
 * sentinel would be assignable to every string literal and the check would be void.
 */
export function PluginOpenMethod(method: UnconditionalMethod): MethodDecorator {
  return pluginMethodDecorator((methodName) => ({ kind: 'open', methodName, method }));
}

/**
 * Declares a HOST-side consumer of one provider-hook function.
 *
 *     @PluginHook('warningProvider', { permission: 'hook:trip-warning-provider', fn: 'getWarnings' })
 *
 * It does NOT impose a fan-out shape, because the real call graph is not uniform:
 * routeProvider is single-target on a 20s budget, calendarSource fans out over two
 * fns with different budgets, photoProvider has three separate sites, and
 * notificationChannel is invoked from PluginRuntimeService rather than a controller.
 * What the declaration buys is the compile-checked hook/permission pair, one place
 * where the timeout lives, and the boot assertion that no granted hook is left
 * without a consumer.
 */
export function PluginHook<H extends HookKey>(hook: H, options: PluginHookOptions<H>): MethodDecorator {
  return pluginMethodDecorator((methodName) => ({
    kind: 'hook',
    methodName,
    hook,
    permission: options.permission,
    fn: options.fn,
    timeoutMs: options.timeoutMs ?? 5000,
  }));
}
