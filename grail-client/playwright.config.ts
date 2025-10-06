import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PlaywrightTestConfig } from '@playwright/test'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const storageStatePath =
  process.env.PLAYWRIGHT_STORAGE_STATE ?? path.join(projectRoot, 'tests', 'e2e', '.auth', 'storageState.json')
const baseURL = process.env.PLAYWRIGHT_WEB_BASE_URL ?? 'http://localhost:5173'

const shouldStartLocalServer = !process.env.PLAYWRIGHT_WEB_BASE_URL

const config: PlaywrightTestConfig = {
  testDir: path.join(projectRoot, 'tests', 'e2e'),
  globalSetup: path.join(projectRoot, 'tests', 'e2e', 'globalSetup.ts'),
  use: {
    storageState: storageStatePath,
    baseURL,
    trace: 'on-first-retry',
  },
  ...(shouldStartLocalServer
    ? {
        webServer: {
          command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          stdout: 'pipe',
          stderr: 'pipe',
          timeout: 120_000,
        },
      }
    : {}),
}

export default config
