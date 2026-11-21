import { toRowId } from './row-id';
import { HttpException, Injectable, type PipeTransform } from '@nestjs/common';

/** What a route answers for a path id that names no row: its own status and error text. */
interface RowIdRefusal {
  status: number;
  error: string;
}

/**
 * Parses a route's row id param with `toRowId` before the handler sees it, and
 * answers a spelling it refuses the way the route answers an id that names no
 * row. `Number(id)` read '0x1', '1e0', '1.0' and '+1' as row 1 and 'abc' as
 * NaN, which Postgres refuses with an error while SQLite matches nothing; a
 * string handed on unparsed reached SQL, where Postgres 14 and 15 refuse the
 * cast and 16 and later read hex and underscores as a number. Through this pipe
 * every such spelling gets the same answer on every engine, and the handler
 * receives a number.
 *
 * `tests/e2e/route-row-ids.e2e.test.ts` sends those spellings to every route.
 */
@Injectable()
class RowIdPipe implements PipeTransform<unknown, number> {
  constructor(private readonly refusal: RowIdRefusal) {}

  transform(value: unknown): number {
    const id = toRowId(value);
    if (id === null) throw new HttpException({ error: this.refusal.error }, this.refusal.status);
    return id;
  }
}

/** `@Param('id', rowId('Journey not found')) id: number`: the route's not-found answer for a malformed id. */
export function rowId(error: string, status = 404): RowIdPipe {
  return new RowIdPipe({ status, error });
}

/**
 * In place of Nest's `ParseIntPipe`, which reads '-1', '-0' and a number past
 * 2^53 as integers, and Postgres refuses the last as out of range: its 400 and
 * message, with `toRowId`'s parse. `@Param('id', ParseRowIdPipe) id: number`.
 */
@Injectable()
export class ParseRowIdPipe extends RowIdPipe {
  constructor() {
    super({ status: 400, error: 'Validation failed (numeric string is expected)' });
  }
}

/**
 * The same parse for a whole number in the path that is not a row id but is
 * compared with an integer column all the same (a year, a day number):
 * `@Param('year', intParam('Invalid year', 400)) year: number`.
 */
export function intParam(error: string, status = 400): RowIdPipe {
  return new RowIdPipe({ status, error });
}
