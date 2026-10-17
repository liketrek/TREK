/**
 * Which repository methods the Postgres probe calls, and with what.
 *
 * The probe has no fixtures: it reads every repository class with the
 * TypeScript checker and builds one sample argument list per public method
 * from the declared parameter types (a number is 1, a string is "probe" or a
 * date-shaped string when the name says so, an object gets every property
 * it can sample, an array one element). The values only have to get the
 * method to send its SQL; what the probe measures is whether Postgres
 * accepts that SQL against an empty schema. A sample the column cannot take
 * (a name-shaped string in a date column) is a data error, which the
 * ratchet does not hold (pg-probe/baseline.ts). A parameter the sampler
 * cannot build (a callback, an EntityManager, an entity instance) makes the
 * method unprobeable: the report lists it instead of guessing, and the
 * baseline's `uncovered` list must name it, so a new one fails the run.
 */
import path from 'node:path';
import ts from 'typescript';

export type Sample = { ok: true; value: unknown } | { ok: false; reason: string };

export type MethodPlan =
  | { className: string; file: string; method: string; args: unknown[] }
  | { className: string; file: string; method: string; unprobeable: string };

const MAX_DEPTH = 4;
const SAMPLE_DATE = '2026-01-01';
const SAMPLE_TIMESTAMP = '2026-01-01 00:00:00';

/** A string sample shaped by the parameter or property name it is for. */
export function sampleString(name: string): string {
  const lower = name.toLowerCase();
  if (/(^|_)(date|day)$|date$/.test(lower) || /^(start|end|from|to)$/.test(lower)) return SAMPLE_DATE;
  if (/(_at|time|timestamp)$/.test(lower) || /At$/.test(name)) return SAMPLE_TIMESTAMP;
  if (lower.includes('email')) return 'probe@example.com';
  if (/(url|uri|href)$/.test(lower)) return 'https://example.com/probe';
  if (/colou?r$/.test(lower)) return '#000000';
  if (/(^|_)ids?$|Ids?$/.test(name)) return '1';
  return 'probe';
}

const OK = (value: unknown): Sample => ({ ok: true, value });
const NO = (reason: string): Sample => ({ ok: false, reason });

/** Why a sample failed (the server's non-strict config does not narrow `ok: false`). */
function reasonOf(sample: Sample): string {
  return 'reason' in sample ? sample.reason : '';
}

function isNullish(type: ts.Type): boolean {
  return (type.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void)) !== 0;
}

function declaredInNodeModules(symbol: ts.Symbol | undefined): boolean {
  const declarations = symbol?.getDeclarations() ?? [];
  return declarations.length > 0 && declarations.every((d) => d.getSourceFile().fileName.includes('/node_modules/'));
}

/** Builds a sample value for `type`; `name` is the parameter or property it is for. */
export function sampleFor(checker: ts.TypeChecker, type: ts.Type, name: string, depth = 0): Sample {
  if (depth > MAX_DEPTH) return NO(`${name}: nested deeper than ${MAX_DEPTH}`);
  const flags = type.flags;
  if (flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return OK(sampleString(name));
  if (flags & ts.TypeFlags.TypeParameter) {
    const constraint = checker.getBaseConstraintOfType(type);
    return constraint && constraint !== type ? sampleFor(checker, constraint, name, depth + 1) : OK(sampleString(name));
  }
  if (type.isUnion()) {
    const members = type.types.filter((member) => !isNullish(member));
    if (members.length === 0) return OK(null);
    if (members.every((member) => member.flags & ts.TypeFlags.BooleanLiteral)) return OK(false);
    const numeric = members.find((member) => member.flags & ts.TypeFlags.NumberLike);
    return sampleFor(checker, numeric ?? members[0]!, name, depth + 1);
  }
  if (type.isStringLiteral()) return OK(type.value);
  if (type.isNumberLiteral()) return OK(type.value);
  if (flags & ts.TypeFlags.BooleanLiteral) return OK(checker.typeToString(type) === 'true');
  if (flags & ts.TypeFlags.BooleanLike) return OK(false);
  if (flags & ts.TypeFlags.BigIntLike) return OK(BigInt(1));
  if (flags & ts.TypeFlags.NumberLike) return OK(1);
  if (flags & (ts.TypeFlags.StringLike | ts.TypeFlags.TemplateLiteral)) return OK(sampleString(name));
  if (isNullish(type)) return OK(null);
  if (type.isIntersection()) return sampleObject(checker, type, name, depth);
  if (flags & ts.TypeFlags.Object) return sampleObjectType(checker, type as ts.ObjectType, name, depth);
  return NO(`${name}: no sample for ${checker.typeToString(type)}`);
}

function sampleObjectType(checker: ts.TypeChecker, type: ts.ObjectType, name: string, depth: number): Sample {
  if (checker.isTupleType(type)) {
    const values: unknown[] = [];
    for (const [i, element] of checker.getTypeArguments(type as ts.TypeReference).entries()) {
      const sample = sampleFor(checker, element, `${name}[${i}]`, depth + 1);
      if (!sample.ok) return sample;
      values.push(sample.value);
    }
    return OK(values);
  }
  if (checker.isArrayType(type)) {
    const element = checker.getTypeArguments(type as ts.TypeReference)[0];
    if (!element) return OK([]);
    const sample = sampleFor(checker, element, singular(name), depth + 1);
    return sample.ok ? OK([sample.value]) : sample;
  }
  const symbolName = type.getSymbol()?.getName();
  if (symbolName === 'Date') return OK(new Date(`${SAMPLE_DATE}T00:00:00Z`));
  if (symbolName === 'Buffer' || symbolName === 'Uint8Array') return OK(Buffer.from('probe'));
  if (symbolName === 'Set' || symbolName === 'ReadonlySet' || symbolName === 'Map' || symbolName === 'ReadonlyMap') {
    return sampleCollection(checker, type, symbolName, name, depth);
  }
  if (type.getCallSignatures().length > 0) return NO(`${name}: a function parameter`);
  if (symbolName === 'Promise') return NO(`${name}: a promise parameter`);
  const symbol = type.getSymbol();
  if (symbol && symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface) && declaredInNodeModules(symbol)) {
    return NO(`${name}: a ${symbolName} parameter`);
  }
  return sampleObject(checker, type, name, depth);
}

function sampleCollection(
  checker: ts.TypeChecker,
  type: ts.ObjectType,
  kind: string,
  name: string,
  depth: number,
): Sample {
  const args = checker.getTypeArguments(type as ts.TypeReference);
  const samples = args.map((arg, i) => sampleFor(checker, arg, i === 0 ? singular(name) : name, depth + 1));
  const failed = samples.find((sample) => !sample.ok);
  if (failed) return failed;
  const values = samples.map((sample) => (sample.ok ? sample.value : undefined));
  if (kind.endsWith('Set')) return OK(new Set([values[0]]));
  return OK(new Map([[values[0], values[1]]]));
}

function sampleObject(checker: ts.TypeChecker, type: ts.Type, name: string, depth: number): Sample {
  const value: Record<string, unknown> = {};
  for (const property of checker.getPropertiesOfType(type)) {
    const propertyType = checker.getTypeOfSymbol(property);
    if (propertyType.getCallSignatures().length > 0) continue;
    const optional = (property.flags & ts.SymbolFlags.Optional) !== 0;
    const sample = sampleFor(checker, propertyType, property.getName(), depth + 1);
    if (sample.ok) value[property.getName()] = sample.value;
    else if (!optional) return NO(`${name}.${reasonOf(sample)}`);
  }
  return OK(value);
}

function singular(name: string): string {
  return name.endsWith('s') ? name.slice(0, -1) : name;
}

function isPublicMethod(member: ts.ClassElement): member is ts.MethodDeclaration {
  if (!ts.isMethodDeclaration(member) || !member.body || !ts.isIdentifier(member.name)) return false;
  const modifiers = ts.getCombinedModifierFlags(member);
  return (modifiers & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected | ts.ModifierFlags.Static)) === 0;
}

/** The sample argument list for one method, or why there is none. */
export function planMethod(
  checker: ts.TypeChecker,
  method: ts.MethodDeclaration,
): { args: unknown[] } | { unprobeable: string } {
  const args: unknown[] = [];
  for (const parameter of method.parameters) {
    const name = ts.isIdentifier(parameter.name) ? parameter.name.text : 'options';
    const optional = parameter.questionToken !== undefined || parameter.initializer !== undefined;
    const sample = sampleFor(checker, checker.getTypeAtLocation(parameter), name);
    if (!sample.ok) {
      if (optional || parameter.dotDotDotToken) break;
      return { unprobeable: reasonOf(sample) };
    }
    if (parameter.dotDotDotToken && Array.isArray(sample.value)) args.push(...(sample.value as unknown[]));
    else args.push(sample.value);
  }
  return { args };
}

/** Every public method of every exported class declared in `files`, with its sample arguments. */
export function planRepositories(
  files: readonly string[],
  compilerOptions: ts.CompilerOptions,
  root: string,
): MethodPlan[] {
  const program = ts.createProgram({ rootNames: [...files], options: { ...compilerOptions, noEmit: true } });
  const checker = program.getTypeChecker();
  const wanted = new Set(files.map((file) => path.resolve(file)));
  const plans: MethodPlan[] = [];
  for (const sourceFile of program.getSourceFiles()) {
    if (!wanted.has(path.resolve(sourceFile.fileName))) continue;
    const file = path.relative(root, sourceFile.fileName).split(path.sep).join('/');
    for (const statement of sourceFile.statements) {
      if (!ts.isClassDeclaration(statement) || !statement.name) continue;
      if (!(ts.getCombinedModifierFlags(statement) & ts.ModifierFlags.Export)) continue;
      if (ts.getCombinedModifierFlags(statement) & ts.ModifierFlags.Abstract) continue;
      const className = statement.name.text;
      for (const member of statement.members) {
        if (!isPublicMethod(member)) continue;
        const method = (member.name as ts.Identifier).text;
        const plan = planMethod(checker, member);
        plans.push(
          'args' in plan
            ? { className, file, method, args: plan.args }
            : { className, file, method, unprobeable: plan.unprobeable },
        );
      }
    }
  }
  return plans.sort((a, b) => `${a.className}.${a.method}`.localeCompare(`${b.className}.${b.method}`));
}

/** The compiler options of a tsconfig file, as `tsc -p` would read them. */
export function readCompilerOptions(tsconfigPath: string): ts.CompilerOptions {
  const read = ts.readConfigFile(tsconfigPath, (file) => ts.sys.readFile(file));
  if (read.error) throw new Error(ts.flattenDiagnosticMessageText(read.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, path.dirname(tsconfigPath));
  return parsed.options;
}
