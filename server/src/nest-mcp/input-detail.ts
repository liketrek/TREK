import type { ToolDetail, ToolOptions } from './types';

import { z, type ZodRawShape, type ZodType } from 'zod';

/**
 * Keeping `tools/list` small without loosening a tool.
 *
 * A few tools take a large structured argument (the operations of a book page,
 * a tour change, a transit itinerary) whose JSON schema alone runs to tens of
 * kilobytes, and every session pays for it before the first message. A tool
 * that declares `detail.fields` advertises a permissive stand-in for those
 * fields instead (`looseField`), and the registry parses the call against the
 * full shape before the handler runs, so what the handler receives is exactly
 * what it received before. The full schema, and any `detail.text` the tool
 * moved out of its description, are served as the help topic `tool/<name>`
 * (`get_help_page`), generated from the same Zod shape, so the reference can
 * never drift from what the tool accepts.
 */

export const TOOL_HELP_PREFIX = 'tool/';

export function toolHelpSlug(name: string): string {
  return `${TOOL_HELP_PREFIX}${name}`;
}

/** The sentence a detailed tool's description ends with. */
function toolHelpPointer(name: string): string {
  return `Full reference: get_help_page slug "${toolHelpSlug(name)}".`;
}

interface ZodDefView {
  type: string;
  innerType?: ZodType;
  element?: ZodType;
  options?: readonly ZodType[];
  discriminator?: string;
}

function defOf(schema: ZodType): ZodDefView {
  return (schema as unknown as { _zod: { def: ZodDefView } })._zod.def;
}

/** The literal values a union member takes for its discriminator, as zod records them on the object. */
function discriminatorValues(option: ZodType, key: string): string[] {
  const values = (option as unknown as { _zod: { propValues?: Record<string, Set<unknown>> } })._zod.propValues?.[key];
  return values ? [...values].filter((v): v is string => typeof v === 'string') : [];
}

function looseShape(schema: ZodType): ZodType {
  const def = defOf(schema);
  switch (def.type) {
    case 'optional':
    case 'default':
    case 'prefault':
      return looseShape(def.innerType as ZodType).optional();
    case 'nullable':
      return looseShape(def.innerType as ZodType).nullable();
    case 'array':
      return z.array(looseShape(def.element as ZodType));
    case 'union': {
      const key = def.discriminator;
      const values = key ? (def.options ?? []).flatMap((o) => discriminatorValues(o, key)) : [];
      if (key && values.length > 0) return z.looseObject({ [key]: z.enum(values as [string, ...string[]]) });
      return z.unknown();
    }
    case 'object':
      return z.looseObject({});
    case 'record':
      return z.record(z.string(), z.unknown());
    default:
      return schema;
  }
}

/**
 * A permissive stand-in for one field: the same nesting of arrays, optionals
 * and nullables, objects open, a discriminated union reduced to its
 * discriminator. Its description says where the full shape is.
 */
export function looseField(schema: ZodType, toolName: string): ZodType {
  const lead = schema.description ? `${schema.description} ` : '';
  return looseShape(schema).describe(`${lead}${toolHelpPointer(toolName)}`);
}

/** The shape a detailed tool advertises in tools/list. */
export function advertisedShape(shape: ZodRawShape, detail: ToolDetail, toolName: string): ZodRawShape {
  const fields = new Set(detail.fields ?? []);
  return Object.fromEntries(
    Object.entries(shape).map(([key, value]) => [
      key,
      fields.has(key) ? looseField(value as unknown as ZodType, toolName) : value,
    ]),
  );
}

/** The description a detailed tool advertises: its own, then the pointer to its reference. */
export function advertisedDescription(options: ToolOptions): string | undefined {
  if (!options.detail) return options.description;
  return [options.description, toolHelpPointer(options.name)].filter(Boolean).join(' ');
}

/** At most this many issues are spelled out when a call does not fit the full shape. */
const MAX_ISSUES = 5;

/** Why the arguments do not fit the full shape, in a line a model can act on. */
export function describeIssues(error: z.ZodError, toolName: string): string {
  const issues = error.issues.slice(0, MAX_ISSUES).map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : '(arguments)';
    return `${path}: ${issue.message}`;
  });
  const more = error.issues.length > MAX_ISSUES ? ` (and ${error.issues.length - MAX_ISSUES} more)` : '';
  return `Invalid arguments for ${toolName}: ${issues.join('; ')}${more}. ${toolHelpPointer(toolName)}`;
}

/** One detailed tool's reference, as the help topic renders it. */
export interface ToolHelpTopic {
  name: string;
  title: string;
  description: string;
  text?: string;
  inputSchema: unknown;
}

export function toolHelpTopic(options: ToolOptions): ToolHelpTopic {
  const shape = options.inputSchema as ZodRawShape | undefined;
  return {
    name: options.name,
    title: options.title ?? options.name,
    description: options.description ?? '',
    text: options.detail?.text,
    inputSchema: z.toJSONSchema(z.strictObject(shape ?? {}), { io: 'input', unrepresentable: 'any' }),
  };
}

/** The help topic as markdown, the way get_help_page hands out the bundled pages. */
export function renderToolHelp(topic: ToolHelpTopic): string {
  const parts = [`# ${topic.title}`, `Tool \`${topic.name}\`.`, topic.description];
  if (topic.text) parts.push(topic.text);
  parts.push('## Input schema', '```json\n' + JSON.stringify(topic.inputSchema, null, 2) + '\n```');
  return parts.filter(Boolean).join('\n\n');
}
