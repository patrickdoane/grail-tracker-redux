import type { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/globalSetup.ts',
}

export default config
