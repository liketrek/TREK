import React, { useId } from 'react'
import { fs } from '../shared/DialogShell'
import { EditorField, INPUT } from '../shared/dialogParts'
import { SettingsCard, StatusPill } from '../Settings/settingsKit'
import { useDevNotifications } from './useDevNotifications'
import {
  Bell, Zap, CheckCircle, Navigation, User, Calendar, Clock, Image, MessageSquare, Tag, UserPlus,
  Download, MapPin, ChevronDown, FlaskConical, Loader2, Map as MapIcon, ShieldCheck,
} from 'lucide-react'

/** A native select in the editors' box look, with the chevron the CustomSelect draws. */
const SELECT = `${INPUT} appearance-none pe-9`

function SelectBox({ id, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>): React.ReactElement {
  return (
    <div className="relative">
      <select id={id} {...rest} className={SELECT}>{children}</select>
      <ChevronDown size={14} strokeWidth={2.2} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-content-faint" />
    </div>
  )
}

/** The buttons of one group, two to a row from a small window up. */
function ButtonGrid({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
}

export default function DevNotificationsPanel(): React.ReactElement {
  const ids = useId()
  const {
    sending, trips, selectedTripId, setSelectedTripId, users, selectedUserId, setSelectedUserId,
    tripInviteId, vacayInviteId, send,
  } = useDevNotifications()

  // ── Helpers ──────────────────────────────────────────────────────────────

  const Btn = ({
    id, label, sub, icon: Icon, onClick,
  }: {
    id: string; label: string; sub: string; icon: React.ElementType; onClick: () => void
  }) => (
    <button type="button"
      onClick={onClick}
      disabled={sending !== null}
      className="flex w-full min-w-0 items-center gap-3 rounded-[12px] border border-edge-faint bg-surface-card px-3 py-2.5 text-start transition-colors hover:bg-surface-secondary disabled:cursor-default"
    >
      <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-secondary">
        <Icon size={15} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-content" style={fs(13, 'body')}>{label}</span>
        <span className="block truncate font-geist text-content-faint" style={fs(11)}>{sub}</span>
      </span>
      {sending === id && <Loader2 size={15} className="flex-none animate-spin text-content-faint" />}
    </button>
  )

  return (
    <div>
      {/* ── Type Testing ─────────────────────────────────────────────────── */}
      {/* The whole tab is a dev build's tool; the first card, always there, says so in its band. */}
      <SettingsCard
        icon={FlaskConical}
        title="Type Testing"
        hint="Test how each in-app notification type renders, sent to yourself."
        badge={<StatusPill tone="warning">DEV ONLY</StatusPill>}
      >
        <ButtonGrid>
          <Btn id="simple-me" label="Simple → Me" sub="test_simple · user" icon={Bell}
            onClick={send.simpleMe}
          />
          <Btn id="boolean-me" label="Boolean → Me" sub="test_boolean · user" icon={CheckCircle}
            onClick={send.booleanMe}
          />
          <Btn id="navigate-me" label="Navigate → Me" sub="test_navigate · user" icon={Navigation}
            onClick={send.navigateMe}
          />
          <Btn id="simple-admins" label="Simple → All Admins" sub="test_simple · admin" icon={Zap}
            onClick={send.simpleAdmins}
          />
        </ButtonGrid>
      </SettingsCard>

      {/* ── Trip-Scoped Events ───────────────────────────────────────────── */}
      {trips.length > 0 && (
        <SettingsCard icon={MapIcon} title="Trip-Scoped Events" hint="Fires each trip event to all members of the selected trip (excluding yourself).">
          <EditorField label="Trip" htmlFor={`${ids}-trip`}>
            <SelectBox
              id={`${ids}-trip`}
              value={selectedTripId ?? ''}
              onChange={e => setSelectedTripId(Number(e.target.value))}
            >
              {trips.map(trip => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
            </SelectBox>
          </EditorField>
          <ButtonGrid>
            <Btn id="booking_change" label="booking_change" sub="navigate · trip" icon={Calendar}
              onClick={send.bookingChange}
            />
            <Btn id="trip_reminder" label="trip_reminder" sub="navigate · trip" icon={Clock}
              onClick={send.tripReminder}
            />
            <Btn id="photos_shared" label="photos_shared" sub="navigate · trip" icon={Image}
              onClick={send.photosShared}
            />
            <Btn id="collab_message" label="collab_message" sub="navigate · trip" icon={MessageSquare}
              onClick={send.collabMessage}
            />
            <Btn id="packing_tagged" label="packing_tagged" sub="navigate · trip" icon={Tag}
              onClick={send.packingTagged}
            />
          </ButtonGrid>
        </SettingsCard>
      )}

      {/* ── User-Scoped Events ───────────────────────────────────────────── */}
      {users.length > 0 && (
        <SettingsCard icon={User} title="User-Scoped Events" hint="Fires each user event to the selected recipient.">
          <EditorField label="Recipient" htmlFor={`${ids}-user`}>
            <SelectBox
              id={`${ids}-user`}
              value={selectedUserId ?? ''}
              onChange={e => setSelectedUserId(Number(e.target.value))}
            >
              {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
            </SelectBox>
          </EditorField>
          <ButtonGrid>
            <Btn
              id={tripInviteId}
              label="trip_invite"
              sub="navigate · user"
              icon={UserPlus}
              onClick={send.tripInvite}
            />
            <Btn
              id={vacayInviteId}
              label="vacay_invite"
              sub="navigate · user"
              icon={MapPin}
              onClick={send.vacayInvite}
            />
          </ButtonGrid>
        </SettingsCard>
      )}

      {/* ── Admin-Scoped Events ──────────────────────────────────────────── */}
      <SettingsCard icon={ShieldCheck} title="Admin-Scoped Events" hint="Fires to all admin users.">
        <ButtonGrid>
          <Btn id="version_available" label="version_available" sub="navigate · admin" icon={Download}
            onClick={send.versionAvailable}
          />
        </ButtonGrid>
      </SettingsCard>
    </div>
  )
}
