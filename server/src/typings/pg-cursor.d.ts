// `pg-cursor` ships no type definitions. These are the parts the Postgres
// plugin data store uses (`db/engine/postgres/plugin-data-store.ts`): a cursor
// is handed to a `pg` client's `query`, which submits it over the extended
// query protocol, and is then read a number of rows at a time.

declare module 'pg-cursor' {
  export default class Cursor {
    constructor(text: string, values?: unknown[]);
    /** The next `rows` rows, or none once the statement has returned them all. */
    read(rows: number): Promise<unknown[]>;
    /** Closes the portal; safe after the last read and after an error. */
    close(): Promise<void>;
  }
}
