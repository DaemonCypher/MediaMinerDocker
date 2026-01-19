export type JobLog = {
  activeJobId: string | null
  fullLog: string
}

const JOB_LOG_KEY = 'job_log'
let subscribers: Array<() => void> = []

function load(): JobLog {
  try {
    const raw = localStorage.getItem(JOB_LOG_KEY)
    if (!raw) return { activeJobId: null, fullLog: '' }
    const parsed = JSON.parse(raw)
    return {
      activeJobId: parsed?.activeJobId ?? null,
      fullLog: typeof parsed?.fullLog === 'string' ? parsed.fullLog : '',
    }
  } catch {
    return { activeJobId: null, fullLog: '' }
  }
}

function save(next: JobLog) {
  try {
    localStorage.setItem(JOB_LOG_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

export function getJobLog(): JobLog {
  return load()
}

export function setActiveJobId(activeJobId: string | null): void {
  const current = load()
  const next = { ...current, activeJobId }
  save(next)
  notifySubscribers()
}

export function appendToJobLog(line: string, activeJobId: string | null = null): void {
  const current = load()
  const timestamp = new Date().toLocaleTimeString()
  const newLine = `[${timestamp}] ${line}`
  const combined = current.fullLog ? `${current.fullLog}\n${newLine}` : newLine
  const trimmed = combined.slice(-30000)
  const next: JobLog = {
    activeJobId: activeJobId ?? current.activeJobId ?? null,
    fullLog: trimmed,
  }
  save(next)
  notifySubscribers()
}

export function clearJobLog(): void {
  save({ activeJobId: null, fullLog: '' })
  notifySubscribers()
}

export function subscribeToJobLog(callback: () => void): () => void {
  subscribers.push(callback)
  return () => {
    subscribers = subscribers.filter((sub) => sub !== callback)
  }
}

function notifySubscribers(): void {
  subscribers.forEach((callback) => callback())
}
