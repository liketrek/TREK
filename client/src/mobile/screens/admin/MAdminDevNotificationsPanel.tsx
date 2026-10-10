import React from 'react'
import {
  Bell, Zap, CheckCircle, Navigation, Calendar, Clock, Image,
  MessageSquare, Tag, UserPlus, Download, MapPin, Loader2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useDevNotifications } from '../../../components/Admin/useDevNotifications'
import { MAdminCard, MAdminCardHead } from './MAdminUi'

/** The phone panel toasts the thrown error's own message rather than the server's error field. */
const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Failed')

const SELECT_CLASS =
  'mb-2 h-[42px] w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 text-[0.84375rem] text-m-ink outline-none focus:border-[color:var(--m-faint)]'

function Btn({
  id, label, sub, icon: Icon, color, sending, onClick,
}: {
  id: string
  label: string
  sub: string
  icon: LucideIcon
  color: string
  sending: string | null
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={sending !== null}
      className="flex w-full items-center gap-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[11px] text-start disabled:opacity-50"
    >
      <span
        className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px]"
        style={{ background: `${color}20`, color }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] font-bold text-m-ink">{label}</p>
        <p className="truncate font-geist text-[0.625rem] text-m-faint">{sub}</p>
      </div>
      {sending === id && <Loader2 size={14} className="flex-none animate-spin text-m-faint" />}
    </button>
  )
}

// Dev-only notification testing panel, re-skinned to the mobile admin system.
// All state, fetches and payloads come from useDevNotifications, shared
// with the desktop DevNotificationsPanel; only the presentation layer differs.
export default function MAdminDevNotificationsPanel(): React.ReactElement {
  const {
    sending, trips, selectedTripId, setSelectedTripId, users, selectedUserId, setSelectedUserId,
    tripInviteId, vacayInviteId, send,
  } = useDevNotifications({ errorMessage })

  return (
    <div className="space-y-3">
      {/* Dev header */}
      <div className="flex items-center gap-2">
        <span className="rounded px-2 py-[3px] font-mono text-[0.625rem] font-bold bg-[color:var(--m-st-pending)] text-white">
          DEV ONLY
        </span>
        <span className="text-[0.8125rem] font-bold text-m-ink">
          Notification Testing
        </span>
      </div>

      {/* ── Type Testing ─────────────────────────────────────────────────── */}
      <MAdminCard>
        <MAdminCardHead
          title="Type Testing"
          hint="Test how each in-app notification type renders, sent to yourself."
        />
        <div className="mt-2 grid grid-cols-1 gap-2">
          <Btn sending={sending} id="simple-me" label="Simple → Me" sub="test_simple · user" icon={Bell} color="#6366f1"
            onClick={send.simpleMe}
          />
          <Btn sending={sending} id="boolean-me" label="Boolean → Me" sub="test_boolean · user" icon={CheckCircle} color="#10b981"
            onClick={send.booleanMe}
          />
          <Btn sending={sending} id="navigate-me" label="Navigate → Me" sub="test_navigate · user" icon={Navigation} color="#f59e0b"
            onClick={send.navigateMe}
          />
          <Btn sending={sending} id="simple-admins" label="Simple → All Admins" sub="test_simple · admin" icon={Zap} color="#ef4444"
            onClick={send.simpleAdmins}
          />
        </div>
      </MAdminCard>

      {/* ── Trip-Scoped Events ───────────────────────────────────────────── */}
      {trips.length > 0 && (
        <MAdminCard>
          <MAdminCardHead
            title="Trip-Scoped Events"
            hint="Fires each trip event to all members of the selected trip (excluding yourself)."
          />
          <div className="mt-2">
            <select
              value={selectedTripId ?? ''}
              onChange={e => setSelectedTripId(Number(e.target.value))}
              className={SELECT_CLASS}
            >
              {trips.map(trip => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
            </select>
            <div className="grid grid-cols-1 gap-2">
              <Btn sending={sending} id="booking_change" label="booking_change" sub="navigate · trip" icon={Calendar} color="#6366f1"
                onClick={send.bookingChange}
              />
              <Btn sending={sending} id="trip_reminder" label="trip_reminder" sub="navigate · trip" icon={Clock} color="#10b981"
                onClick={send.tripReminder}
              />
              <Btn sending={sending} id="photos_shared" label="photos_shared" sub="navigate · trip" icon={Image} color="#f59e0b"
                onClick={send.photosShared}
              />
              <Btn sending={sending} id="collab_message" label="collab_message" sub="navigate · trip" icon={MessageSquare} color="#8b5cf6"
                onClick={send.collabMessage}
              />
              <Btn sending={sending} id="packing_tagged" label="packing_tagged" sub="navigate · trip" icon={Tag} color="#ec4899"
                onClick={send.packingTagged}
              />
            </div>
          </div>
        </MAdminCard>
      )}

      {/* ── User-Scoped Events ───────────────────────────────────────────── */}
      {users.length > 0 && (
        <MAdminCard>
          <MAdminCardHead
            title="User-Scoped Events"
            hint="Fires each user event to the selected recipient."
          />
          <div className="mt-2">
            <select
              value={selectedUserId ?? ''}
              onChange={e => setSelectedUserId(Number(e.target.value))}
              className={SELECT_CLASS}
            >
              {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
            </select>
            <div className="grid grid-cols-1 gap-2">
              <Btn
                sending={sending}
                id={tripInviteId}
                label="trip_invite"
                sub="navigate · user"
                icon={UserPlus}
                color="#06b6d4"
                onClick={send.tripInvite}
              />
              <Btn
                sending={sending}
                id={vacayInviteId}
                label="vacay_invite"
                sub="navigate · user"
                icon={MapPin}
                color="#f97316"
                onClick={send.vacayInvite}
              />
            </div>
          </div>
        </MAdminCard>
      )}

      {/* ── Admin-Scoped Events ──────────────────────────────────────────── */}
      <MAdminCard>
        <MAdminCardHead
          title="Admin-Scoped Events"
          hint="Fires to all admin users."
        />
        <div className="mt-2 grid grid-cols-1 gap-2">
          <Btn sending={sending} id="version_available" label="version_available" sub="navigate · admin" icon={Download} color="#64748b"
            onClick={send.versionAvailable}
          />
        </div>
      </MAdminCard>
    </div>
  )
}
