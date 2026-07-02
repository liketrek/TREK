import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { tripInviteApi } from '../../api/client'

export type JoinTripState = 'loading' | 'ready' | 'joining' | 'invalid'

/**
 * State + effects behind JoinTripPage (#1143): resolve the invite token to a
 * trip name, then accept it (add the current user as a member) and open the trip.
 * The page itself is a thin presentational shell over this hook.
 */
export function useJoinTrip() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [state, setState] = useState<JoinTripState>('loading')
  const [title, setTitle] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!token) { setState('invalid'); return }
    tripInviteApi.preview(token)
      .then((data: { title: string }) => { if (!cancelled) { setTitle(data.title); setState('ready') } })
      .catch(() => { if (!cancelled) setState('invalid') })
    return () => { cancelled = true }
  }, [token])

  const accept = () => {
    if (!token) return
    setState('joining')
    tripInviteApi.accept(token)
      .then((data: { trip_id: number }) => navigate(`/trips/${data.trip_id}`, { replace: true }))
      .catch(() => setState('invalid'))
  }

  const goToDashboard = () => navigate('/dashboard', { replace: true })

  return { state, title, accept, goToDashboard }
}
