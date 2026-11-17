/**
 * Whether a tool call's arguments are of the shape its JSON schema asks for, as far as
 * a blind call can get it wrong: a required argument missing, or a value of the wrong
 * kind, such as a number or a list written as text (#2967). Not a full validator: a
 * property without a plain `type` (a union, a reference) is taken as it comes, and
 * the tool still validates everything when it runs.
 */
export function argsFitSchema(args: Record<string, unknown>, schema: Record<string, unknown>): boolean {
  const properties = (schema.properties as Record<string, { type?: unknown }> | undefined) ?? {};
  const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];
  if (required.some((key) => args[key] === undefined)) return false;
  return Object.entries(args).every(([key, value]) => {
    const declared = properties[key]?.type;
    if (value === undefined || declared === undefined) return true;
    const types = Array.isArray(declared) ? declared : [declared];
    return types.some((type) => isOfType(value, type));
  });
}

function isOfType(value: unknown, type: unknown): boolean {
  switch (type) {
    case 'null':
      return value === null;
    case 'integer':
      return Number.isInteger(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'string':
    case 'boolean':
      return typeof value === type;
    default:
      return true;
  }
}
