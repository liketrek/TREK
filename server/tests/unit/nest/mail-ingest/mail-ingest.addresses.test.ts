/**
 * The forwarding addresses inside MailIngestModule over a snapshot test db: a
 * person's own address and a trip's, renewing that retires the old token at
 * once, and a trip address that stops working when its owner can no longer
 * add bookings to the trip.
 */
import { MailIngestAddresses } from '../../../../src/db/entities/MailIngestAddresses.entity';
import { TripMembers } from '../../../../src/db/entities/TripMembers.entity';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { MailIngestAddressService } from '../../../../src/nest/mail-ingest/mail-ingest-address.service';
import { MailIngestIntakeService } from '../../../../src/nest/mail-ingest/mail-ingest-intake.service';
import { MailIngestSettingsService } from '../../../../src/nest/mail-ingest/mail-ingest-settings.service';
import { MailIngestModule } from '../../../../src/nest/mail-ingest/mail-ingest.module';
import { PermissionsService } from '../../../../src/nest/permissions/permissions.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { deleteRows, findRow } from '../../../helpers/factories/rows';
import { setAppSetting } from '../../../helpers/factories/settings';
import { addTripMember, makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
const orm = () => t.get(MikroORM);
const addresses = () => t.get(MailIngestAddressService);
const TEMPLATE = 'trek+{token}@mail.example.com';
const permissions = { checkPermission: vi.fn(async () => true) };

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [MailIngestModule],
    overrides: [{ provide: PermissionsService, useValue: permissions }],
  });
});
beforeEach(async () => {
  resetTestDb(db);
  vi.clearAllMocks();
  permissions.checkPermission.mockResolvedValue(true);
  await setAppSetting(orm(), 'mail_ingest_enabled', 'true');
  await setAppSetting(orm(), 'mail_ingest_address_template', TEMPLATE);
});
afterAll(async () => {
  await t.close();
  db.close();
});

const tokenIn = (address: string) => /^trek\+([a-z2-7]+)@/.exec(address)?.[1] ?? '';
function mailTo(address: string, id: string): Buffer {
  const lines = ['From: mia@example.com', `To: ${address}`, 'Subject: Booking', `Message-ID: <${id}@x>`];
  return Buffer.from(`${lines.join('\r\n')}\r\n\r\nBooking ABC123`);
}

describe('a person’s own address', () => {
  it('exists once asked for, and a renewal retires the old token', async () => {
    const { user } = await makeUser(orm());
    expect(await addresses().ownAddress(user.id)).toBeNull();

    const first = await addresses().renewOwn(user.id);
    expect(first?.address).toMatch(/^trek\+[a-z2-7]{24}@mail\.example\.com$/);
    expect(first?.trip_id).toBeNull();
    expect((await addresses().ownAddress(user.id))?.address).toBe(first?.address);

    const second = await addresses().renewOwn(user.id);
    expect(second?.address).not.toBe(first?.address);
    const intake = t.get(MailIngestIntakeService);
    expect(await intake.receive(mailTo(first?.address ?? '', 'old'), 'webhook')).toEqual({
      status: 'refused',
      reason: 'unknown_address',
    });
    expect(await intake.receive(mailTo(second?.address ?? '', 'new'), 'webhook')).toMatchObject({ status: 'accepted' });
    const row = await findRow(orm(), MailIngestAddresses, { id: second?.id });
    expect(row?.last_used_at).not.toBeNull();
  });

  it('cannot be made without an address template, and is not shown without one', async () => {
    const { user } = await makeUser(orm());
    await addresses().ensureOwn(user.id);
    await setAppSetting(orm(), 'mail_ingest_address_template', '');
    await expect(addresses().renewOwn(user.id)).rejects.toThrow(DomainError);
    expect(await addresses().ownAddress(user.id)).toBeNull();
  });

  it('takes no mail while its person has the import off', async () => {
    const { user } = await makeUser(orm());
    const own = await addresses().renewOwn(user.id);
    await t.get(MailIngestSettingsService).updatePrefs(user.id, { enabled: false });
    expect(await addresses().resolve([own?.address ?? ''])).toBeNull();
    await t.get(MailIngestSettingsService).updatePrefs(user.id, { enabled: true });
    expect((await addresses().resolve([`Mia <${own?.address}>`]))?.person.id).toBe(user.id);
    expect(tokenIn(own?.address ?? '')).toHaveLength(24);
  });
});

describe('a trip address', () => {
  it('belongs to the member who made it and stops working when they leave the trip', async () => {
    const { user: owner } = await makeUser(orm());
    const { user: member } = await makeUser(orm());
    const trip = await makeTrip(orm(), owner.id);
    await addTripMember(orm(), trip.id, member.id);

    const made = await addresses().renewTripAddress(member.id, trip.id);
    expect(made?.trip_id).toBe(trip.id);
    expect((await addresses().tripAddress(member.id, trip.id))?.address).toBe(made?.address);
    expect(await addresses().tripAddress(owner.id, trip.id)).toBeNull();
    expect((await addresses().resolve([made?.address ?? '']))?.address.trip_id).toBe(trip.id);

    await deleteRows(orm(), TripMembers, { trip: trip.id, user: member.id });
    expect(await addresses().resolve([made?.address ?? ''])).toBeNull();
    await expect(addresses().tripAddress(member.id, trip.id)).rejects.toThrow('Trip not found');
  });

  it('is refused to a member who may not add bookings, and revoked on request', async () => {
    const { user: owner } = await makeUser(orm());
    const trip = await makeTrip(orm(), owner.id);
    const made = await addresses().renewTripAddress(owner.id, trip.id);
    await addresses().revokeTripAddress(owner.id, trip.id);
    expect(await addresses().tripAddress(owner.id, trip.id)).toBeNull();
    expect(await addresses().resolve([made?.address ?? ''])).toBeNull();

    permissions.checkPermission.mockResolvedValue(false);
    await expect(addresses().renewTripAddress(owner.id, trip.id)).rejects.toThrow('Trip not found');
  });
});
