/**
 * Admin integration tests.
 * Covers ADMIN-001 to ADMIN-022.
 */
import { buildApp } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { AuditLog } from '../../src/db/entities/AuditLog.entity';
import { BucketList } from '../../src/db/entities/BucketList.entity';
import { BudgetItems } from '../../src/db/entities/BudgetItems.entity';
import { Categories } from '../../src/db/entities/Categories.entity';
import { CollabNotes } from '../../src/db/entities/CollabNotes.entity';
import { InviteTokens } from '../../src/db/entities/InviteTokens.entity';
import { JourneyContributors } from '../../src/db/entities/JourneyContributors.entity';
import { JourneyEntries } from '../../src/db/entities/JourneyEntries.entity';
import { JourneyShareTokens } from '../../src/db/entities/JourneyShareTokens.entity';
import { Journeys } from '../../src/db/entities/Journeys.entity';
import { McpTokens } from '../../src/db/entities/McpTokens.entity';
import { NotificationChannelPreferences } from '../../src/db/entities/NotificationChannelPreferences.entity';
import { Notifications } from '../../src/db/entities/Notifications.entity';
import { OauthClients } from '../../src/db/entities/OauthClients.entity';
import { OauthConsents } from '../../src/db/entities/OauthConsents.entity';
import { OauthTokens } from '../../src/db/entities/OauthTokens.entity';
import { PackingBags } from '../../src/db/entities/PackingBags.entity';
import { PackingTemplates } from '../../src/db/entities/PackingTemplates.entity';
import { PasswordResetTokens } from '../../src/db/entities/PasswordResetTokens.entity';
import { Settings } from '../../src/db/entities/Settings.entity';
import { ShareTokens } from '../../src/db/entities/ShareTokens.entity';
import { Tags } from '../../src/db/entities/Tags.entity';
import { TodoItems } from '../../src/db/entities/TodoItems.entity';
import { TrekPhotos } from '../../src/db/entities/TrekPhotos.entity';
import { TripFiles } from '../../src/db/entities/TripFiles.entity';
import { TripMembers } from '../../src/db/entities/TripMembers.entity';
import { TripPhotos } from '../../src/db/entities/TripPhotos.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { UserNoticeDismissals } from '../../src/db/entities/UserNoticeDismissals.entity';
import { Users } from '../../src/db/entities/Users.entity';
import { VacayPlanMembers } from '../../src/db/entities/VacayPlanMembers.entity';
import { VacayPlans } from '../../src/db/entities/VacayPlans.entity';
import { VisitedCountries } from '../../src/db/entities/VisitedCountries.entity';
import { VisitedRegions } from '../../src/db/entities/VisitedRegions.entity';
import { dbNow } from '../../src/db/types/db-timestamp.type';
import { authCookie } from '../helpers/auth';
import {
  createUser,
  createAdmin,
  createInviteToken,
  createTrip,
  createBudgetItem,
  createJourney,
  createJourneyEntry,
  addJourneyContributor,
  addTripPhoto,
  createCategory,
  createTag,
  createTodoItem,
  createMcpToken,
  createBucketListItem,
  createVisitedCountry,
  createCollabNote,
  addTripMember,
} from '../helpers/factories';
import type { FactoryOrm } from '../helpers/factories/context';
import { countRows, findRow, insertRow, insertRowIgnoringConflict, updateRows } from '../helpers/factories/rows';
import { makeShareToken } from '../helpers/factories/trips';
import { readUser } from '../helpers/factories/users';
import { makeVacayPlan } from '../helpers/factories/vacay';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

let nestApp: INestApplication;
let app: Application;
let orm: FactoryOrm;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});

beforeEach(async () => {
  resetTestDb(testDb);
  await resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// Access control
// ─────────────────────────────────────────────────────────────────────────────

describe('Admin access control', () => {
  it('ADMIN-022 — non-admin cannot access admin routes', async () => {
    const { user } = createUser(testDb);

    const res = await request(app).get('/api/admin/users').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(403);
  });

  it('ADMIN-022 — unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// User management
// ─────────────────────────────────────────────────────────────────────────────

describe('Admin user management', () => {
  it('ADMIN-001 — GET /admin/users lists all users', async () => {
    const { user: admin } = createAdmin(testDb);
    createUser(testDb);
    createUser(testDb);

    const res = await request(app).get('/api/admin/users').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(3);
  });

  it('ADMIN-002 — POST /admin/users creates a user', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .post('/api/admin/users')
      .set('Cookie', authCookie(admin.id))
      .send({ username: 'newuser', email: 'newuser@example.com', password: 'Secure1234!', role: 'user' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('newuser@example.com');
  });

  it('ADMIN-003 — POST /admin/users with duplicate email returns 409', async () => {
    const { user: admin } = createAdmin(testDb);
    const { user: existing } = createUser(testDb);

    const res = await request(app)
      .post('/api/admin/users')
      .set('Cookie', authCookie(admin.id))
      .send({ username: 'duplicate', email: existing.email, password: 'Secure1234!' });
    expect(res.status).toBe(409);
  });

  it('ADMIN-004 — PUT /admin/users/:id updates user', async () => {
    const { user: admin } = createAdmin(testDb);
    const { user } = createUser(testDb);

    const res = await request(app)
      .put(`/api/admin/users/${user.id}`)
      .set('Cookie', authCookie(admin.id))
      .send({ username: 'updated_username' });
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('updated_username');
  });

  it('ADMIN-005 — DELETE /admin/users/:id removes user', async () => {
    const { user: admin } = createAdmin(testDb);
    const { user } = createUser(testDb);

    const res = await request(app).delete(`/api/admin/users/${user.id}`).set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify the row is actually gone from the DB
    const deleted = await findRow(orm, Users, { id: user.id });
    expect(deleted).toBeNull();
  });

  it('ADMIN-005b — DELETE /admin/users/:id succeeds when user has FK references', async () => {
    const { user: admin } = createAdmin(testDb);
    const { user: target } = createUser(testDb);
    const { user: otherUser } = createUser(testDb);
    const { user: thirdUser } = createUser(testDb);

    // trip_members.invited_by: target invited thirdUser to otherUser's trip
    // (trip survives deletion; only invited_by should become NULL)
    const otherTrip = createTrip(testDb, otherUser.id);
    await insertRow(orm, TripMembers, { trip: otherTrip.id, user: thirdUser.id, invitedByRef: target.id });

    // share_tokens.created_by: target created a share token for otherUser's trip
    await makeShareToken(orm, otherTrip.id, target.id, { token: 'tok-admin-test' });

    // budget_items.paid_by_user_id: target paid for an expense on otherUser's trip
    const budgetItem = createBudgetItem(testDb, otherTrip.id);
    await updateRows(orm, BudgetItems, { id: budgetItem.id }, { paidByUser: target.id });

    // journey_contributors: target is a contributor on otherUser's journey
    const otherJourney = createJourney(testDb, otherUser.id);
    addJourneyContributor(testDb, otherJourney.id, target.id);

    // journey_entries: target authored an entry on otherUser's journey
    createJourneyEntry(testDb, otherJourney.id, target.id);

    // journey_share_tokens: target created a share token for otherUser's journey
    await insertRow(orm, JourneyShareTokens, {
      journey: otherJourney.id,
      token: 'jst-admin-test',
      createdByRef: target.id,
    });

    // notifications.sender_id (SET NULL): target sent a notification to otherUser
    const sentNotif = await insertRow(orm, Notifications, {
      type: 'simple',
      scope: 'trip',
      target: otherTrip.id,
      sender: target.id,
      recipient: otherUser.id,
      title_key: 'k',
      text_key: 'k',
    });
    // notifications.recipient_id (CASCADE): otherUser sent a notification to target
    await insertRow(orm, Notifications, {
      type: 'simple',
      scope: 'trip',
      target: otherTrip.id,
      sender: otherUser.id,
      recipient: target.id,
      title_key: 'k',
      text_key: 'k',
    });

    // user_notice_dismissals (CASCADE): target dismissed a notice
    await insertRow(orm, UserNoticeDismissals, { user: target.id, notice_id: 'test-notice', dismissed_at: Date.now() });

    // owned journey: target owns a journey with an entry (cascade-deletes on journey deletion)
    const ownedJourney = createJourney(testDb, target.id);
    createJourneyEntry(testDb, ownedJourney.id, target.id);

    // trip_files.uploaded_by (SET NULL): target uploaded a file to otherUser's trip
    const fileId = await insertRow(orm, TripFiles, {
      trip: otherTrip.id,
      filename: 'f.pdf',
      original_name: 'file.pdf',
      uploadedByRef: target.id,
    });

    // trek_photos.owner_id (SET NULL): target owns a photo in the central registry
    const trekPhotoId = await insertRow(orm, TrekPhotos, {
      provider: 'immich',
      asset_id: 'asset-admin-test',
      owner: target.id,
    });

    // trip_photos.user_id (CASCADE): target added a photo to otherUser's trip
    addTripPhoto(testDb, otherTrip.id, target.id, 'asset-tp-admin', 'immich');

    // trips.user_id (CASCADE): target owns a trip
    const ownedTrip = createTrip(testDb, target.id);

    // trip_members.user_id (CASCADE): target is a member of otherUser's trip
    addTripMember(testDb, otherTrip.id, target.id);

    // categories.user_id (SET NULL): target created a category
    const userCategory = createCategory(testDb, { user_id: target.id });

    // tags.user_id (CASCADE): target created a tag
    const userTag = createTag(testDb, target.id);

    // todo_items.assigned_user_id (SET NULL): target is assigned to a todo on otherUser's trip
    const todoItem = createTodoItem(testDb, otherTrip.id);
    await updateRows(orm, TodoItems, { id: todoItem.id }, { assignedUser: target.id });

    // packing_bags.user_id (SET NULL): target owns a packing bag on otherUser's trip
    const packBagId = await insertRow(orm, PackingBags, {
      trip: otherTrip.id,
      name: 'Bag',
      color: '#ff0000',
      user: target.id,
    });

    // mcp_tokens.user_id (CASCADE): target has an MCP API token
    createMcpToken(testDb, target.id);

    // oauth_tokens/consents.user_id (CASCADE): target has tokens from otherUser's OAuth client
    // The row id and the public client_id are the same string here, so the
    // tokens' client reference resolves to it whichever of the two it keys on.
    await insertRow(orm, OauthClients, {
      id: 'cid-admin-test',
      user: otherUser.id,
      name: 'App',
      client_id: 'cid-admin-test',
      client_secret_hash: 'h',
    });
    await insertRow(orm, OauthTokens, {
      client: 'cid-admin-test',
      user: target.id,
      access_token_hash: 'ath-admin',
      refresh_token_hash: 'rth-admin',
      access_token_expires_at: dbNow(new Date(Date.now() + 60 * 60 * 1000)),
      refresh_token_expires_at: dbNow(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    });
    await insertRow(orm, OauthConsents, { client: 'cid-admin-test', user: target.id });

    // vacay_plans.owner_id (CASCADE): target owns a vacation plan
    const vacayPlanId = (await makeVacayPlan(orm, target.id)).id;

    // vacay_plan_members.user_id (CASCADE): target is a member of otherUser's vacay plan
    const otherVacayPlanId = (await makeVacayPlan(orm, otherUser.id)).id;
    await insertRow(orm, VacayPlanMembers, { plan: otherVacayPlanId, user: target.id });

    // bucket_list.user_id (CASCADE): target has a bucket list item
    createBucketListItem(testDb, target.id);

    // visited_countries.user_id (CASCADE): target has visited a country
    createVisitedCountry(testDb, target.id, 'JP');

    // visited_regions.user_id (CASCADE): target has visited a region
    await insertRow(orm, VisitedRegions, {
      user: target.id,
      region_code: 'JP-13',
      region_name: 'Tokyo',
      country_code: 'JP',
    });

    // packing_templates.created_by (CASCADE): target created a packing template
    const packTemplateId = await insertRow(orm, PackingTemplates, { name: 'My Template', createdByRef: target.id });

    // invite_tokens.created_by (CASCADE): target created an invite token
    createInviteToken(testDb, { created_by: target.id });

    // collab_notes.user_id (CASCADE): target authored a collab note on otherUser's trip
    createCollabNote(testDb, otherTrip.id, target.id);

    // settings.user_id (CASCADE): target has a user setting
    await insertRow(orm, Settings, { user: target.id, key: 'theme', value: 'dark' });

    // password_reset_tokens.user_id (CASCADE): target has a pending password reset
    await insertRow(orm, PasswordResetTokens, {
      user: target.id,
      token_hash: 'prt-hash-admin',
      expires_at: dbNow(new Date(Date.now() + 60 * 60 * 1000)),
    });

    // audit_log.user_id (SET NULL): target performed an audited action
    const auditId = await insertRow(orm, AuditLog, { user: target.id, action: 'test.action', ip: '127.0.0.1' });

    // notification_channel_preferences.user_id (CASCADE): target has notification preferences
    await insertRowIgnoringConflict(orm, NotificationChannelPreferences, {
      user: target.id,
      event_type: 'trip_invite',
      channel: 'email',
    });

    const res = await request(app).delete(`/api/admin/users/${target.id}`).set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    expect(await findRow(orm, Users, { id: target.id })).toBeNull();
    // trip_members row survives but invited_by is now NULL
    expect((await findRow(orm, TripMembers, { trip: otherTrip.id, user: thirdUser.id }))?.invited_by).toBeNull();
    expect(await findRow(orm, ShareTokens, { createdByRef: target.id })).toBeNull();
    expect((await findRow(orm, BudgetItems, { id: budgetItem.id }))?.paid_by_user_id).toBeNull();
    expect(await findRow(orm, JourneyContributors, { journey: otherJourney.id, user: target.id })).toBeNull();
    expect(await findRow(orm, JourneyEntries, { author: target.id })).toBeNull();
    expect(await findRow(orm, JourneyShareTokens, { createdByRef: target.id })).toBeNull();
    // sent notification survives but sender_id becomes NULL
    expect((await findRow(orm, Notifications, { id: sentNotif }))?.sender_id).toBeNull();
    // received notification is cascade-deleted
    expect(await findRow(orm, Notifications, { recipient: target.id })).toBeNull();
    // notice dismissals are cascade-deleted
    expect(await findRow(orm, UserNoticeDismissals, { user: target.id, notice_id: 'test-notice' })).toBeNull();
    // owned journey and its entries are cascade-deleted
    expect(await findRow(orm, Journeys, { user: target.id })).toBeNull();
    expect(await findRow(orm, JourneyEntries, { journey: ownedJourney.id })).toBeNull();
    // uploaded file survives but uploaded_by is now NULL
    expect((await findRow(orm, TripFiles, { id: fileId }))?.uploaded_by).toBeNull();
    // trek_photos row survives but owner_id is now NULL
    expect((await findRow(orm, TrekPhotos, { id: trekPhotoId }))?.owner_id).toBeNull();
    // trip_photos row for target is cascade-deleted
    expect(await findRow(orm, TripPhotos, { trip: otherTrip.id, user: target.id })).toBeNull();
    // owned trip is cascade-deleted
    expect(await findRow(orm, Trips, { id: ownedTrip.id })).toBeNull();
    // trip membership on others' trips is removed
    expect(await findRow(orm, TripMembers, { trip: otherTrip.id, user: target.id })).toBeNull();
    // category survives but user_id is NULL
    expect((await findRow(orm, Categories, { id: userCategory.id }))?.user_id).toBeNull();
    // tag is deleted
    expect(await findRow(orm, Tags, { id: userTag.id })).toBeNull();
    // todo assigned_user_id is NULL
    expect((await findRow(orm, TodoItems, { id: todoItem.id }))?.assigned_user_id).toBeNull();
    // packing bag survives but user_id is NULL
    expect((await findRow(orm, PackingBags, { id: packBagId }))?.user_id).toBeNull();
    // MCP tokens are deleted
    expect(await findRow(orm, McpTokens, { user: target.id })).toBeNull();
    // OAuth tokens and consents are deleted
    expect(await findRow(orm, OauthTokens, { user: target.id })).toBeNull();
    expect(await findRow(orm, OauthConsents, { user: target.id })).toBeNull();
    // owned vacay plan is deleted
    expect(await findRow(orm, VacayPlans, { id: vacayPlanId })).toBeNull();
    // vacay plan membership on others' plans is removed
    expect(await findRow(orm, VacayPlanMembers, { plan: otherVacayPlanId, user: target.id })).toBeNull();
    // bucket list items are deleted
    expect(await findRow(orm, BucketList, { user: target.id })).toBeNull();
    // travel history is deleted
    expect(await findRow(orm, VisitedCountries, { user: target.id, country_code: 'JP' })).toBeNull();
    expect(await findRow(orm, VisitedRegions, { user: target.id })).toBeNull();
    // packing template is deleted
    expect(await findRow(orm, PackingTemplates, { id: packTemplateId })).toBeNull();
    // invite tokens created by target are deleted
    expect(await findRow(orm, InviteTokens, { createdByRef: target.id })).toBeNull();
    // collab content is deleted
    expect(await findRow(orm, CollabNotes, { user: target.id, trip: otherTrip.id })).toBeNull();
    // user settings are deleted
    expect(await findRow(orm, Settings, { user: target.id })).toBeNull();
    // password reset tokens are deleted
    expect(await findRow(orm, PasswordResetTokens, { user: target.id })).toBeNull();
    // audit log entry survives but user_id is NULL
    expect((await findRow(orm, AuditLog, { id: auditId }))?.user_id).toBeNull();
    // notification channel preferences are deleted
    expect(
      await findRow(orm, NotificationChannelPreferences, { user: target.id, event_type: 'trip_invite' }),
    ).toBeNull();
  });

  it('ADMIN-006 — admin cannot delete their own account', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).delete(`/api/admin/users/${admin.id}`).set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Admin user management — whitespace normalization
// ─────────────────────────────────────────────────────────────────────────────

describe('Admin user management — whitespace normalization', () => {
  it('ADMIN-UPDATE-TRIM-1 — PUT /admin/users/:id trims username before storing', async () => {
    const { user: admin } = createAdmin(testDb);
    const { user } = createUser(testDb);

    const res = await request(app)
      .put(`/api/admin/users/${user.id}`)
      .set('Cookie', authCookie(admin.id))
      .send({ username: '  trimmedadmin  ' });

    expect(res.status).toBe(200);
    const row = await readUser(orm, user.id);
    expect(row.username).toBe('trimmedadmin');
  });

  it('ADMIN-UPDATE-TRIM-2 — PUT /admin/users/:id trims email before storing', async () => {
    const { user: admin } = createAdmin(testDb);
    const { user } = createUser(testDb);

    const res = await request(app)
      .put(`/api/admin/users/${user.id}`)
      .set('Cookie', authCookie(admin.id))
      .send({ email: '  newemail@example.com  ' });

    expect(res.status).toBe(200);
    const row = await readUser(orm, user.id);
    expect(row.email).toBe('newemail@example.com');
  });

  it('ADMIN-UPDATE-TRIM-3 — PUT /admin/users/:id with whitespace-padded username that trims to existing returns 409', async () => {
    const { user: admin } = createAdmin(testDb);
    const { user: existing } = createUser(testDb, { username: 'carol' });
    const { user: target } = createUser(testDb);

    const res = await request(app)
      .put(`/api/admin/users/${target.id}`)
      .set('Cookie', authCookie(admin.id))
      .send({ username: `  ${existing.username}  ` });

    expect(res.status).toBe(409);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// System stats
// ─────────────────────────────────────────────────────────────────────────────

describe('System stats', () => {
  it('ADMIN-007 — GET /admin/stats returns system statistics', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).get('/api/admin/stats').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalUsers');
    expect(res.body).toHaveProperty('totalTrips');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Permissions
// ─────────────────────────────────────────────────────────────────────────────

describe('Permissions management', () => {
  it('ADMIN-008 — GET /admin/permissions returns permission config', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).get('/api/admin/permissions').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('permissions');
    expect(Array.isArray(res.body.permissions)).toBe(true);
  });

  it('ADMIN-008 — PUT /admin/permissions updates permissions and change persists', async () => {
    const { user: admin } = createAdmin(testDb);

    // Change trip_create from its default ('everybody') to 'admin'
    const res = await request(app)
      .put('/api/admin/permissions')
      .set('Cookie', authCookie(admin.id))
      .send({ permissions: { trip_create: 'admin' } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Re-fetch and verify the change persisted
    const getRes = await request(app).get('/api/admin/permissions').set('Cookie', authCookie(admin.id));
    expect(getRes.status).toBe(200);
    const tripCreatePerm = getRes.body.permissions.find((p: any) => p.key === 'trip_create');
    expect(tripCreatePerm).toBeDefined();
    expect(tripCreatePerm.level).toBe('admin');
  });

  it('ADMIN-008 — PUT /admin/permissions without object returns 400', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .put('/api/admin/permissions')
      .set('Cookie', authCookie(admin.id))
      .send({ permissions: null });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Audit log
// ─────────────────────────────────────────────────────────────────────────────

describe('Audit log', () => {
  it('ADMIN-009 — GET /admin/audit-log returns log entries', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).get('/api/admin/audit-log').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Addon management
// ─────────────────────────────────────────────────────────────────────────────

describe('Addon management', () => {
  it('ADMIN-011 — PUT /admin/addons/:id disables an addon', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .put('/api/admin/addons/atlas')
      .set('Cookie', authCookie(admin.id))
      .send({ enabled: false });
    expect(res.status).toBe(200);
  });

  it('ADMIN-012 — PUT /admin/addons/:id re-enables an addon', async () => {
    const { user: admin } = createAdmin(testDb);

    await request(app).put('/api/admin/addons/atlas').set('Cookie', authCookie(admin.id)).send({ enabled: false });

    const res = await request(app)
      .put('/api/admin/addons/atlas')
      .set('Cookie', authCookie(admin.id))
      .send({ enabled: true });
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Invite tokens
// ─────────────────────────────────────────────────────────────────────────────

describe('Invite token management', () => {
  it('ADMIN-013 — POST /admin/invites creates an invite token', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).post('/api/admin/invites').set('Cookie', authCookie(admin.id)).send({ max_uses: 5 });
    expect(res.status).toBe(201);
    expect(res.body.invite.token).toBeDefined();
  });

  it('ADMIN-013b — POST /admin/invites with a trip that does not exist answers 404 and writes nothing', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .post('/api/admin/invites')
      .set('Cookie', authCookie(admin.id))
      .send({ max_uses: 1, trip_id: 99999 });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
    expect(await countRows(orm, InviteTokens, {})).toBe(0);
    expect(await countRows(orm, AuditLog, { action: 'admin.invite_create' })).toBe(0);
  });

  it('ADMIN-014 — DELETE /admin/invites/:id removes invite', async () => {
    const { user: admin } = createAdmin(testDb);
    const invite = createInviteToken(testDb, { created_by: admin.id });

    const res = await request(app).delete(`/api/admin/invites/${invite.id}`).set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Packing templates
// ─────────────────────────────────────────────────────────────────────────────

describe('Packing templates', () => {
  it('ADMIN-015 — POST /admin/packing-templates creates a template', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .post('/api/admin/packing-templates')
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Beach Trip', description: 'Beach essentials' });
    expect(res.status).toBe(201);
    expect(res.body.template.name).toBe('Beach Trip');
  });

  it('ADMIN-016 — DELETE /admin/packing-templates/:id removes template', async () => {
    const { user: admin } = createAdmin(testDb);
    const create = await request(app)
      .post('/api/admin/packing-templates')
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Temp Template' });
    const templateId = create.body.template.id;

    const res = await request(app)
      .delete(`/api/admin/packing-templates/${templateId}`)
      .set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bag tracking
// ─────────────────────────────────────────────────────────────────────────────

describe('Bag tracking', () => {
  it('ADMIN-017 — PUT /admin/bag-tracking toggles bag tracking', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .put('/api/admin/bag-tracking')
      .set('Cookie', authCookie(admin.id))
      .send({ enabled: true });
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// JWT rotation
// ─────────────────────────────────────────────────────────────────────────────

describe('JWT rotation', () => {
  it('ADMIN-018 — POST /admin/rotate-jwt-secret rotates the JWT secret', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).post('/api/admin/rotate-jwt-secret').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Packing template CRUD (full)
// ─────────────────────────────────────────────────────────────────────────────

describe('Packing template CRUD (full)', () => {
  async function makeTemplate(admin: any) {
    const res = await request(app)
      .post('/api/admin/packing-templates')
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Test Template' });
    return res.body.template;
  }

  it('ADMIN-019 — GET /admin/packing-templates/:id returns template', async () => {
    const { user: admin } = createAdmin(testDb);
    const template = await makeTemplate(admin);

    const res = await request(app)
      .get(`/api/admin/packing-templates/${template.id}`)
      .set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body.template.id).toBe(template.id);
    expect(res.body.template.name).toBe('Test Template');
  });

  it('ADMIN-019b — GET /admin/packing-templates/:id returns 404 for missing', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).get('/api/admin/packing-templates/99999').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(404);
  });

  it('ADMIN-020 — PUT /admin/packing-templates/:id updates name', async () => {
    const { user: admin } = createAdmin(testDb);
    const template = await makeTemplate(admin);

    const res = await request(app)
      .put(`/api/admin/packing-templates/${template.id}`)
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.template.name).toBe('Updated Name');
  });

  it('ADMIN-021 — POST /admin/packing-templates/:id/categories adds a category', async () => {
    const { user: admin } = createAdmin(testDb);
    const template = await makeTemplate(admin);

    const res = await request(app)
      .post(`/api/admin/packing-templates/${template.id}/categories`)
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Clothing' });
    expect(res.status).toBe(201);
    expect(res.body.category.name).toBe('Clothing');
  });

  it('ADMIN-021b — PUT /admin/packing-templates/:templateId/categories/:catId updates category', async () => {
    const { user: admin } = createAdmin(testDb);
    const template = await makeTemplate(admin);
    const catRes = await request(app)
      .post(`/api/admin/packing-templates/${template.id}/categories`)
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Clothing' });
    const catId = catRes.body.category.id;

    const res = await request(app)
      .put(`/api/admin/packing-templates/${template.id}/categories/${catId}`)
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Apparel' });
    expect(res.status).toBe(200);
    expect(res.body.category.name).toBe('Apparel');
  });

  it('ADMIN-021c — DELETE /admin/packing-templates/:templateId/categories/:catId removes category', async () => {
    const { user: admin } = createAdmin(testDb);
    const template = await makeTemplate(admin);
    const catRes = await request(app)
      .post(`/api/admin/packing-templates/${template.id}/categories`)
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Toiletries' });
    const catId = catRes.body.category.id;

    const res = await request(app)
      .delete(`/api/admin/packing-templates/${template.id}/categories/${catId}`)
      .set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('ADMIN-021d — POST .../categories/:catId/items adds an item to category', async () => {
    const { user: admin } = createAdmin(testDb);
    const template = await makeTemplate(admin);
    const catRes = await request(app)
      .post(`/api/admin/packing-templates/${template.id}/categories`)
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Clothing' });
    const catId = catRes.body.category.id;

    const res = await request(app)
      .post(`/api/admin/packing-templates/${template.id}/categories/${catId}/items`)
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'T-Shirt' });
    expect(res.status).toBe(201);
    expect(res.body.item.name).toBe('T-Shirt');
  });

  it('ADMIN-021e — PUT /admin/packing-templates/:templateId/items/:itemId updates item', async () => {
    const { user: admin } = createAdmin(testDb);
    const template = await makeTemplate(admin);
    const catRes = await request(app)
      .post(`/api/admin/packing-templates/${template.id}/categories`)
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Clothing' });
    const catId = catRes.body.category.id;
    const itemRes = await request(app)
      .post(`/api/admin/packing-templates/${template.id}/categories/${catId}/items`)
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'T-Shirt' });
    const itemId = itemRes.body.item.id;

    const res = await request(app)
      .put(`/api/admin/packing-templates/${template.id}/items/${itemId}`)
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Polo Shirt' });
    expect(res.status).toBe(200);
    expect(res.body.item.name).toBe('Polo Shirt');
  });

  it('ADMIN-021f — DELETE /admin/packing-templates/:templateId/items/:itemId removes item', async () => {
    const { user: admin } = createAdmin(testDb);
    const template = await makeTemplate(admin);
    const catRes = await request(app)
      .post(`/api/admin/packing-templates/${template.id}/categories`)
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Clothing' });
    const catId = catRes.body.category.id;
    const itemRes = await request(app)
      .post(`/api/admin/packing-templates/${template.id}/categories/${catId}/items`)
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'T-Shirt' });
    const itemId = itemRes.body.item.id;

    const res = await request(app)
      .delete(`/api/admin/packing-templates/${template.id}/items/${itemId}`)
      .set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MCP token management
// ─────────────────────────────────────────────────────────────────────────────

describe('MCP token management', () => {
  it('ADMIN-023 — GET /admin/mcp-tokens returns list', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).get('/api/admin/mcp-tokens').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tokens)).toBe(true);
  });

  it('ADMIN-024 — DELETE /admin/mcp-tokens/:id returns 404 for missing token', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).delete('/api/admin/mcp-tokens/99999').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(404);
  });

  it('ADMIN-025 — DELETE /admin/mcp-tokens/abc (non-numeric id) returns the legacy 404, not a 500 (Plan 3b Task 2 review, F1)', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).delete('/api/admin/mcp-tokens/abc').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Token not found' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OAuth sessions
// ─────────────────────────────────────────────────────────────────────────────

describe('OAuth sessions', () => {
  it('ADMIN-025 — GET /admin/oauth-sessions returns list', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).get('/api/admin/oauth-sessions').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sessions)).toBe(true);
  });

  it('ADMIN-026 — DELETE /admin/oauth-sessions/:id returns 404 for missing session', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).delete('/api/admin/oauth-sessions/99999').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(404);
  });

  it('ADMIN-026B — DELETE /admin/oauth-sessions/abc (non-numeric id) returns the legacy 404, not a 500 (Plan 3b Task 4 controller addendum, per Task 2 review F1)', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).delete('/api/admin/oauth-sessions/abc').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Session not found' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OIDC settings
// ─────────────────────────────────────────────────────────────────────────────

describe('OIDC settings', () => {
  it('ADMIN-027 — GET /admin/oidc returns OIDC configuration', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).get('/api/admin/oidc').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
  });

  it('ADMIN-028 — PUT /admin/oidc updates OIDC settings', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .put('/api/admin/oidc')
      .set('Cookie', authCookie(admin.id))
      .send({ issuer: 'https://accounts.example.com', client_id: 'my-client', oidc_only: false });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Demo baseline
// ─────────────────────────────────────────────────────────────────────────────

describe('Demo baseline', () => {
  it('ADMIN-029 — POST /admin/save-demo-baseline returns 404 when DEMO_MODE is not set', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).post('/api/admin/save-demo-baseline').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GitHub releases / version check
// ─────────────────────────────────────────────────────────────────────────────

describe('GitHub releases and version check', () => {
  it('ADMIN-030 — GET /admin/github-releases returns array (even if GitHub unreachable)', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .get('/api/admin/github-releases?per_page=5&page=1')
      .set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('ADMIN-031 — GET /admin/version-check returns version info', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).get('/api/admin/version-check').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('current');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Additional list routes
// ─────────────────────────────────────────────────────────────────────────────

describe('Admin list routes', () => {
  it('ADMIN-032 — GET /admin/invites lists invites', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).get('/api/admin/invites').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.invites)).toBe(true);
  });

  it('ADMIN-033 — GET /admin/bag-tracking returns bag tracking setting', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).get('/api/admin/bag-tracking').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
  });

  it('ADMIN-034 — GET /admin/packing-templates lists templates', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).get('/api/admin/packing-templates').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.templates)).toBe(true);
  });

  it('ADMIN-035 — GET /admin/addons lists addons', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).get('/api/admin/addons').set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.addons)).toBe(true);
  });
});
