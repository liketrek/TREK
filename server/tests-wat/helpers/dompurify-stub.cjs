// Stub for isomorphic-dompurify in the Node server tests.
// The real package pulls in jsdom (ESM @exodus/bytes) which Jest won't transform inside node_modules.
// Nothing under test sanitizes HTML, so an identity sanitizer is enough.
const sanitize = (input) => (input == null ? input : String(input));
const DOMPurify = { sanitize, setConfig: () => {}, addHook: () => {} };

module.exports = DOMPurify;
module.exports.default = DOMPurify;
module.exports.sanitize = sanitize;
module.exports.__esModule = true;
