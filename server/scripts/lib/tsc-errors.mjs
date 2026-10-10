/*
 * Reading tsc's --pretty false output for lint:strict (scripts/strict-lint.mjs).
 * Kept free of imports so the unit tests can load it on their own.
 */

/** `src/a.ts(3,7): error TS2322: ...` as tsc --pretty false prints it. */
const FILE_ERROR = /^(.+?)\((\d+),(\d+)\): error (TS\d+): /;
/** An error tied to no file, such as a config problem. */
const GLOBAL_ERROR = /^error (TS\d+): /;

/**
 * The errors per file in tsc's output, keyed by the path from the server root
 * with forward slashes, and the lines of every error that names no file.
 * Continuation lines (indented) belong to the error above and do not count.
 */
export function countErrors(output) {
  const counts = {};
  const global = [];
  for (const line of output.replace(/\r\n?/g, '\n').split('\n')) {
    const match = FILE_ERROR.exec(line);
    if (match) {
      const key = match[1].split('\\').join('/').replace(/^\.\//, '');
      counts[key] = (counts[key] ?? 0) + 1;
    } else if (GLOBAL_ERROR.test(line)) {
      global.push(line);
    }
  }
  return { counts, global };
}
