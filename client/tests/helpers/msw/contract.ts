import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw';
import type { z } from 'zod';

/**
 * An MSW handler held to the contract in @trek/shared.
 *
 * A raw `http.post(...)` handler believes whatever the test hands it: the body
 * is cast with `as`, and the response is whatever a factory builds. When the
 * server's contract moves, such a handler keeps answering the old shape and
 * the tests stay green against a server that no longer exists. A contract
 * handler parses both sides instead:
 *
 * - the request body against `request`. A body the server's Zod pipe would
 *   refuse gets the same 400 here, so a client call that drifted from the
 *   contract fails in the test that makes it;
 * - the resolver's result against `response`. A handler or factory that
 *   answers a shape the contract does not allow throws, which MSW turns into a
 *   500 with the Zod issues in the log, because that is a bug in the test
 *   setup rather than in the code under test.
 *
 * The resolver receives the parsed body, so it never needs a cast, and
 * returns plain data; the helper wraps it in `HttpResponse.json`. A resolver
 * that has to answer something else (an error status, a binary body) returns
 * an `HttpResponse` itself, which is passed through unchecked.
 */
type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface Contract<Req extends z.ZodType | undefined, Res extends z.ZodType | undefined> {
  request?: Req;
  response?: Res;
}

type BodyOf<Req> = Req extends z.ZodType ? z.output<Req> : undefined;
type ResultOf<Res> = Res extends z.ZodType ? z.input<Res> : DefaultBodyType;

export interface ContractResolverInfo<Req> {
  params: PathParams;
  request: Request;
  body: BodyOf<Req>;
}

export type ContractResolver<Req, Res> = (
  info: ContractResolverInfo<Req>
) => ResultOf<Res> | Response | Promise<ResultOf<Res> | Response>;

/** The Zod issues as one readable line each, for the 400 body and the thrown error. */
export function describeIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`);
}

export function contractHandler<
  Req extends z.ZodType | undefined = undefined,
  Res extends z.ZodType | undefined = undefined,
>(method: Method, path: string, contract: Contract<Req, Res>, resolver: ContractResolver<Req, Res>) {
  return http[method](path, async ({ params, request }) => {
    let body: unknown = undefined;
    if (contract.request) {
      const raw: unknown = await request
        .clone()
        .json()
        .catch(() => undefined);
      const parsed = contract.request.safeParse(raw);
      if (!parsed.success) {
        return HttpResponse.json({ error: 'Validation failed', issues: describeIssues(parsed.error) }, { status: 400 });
      }
      body = parsed.data;
    }
    const result = await resolver({ params, request, body: body as BodyOf<Req> });
    if (result instanceof Response) return result;
    if (contract.response) {
      const checked = contract.response.safeParse(result);
      if (!checked.success) {
        throw new Error(
          `${method.toUpperCase()} ${path}: the mock answers a shape the @trek/shared contract does not allow:\n  ` +
            describeIssues(checked.error).join('\n  ')
        );
      }
    }
    return HttpResponse.json(result as DefaultBodyType);
  });
}
