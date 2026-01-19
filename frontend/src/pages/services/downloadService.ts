export type AnyEvent = any

export type Metadata = {
  title: string
  thumbnail?: string
  duration?: number
  uploader?: string
  artist?: string
  year?: number
  album?: string
  genre?: string
}

export function wsUrlFor(jobId: string) {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}/ws/${jobId}`
}

export function formatLine(ev: AnyEvent) {
  if (ev.type === 'progress') {
    return `${ev.status ?? ''} ${ev.percent ?? ''} ${ev.speed ?? ''} ETA:${ev.eta ?? ''}`.trim()
  }
  if (ev.type === 'status') return `STATUS: ${ev.status}`
  if (ev.type === 'error') return `ERROR: ${ev.message}`
  if (ev.type === 'snapshot') return `SNAPSHOT: ${JSON.stringify(ev.job)}`
  if (ev.type === 'heartbeat') return `HEARTBEAT: ${ev.status}${ev.error ? ' | ' + ev.error : ''}`
  return JSON.stringify(ev)
}

export async function postJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.detail ?? 'Request failed')
  return data as T
}

export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.detail ?? 'Request failed')
  return data as T
}
