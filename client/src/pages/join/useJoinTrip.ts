import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { tripInviteApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { getApiErrorMessage } from '../../types'
import { useToast } from '../../components/shared/Toast'

export type JoinTripState = 'loading' | 'ready' | 'joining' | 'invalid'

/**
 * State + effects behind JoinTripPage (#1143): resolve the invite token to a
 * trip name, then accept it (add the current user as a member) and open the trip.
 * The page itself is a thin presentational shell over this hook.
 */
export function useJoinTrip() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const toast = useToast()

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
      .catch((err: unknown) => {
        // Only a 404 means the invite itself is gone. A rate limit or a server
        // having a bad minute used to be reported as an expired invite too,
        // which sent the user back to the dashboard with no way to try again.
        if ((err as { response?: { status?: number } }).response?.status === 404) {
          setState('invalid')
          return
        }
        setState('ready')
        toast.error(getApiErrorMessage(err, t('common.error')))
      })
  }

  const goToDashboard = () => navigate('/dashboard', { replace: true })

  return { state, title, accept, goToDashboard }
}
