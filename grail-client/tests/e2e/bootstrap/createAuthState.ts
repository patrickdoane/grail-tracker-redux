import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:8080/api'
const DEFAULT_WEB_BASE_URL = process.env.PLAYWRIGHT_WEB_BASE_URL ?? 'http://localhost:5173'

const DEFAULT_USER = {
  username: process.env.PLAYWRIGHT_TEST_USERNAME ?? 'playwright',
  email: process.env.PLAYWRIGHT_TEST_EMAIL ?? 'playwright@example.com',
  password: process.env.PLAYWRIGHT_TEST_PASSWORD ?? 'Playwright!1',
}

const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.PLAYWRIGHT_LOGIN_TIMEOUT_MS ?? '5000', 10)

type LoginResponse = {
  token: string
}

type CreateAuthStateOptions = {
  apiBaseUrl?: string
  webBaseUrl?: string
  storageStatePath?: string
  username?: string
  password?: string
  timeoutMs?: number
  projectRoot?: string
}

export async function createAuthState(options: CreateAuthStateOptions = {}): Promise<string> {
  const {
    apiBaseUrl = DEFAULT_BASE_URL,
    webBaseUrl = DEFAULT_WEB_BASE_URL,
    storageStatePath,
    username = DEFAULT_USER.username,
    password = DEFAULT_USER.password,
    timeoutMs = REQUEST_TIMEOUT_MS,
    projectRoot = getProjectRoot(),
  } = options

  const resolvedStorageStatePath =
    storageStatePath ?? path.join(projectRoot, 'tests', 'e2e', '.auth', 'storageState.json')

  await ensureDirectoryExists(path.dirname(resolvedStorageStatePath))

  const loginResponse = await login({ apiBaseUrl, usernameOrEmail: username, password, timeoutMs })

  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  const context = await browser.newContext({
    baseURL: webBaseUrl,
    extraHTTPHeaders: {
      Authorization: `Bearer ${loginResponse.token}`,
    },
  })

  await context.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value)
    },
    ['grail-auth-token', loginResponse.token],
  )

  const page = await context.newPage()
  await page.goto('/')
  await context.storageState({ path: resolvedStorageStatePath })
  await page.close()
  await browser.close()

  return resolvedStorageStatePath
}

type LoginInput = {
  apiBaseUrl: string
  usernameOrEmail: string
  password: string
  timeoutMs: number
}

async function login({ apiBaseUrl, usernameOrEmail, password, timeoutMs }: LoginInput): Promise<LoginResponse> {
  const endpoint = `${stripTrailingSlash(apiBaseUrl)}/auth/login`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usernameOrEmail, password }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await safeReadText(response)
      throw new Error(
        `Login failed: ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`,
      )
    }

    return (await response.json()) as LoginResponse
  } finally {
    clearTimeout(timeoutId)
  }
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  const { mkdir } = await import('node:fs/promises')
  await mkdir(dirPath, { recursive: true })
}

async function safeReadText(response: Response): Promise<string | null> {
  try {
    return await response.text()
  } catch (error) {
    return error instanceof Error ? error.message : null
  }
}

function stripTrailingSlash(input: string): string {
  return input.endsWith('/') ? input.slice(0, -1) : input
}

function getProjectRoot(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(currentDir, '..', '..', '..')
}
