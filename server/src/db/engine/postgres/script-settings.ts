import { Transform } from 'node:stream';

/**
 * The settings a newer pg_restore writes at the start of every script, with
 * the first server major that knows each. pg_restore 17 and later set
 * `transaction_timeout` whatever server the script is for.
 */
const SETTING_SINCE: Readonly<Record<string, number>> = { transaction_timeout: 17 };

/** A line of the settings block before the script's first object: blank, a comment, a psql command or a setting. */
const PREAMBLE_LINE = /^(?:$|--|\\|SET |SELECT pg_catalog\.set_config\()/;

const SET_LINE = /^SET (\w+) = /;

/**
 * Leaves out the `SET` lines of a restore script's settings block that a
 * server of major `serverMajor` does not know, so psql under ON_ERROR_STOP does
 * not refuse the whole script on its first lines. Only the lines before the
 * first object are looked at; from there on every chunk passes as it comes,
 * so a script's COPY data is never split into lines.
 */
export function withoutUnknownSettings(serverMajor: number): Transform {
  const unknown = new Set(
    Object.entries(SETTING_SINCE)
      .filter(([, since]) => serverMajor < since)
      .map(([name]) => name),
  );
  let inPreamble = unknown.size > 0;
  let pending = Buffer.alloc(0);

  const dropped = (line: string): boolean => unknown.has(SET_LINE.exec(line)?.[1] ?? '');

  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      if (!inPreamble) {
        callback(null, chunk);
        return;
      }
      pending = Buffer.concat([pending, chunk]);
      const kept: Buffer[] = [];
      let start = 0;
      for (let end = pending.indexOf(0x0a, start); end >= 0; end = pending.indexOf(0x0a, start)) {
        const line = pending.toString('utf8', start, end).replace(/\r$/, '');
        if (!PREAMBLE_LINE.test(line)) {
          inPreamble = false;
          break;
        }
        if (!dropped(line)) kept.push(pending.subarray(start, end + 1));
        start = end + 1;
      }
      const rest = pending.subarray(start);
      if (inPreamble) {
        pending = Buffer.from(rest);
      } else {
        kept.push(rest);
        pending = Buffer.alloc(0);
      }
      callback(null, Buffer.concat(kept));
    },
    flush(callback) {
      const last = pending.toString('utf8');
      callback(null, inPreamble && dropped(last) ? Buffer.alloc(0) : pending);
    },
  });
}
