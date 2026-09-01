import { weatherApi } from '../api/client'

const MAX_CONCURRENT = 3
let active = 0
const queue: Array<() => void> = []

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) { active++; return Promise.resolve() }
  return new Promise(resolve => queue.push(resolve))
}

function release(): void {
  const next = queue.shift()
  if (next) next()
  else active--
}

export async function fetchWeather(lat: number, lng: number, date: string, lang?: string) {
  await acquire()
  try {
    return await weatherApi.get(lat, lng, date, lang)
  } finally {
    release()
  }
}
