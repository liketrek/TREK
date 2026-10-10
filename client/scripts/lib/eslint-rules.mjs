/*
 * The client's own ESLint rules, as the local plugin `trek` in eslint.config.mjs.
 *
 * Each one finds a smell client/CLAUDE.md forbids and that no stock rule sees
 * on its own. They run as warnings, so lint:warnings
 * (scripts/eslint-ratchet.mjs) holds what exists today in
 * scripts/eslint-baseline.json and fails on each new one.
 */

/** The expression under any `as`, `!`, `satisfies` or type assertion, which do not change the value. */
function unwrap(node) {
  let current = node;
  while (
    current &&
    (current.type === 'TSAsExpression' ||
      current.type === 'TSNonNullExpression' ||
      current.type === 'TSSatisfiesExpression' ||
      current.type === 'TSTypeAssertion')
  )
    current = current.expression;
  return current;
}

const isWindow = (node) => {
  const target = unwrap(node);
  return (
    (target?.type === 'Identifier' && (target.name === 'window' || target.name === 'globalThis')) ||
    (target?.type === 'MemberExpression' &&
      !target.computed &&
      target.property.name === 'window' &&
      unwrap(target.object)?.type === 'Identifier' &&
      unwrap(target.object).name === 'globalThis')
  );
};

const propertyName = (member) =>
  !member.computed && member.property.type === 'Identifier'
    ? member.property.name
    : member.property.type === 'Literal' && typeof member.property.value === 'string'
      ? member.property.value
      : null;

/**
 * `.catch(() => {})`, `.catch(() => undefined)`, `.catch(() => null)`: the
 * failure disappears without a trace. A write that fails needs a rollback and
 * a toast; a read that may fail says why it may, in code that handles it.
 */
/** @type {import('eslint').Rule.RuleModule} */
const noSwallowedCatch = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      swallowed:
        'This .catch() swallows the error. Roll back and tell the user (toast), or handle the failure on purpose ' +
        'and say why in the handler; never .catch(() => {}).',
    },
  },
  create(context) {
    const empty = (fn) => {
      if (fn?.type !== 'ArrowFunctionExpression' && fn?.type !== 'FunctionExpression') return false;
      const body = fn.body;
      if (body.type === 'BlockStatement') return body.body.length === 0;
      return (
        (body.type === 'Identifier' && body.name === 'undefined') ||
        (body.type === 'Literal' && body.value === null) ||
        (body.type === 'UnaryExpression' && body.operator === 'void')
      );
    };
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== 'MemberExpression' || propertyName(callee) !== 'catch') return;
        if (node.arguments.length === 1 && empty(node.arguments[0])) context.report({ node, messageId: 'swallowed' });
      },
    };
  },
};

/**
 * `useTripStore()` with no selector subscribes the component to the whole
 * store, so it re-renders on every change anywhere in it. And on Zustand 5 the
 * obvious repair, a selector that builds an object, loops forever without
 * useShallow, because each call returns a new object.
 */
/** @type {import('eslint').Rule.RuleModule} */
const storeWithoutSelector = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      whole:
        '{{name}}() without a selector subscribes to the whole store and re-renders on every change in it. ' +
        'Select what you read: {{name}}(s => s.field), or for several fields {{name}}(useShallow(s => ({ a: s.a, b: s.b }))). ' +
        'On Zustand 5 an object selector without useShallow loops forever. In an effect or handler use {{name}}.getState().',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          /^use[A-Z]\w*Store$/.test(node.callee.name) &&
          node.arguments.length === 0
        )
          context.report({ node, messageId: 'whole', data: { name: node.callee.name } });
      },
    };
  },
};

/** Events the browser itself fires on window; dispatching one of these is simulating the platform, not a bus. */
const PLATFORM_EVENTS = new Set([
  'resize',
  'scroll',
  'storage',
  'online',
  'offline',
  'focus',
  'blur',
  'popstate',
  'hashchange',
  'visibilitychange',
  'load',
  'beforeunload',
  'pagehide',
  'pageshow',
  'message',
  'keydown',
  'keyup',
]);

/**
 * Global mutable state and event buses on window: `window.__dragData`,
 * `window.__addToast` and any other `window.__*`, and window.dispatchEvent
 * with an event of the app's own. Nothing types them, nothing finds their
 * listeners, and a test has to fake the global to reach them.
 */
/** @type {import('eslint').Rule.RuleModule} */
const noWindowGlobals = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      global:
        'window.{{name}} is global mutable state. Keep it in a module (a store, a small session module) and import it.',
      bus:
        'window.dispatchEvent with an event of our own is an untyped global bus. Call a store action, or bump a ' +
        'version counter in a slice that the listener selects.',
    },
  },
  create(context) {
    const ownEvent = (arg) => {
      const event = unwrap(arg);
      if (event?.type !== 'NewExpression' || event.callee.type !== 'Identifier') return false;
      if (event.callee.name === 'CustomEvent') return true;
      if (event.callee.name !== 'Event') return false;
      const name = event.arguments[0];
      return !(name?.type === 'Literal' && typeof name.value === 'string' && PLATFORM_EVENTS.has(name.value));
    };
    return {
      MemberExpression(node) {
        const name = propertyName(node);
        if (name?.startsWith('__') && isWindow(node.object))
          context.report({ node, messageId: 'global', data: { name } });
      },
      CallExpression(node) {
        const callee = unwrap(node.callee);
        if (callee?.type !== 'MemberExpression' || propertyName(callee) !== 'dispatchEvent') return;
        if (isWindow(callee.object) && ownEvent(node.arguments[0])) context.report({ node, messageId: 'bus' });
      },
    };
  },
};

export default {
  meta: { name: 'trek' },
  rules: {
    'no-swallowed-catch': noSwallowedCatch,
    'store-without-selector': storeWithoutSelector,
    'no-window-globals': noWindowGlobals,
  },
};
