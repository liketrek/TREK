import { request as apiRequest, type APIRequestContext, type Page } from '@playwright/test';
import { E2E_BASE_URL } from '../../playwright.config';

/**
 * The Vacay state the guides set up through the API: the seeded member mira
 * fused into the admin's plan, a fusion request from her, a public-holiday
 * calendar to edit. Every helper is idempotent, so a retried or a single
 * guide finds what it needs, and each has its way back to the seed.
 */

const VACAY = '/api/addons/vacay';

/**
 * The seeded member the fusion and sharing guides play with. Not jonas: the
 * share guide shares with jonas, and two rows of the same name would hide
 * which one is which.
 */
export const PARTNER = { username: 'mira', email: 'mira@example.com', password: 'DemoSeed12345!' };

interface PlanData {
  plan: { id: number; holiday_calendars: { id: number; type?: string | null; color: string; label: string | null }[] };
  users: { id: number; username: string; color: string }[];
  pendingInvites: { user_id: number }[];
  incomingInvites: { plan_id: number; username: string }[];
  isFused: boolean;
}

async function ok(res: { ok(): boolean; status(): number; text(): Promise<string> }, what: string): Promise<void> {
  if (!res.ok()) throw new Error(`${what}: ${res.status()} ${await res.text()}`);
}

/**
 * A request context acting as the member. Its own context with a bearer
 * token: a login on the page's context would put the member's session cookie
 * on the admin's requests.
 */
export async function asMember(member: typeof PARTNER = PARTNER): Promise<APIRequestContext> {
  const anon = await apiRequest.newContext({ baseURL: E2E_BASE_URL, storageState: undefined });
  const login = await anon.post('/api/auth/login', { data: { email: member.email, password: member.password } });
  const token = login.ok() ? ((await login.json()) as { token?: string }).token : undefined;
  await anon.dispose();
  if (!token) throw new Error(`could not log in as ${member.username}: ${login.status()}`);
  return apiRequest.newContext({
    baseURL: E2E_BASE_URL,
    storageState: undefined,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
}

async function meId(api: APIRequestContext): Promise<number> {
  return ((await (await api.get('/api/auth/me')).json()) as { user: { id: number } }).user.id;
}

/** The admin's active plan, as the page loads it. */
export async function adminPlan(page: Page): Promise<PlanData> {
  const res = await page.request.get(`${VACAY}/plan`);
  await ok(res, 'could not load the vacay plan');
  return (await res.json()) as PlanData;
}

/** The admin's own id. */
export const adminId = (page: Page): Promise<number> => meId(page.request);

/**
 * Mira fused into the admin's plan, the admin its owner. The invite guide may
 * have left an invite pending already; otherwise the admin sends one.
 */
export async function ensureFused(page: Page): Promise<void> {
  const data = await adminPlan(page);
  if (data.isFused && data.users.some((u) => u.username === PARTNER.username)) return;
  const member = await asMember();
  try {
    const partnerId = await meId(member);
    if (!data.pendingInvites.some((i) => i.user_id === partnerId)) {
      await ok(
        await page.request.post(`${VACAY}/invite`, { data: { user_id: partnerId } }),
        `could not invite ${PARTNER.username}`
      );
    }
    await ok(
      await member.post(`${VACAY}/invite/accept`, { data: { plan_id: data.plan.id } }),
      `${PARTNER.username} could not accept`
    );
  } finally {
    await member.dispose();
  }
}

/** Back to separate plans. The admin owns the plan, so everyone's entries go home. */
export async function ensureSeparate(page: Page): Promise<void> {
  if (!(await adminPlan(page)).isFused) return;
  await ok(await page.request.post(`${VACAY}/dissolve`), 'could not dissolve the fusion');
}

/** Clear what the partner has logged in the admin's plan on these dates. */
export async function clearPartnerDays(page: Page, year: number, dates: string[]): Promise<void> {
  const res = await page.request.get(`${VACAY}/entries/${year}`);
  await ok(res, 'could not load the entries');
  const { entries } = (await res.json()) as {
    entries: { user_id: number; date: string; fraction: number; kind: string | null }[];
  };
  const member = await asMember();
  try {
    const partnerId = await meId(member);
    for (const e of entries.filter((x) => x.user_id === partnerId && dates.includes(x.date))) {
      // The same day with the same fraction and kind again is what clears it.
      await ok(
        await member.post(`${VACAY}/entries/toggle`, {
          data: { date: e.date, fraction: e.fraction, kind: e.kind ?? 'vacation' },
        }),
        `could not clear ${e.date}`
      );
    }
  } finally {
    await member.dispose();
  }
}

/**
 * A fusion request from mira to the admin, which opens the Fusion Request
 * dialog on the admin's next visit. Both have to be on their own plans first,
 * or her invite would come from the plan the admin already owns.
 */
export async function requestFusionFromPartner(page: Page): Promise<void> {
  await ensureSeparate(page);
  const target = await adminId(page);
  const member = await asMember();
  try {
    const res = await member.post(`${VACAY}/invite`, { data: { user_id: target } });
    if (!res.ok() && !(await res.text()).includes('Invite already pending')) {
      throw new Error(`${PARTNER.username} could not invite the admin: ${res.status()}`);
    }
  } finally {
    await member.dispose();
  }
}

/** Take back what requestFusionFromPartner did: the request and the notification it sent. */
export async function clearFusionRequest(page: Page): Promise<void> {
  for (const inv of (await adminPlan(page)).incomingInvites) {
    await ok(
      await page.request.post(`${VACAY}/invite/decline`, { data: { plan_id: inv.plan_id } }),
      'could not decline the request'
    );
  }
  await deleteNotifications(page, 'notif.vacay_invite.title', PARTNER.username);
}

/** Remove the in-app notifications of one kind that a member sent the admin. */
export async function deleteNotifications(page: Page, titleKey: string, sender: string): Promise<void> {
  const inbox = (await (await page.request.get('/api/notifications/in-app?limit=50')).json()) as {
    notifications: { id: number; title_key: string; sender_username: string | null }[];
  };
  for (const n of inbox.notifications.filter((x) => x.title_key === titleKey && x.sender_username === sender)) {
    await page.request.delete(`/api/notifications/in-app/${n.id}`);
  }
}

/** The member shares her calendar with the admin, as she would from her own Vacay. */
export async function shareWithAdmin(page: Page): Promise<void> {
  const target = await adminId(page);
  const member = await asMember();
  try {
    const res = await member.post(`${VACAY}/shares`, { data: { user_id: target } });
    // A retried guide finds the share from its first attempt still there.
    if (!res.ok() && !(await res.text()).includes('Already shared')) {
      throw new Error(`could not share ${PARTNER.username}'s calendar with the admin: ${res.status()}`);
    }
  } finally {
    await member.dispose();
  }
}

/** Take back what shareWithAdmin did: the share and the notification it sent the admin. */
export async function unshareWithAdmin(page: Page): Promise<void> {
  const shares = (await (await page.request.get(`${VACAY}/shares`)).json()) as {
    incoming: { id: number; username: string }[];
  };
  for (const s of shares.incoming.filter((x) => x.username === PARTNER.username)) {
    await ok(await page.request.delete(`${VACAY}/shares/${s.id}`), `could not remove ${PARTNER.username}'s share`);
  }
  await deleteNotifications(page, 'notif.vacay_share.title', PARTNER.username);
}

/** The admin's own colour, to put back after the colour guide. */
export async function ownColor(page: Page): Promise<string> {
  const me = await adminId(page);
  const user = (await adminPlan(page)).users.find((u) => u.id === me);
  if (!user) throw new Error('the admin is not on their own plan');
  return user.color;
}

export async function setOwnColor(page: Page, color: string): Promise<void> {
  await ok(await page.request.put(`${VACAY}/color`, { data: { color } }), 'could not set the colour');
}

/**
 * At least one public-holiday calendar, for the guide that edits one. The
 * public-holidays guide adds it in a full run; on its own the guide adds the
 * same Berlin calendar here.
 */
export async function ensurePublicCalendar(page: Page): Promise<void> {
  const { plan } = await adminPlan(page);
  await ok(
    await page.request.put(`${VACAY}/plan`, { data: { holidays_enabled: true } }),
    'could not switch public holidays on'
  );
  if (plan.holiday_calendars.some((c) => (c.type ?? 'public_holiday') === 'public_holiday')) return;
  await ok(
    await page.request.post(`${VACAY}/plan/holiday-calendars`, {
      data: { region: 'DE-BE', label: 'Berlin', type: 'public_holiday' },
    }),
    'could not add the Berlin calendar'
  );
}

/** The colour of every holiday calendar, by id, to put back after the edit guide. */
export async function calendarColors(page: Page): Promise<Map<number, string>> {
  return new Map((await adminPlan(page)).plan.holiday_calendars.map((c) => [c.id, c.color]));
}

export async function restoreCalendarColors(page: Page, colors: Map<number, string>): Promise<void> {
  for (const cal of (await adminPlan(page)).plan.holiday_calendars) {
    const was = colors.get(cal.id);
    if (was && was !== cal.color) {
      await ok(
        await page.request.put(`${VACAY}/plan/holiday-calendars/${cal.id}`, { data: { color: was } }),
        'could not restore the colour'
      );
    }
  }
}

/** The fraction of the company holiday on a date, or null when there is none. */
export async function companyHolidayFraction(page: Page, year: number, date: string): Promise<number | null> {
  const res = await page.request.get(`${VACAY}/entries/${year}`);
  await ok(res, 'could not load the entries');
  const { companyHolidays } = (await res.json()) as { companyHolidays: { date: string; fraction: number }[] };
  return companyHolidays.find((c) => c.date === date)?.fraction ?? null;
}

/** Put a company holiday back to a size, or remove it (null). The same size again clears it. */
export async function setCompanyHoliday(
  page: Page,
  year: number,
  date: string,
  fraction: number | null
): Promise<void> {
  const now = await companyHolidayFraction(page, year, date);
  if (now === fraction) return;
  // Clearing sends the size it has; converting sends the size it should get.
  const send = fraction === null ? now : fraction;
  await ok(
    await page.request.post(`${VACAY}/entries/company-holiday`, { data: { date, fraction: send } }),
    `could not reset ${date}`
  );
}
