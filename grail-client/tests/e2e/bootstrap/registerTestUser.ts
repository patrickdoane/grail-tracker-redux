const DEFAULT_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:8080/api'

const DEFAULT_USER = {
  username: process.env.PLAYWRIGHT_TEST_USERNAME ?? 'playwright',
  email: process.env.PLAYWRIGHT_TEST_EMAIL ?? 'playwright@example.com',
  password: process.env.PLAYWRIGHT_TEST_PASSWORD ?? 'Playwright!1',
}

const DEFAULT_MAX_ATTEMPTS = Number.parseInt(process.env.PLAYWRIGHT_BOOTSTRAP_RETRIES ?? '10', 10)
const DEFAULT_RETRY_DELAY_MS = Number.parseInt(
  process.env.PLAYWRIGHT_BOOTSTRAP_RETRY_DELAY_MS ?? '1000',
  10,
)
const DEFAULT_REQUEST_TIMEOUT_MS = Number.parseInt(
  process.env.PLAYWRIGHT_BOOTSTRAP_TIMEOUT_MS ?? '5000',
  10,
)

type RegisterTestUserOptions = {
  baseUrl?: string
  user?: {
    username: string
    email: string
    password: string
  }
  maxAttempts?: number
  retryDelayMs?: number
  requestTimeoutMs?: number
}

type FetchResponse = Awaited<ReturnType<typeof fetch>>

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function registerTestUser(options: RegisterTestUserOptions = {}): Promise<void> {
  const {
    baseUrl = DEFAULT_BASE_URL,
    user = DEFAULT_USER,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  } = options

  const endpoint = `${stripTrailingSlash(baseUrl)}/auth/register`

  let lastError: unknown = null

  for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt += 1) {
    try {
      const response = await postWithTimeout(endpoint, user, requestTimeoutMs)

      if (response.ok) {
        return
      }

      if (response.status === 409) {
        return
      }

      if (response.status >= 500 && response.status < 600) {
        lastError = new Error(`Server error ${response.status}`)
      } else {
        const text = await safeReadText(response)
        throw new Error(
          `Register test user failed with status ${response.status}${text ? `: ${text}` : ''}`,
        )
      }
    } catch (error) {
      lastError = error
    }

    if (attempt < maxAttempts) {
      await delay(retryDelayMs)
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }
  throw new Error('Unable to register test user')
}

async function postWithTimeout(
  endpoint: string,
  payload: unknown,
  timeoutMs: number,
): Promise<FetchResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function safeReadText(response: FetchResponse): Promise<string | null> {
  try {
    return await response.text()
  } catch (error) {
    return error instanceof Error ? error.message : null
  }
}

function stripTrailingSlash(input: string): string {
  return input.endsWith('/') ? input.slice(0, -1) : input
}
