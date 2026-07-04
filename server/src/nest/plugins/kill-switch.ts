/**
 * Plugin-system kill switch (#plugins). On by default — the runtime and the
 * Admin → Plugins panel are available out of the box, but installed plugins
 * still have to be activated one by one, so no third-party code runs until an
 * admin turns a specific plugin on. Set TREK_PLUGINS_ENABLED=false to switch the
 * whole system off (installed plugins stay on disk, deactivated). Lives in its
 * own module (not config.ts) so the many tests that mock config with a partial
 * export set don't have to know about it: the plugin runtime reads the env
 * directly here. Read at call time so tests and runtime env changes take effect
 * immediately.
 */
export function pluginsEnabled(): boolean {
  const v = (process.env.TREK_PLUGINS_ENABLED || '').trim().toLowerCase();
  return !['false', '0', 'off', 'no'].includes(v);
}
