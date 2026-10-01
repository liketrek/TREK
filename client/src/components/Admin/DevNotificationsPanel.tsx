import React, { useState, useEffect, useId } from 'react'
import { adminApi, tripsApi } from '../../api/client'
import { getApiErrorMessage } from '../../utils/apiError'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../shared/Toast'
import { fs } from '../shared/DialogShell'
import { EditorField, INPUT } from '../shared/dialogParts'
import { SettingsCard, StatusPill } from '../Settings/settingsKit'
import {
  Bell, Zap, CheckCircle, Navigation, User, Calendar, Clock, Image, MessageSquare, Tag, UserPlus,
  Download, MapPin, ChevronDown, FlaskConical, Loader2, Map as MapIcon, ShieldCheck,
} from 'lucide-react'

interface Trip {
  id: number
  title: string
}

interface AppUser {
  id: number
  username: string
  email: string
}

/** A native select in the editors' box look, with the chevron the CustomSelect draws. */
const SELECT = `${INPUT} appearance-none pr-9`

function SelectBox({ id, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>): React.ReactElement {
  return (
    <div className="relative">
      <select id={id} {...rest} className={SELECT}>{children}</select>
      <ChevronDown size={14} strokeWidth={2.2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-content-faint" />
    </div>
  )
}

/** The buttons of one group, two to a row from a small window up. */
function ButtonGrid({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
}

export default function DevNotificationsPanel(): React.ReactElement {
  const toast = useToast()
  const ids = useId()
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
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed'))
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
    id, label, sub, icon: Icon, onClick,
  }: {
    id: string; label: string; sub: string; icon: React.ElementType; onClick: () => void
  }) => (
    <button type="button"
      onClick={onClick}
      disabled={sending !== null}
      className="flex w-full min-w-0 items-center gap-3 rounded-[12px] border border-edge-faint bg-surface-card px-3 py-2.5 text-left transition-colors hover:bg-surface-secondary disabled:cursor-default"
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
            onClick={() => fire('simple-me', {
              event: 'test_simple',
              scope: 'user',
              targetId: user?.id,
              params: {},
            })}
          />
          <Btn id="boolean-me" label="Boolean → Me" sub="test_boolean · user" icon={CheckCircle}
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
          <Btn id="navigate-me" label="Navigate → Me" sub="test_navigate · user" icon={Navigation}
            onClick={() => fire('navigate-me', {
              event: 'test_navigate',
              scope: 'user',
              targetId: user?.id,
              params: {},
            })}
          />
          <Btn id="simple-admins" label="Simple → All Admins" sub="test_simple · admin" icon={Zap}
            onClick={() => fire('simple-admins', {
              event: 'test_simple',
              scope: 'admin',
              targetId: 0,
              params: {},
            })}
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
              onClick={() => selectedTripId && fire('booking_change', {
                event: 'booking_change',
                scope: 'trip',
                targetId: selectedTripId,
                params: { actor: username, trip: tripTitle, booking: 'Test Hotel', type: 'hotel', tripId: String(selectedTripId) },
              })}
            />
            <Btn id="trip_reminder" label="trip_reminder" sub="navigate · trip" icon={Clock}
              onClick={() => selectedTripId && fire('trip_reminder', {
                event: 'trip_reminder',
                scope: 'trip',
                targetId: selectedTripId,
                params: { trip: tripTitle, tripId: String(selectedTripId) },
              })}
            />
            <Btn id="photos_shared" label="photos_shared" sub="navigate · trip" icon={Image}
              onClick={() => selectedTripId && fire('photos_shared', {
                event: 'photos_shared',
                scope: 'trip',
                targetId: selectedTripId,
                params: { actor: username, trip: tripTitle, count: '5', tripId: String(selectedTripId) },
              })}
            />
            <Btn id="collab_message" label="collab_message" sub="navigate · trip" icon={MessageSquare}
              onClick={() => selectedTripId && fire('collab_message', {
                event: 'collab_message',
                scope: 'trip',
                targetId: selectedTripId,
                params: { actor: username, trip: tripTitle, preview: 'This is a test message preview.', tripId: String(selectedTripId) },
              })}
            />
            <Btn id="packing_tagged" label="packing_tagged" sub="navigate · trip" icon={Tag}
              onClick={() => selectedTripId && fire('packing_tagged', {
                event: 'packing_tagged',
                scope: 'trip',
                targetId: selectedTripId,
                params: { actor: username, trip: tripTitle, category: 'Clothing', tripId: String(selectedTripId) },
              })}
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
              id={`trip_invite-${selectedUserId}`}
              label="trip_invite"
              sub="navigate · user"
              icon={UserPlus}
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
              onClick={() => selectedUserId && fire(`vacay_invite-${selectedUserId}`, {
                event: 'vacay_invite',
                scope: 'user',
                targetId: selectedUserId,
                params: { actor: username, planId: '1' },
              })}
            />
          </ButtonGrid>
        </SettingsCard>
      )}

      {/* ── Admin-Scoped Events ──────────────────────────────────────────── */}
      <SettingsCard icon={ShieldCheck} title="Admin-Scoped Events" hint="Fires to all admin users.">
        <ButtonGrid>
          <Btn id="version_available" label="version_available" sub="navigate · admin" icon={Download}
            onClick={() => fire('version_available', {
              event: 'version_available',
              scope: 'admin',
              targetId: 0,
              params: { version: '9.9.9-test' },
            })}
          />
        </ButtonGrid>
      </SettingsCard>
    </div>
  )
}
