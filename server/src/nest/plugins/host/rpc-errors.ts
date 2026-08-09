/**
 * The two error classes the plugin RPC boundary maps onto wire error codes.
 *
 * handle() in rpc-host.ts translates them: BadParams -> BAD_PARAMS,
 * ForbiddenResource -> RESOURCE_FORBIDDEN, anything else -> HOST_ERROR. Lifted out
 * of rpc-host.ts so decorated *.rpc.ts handlers can throw them without importing
 * the router itself; rpc-host.ts re-exports both, so existing importers are
 * unaffected.
 */

/** Thrown by a handler when the acting user may not touch the requested resource. */
export class ForbiddenResource extends Error {}

/** Thrown when a param is missing or has the wrong shape. */
export class BadParams extends Error {}
