import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type SpawnResult = {
  code: number | null
  signal: NodeJS.Signals | null
}

async function runCommand(command: string, args: string[]): Promise<void> {
  const result: SpawnResult = await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
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

export default async function globalSetup(): Promise<void> {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const repoRoot = path.resolve(currentDir, '..', '..')
  const pythonExecutable = process.env.PLAYWRIGHT_PYTHON ?? 'python'

  const csvPath = path.join(repoRoot, 'tests', 'e2e', 'fixtures', 'holy_grail_items.e2e.csv')
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

  await runCommand(pythonExecutable, args)
}
