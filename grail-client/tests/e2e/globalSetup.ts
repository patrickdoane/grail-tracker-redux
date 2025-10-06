import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerTestUser } from './bootstrap/registerTestUser'
import { createAuthState } from './bootstrap/createAuthState'

type SpawnResult = {
  code: number | null
  signal: NodeJS.Signals | null
}

type RunCommandOptions = {
  cwd?: string
}

async function runCommand(command: string, args: string[], options: RunCommandOptions = {}): Promise<void> {
  const result: SpawnResult = await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      cwd: options.cwd,
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.on('close', (code, signal) => {
      resolve({ code, signal })
    })
  })

  if (result.code !== 0) {
    const details =
      result.code !== null ? `exit code ${result.code}` : `signal ${result.signal ?? 'unknown'}`
    throw new Error(`Command failed (${details})`)
  }
}

function resolvePythonExecutable(): string {
  const envOverride = process.env.PLAYWRIGHT_PYTHON
  const candidates = envOverride
    ? [envOverride]
    : process.platform === 'win32'
      ? ['python', 'python3']
      : ['python3', 'python']

  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['--version'], { stdio: 'ignore' })
    if (result.status === 0) {
      return candidate
    }
  }

  throw new Error(
    `Unable to locate a Python executable. Set PLAYWRIGHT_PYTHON to a valid interpreter path before running tests.`,
  )
}

export default async function globalSetup(): Promise<void> {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const projectRoot = path.resolve(currentDir, '..', '..')
  const repoRoot = path.resolve(projectRoot, '..')
  const pythonExecutable = resolvePythonExecutable()

  const csvPath = path.join(projectRoot, 'tests', 'e2e', 'fixtures', 'holy_grail_items.e2e.csv')
  const seedScriptPath = path.join(repoRoot, 'scripts', 'seed_database.py')

  const args = [seedScriptPath, '--csv', csvPath]

  if (process.env.PLAYWRIGHT_DB_HOST) {
    args.push('--host', process.env.PLAYWRIGHT_DB_HOST)
  }
  if (process.env.PLAYWRIGHT_DB_PORT) {
    args.push('--port', process.env.PLAYWRIGHT_DB_PORT)
  }
  if (process.env.PLAYWRIGHT_DB_NAME) {
    args.push('--database', process.env.PLAYWRIGHT_DB_NAME)
  }
  if (process.env.PLAYWRIGHT_DB_USER) {
    args.push('--user', process.env.PLAYWRIGHT_DB_USER)
  }
  if (process.env.PLAYWRIGHT_DB_PASSWORD) {
    args.push('--password', process.env.PLAYWRIGHT_DB_PASSWORD)
  }

  await runCommand(pythonExecutable, args, { cwd: repoRoot })
  await registerTestUser()
  await createAuthState({ projectRoot })
}
