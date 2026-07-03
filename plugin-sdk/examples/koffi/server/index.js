// Koffi — the TREK suitcase mascot (hero-slot widget).
//
// One route: GET /state?tripId= → { days, ongoing, title }. The mascot's mood is
// driven by how close the trip is. The host membership-checks the trip against
// the acting user, so Trekki can only ever see a trip that user can see.

const DAY_MS = 86400000;

function midnight(iso) {
  const d = new Date(iso + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/state',
      auth: true,
      async handler(req, ctx) {
        const json = { 'content-type': 'application/json' };
        const tripId = Number(req.query.tripId);
        if (!tripId) return { status: 200, headers: json, body: JSON.stringify({ days: null, ongoing: false, title: null }) };

        const t = await ctx.trips.getById(tripId, req.user.id);
        if (!t) return { status: 200, headers: json, body: JSON.stringify({ days: null, ongoing: false, title: null }) };

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const start = t.start_date ? midnight(t.start_date) : null;
        const end = t.end_date ? midnight(t.end_date) : null;

        const ongoing = start !== null && start <= now.getTime() && (end === null || now.getTime() <= end);
        const days = !ongoing && start !== null && start >= now.getTime()
          ? Math.round((start - now.getTime()) / DAY_MS)
          : null;

        return { status: 200, headers: json, body: JSON.stringify({ days, ongoing, title: t.title ?? null }) };
      },
    },
  ],
};
