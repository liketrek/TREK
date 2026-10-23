// The MCP SDK's client and in-memory transport resolve, through the `paths`
// redirect in tsconfig.json, to its CommonJS build, which ships no type
// definitions next to it, so the build reads them as untyped modules. Only
// the strict ratchet (tsconfig.strict.json) loads this file: it declares the
// two modules untyped there too, so an import of them is not counted as an
// error the build does not have. The build and the tests never see it.

declare module '@modelcontextprotocol/sdk/client/index';
declare module '@modelcontextprotocol/sdk/inMemory';
