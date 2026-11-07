/*
 * The rules behind `npm run lint:mcp-surface` (scripts/mcp-surface.mjs), kept
 * apart from the measuring so the unit tests can feed them numbers.
 *
 * A measurement is { sessions: { <name>: { tools, bytes, names } }, tools: { <name>: bytes }, outputs: { <name>: bytes } }:
 * what `tools/list` answered for each reference session and every tool's own
 * JSON size, both without `outputSchema` and `_meta` (contracts for the host
 * and the widget, measured apart in `outputs`). The baseline holds { sessions: { <name>: { tools, bytes, tokens } }, tools: { <name>: bytes } }.
 *
 *   - a tool held by the baseline may not grow;
 *   - a tool the baseline does not hold yet (a new tool) may not pass
 *     NEW_TOOL_MAX_BYTES; the next --update records it at its size;
 *   - a session's bytes, leaving out the new tools it lists, may not pass its
 *     entry, so moving an existing tool into a session counts against it;
 *   - a tool's `outputSchema` may not pass OUTPUT_SCHEMA_MAX_BYTES;
 *   - an entry above what is measured now, or for a tool that is gone, fails as
 *     well, so a shrink lands together with the lowered baseline.
 *
 * --update writes the measured numbers for everything held (never above an
 * entry), records new tools and drops the gone ones.
 */

/** The most a tool the baseline does not hold yet may weigh in tools/list, in bytes. */
export const NEW_TOOL_MAX_BYTES = 4096;

/** The most a tool's outputSchema may weigh in tools/list, in bytes. */
export const OUTPUT_SCHEMA_MAX_BYTES = 4096;

/** The rough bytes of JSON per model token the token estimates divide by. */
const BYTES_PER_TOKEN = 4;

/** @returns {{ problems: string[], stale: string[] }} */
export function compareSurface(measured, baseline) {
  const problems = [];
  const stale = [];
  const held = baseline.tools ?? {};
  const isNew = (name) => held[name] === undefined;

  for (const [name, bytes] of Object.entries(measured.tools)) {
    if (isNew(name)) {
      if (bytes > NEW_TOOL_MAX_BYTES) {
        problems.push(`new tool ${name} weighs ${bytes} bytes in tools/list, above the ${NEW_TOOL_MAX_BYTES} cap`);
      }
    } else if (bytes > held[name]) {
      problems.push(`tool ${name} grew from ${held[name]} to ${bytes} bytes`);
    } else if (bytes < held[name]) {
      stale.push(`tool ${name} is ${bytes} bytes now, its entry says ${held[name]}`);
    }
  }
  for (const name of Object.keys(held)) {
    if (measured.tools[name] === undefined) stale.push(`tool ${name} is gone, its entry is not`);
  }
  for (const [name, bytes] of Object.entries(measured.outputs ?? {})) {
    if (bytes > OUTPUT_SCHEMA_MAX_BYTES) {
      problems.push(`tool ${name} has an outputSchema of ${bytes} bytes, above the ${OUTPUT_SCHEMA_MAX_BYTES} cap`);
    }
  }

  for (const [name, session] of Object.entries(measured.sessions)) {
    const entry = baseline.sessions?.[name];
    if (!entry) {
      problems.push(`session ${name} has no baseline entry`);
      continue;
    }
    const newBytes = session.names.filter(isNew).reduce((sum, tool) => sum + (measured.tools[tool] ?? 0), 0);
    const comparable = session.bytes - newBytes;
    if (comparable > entry.bytes) {
      problems.push(
        `session ${name} lists ${comparable} bytes of existing tools, above its ${entry.bytes}` +
          (newBytes ? ` (${newBytes} more come from new tools)` : ''),
      );
    } else if (comparable < entry.bytes) {
      stale.push(`session ${name} is ${comparable} bytes of existing tools now, its entry says ${entry.bytes}`);
    }
  }
  return { problems, stale };
}

/** The baseline --update writes: never above an entry, new tools recorded, gone ones dropped. */
export function updatedBaseline(measured, baseline) {
  const tools = {};
  for (const [name, bytes] of Object.entries(measured.tools).sort(([a], [b]) => (a < b ? -1 : 1))) {
    const entry = baseline.tools?.[name];
    tools[name] = entry === undefined ? bytes : Math.min(entry, bytes);
  }
  const sessions = {};
  for (const [name, session] of Object.entries(measured.sessions)) {
    const entry = baseline.sessions?.[name];
    // New tools are recorded together with the session that lists them, so the
    // next run holds the session at what it lists now, never above the old entry
    // plus those tools.
    const newBytes = session.names
      .filter((tool) => baseline.tools?.[tool] === undefined)
      .reduce((sum, tool) => sum + (measured.tools[tool] ?? 0), 0);
    const bytes = entry === undefined ? session.bytes : Math.min(entry.bytes + newBytes, session.bytes);
    sessions[name] = { tools: session.tools, bytes, tokens: Math.round(bytes / BYTES_PER_TOKEN) };
  }
  return { sessions, tools };
}

/** One line per session, for the run's output and the PR description. */
export function describeSessions(measured) {
  return Object.entries(measured.sessions).map(
    ([name, s]) =>
      `${name.padEnd(9)} ${String(s.tools).padStart(4)} tools ${String(s.bytes).padStart(8)} bytes ` +
      `≈${Math.round(s.bytes / BYTES_PER_TOKEN)} tokens`,
  );
}
