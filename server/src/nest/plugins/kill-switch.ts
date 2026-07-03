/**
 * Plugin-system kill switch (#plugins). Off by default — a brand-new, high-risk
 * surface an instance owner must deliberately opt into. Lives in its own module
 * (not config.ts) so the many tests that mock config with a partial export set
 * don't have to know about it: the plugin runtime reads the env directly here.
 * Read at call time so tests and runtime env changes take effect immediately.
 */
export function pluginsEnabled(): boolean {
  return (process.env.TREK_PLUGINS_ENABLED || '').trim().toLowerCase() === 'true';
}
