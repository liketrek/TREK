/**
 * Runs `step` over `items` one after another, each once the one before has
 * settled, and stops at the first step that answers `false`. For work that must
 * not overlap: writes inside one transaction, requests to one rate-limited
 * service, a run that ends when the service says stop. Work that may overlap
 * belongs in a `Promise.all` instead.
 *
 * Answers whether every item ran to the end.
 */
export function inOrder<T>(items: readonly T[], step: (item: T) => Promise<boolean | void>): Promise<boolean> {
  return items.reduce<Promise<boolean>>(
    (previous, item) => previous.then(async (go) => go && (await step(item)) !== false),
    Promise.resolve(true),
  );
}
