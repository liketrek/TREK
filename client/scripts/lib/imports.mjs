/*
 * The imports of a source file, read from its syntax tree rather than with a
 * regular expression, so an import split over lines, a dynamic import() and a
 * re-export count, and an import inside a comment or a string does not.
 */
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { listFiles, readText, TEST_FILE, toKey } from './ratchet.mjs';

const bindingsAreTypes = (elements) => elements.length > 0 && elements.every((el) => el.isTypeOnly);

/**
 * Every module the file names, with the line it is named on and whether the
 * import only brings in types (erased from the bundle, so no runtime path).
 */
export function importsOf(source, file) {
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const found = [];
  const add = (node, literal, typeOnly) => {
    if (!literal || !ts.isStringLiteralLike(literal)) return;
    found.push({
      specifier: literal.text,
      line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
      typeOnly,
    });
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      const named =
        clause?.namedBindings && ts.isNamedImports(clause.namedBindings) ? clause.namedBindings.elements : null;
      const typeOnly = Boolean(clause && (clause.isTypeOnly || (!clause.name && named && bindingsAreTypes(named))));
      add(node, node.moduleSpecifier, typeOnly);
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      const named = node.exportClause && ts.isNamedExports(node.exportClause) ? node.exportClause.elements : null;
      add(node, node.moduleSpecifier, node.isTypeOnly || Boolean(named && bindingsAreTypes(named)));
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      add(node, node.moduleReference.expression, node.isTypeOnly);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      add(node, node.argument.literal, true);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      add(node, node.arguments[0], false);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

/**
 * The layer of a path from src/: its top directory ("components", "api"), or,
 * for a file directly in src/, its name without the extension. src/types.ts
 * is then the layer "types" both when it imports and when it is imported as
 * '../types', and its rules are those of the src/types/ directory.
 */
export function layerOfPath(fromSrc) {
  const [top, ...rest] = fromSrc.split('/');
  return rest.length ? top : top.replace(/(\.d)?\.[cm]?[jt]sx?$/, '');
}

/**
 * The layer a relative import lands in (see layerOfPath), or null for a
 * package or a path outside src/.
 */
export function layerOf(srcRoot, fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const target = relative(srcRoot, resolve(dirname(fromFile), specifier))
    .split('\\')
    .join('/');
  if (!target || target.startsWith('..')) return null;
  return layerOfPath(target);
}

/** Every source file under root/src outside the tests, with its key, its layer and its imports resolved to layers. */
export function sourceGraph(root) {
  const src = join(root, 'src');
  return listFiles(root, ['src'], (key) => /\.tsx?$/.test(key) && !TEST_FILE.test(key)).map((path) => ({
    key: toKey(root, path),
    layer: layerOfPath(toKey(src, path)),
    imports: importsOf(readText(path), path).map((imp) => ({ ...imp, layer: layerOf(src, path, imp.specifier) })),
  }));
}
