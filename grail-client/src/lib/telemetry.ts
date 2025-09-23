export type TelemetryEventPayload = Record<string, unknown>

export type TelemetryEvent = {
  name: string
  payload: TelemetryEventPayload
  timestamp: string
}

const DEFAULT_ENDPOINT = (import.meta.env.VITE_TELEMETRY_ENDPOINT as string | undefined) ?? null

const pendingEvents: TelemetryEvent[] = []
let isFlushing = false
let telemetryEndpoint: string | null = DEFAULT_ENDPOINT

export function configureTelemetryEndpoint(endpoint: string | null): void {
  telemetryEndpoint = endpoint
}

export function trackTelemetryEvent(name: string, payload: TelemetryEventPayload = {}): void {
  const event: TelemetryEvent = {
    name,
    payload,
    timestamp: new Date().toISOString(),
  }

  pendingEvents.push(event)
  void flushTelemetryQueue()
}

async function flushTelemetryQueue(): Promise<void> {
  if (isFlushing) {
    return
  }

  isFlushing = true

  try {
    while (pendingEvents.length > 0) {
      const next = pendingEvents.shift()
      if (!next) {
        continue
      }

      const endpoint = telemetryEndpoint
      if (!endpoint) {
        console.info('[telemetry]', next.name, next)
        continue
      }

      const payload = JSON.stringify(next)

      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'application/json' })
        const sent = navigator.sendBeacon(endpoint, blob)
        if (sent) {
          continue
        }
      }

      if (typeof fetch !== 'undefined') {
        try {
          await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: payload,
            keepalive: true,
          })
          continue
        } catch (error) {
          console.warn('[telemetry] failed to deliver event', next.name, error)
        }
      }

      // If delivery fails, push event back onto the queue and stop to retry later.
      pendingEvents.unshift(next)
      break
    }
  } finally {
    isFlushing = false
  }
}

