import { create } from 'zustand'
import apiClient from '../api/client'
import { useAuthStore } from './authStore'
import type { AxiosResponse } from 'axios'
import type {
  VacayPlan, VacayUser, VacayEntry, VacayStat, HolidaysMap, HolidayInfo, VacayHolidayCalendar,
  VacayShareOutgoing, VacayShareIncoming, SharedVacayCalendar,
} from '../types'
import type {
  VacaySetColorRequest, VacayInviteRequest, VacayInviteActionRequest,
  VacayAddYearRequest, VacayToggleEntryRequest, VacayCompanyHolidayRequest,
  VacayUpdateStatsRequest, VacayShareRequest, VacayShareUpdateRequest,
} from '@trek/shared'

const ax = apiClient

interface PendingInvite {
  user_id: number
  username: string
}

interface IncomingInvite {
  plan_id: number
  owner_username: string
}

interface VacayPlanResponse {
  plan: VacayPlan
  users: VacayUser[]
  pendingInvites: PendingInvite[]
  incomingInvites: IncomingInvite[]
  isOwner: boolean
  isFused: boolean
}

interface VacayYearsResponse {
  years: number[]
}

interface VacayEntriesResponse {
  entries: VacayEntry[]
  companyHolidays: { date: string; note?: string }[]
}

interface VacayStatsResponse {
  stats: VacayStat[]
}

interface VacayHolidayRaw {
  date: string
  name: string
  localName: string
  global: boolean
  counties: string[] | null
}

interface VacayApi {
  getPlan: () => Promise<VacayPlanResponse>
  updatePlan: (data: Partial<VacayPlan>) => Promise<{ plan: VacayPlan }>
  updateColor: (color: string, targetUserId?: number) => Promise<unknown>
  invite: (userId: number) => Promise<unknown>
  acceptInvite: (planId: number) => Promise<unknown>
  declineInvite: (planId: number) => Promise<unknown>
  cancelInvite: (userId: number) => Promise<unknown>
  dissolve: () => Promise<unknown>
  availableUsers: () => Promise<{ users: VacayUser[] }>
  getYears: () => Promise<VacayYearsResponse>
  addYear: (year: number) => Promise<VacayYearsResponse>
  removeYear: (year: number) => Promise<VacayYearsResponse>
  getEntries: (year: number) => Promise<VacayEntriesResponse>
  toggleEntry: (date: string, targetUserId?: number, fraction?: 0.5 | 1) => Promise<unknown>
  toggleCompanyHoliday: (date: string) => Promise<unknown>
  getStats: (year: number) => Promise<VacayStatsResponse>
  updateStats: (year: number, days: number, targetUserId?: number) => Promise<unknown>
  getCountries: () => Promise<{ countries: string[] }>
  getHolidays: (year: number, country: string) => Promise<VacayHolidayRaw[]>
  addHolidayCalendar: (data: { region: string; color?: string; label?: string | null }) => Promise<{ calendar: VacayHolidayCalendar }>
  updateHolidayCalendar: (id: number, data: { region?: string; color?: string; label?: string | null }) => Promise<{ calendar: VacayHolidayCalendar }>
  deleteHolidayCalendar: (id: number) => Promise<unknown>
  getShares: () => Promise<{ outgoing: VacayShareOutgoing[]; incoming: VacayShareIncoming[] }>
  share: (userId: number) => Promise<unknown>
  removeShare: (shareId: number) => Promise<unknown>
  updateShare: (shareId: number, hidden: boolean) => Promise<unknown>
  shareAvailableUsers: () => Promise<{ users: VacayUser[] }>
  getSharedCalendars: (year: number) => Promise<{ calendars: SharedVacayCalendar[] }>
}

const api: VacayApi = {
  getPlan: () => ax.get('/addons/vacay/plan').then((r: AxiosResponse) => r.data),
  updatePlan: (data) => ax.put('/addons/vacay/plan', data).then((r: AxiosResponse) => r.data),
  updateColor: (color, targetUserId) => ax.put('/addons/vacay/color', { color, target_user_id: targetUserId } satisfies VacaySetColorRequest).then((r: AxiosResponse) => r.data),
  invite: (userId) => ax.post('/addons/vacay/invite', { user_id: userId } satisfies VacayInviteRequest).then((r: AxiosResponse) => r.data),
  acceptInvite: (planId) => ax.post('/addons/vacay/invite/accept', { plan_id: planId } satisfies VacayInviteActionRequest).then((r: AxiosResponse) => r.data),
  declineInvite: (planId) => ax.post('/addons/vacay/invite/decline', { plan_id: planId } satisfies VacayInviteActionRequest).then((r: AxiosResponse) => r.data),
  cancelInvite: (userId) => ax.post('/addons/vacay/invite/cancel', { user_id: userId }).then((r: AxiosResponse) => r.data),
  dissolve: () => ax.post('/addons/vacay/dissolve').then((r: AxiosResponse) => r.data),
  availableUsers: () => ax.get('/addons/vacay/available-users').then((r: AxiosResponse) => r.data),
  getYears: () => ax.get('/addons/vacay/years').then((r: AxiosResponse) => r.data),
  addYear: (year) => ax.post('/addons/vacay/years', { year } satisfies VacayAddYearRequest).then((r: AxiosResponse) => r.data),
  removeYear: (year) => ax.delete(`/addons/vacay/years/${year}`).then((r: AxiosResponse) => r.data),
  getEntries: (year) => ax.get(`/addons/vacay/entries/${year}`).then((r: AxiosResponse) => r.data),
  toggleEntry: (date, targetUserId, fraction) => ax.post('/addons/vacay/entries/toggle', { date, target_user_id: targetUserId, fraction } satisfies VacayToggleEntryRequest).then((r: AxiosResponse) => r.data),
  toggleCompanyHoliday: (date) => ax.post('/addons/vacay/entries/company-holiday', { date } satisfies VacayCompanyHolidayRequest).then((r: AxiosResponse) => r.data),
  getStats: (year) => ax.get(`/addons/vacay/stats/${year}`).then((r: AxiosResponse) => r.data),
  updateStats: (year, days, targetUserId) => ax.put(`/addons/vacay/stats/${year}`, { vacation_days: days, target_user_id: targetUserId } satisfies VacayUpdateStatsRequest).then((r: AxiosResponse) => r.data),
  getCountries: () => ax.get('/addons/vacay/holidays/countries').then((r: AxiosResponse) => r.data),
  getHolidays: (year, country) => ax.get(`/addons/vacay/holidays/${year}/${country}`).then((r: AxiosResponse) => r.data),
  addHolidayCalendar: (data) => ax.post('/addons/vacay/plan/holiday-calendars', data).then((r: AxiosResponse) => r.data),
  updateHolidayCalendar: (id, data) => ax.put(`/addons/vacay/plan/holiday-calendars/${id}`, data).then((r: AxiosResponse) => r.data),
  deleteHolidayCalendar: (id) => ax.delete(`/addons/vacay/plan/holiday-calendars/${id}`).then((r: AxiosResponse) => r.data),
  getShares: () => ax.get('/addons/vacay/shares').then((r: AxiosResponse) => r.data),
  share: (userId) => ax.post('/addons/vacay/shares', { user_id: userId } satisfies VacayShareRequest).then((r: AxiosResponse) => r.data),
  removeShare: (shareId) => ax.delete(`/addons/vacay/shares/${shareId}`).then((r: AxiosResponse) => r.data),
  updateShare: (shareId, hidden) => ax.put(`/addons/vacay/shares/${shareId}`, { hidden } satisfies VacayShareUpdateRequest).then((r: AxiosResponse) => r.data),
  shareAvailableUsers: () => ax.get('/addons/vacay/shares/available-users').then((r: AxiosResponse) => r.data),
  getSharedCalendars: (year) => ax.get(`/addons/vacay/shares/calendars/${year}`).then((r: AxiosResponse) => r.data),
}

interface VacayState {
  plan: VacayPlan | null
  users: VacayUser[]
  pendingInvites: PendingInvite[]
  incomingInvites: IncomingInvite[]
  isOwner: boolean
  isFused: boolean
  years: number[]
  entries: VacayEntry[]
  companyHolidays: { date: string; note?: string }[]
  stats: VacayStat[]
  selectedYear: number
  selectedUserId: number | null
  holidays: HolidaysMap
  loading: boolean
  outgoingShares: VacayShareOutgoing[]
  incomingShares: VacayShareIncoming[]
  sharedCalendars: SharedVacayCalendar[]

  setSelectedYear: (year: number) => void
  setSelectedUserId: (id: number | null) => void
  loadPlan: () => Promise<void>
  updatePlan: (updates: Partial<VacayPlan>) => Promise<void>
  updateColor: (color: string, targetUserId?: number) => Promise<void>
  invite: (userId: number) => Promise<void>
  acceptInvite: (planId: number) => Promise<void>
  declineInvite: (planId: number) => Promise<void>
  cancelInvite: (userId: number) => Promise<void>
  dissolve: () => Promise<void>
  loadYears: () => Promise<void>
  addYear: (year: number) => Promise<void>
  removeYear: (year: number) => Promise<void>
  loadEntries: (year?: number) => Promise<void>
  toggleEntry: (date: string, targetUserId?: number, fraction?: 0.5 | 1) => Promise<void>
  toggleCompanyHoliday: (date: string) => Promise<void>
  loadStats: (year?: number) => Promise<void>
  updateVacationDays: (year: number, days: number, targetUserId?: number) => Promise<void>
  loadHolidays: (year?: number) => Promise<void>
  addHolidayCalendar: (data: { region: string; color?: string; label?: string | null }) => Promise<void>
  updateHolidayCalendar: (id: number, data: { region?: string; color?: string; label?: string | null }) => Promise<void>
  deleteHolidayCalendar: (id: number) => Promise<void>
  loadShares: () => Promise<void>
  loadSharedCalendars: (year?: number) => Promise<void>
  shareWith: (userId: number) => Promise<void>
  removeShare: (shareId: number) => Promise<void>
  setShareHidden: (shareId: number, hidden: boolean) => Promise<void>
  loadAll: () => Promise<void>
}

export const useVacayStore = create<VacayState>((set, get) => ({
  plan: null,
  users: [],
  pendingInvites: [],
  incomingInvites: [],
  isOwner: true,
  isFused: false,
  years: [],
  entries: [],
  companyHolidays: [],
  stats: [],
  selectedYear: new Date().getFullYear(),
  selectedUserId: null,
  holidays: {},
  loading: false,
  outgoingShares: [],
  incomingShares: [],
  sharedCalendars: [],

  setSelectedYear: (year: number) => set({ selectedYear: year }),
  setSelectedUserId: (id: number | null) => set({ selectedUserId: id }),

  loadPlan: async () => {
    const data = await api.getPlan()
    set({
      plan: data.plan,
      users: data.users,
      pendingInvites: data.pendingInvites,
      incomingInvites: data.incomingInvites,
      isOwner: data.isOwner,
      isFused: data.isFused,
    })
  },

  updatePlan: async (updates: Partial<VacayPlan>) => {
    const data = await api.updatePlan(updates)
    set({ plan: data.plan })
    await get().loadEntries()
    await get().loadStats()
    await get().loadHolidays()
  },

  updateColor: async (color: string, targetUserId?: number) => {
    await api.updateColor(color, targetUserId)
    await get().loadPlan()
    await get().loadEntries()
  },

  invite: async (userId: number) => {
    await api.invite(userId)
    await get().loadPlan()
  },

  acceptInvite: async (planId: number) => {
    await api.acceptInvite(planId)
    await get().loadAll()
  },

  declineInvite: async (planId: number) => {
    await api.declineInvite(planId)
    await get().loadPlan()
  },

  cancelInvite: async (userId: number) => {
    await api.cancelInvite(userId)
    await get().loadPlan()
  },

  dissolve: async () => {
    await api.dissolve()
    await get().loadAll()
  },

  loadYears: async () => {
    const data = await api.getYears()
    set({ years: data.years })
    if (data.years.length > 0) {
      set({ selectedYear: data.years[data.years.length - 1] })
    }
  },

  addYear: async (year: number) => {
    const data = await api.addYear(year)
    set({ years: data.years })
    await get().loadStats(year)
  },

  removeYear: async (year: number) => {
    const data = await api.removeYear(year)
    const updates: Partial<VacayState> = { years: data.years }
    if (get().selectedYear === year) {
      updates.selectedYear = data.years.length > 0
        ? data.years[data.years.length - 1]
        : new Date().getFullYear()
    }
    set(updates)
    await get().loadStats()
  },

  loadEntries: async (year?: number) => {
    const y = year || get().selectedYear
    const data = await api.getEntries(y)
    set({ entries: data.entries, companyHolidays: data.companyHolidays })
  },

  toggleEntry: async (date: string, targetUserId?: number, fraction: 0.5 | 1 = 1) => {
    // Optimistic: mirror the server's toggle locally so the cell reacts instantly,
    // then reconcile (stats are server-computed). Same fraction clears the day, a
    // different one converts it (full ↔ half); an empty day gets the new entry.
    const userId = targetUserId ?? useAuthStore.getState().user?.id
    const prevEntries = get().entries
    const prevStats = get().stats
    if (userId != null) {
      const existing = prevEntries.find(e => e.date === date && e.user_id === userId)
      if (existing && (existing.fraction ?? 1) === fraction) {
        set({ entries: prevEntries.filter(e => !(e.date === date && e.user_id === userId)) })
      } else if (existing) {
        set({ entries: prevEntries.map(e => (e.date === date && e.user_id === userId ? { ...e, fraction } : e)) })
      } else {
        const u = get().users.find(x => x.id === userId)
        set({ entries: [...prevEntries, { date, user_id: userId, fraction, person_color: u?.color || undefined, person_name: u?.username }] })
      }
    }
    try {
      await api.toggleEntry(date, targetUserId, fraction)
      await get().loadEntries()
      await get().loadStats()
    } catch (e) {
      set({ entries: prevEntries, stats: prevStats })
      throw e
    }
  },

  toggleCompanyHoliday: async (date: string) => {
    // Optimistic like toggleEntry; a company holiday also overrides personal
    // entries on that day, so refetch entries afterwards to reconcile.
    const prevEntries = get().entries
    const prevCompany = get().companyHolidays
    const prevStats = get().stats
    const has = prevCompany.some(h => h.date === date)
    set({ companyHolidays: has ? prevCompany.filter(h => h.date !== date) : [...prevCompany, { date }] })
    try {
      await api.toggleCompanyHoliday(date)
      await get().loadEntries()
      await get().loadStats()
    } catch (e) {
      set({ entries: prevEntries, companyHolidays: prevCompany, stats: prevStats })
      throw e
    }
  },

  loadStats: async (year?: number) => {
    const y = year || get().selectedYear
    const data = await api.getStats(y)
    set({ stats: data.stats })
  },

  updateVacationDays: async (year: number, days: number, targetUserId?: number) => {
    await api.updateStats(year, days, targetUserId)
    await get().loadStats(year)
  },

  loadHolidays: async (year?: number) => {
    const y = year || get().selectedYear
    const plan = get().plan
    const calendars = plan?.holiday_calendars ?? []
    if (!plan?.holidays_enabled || calendars.length === 0) {
      set({ holidays: {} })
      return
    }
    const map: HolidaysMap = {}
    for (const cal of calendars) {
      const country = cal.region.split('-')[0]
      const region = cal.region.includes('-') ? cal.region : null
      try {
        const data = await api.getHolidays(y, country)
        const hasRegions = data.some((h: VacayHolidayRaw) => h.counties && h.counties.length > 0)
        if (hasRegions && !region) continue
        data.forEach((h: VacayHolidayRaw) => {
          if (h.global || !h.counties || (region && h.counties.includes(region))) {
            if (!map[h.date]) {
              map[h.date] = { name: h.name, localName: h.localName, color: cal.color, label: cal.label }
            }
          }
        })
      } catch { /* API error, skip */ }
    }
    set({ holidays: map })
  },

  addHolidayCalendar: async (data) => {
    await api.addHolidayCalendar(data)
    await get().loadPlan()
    await get().loadHolidays()
  },

  updateHolidayCalendar: async (id, data) => {
    await api.updateHolidayCalendar(id, data)
    await get().loadPlan()
    await get().loadHolidays()
  },

  deleteHolidayCalendar: async (id) => {
    await api.deleteHolidayCalendar(id)
    await get().loadPlan()
    await get().loadHolidays()
  },

  loadShares: async () => {
    const data = await api.getShares()
    set({ outgoingShares: data.outgoing, incomingShares: data.incoming })
  },

  loadSharedCalendars: async (year?: number) => {
    const y = year || get().selectedYear
    const data = await api.getSharedCalendars(y)
    set({ sharedCalendars: data.calendars })
  },

  shareWith: async (userId: number) => {
    await api.share(userId)
    await get().loadShares()
  },

  removeShare: async (shareId: number) => {
    await api.removeShare(shareId)
    await get().loadShares()
    await get().loadSharedCalendars()
  },

  setShareHidden: async (shareId: number, hidden: boolean) => {
    // Optimistic: the eye toggle should feel instant; reconcile via refetch.
    const prevIncoming = get().incomingShares
    const prevCalendars = get().sharedCalendars
    set({
      incomingShares: prevIncoming.map(s => (s.id === shareId ? { ...s, hidden } : s)),
      sharedCalendars: prevCalendars.map(c => (c.share_id === shareId ? { ...c, hidden } : c)),
    })
    try {
      await api.updateShare(shareId, hidden)
    } catch (e) {
      set({ incomingShares: prevIncoming, sharedCalendars: prevCalendars })
      throw e
    }
  },

  loadAll: async () => {
    set({ loading: true })
    try {
      await get().loadPlan()
      await get().loadYears()
      const year = get().selectedYear
      await get().loadEntries(year)
      await get().loadStats(year)
      await get().loadHolidays(year)
      await get().loadShares()
      await get().loadSharedCalendars(year)
    } finally {
      set({ loading: false })
    }
  },
}))
