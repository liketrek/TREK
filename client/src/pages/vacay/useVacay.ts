import { useEffect, useState, useCallback } from 'react'
import { useVacayStore } from '../../store/vacayStore'
import { addListener, removeListener } from '../../api/websocket'

/**
 * Vacay page logic — pulls the vacay store, owns the page-local UI state
 * (settings modal, delete-year prompt, mobile drawer), wires the WebSocket live
 * sync and the per-year (re)loads, and exposes the add-prev/next-year helpers.
 * VacayPage stays a wiring container around its sidebar/calendar JSX.
 * Behaviour is identical to the previous in-component logic.
 */
export function useVacay() {
  const { years, selectedYear, setSelectedYear, addYear, removeYear, loadAll, loadPlan, loadEntries, loadStats, loadHolidays, loading, incomingInvites, acceptInvite, declineInvite, plan } = useVacayStore()
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [deleteYear, setDeleteYear] = useState<number | null>(null)
  const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(false)

  useEffect(() => { loadAll() }, [])

  // Live sync via WebSocket
  const handleWsMessage = useCallback((msg: { type: string }) => {
    if (msg.type === 'vacay:update' || msg.type === 'vacay:settings') {
      loadPlan()
      loadEntries(selectedYear)
      loadStats(selectedYear)
      if (msg.type === 'vacay:settings') loadAll()
    }
    if (msg.type === 'vacay:invite' || msg.type === 'vacay:accepted' || msg.type === 'vacay:declined' || msg.type === 'vacay:cancelled' || msg.type === 'vacay:dissolved') {
      loadAll()
    }
  }, [selectedYear])

  useEffect(() => {
    addListener(handleWsMessage)
    return () => removeListener(handleWsMessage)
  }, [handleWsMessage])
  useEffect(() => {
    if (selectedYear) { loadEntries(selectedYear); loadStats(selectedYear); loadHolidays(selectedYear) }
  }, [selectedYear])

  const handleAddNextYear = () => {
    const nextYear = years.length > 0 ? Math.max(...years) + 1 : new Date().getFullYear()
    addYear(nextYear)
  }

  const handleAddPrevYear = () => {
    const prevYear = years.length > 0 ? Math.min(...years) - 1 : new Date().getFullYear()
    addYear(prevYear)
  }

  return {
    years, selectedYear, setSelectedYear, removeYear, loading,
    incomingInvites, acceptInvite, declineInvite, plan,
    showSettings, setShowSettings, deleteYear, setDeleteYear,
    showMobileSidebar, setShowMobileSidebar,
    handleAddNextYear, handleAddPrevYear,
  }
}
