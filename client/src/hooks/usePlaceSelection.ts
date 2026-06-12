import { useState, useCallback } from 'react'

export function usePlaceSelection() {
  const [selectedPlaceId, _setSelectedPlaceId] = useState<number | null>(null)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null)

  const setSelectedPlaceId = useCallback((placeId: number | null) => {
    _setSelectedPlaceId(placeId)
    setSelectedAssignmentId(null)
  }, [])

  const selectAssignment = useCallback((assignmentId: number | null, placeId: number | null = null) => {
    setSelectedAssignmentId(assignmentId)
    _setSelectedPlaceId(placeId)
  }, [])

  return { selectedPlaceId, selectedAssignmentId, setSelectedPlaceId, selectAssignment }
}
