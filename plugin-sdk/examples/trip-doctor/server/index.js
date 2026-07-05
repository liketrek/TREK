// Trip Doctor — a hooks-only TREK plugin that showcases the #1429 capabilities.
//
// It has no UI of its own. Instead it feeds data into TREK's own planner surfaces
// through two provider hooks, and stores its notes in its own per-plugin metadata:
//
//   • warningProvider   → validation banner in the trip planner
//   • placeDetailProvider → an extra "Note" row at the foot of the place panel
//   • POST /pin          → pin/clear that note (ctx.meta), from your own UI or a
//                          keyboard-shortcut plugin
//
// SECURITY: the plugin never passes a user id. The host binds the person viewing
// the planner to the invocation, membership-checks the trip/place against THEM,
// and (for meta writes) requires their place_edit permission. A hook that is slow
// or throws is dropped by the host, so it can never break or stall the planner.

module.exports = {
  hooks: {
    // Core calls this for the open trip; return the problems to surface.
    warningProvider: {
      async getWarnings(tripId, ctx) {
        const warnings = [];

        const places = await ctx.trips.getPlaces(tripId);
        for (const p of places) {
          if (p.lat == null || p.lng == null) {
            warnings.push({
              level: 'warning',
              message: `"${p.name || 'A place'}" has no map location`,
              placeId: p.id,
            });
          }
        }

        const reservations = await ctx.trips.getReservations(tripId);
        if (reservations.length === 0) {
          warnings.push({ level: 'info', message: 'No bookings added to this trip yet' });
        }

        return warnings;
      },
    },

    // Core calls this for the open place; return the pinned note (if any).
    placeDetailProvider: {
      async getDetails(placeId, ctx) {
        const note = await ctx.meta.get('place', placeId, 'note');
        return note ? [{ label: 'Note', value: String(note) }] : [];
      },
    },
  },

  routes: [
    {
      // POST /pin { placeId, note } — pin a note on a place, or clear it (empty note).
      method: 'POST',
      path: '/pin',
      auth: true,
      async handler(req, ctx) {
        const json = { 'content-type': 'application/json' };
        const { placeId, note } = req.body || {};
        if (!placeId) {
          return { status: 400, headers: json, body: JSON.stringify({ error: 'placeId required' }) };
        }
        if (note && String(note).trim()) {
          await ctx.meta.set('place', Number(placeId), 'note', String(note).trim());
        } else {
          await ctx.meta.delete('place', Number(placeId), 'note');
        }
        return { status: 200, headers: json, body: JSON.stringify({ ok: true }) };
      },
    },
  ],
};
