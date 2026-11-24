/**
 * The text pass for Rule 1c of `generate-entities.ts` (the flag columns in
 * `BOOLEAN_COLUMNS`, rendered as `p.type(IntegerFlagType)`), kept in a file of
 * its own because the generator is at its size baseline.
 *
 * The renderer gives such a column's class field the type
 * `IType<boolean, number>`: it sees a boolean runtime type over a number
 * column and marks it ambiguous. The entity's field is a plain boolean
 * (`IntegerFlagType` converts on the way in and out), so the wrapper is taken
 * off here, as `fixJsonClassFieldTypes` does for a JSON column. A field that
 * already reads `boolean` is left alone; any other shape fails, naming it.
 */

/** A property Rule 1c retyped: its entity class and its name. */
interface FlagFixup {
  className: string;
  propName: string;
}

export function fixFlagClassFieldTypes(source: string, fixups: readonly FlagFixup[]): string {
  let result = source;
  for (const { className, propName } of fixups) {
    const name = propName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const field = new RegExp(`^([ \\t]*${name}[?!]?: )(?:IType<boolean\\s*,\\s*number>|boolean)(.*)$`, 'm');
    const match = field.exec(result);
    if (!match) {
      throw new Error(
        `generate-entities: fixFlagClassFieldTypes found no class field for "${className}.${propName}" ` +
          'typed IType<boolean, number> to simplify; check the renderer shape.',
      );
    }
    result = result.slice(0, match.index) + `${match[1]}boolean${match[2]}` + result.slice(match.index + match[0].length);
  }
  return result;
}
