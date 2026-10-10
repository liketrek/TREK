import { useEffect, useRef, useState } from 'react'
import type { TripMember } from '@trek/shared'
import { tripsApi, authApi, shareApi, tripInviteApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import { useAuthStore } from '../../store/authStore'
import { useCanDo } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import { useTranslation } from '../../i18n'
import { getApiErrorMessage } from '../../types'
import { copyText } from '../../utils/clipboard'

// The state behind the share dialog, shared by the desktop dialog and the one the
// phone opens from its More sheet. The questions ("Remove this member?") are the
// caller's: the desktop asks in a dialog of its own, the phone with the browser's.

export type SharePerm = 'share_map' | 'share_bookings' | 'share_packing' | 'share_budget' | 'share_collab' | 'share_travel_only' | 'share_hide_images'
type SharePerms = Record<SharePerm, boolean>

const DEFAULT_PERMS: SharePerms = {
  share_map: true, share_bookings: true, share_packing: false, share_budget: false, share_collab: false,
  share_travel_only: false, share_hide_images: false,
}

/** What the link shows, one tab each. */
export const SHARE_SECTIONS: { key: SharePerm; label: string; always?: boolean }[] = [
  { key: 'share_map', label: 'share.permMap', always: true },
  { key: 'share_bookings', label: 'share.permBookings' },
  { key: 'share_packing', label: 'share.permPacking' },
  { key: 'share_budget', label: 'share.permBudget' },
  { key: 'share_collab', label: 'share.permCollab' },
]

/** How the plan it shows is narrowed (#1712). */
export const SHARE_OPTIONS: { key: SharePerm; label: string }[] = [
  { key: 'share_travel_only', label: 'share.optTravelOnly' },
  { key: 'share_hide_images', label: 'share.optHideImages' },
]

/** Copy text and show "Copied" for two seconds, the timer restarting on every copy. */
function useCopied() {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  const copy = async (text: string | null) => {
    if (!text || !(await copyText(text))) return
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }
  return { copied, copy }
}

/** The public read-only link and what it may show. */
export function useShareLink(tripId: number) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [perms, setPerms] = useState<SharePerms>(DEFAULT_PERMS)
  const { copied, copy } = useCopied()
  const toast = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    shareApi.getLink(tripId).then(d => {
      setToken(d.token)
      if (d.token) setPerms({
        share_map: d.share_map ?? true, share_bookings: d.share_bookings ?? true, share_packing: d.share_packing ?? false,
        share_budget: d.share_budget ?? false, share_collab: d.share_collab ?? false,
        share_travel_only: d.share_travel_only ?? false, share_hide_images: d.share_hide_images ?? false,
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [tripId])

  const url = token ? `${window.location.origin}/shared/${token}` : null

  const create = async () => {
    try {
      const d = await shareApi.createLink(tripId, perms)
      setToken(d.token)
    } catch { toast.error(t('share.createError')) }
  }

  const setPerm = async (key: SharePerm, value: boolean) => {
    const next = { ...perms, [key]: value }
    setPerms(next)
    if (token) {
      try { await shareApi.createLink(tripId, next) } catch { toast.error(t('share.createError')) }
    }
  }

  const remove = async () => {
    try {
      await shareApi.deleteLink(tripId)
      setToken(null)
    } catch { toast.error(t('common.error')) }
  }

  return { loading, url, perms, copied, create, setPerm, remove, copy: () => copy(url) }
}

/** The rotating link an existing user opens to join the trip (#1143). */
export function useTripInviteLink(tripId: number) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const { copied, copy } = useCopied()
  const toast = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    tripInviteApi.getLink(tripId)
      .then((d: { token: string | null }) => setToken(d.token))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tripId])

  const url = token ? `${window.location.origin}/join/${token}` : null

  const create = async () => {
    setBusy(true)
    try { const d = await tripInviteApi.createLink(tripId); setToken(d.token) }
    catch { toast.error(t('share.createError')) }
    finally { setBusy(false) }
  }

  const remove = async () => {
    setBusy(true)
    try { await tripInviteApi.deleteLink(tripId); setToken(null) }
    catch { toast.error(t('common.error')) }
    finally { setBusy(false) }
  }

  return { loading, url, busy, copied, create, remove, copy: () => copy(url) }
}

interface MembersData { owner: TripMember; members: TripMember[] }
interface DirectoryUser { id: number; username: string; is_guest?: boolean }
export type ListedMember = TripMember & { role?: string }

/** The roster: members with an account, the guests without one, and the users who could still be invited. */
export function useTripMembers({ isOpen, tripId, onClose, onMembersChanged }: {
  isOpen: boolean
  tripId: number
  onClose: () => void
  /** After a change to the roster, so the planner can refresh Costs participants, Collab and the rest. */
  onMembersChanged?: () => void
}) {
  const [data, setData] = useState<MembersData | null>(null)
  const [allUsers, setAllUsers] = useState<DirectoryUser[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [transferringId, setTransferringId] = useState<number | null>(null)
  const [newGuestName, setNewGuestName] = useState('')
  const [addingGuest, setAddingGuest] = useState(false)
  const [renamingGuestId, setRenamingGuestId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const toast = useToast()
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const can = useCanDo()
  const trip = useTripStore(s => s.trip)
  const loadBudgetItems = useTripStore(s => s.loadBudgetItems)

  const loadMembers = async (notify = false) => {
    setLoading(true)
    try {
      setData(await tripsApi.getMembers(tripId))
      // Only after an actual change: the load on opening would be a redundant re-sync.
      if (notify) onMembersChanged?.()
    } catch {
      toast.error(t('members.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen || !tripId) return
    void loadMembers()
    authApi.listUsers().then(d => setAllUsers(d.users)).catch(() => {})
  }, [isOpen, tripId])

  const add = async () => {
    const target = allUsers.find(u => String(u.id) === String(selectedUserId))
    if (!target) return
    setAdding(true)
    try {
      await tripsApi.addMember(tripId, target.username)
      setSelectedUserId('')
      await loadMembers(true)
      toast.success(`${target.username} ${t('members.added')}`)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('members.addError')))
    } finally {
      setAdding(false)
    }
  }

  const transfer = async (newOwnerId: number) => {
    setTransferringId(newOwnerId)
    try {
      await tripsApi.transferOwnership(tripId, newOwnerId)
      // The current user just dropped from owner to member: reload so the trip
      // and the permissions everywhere reflect the new ownership.
      onClose()
      window.location.reload()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('members.transferError')))
      setTransferringId(null)
    }
  }

  const remove = async (userId: number, isSelf: boolean) => {
    setRemovingId(userId)
    try {
      await tripsApi.removeMember(tripId, userId)
      if (isSelf) { onClose(); window.location.reload() }
      else { await loadMembers(true); toast.success(t('members.removed')) }
    } catch {
      toast.error(t('members.removeError'))
    } finally {
      setRemovingId(null)
    }
  }

  const addGuest = async () => {
    const name = newGuestName.trim()
    if (!name) return
    setAddingGuest(true)
    try {
      await tripsApi.createGuest(tripId, name)
      setNewGuestName('')
      await loadMembers(true)
      toast.success(t('members.guestAdded'))
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('members.guestAddError')))
    } finally {
      setAddingGuest(false)
    }
  }

  // Enter commits, and the blur that follows would send the same rename a second
  // time. Only the first commit per editing session goes through; a failed one
  // reopens the gate so the user can retry from the still-open input.
  const renameCommitted = useRef(false)

  const startRename = (guest: TripMember) => {
    renameCommitted.current = false
    setRenamingGuestId(guest.id)
    setRenameValue(guest.username)
  }

  const cancelRename = () => {
    renameCommitted.current = true
    setRenamingGuestId(null)
  }

  const commitRename = async (userId: number) => {
    if (renameCommitted.current) return
    renameCommitted.current = true
    const name = renameValue.trim()
    if (!name) { setRenamingGuestId(null); return }
    try {
      await tripsApi.renameGuest(tripId, userId, name)
      setRenamingGuestId(null)
      await loadMembers(true)
    } catch (err: unknown) {
      renameCommitted.current = false
      toast.error(getApiErrorMessage(err, t('members.guestRenameError')))
    }
  }

  const removeGuest = async (userId: number) => {
    setRemovingId(userId)
    try {
      await tripsApi.deleteGuest(tripId, userId)
      await loadMembers(true)
      await loadBudgetItems(tripId)
      toast.success(t('members.guestRemoved'))
    } catch {
      toast.error(t('members.removeError'))
    } finally {
      setRemovingId(null)
    }
  }

  // Guests are accountless and never live in the directory.
  const existingIds = new Set([data?.owner?.id, ...(data?.members?.map(m => m.id) || [])])
  const availableUsers = allUsers.filter(u => !existingIds.has(u.id) && !u.is_guest)
  // Real members (owner and accounts) and guests (#1362) are listed apart.
  const realMembers: ListedMember[] = data ? [{ ...data.owner, role: 'owner' }, ...data.members.filter(m => !m.is_guest)] : []
  const guests = data ? data.members.filter(m => m.is_guest) : []

  return {
    user, loading, realMembers, guests, allUsers, availableUsers,
    isCurrentOwner: !!data && data.owner?.id === user?.id,
    canManageMembers: can('member_manage', trip),
    canManageShare: can('share_manage', trip),
    selectedUserId, setSelectedUserId, adding, add,
    transferringId, transfer, removingId, remove,
    newGuestName, setNewGuestName, addingGuest, addGuest,
    renamingGuestId, renameValue, setRenameValue, startRename, cancelRename, commitRename, removeGuest,
  }
}

export type TripMembersState = ReturnType<typeof useTripMembers>
export type ShareLinkState = ReturnType<typeof useShareLink>
export type InviteLinkState = ReturnType<typeof useTripInviteLink>
