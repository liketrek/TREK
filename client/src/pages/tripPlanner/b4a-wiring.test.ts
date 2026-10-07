import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import * as ts from 'typescript'
import { test, vi } from 'vitest'

vi.mock('../../../../server/src/config', () => { throw new Error('Config initialization is forbidden in static tests') })
vi.mock('../../../../server/src/db/database', () => { throw new Error('Legacy database imports are forbidden in static tests') })
vi.mock('../../../../server/src/nest/database/database.service', () => { throw new Error('Database service imports are forbidden in static tests') })
vi.mock('better-sqlite3', () => { throw new Error('SQLite imports are forbidden in static tests') })

const pagePath = 'client/src/pages/TripPlannerPage.tsx'
const hookPath = 'client/src/pages/tripPlanner/useTripPlanner.ts'
const pageControllerPath = 'client/src/pages/tripPlanner/useTripPlannerPage.ts'
const pageText = readFileSync(resolve(process.cwd(), 'src/pages/TripPlannerPage.tsx'), 'utf8')
const hookText = readFileSync(resolve(process.cwd(), 'src/pages/tripPlanner/useTripPlanner.ts'), 'utf8')
const pageControllerText = readFileSync(resolve(process.cwd(), 'src/pages/tripPlanner/useTripPlannerPage.ts'), 'utf8')
const parse = (file: string, text: string) => ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
const page = parse(pagePath, pageText)
const hook = parse(hookPath, hookText)
const pageController = parse(pageControllerPath, pageControllerText)

function collect(source: ts.Node, predicate: (node: ts.Node) => boolean): ts.Node[] {
  const matches: ts.Node[] = []
  function visit(node: ts.Node) {
    if (predicate(node)) matches.push(node)
    ts.forEachChild(node, visit)
  }
  visit(source)
  return matches
}

function initializer(source: ts.SourceFile, name: string): ts.Expression {
  const declaration = collect(source, node => ts.isVariableDeclaration(node)
    && ts.isIdentifier(node.name) && node.name.text === name)[0]
  assert.ok(declaration && ts.isVariableDeclaration(declaration) && declaration.initializer, name)
  return declaration.initializer
}

function callNamed(source: ts.SourceFile, name: string): ts.CallExpression | undefined {
  const call = collect(source, node => ts.isCallExpression(node)
    && ts.isIdentifier(node.expression) && node.expression.text === name)[0]
  return call && ts.isCallExpression(call) ? call : undefined
}

function propertyValue(object: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  const property = object.properties.find(item => ts.isPropertyAssignment(item)
    && (ts.isIdentifier(item.name) || ts.isStringLiteral(item.name)) && item.name.text === name)
  return property && ts.isPropertyAssignment(property) ? property.initializer : undefined
}

function mobileSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return mobileSourceFiles(path)
    return /\.tsx?$/.test(entry.name) ? [path] : []
  })
}

function jsxTags(source: ts.SourceFile, name: string): (ts.JsxOpeningElement | ts.JsxSelfClosingElement)[] {
  return collect(source, node => (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node))
    && node.tagName.getText(source) === name)
    .filter((node): node is ts.JsxOpeningElement | ts.JsxSelfClosingElement =>
      ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node))
}

test('B4A Core testability debt: verify source without importing the page, hook, config, or database', () => {
  for (const source of [page, hook, pageController]) {
    const diagnostics = ts.transpileModule(source.text, {
      fileName: source.fileName,
      reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022 },
    }).diagnostics ?? []
    assert.equal(diagnostics.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error).length, 0, source.fileName)
    assert.doesNotMatch(source.text, /^(<<<<<<<|=======|>>>>>>>)/m)
  }
  assert.doesNotMatch(pageText, /\bnarrowPanels\b/)
  const self = parse('b4a-wiring.test.ts', readFileSync(resolve(process.cwd(), 'src/pages/tripPlanner/b4a-wiring.test.ts'), 'utf8'))
  const imports = collect(self, ts.isImportDeclaration).map(node => {
    assert.ok(ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier))
    return node.moduleSpecifier.text
  })
  assert.deepEqual(imports, ['node:assert/strict', 'node:fs', 'node:path', 'typescript', 'vitest'])
  assert.equal(collect(self, node => ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword).length, 0)
})

test('B4A Tours tab is readable, desktop-only, and absent with addon OFF', () => {
  const tabs = initializer(hook, 'TRIP_TABS')
  const branches = collect(tabs, node => ts.isConditionalExpression(node)
    && node.whenTrue.getText(hook).includes("id: 'tour-planner'"))
  assert.equal(branches.length, 1)
  const branch = branches[0]
  assert.ok(ts.isConditionalExpression(branch))
  assert.equal(branch.condition.getText(hook), 'enabledAddons.tours && !isMobile')
  assert.equal(branch.whenFalse.getText(hook), '[]')
  assert.match(branch.whenTrue.getText(hook), /desktopOnly: true/)
  assert.doesNotMatch(tabs.getText(hook), /\bcan\b|canPlaceEdit|canDayEdit/)
  assert.match(hookText, /!validTabIds\.includes\(activeTab\)[\s\S]*?setActiveTab\('plan'\)/)
  assert.match(pageText, /activeTab === 'tour-planner' && enabledAddons\.tours && !isMobile/)
})

test('B4A selectedTour is derived only from explicit place selection and addon state', () => {
  const selection = initializer(hook, 'selectedTour')
  assert.ok(ts.isConditionalExpression(selection))
  assert.equal(selection.condition.getText(hook), 'toursEnabled && selectedPlaceId')
  assert.match(selection.whenTrue.getText(hook), /^tours\.find\(\w+ => \w+\.place_id === selectedPlaceId\) \?\? null$/)
  assert.equal(selection.whenFalse.kind, ts.SyntaxKind.NullKeyword)
})

test('B4A desktop page delegates Tours state and permissions to its page hook', () => {
  const pageHookImport = collect(page, node => ts.isImportDeclaration(node)
    && ts.isStringLiteral(node.moduleSpecifier)
    && node.moduleSpecifier.text === './tripPlanner/useTripPlannerPage')[0]
  assert.ok(pageHookImport && ts.isImportDeclaration(pageHookImport))
  const importedBindings = pageHookImport.importClause?.namedBindings
  assert.ok(importedBindings && ts.isNamedImports(importedBindings)
    && importedBindings.elements.some(element => element.name.text === 'useTripPlannerPage'))

  const desktop = collect(page, node => ts.isFunctionDeclaration(node)
    && node.name?.text === 'TripPlannerPageDesktop')[0]
  assert.ok(desktop)
  const pageHookCall = collect(desktop, node => ts.isCallExpression(node)
    && ts.isIdentifier(node.expression) && node.expression.text === 'useTripPlannerPage')[0]
  assert.ok(pageHookCall)

  assert.ok(callNamed(pageController, 'useTourPlanner'))
  const mobileFiles = mobileSourceFiles(resolve(process.cwd(), 'src/mobile'))
  for (const file of mobileFiles) {
    const mobileSource = parse(file, readFileSync(file, 'utf8'))
    const importsDesktopHook = collect(mobileSource, ts.isImportDeclaration).some(node => {
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) return false
      const modulePath = node.moduleSpecifier.text
      const namedImport = node.importClause?.namedBindings
      return /(?:^|\/)useTripPlannerPage(?:\.tsx?)?$/.test(modulePath)
        || (namedImport && ts.isNamedImports(namedImport)
          && namedImport.elements.some(element => element.name.text === 'useTripPlannerPage'))
    })
    assert.equal(importsDesktopHook, false, file)
  }

  const permissions = initializer(pageController, 'canPlaceEdit')
  const permissionCalls = collect(pageController, node => ts.isCallExpression(node)
    && ts.isIdentifier(node.expression) && node.expression.text === 'can')
  for (const action of ['place_edit', 'day_edit']) {
    assert.ok(permissionCalls.some(node => ts.isCallExpression(node)
      && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === action
      && ts.isIdentifier(node.arguments[1]) && node.arguments[1].text === 'trip'))
  }
  assert.ok(ts.isCallExpression(permissions) && ts.isIdentifier(permissions.expression)
    && permissions.expression.text === 'can')

  const tourPlannerCall = callNamed(pageController, 'useTourPlanner')
  assert.ok(tourPlannerCall && ts.isObjectLiteralExpression(tourPlannerCall.arguments[0]))
  const tourPlannerOptions = tourPlannerCall.arguments[0]
  assert.equal(propertyValue(tourPlannerOptions, 'canEdit')?.getText(pageController), 'canPlaceEdit')
  assert.equal(propertyValue(tourPlannerOptions, 'canAssign')?.getText(pageController), 'canDayEdit')

  const returnedViewModel = collect(pageController, node => ts.isReturnStatement(node)
    && !!node.expression && ts.isObjectLiteralExpression(node.expression))
    .find((node): node is ts.ReturnStatement => ts.isReturnStatement(node))?.expression
  assert.ok(returnedViewModel && ts.isObjectLiteralExpression(returnedViewModel))
  const returnedPermissions = propertyValue(returnedViewModel, 'permissions')
  assert.ok(returnedPermissions && ts.isObjectLiteralExpression(returnedPermissions))
  assert.ok(returnedPermissions.properties.some(property => ts.isShorthandPropertyAssignment(property)
    && property.name.text === 'canPlaceEdit'))
  assert.ok(returnedPermissions.properties.some(property => ts.isShorthandPropertyAssignment(property)
    && property.name.text === 'canDayEdit'))

  for (const name of ['TourPlannerRail', 'TourPlannerToursRail', 'ToursSidebar', 'TourDetailDialog']) {
    const tags = jsxTags(page, name)
    assert.equal(tags.length, name === 'TourDetailDialog' ? 2 : 1)
    for (const tag of tags) {
      const canEdit = tag.attributes.properties.find(property => ts.isJsxAttribute(property)
        && property.name.getText(page) === 'canEdit')
      const canAssign = tag.attributes.properties.find(property => ts.isJsxAttribute(property)
        && property.name.getText(page) === 'canAssign')
      assert.ok(canEdit && ts.isJsxAttribute(canEdit) && canEdit.initializer
        && ts.isJsxExpression(canEdit.initializer) && canEdit.initializer.expression?.getText(page) === 'canPlaceEdit')
      assert.ok(canAssign && ts.isJsxAttribute(canAssign) && canAssign.initializer
        && ts.isJsxExpression(canAssign.initializer) && canAssign.initializer.expression?.getText(page) === 'canDayEdit')
    }
  }

  const mapClickGate = collect(page, node => ts.isJsxAttribute(node)
    && node.name.getText(page) === 'onMapClick'
    && node.initializer && ts.isJsxExpression(node.initializer)
    && !!node.initializer.expression && node.initializer.expression.getText(page).includes('canPlaceEdit'))
  assert.ok(mapClickGate.length > 0)
})

test('B4A dedicated desktop controller retains GPX, draft, focus, and saved rail wiring', () => {
  assert.ok(callNamed(pageController, 'useTourPlanner'))
  assert.ok(pageText.includes('const pageState = useTripPlannerPage()'))
  assert.ok(pageControllerText.includes("tourPlanner.mode.type === 'view-gpx'"))
  for (const mode of ['new-draft', 'edit-saved']) assert.ok(pageText.includes(`tourPlanner.mode.type === '${mode}'`))
  assert.match(pageControllerText, /readOnlyGpxAnalysis\?\.routeCoordinates/)
  assert.match(pageText, /routeProfileFocus=\{tourPlanner\.routeProfileFocus\}/)
  assert.match(pageText, /tourPlanner\.viewGpxTour\(tour, place\?\.route_geometry \?\? null\)/)
  assert.match(pageControllerText, /onSaved:[\s\S]*?upsertTour\(result\.tour\)/)
  assert.doesNotMatch(pageText, /setSelectedPlaceId\(result\.tour/)
})

test('B4A retains non-Tours panels and protected page integrations', () => {
  for (const name of ['HelpAnchor', 'RoadtripSidebar', 'RoadtripCorridorPanel', 'DayDetailPanel', 'PlaceInspector', 'BookingDetailPopup']) {
    assert.ok(jsxTags(page, name).length > 0, name)
  }
  assert.ok(jsxTags(page, 'PanelResizeHandle').length >= 2)
  for (const tab of ['transports', 'buchungen', 'listen', 'finanzplan', 'dateien', 'collab']) {
    const panels = collect(page, node => ts.isJsxExpression(node)
      && !!node.expression && ts.isBinaryExpression(node.expression)
      && node.expression.left.getText(page) === `activeTab === '${tab}'`)
    assert.equal(panels.length, 1, tab)
  }
  assert.match(hookText, /dayDetail && days\.some\(d => d\.id === dayDetail\.id\) \? dayDetail : null/)
  assert.match(hookText, /!stop\.automaticNight && !stop\.bookend/)
})