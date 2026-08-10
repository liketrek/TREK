import { expect } from 'vitest';

/**
 * Asserts that `moduleClass` lists `provider` in its `providers: []`.
 *
 * This is the one failure the compiler cannot see: a `@PluginController()` or
 * `@McpController()` class that no module registers is invisible to discovery, and
 * every call to it comes back PERMISSION_DENIED with no other symptom.
 *
 * It is a helper rather than an inline `expect(...).toContain(...)` because that form
 * is unsound here. `Reflect.getMetadata('providers', M)` is `undefined` for a module
 * declared without a `providers` key, and `expect(undefined).toContain(SomeClass)`
 * PASSES in this vitest version (it only throws for a string needle). Every guard
 * written that way silently stopped guarding the moment its class moved to another
 * module. Asserting the array shape first is what makes the check real.
 */
export function expectRegisteredProvider(moduleClass: object, provider: object): void {
  const providers = Reflect.getMetadata('providers', moduleClass) as unknown[] | undefined;
  expect(Array.isArray(providers)).toBe(true);
  expect(providers).toEqual(expect.arrayContaining([provider]));
}

/** The same check for a module's `controllers: []`, with the same soundness caveat. */
export function expectRegisteredController(moduleClass: object, controller: object): void {
  const controllers = Reflect.getMetadata('controllers', moduleClass) as unknown[] | undefined;
  expect(Array.isArray(controllers)).toBe(true);
  expect(controllers).toEqual(expect.arrayContaining([controller]));
}
