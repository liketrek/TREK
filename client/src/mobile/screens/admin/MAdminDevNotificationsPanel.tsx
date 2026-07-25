import React, { useState, useEffect } from 'react'
import {
  Bell, Zap, CheckCircle, Navigation, Calendar, Clock, Image,
  MessageSquare, Tag, UserPlus, Download, MapPin, Loader2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { adminApi, tripsApi } from '../../../api/client'
import { useAuthStore } from '../../../store/authStore'
import { useToast } from '../../../components/shared/Toast'
import { MAdminCard, MAdminCardHead } from './MAdminUi'

interface Trip {
  id: number
  title: string
}

interface AppUser {
  id: number
  username: string
  email: string
}

// Dev-only notification testing panel, re-skinned to the mobile admin system.
// All state, fetches and fire() payloads are ported verbatim from the desktop
// DevNotificationsPanel — only the presentation layer changes.
export default function MAdminDevNotificationsPanel(): React.ReactElement {
  const toast = useToast()
  const user = useAuthStore(s => s.user)
  const [sending, setSending] = useState<string | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null)
  const [users, setUsers] = useState<AppUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  useEffect(() => {
    tripsApi.list().then(data => {
      const list = (data.trips || data || []) as Trip[]
      setTrips(list)
      if (list.length > 0) setSelectedTripId(list[0].id)
    }).catch(() => {})
    adminApi.users().then(data => {
      const list = (data.users || data || []) as AppUser[]
      setUsers(list)
      if (list.length > 0) setSelectedUserId(list[0].id)
    }).catch(() => {})
  }, [])

  const fire = async (label: string, payload: Record<string, unknown>) => {
    setSending(label)
    try {
      await adminApi.sendTestNotification(payload)
      toast.success(`Sent: ${label}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed')
    } finally {
      setSending(null)
    }
  }

  const selectedTrip = trips.find(t => t.id === selectedTripId)
  const selectedUser = users.find(u => u.id === selectedUserId)
  const username = user?.username || 'Admin'
  const tripTitle = selectedTrip?.title || 'Test Trip'

  // ── Helpers ──────────────────────────────────────────────────────────────

  const Btn = ({
    id, label, sub, icon: Icon, color, onClick,
  }: {
    id: string; label: string; sub: string; icon: LucideIcon; color: string; onClick: () => void
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={sending !== null}
      className="flex w-full items-center gap-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[11px] text-left disabled:opacity-50"
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

  const TripSelector = () => (
    <select
      value={selectedTripId ?? ''}
      onChange={e => setSelectedTripId(Number(e.target.value))}
      className="mb-2 h-[42px] w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 text-[0.84375rem] text-m-ink outline-none focus:border-[color:var(--m-faint)]"
    >
      {trips.map(trip => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
    </select>
  )

  const UserSelector = () => (
    <select
      value={selectedUserId ?? ''}
      onChange={e => setSelectedUserId(Number(e.target.value))}
      className="mb-2 h-[42px] w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 text-[0.84375rem] text-m-ink outline-none focus:border-[color:var(--m-faint)]"
    >
      {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
    </select>
  )

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
          <Btn id="simple-me" label="Simple → Me" sub="test_simple · user" icon={Bell} color="#6366f1"
            onClick={() => fire('simple-me', {
              event: 'test_simple',
              scope: 'user',
              targetId: user?.id,
              params: {},
            })}
          />
          <Btn id="boolean-me" label="Boolean → Me" sub="test_boolean · user" icon={CheckCircle} color="#10b981"
            onClick={() => fire('boolean-me', {
              event: 'test_boolean',
              scope: 'user',
              targetId: user?.id,
              params: {},
              inApp: {
                type: 'boolean',
                positiveCallback: { action: 'test_approve', payload: {} },
                negativeCallback: { action: 'test_deny', payload: {} },
              },
            })}
          />
          <Btn id="navigate-me" label="Navigate → Me" sub="test_navigate · user" icon={Navigation} color="#f59e0b"
            onClick={() => fire('navigate-me', {
              event: 'test_navigate',
              scope: 'user',
              targetId: user?.id,
              params: {},
            })}
          />
          <Btn id="simple-admins" label="Simple → All Admins" sub="test_simple · admin" icon={Zap} color="#ef4444"
            onClick={() => fire('simple-admins', {
              event: 'test_simple',
              scope: 'admin',
              targetId: 0,
              params: {},
            })}
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
            <TripSelector />
            <div className="grid grid-cols-1 gap-2">
              <Btn id="booking_change" label="booking_change" sub="navigate · trip" icon={Calendar} color="#6366f1"
                onClick={() => selectedTripId && fire('booking_change', {
                  event: 'booking_change',
                  scope: 'trip',
                  targetId: selectedTripId,
                  params: { actor: username, trip: tripTitle, booking: 'Test Hotel', type: 'hotel', tripId: String(selectedTripId) },
                })}
              />
              <Btn id="trip_reminder" label="trip_reminder" sub="navigate · trip" icon={Clock} color="#10b981"
                onClick={() => selectedTripId && fire('trip_reminder', {
                  event: 'trip_reminder',
                  scope: 'trip',
                  targetId: selectedTripId,
                  params: { trip: tripTitle, tripId: String(selectedTripId) },
                })}
              />
              <Btn id="photos_shared" label="photos_shared" sub="navigate · trip" icon={Image} color="#f59e0b"
                onClick={() => selectedTripId && fire('photos_shared', {
                  event: 'photos_shared',
                  scope: 'trip',
                  targetId: selectedTripId,
                  params: { actor: username, trip: tripTitle, count: '5', tripId: String(selectedTripId) },
                })}
              />
              <Btn id="collab_message" label="collab_message" sub="navigate · trip" icon={MessageSquare} color="#8b5cf6"
                onClick={() => selectedTripId && fire('collab_message', {
                  event: 'collab_message',
                  scope: 'trip',
                  targetId: selectedTripId,
                  params: { actor: username, trip: tripTitle, preview: 'This is a test message preview.', tripId: String(selectedTripId) },
                })}
              />
              <Btn id="packing_tagged" label="packing_tagged" sub="navigate · trip" icon={Tag} color="#ec4899"
                onClick={() => selectedTripId && fire('packing_tagged', {
                  event: 'packing_tagged',
                  scope: 'trip',
                  targetId: selectedTripId,
                  params: { actor: username, trip: tripTitle, category: 'Clothing', tripId: String(selectedTripId) },
                })}
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
            <UserSelector />
            <div className="grid grid-cols-1 gap-2">
              <Btn
                id={`trip_invite-${selectedUserId}`}
                label="trip_invite"
                sub="navigate · user"
                icon={UserPlus}
                color="#06b6d4"
                onClick={() => selectedUserId && fire(`trip_invite-${selectedUserId}`, {
                  event: 'trip_invite',
                  scope: 'user',
                  targetId: selectedUserId,
                  params: { actor: username, trip: tripTitle, invitee: selectedUser?.email || '', tripId: String(selectedTripId ?? 0) },
                })}
              />
              <Btn
                id={`vacay_invite-${selectedUserId}`}
                label="vacay_invite"
                sub="navigate · user"
                icon={MapPin}
                color="#f97316"
                onClick={() => selectedUserId && fire(`vacay_invite-${selectedUserId}`, {
                  event: 'vacay_invite',
                  scope: 'user',
                  targetId: selectedUserId,
                  params: { actor: username, planId: '1' },
                })}
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
          <Btn id="version_available" label="version_available" sub="navigate · admin" icon={Download} color="#64748b"
            onClick={() => fire('version_available', {
              event: 'version_available',
              scope: 'admin',
              targetId: 0,
              params: { version: '9.9.9-test' },
            })}
          />
        </div>
      </MAdminCard>
    </div>
  )
}
