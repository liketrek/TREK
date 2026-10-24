/**
 * Sends requests one after another and answers their results in order.
 *
 * Supertest given an app's HTTP server that is not listening opens it on a
 * port of its own for every request and closes it again once that request is
 * answered. Several requests sent together against the same server race: a
 * refusal answered at once closes it under another one still in flight, which
 * then fails with ECONNRESET instead of its status. Sent one by one, each
 * request has the server to itself.
 */
export async function oneByOne<T, R>(items: readonly T[], send: (item: T) => PromiseLike<R>): Promise<R[]> {
  return await items.reduce<Promise<R[]>>(
    async (sent, item) => [...(await sent), await send(item)],
    Promise.resolve([]),
  );
}
