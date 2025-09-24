import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Container,
  FilterChip,
  Grid,
  Stack,
  StatusBadge,
  type StatusBadgeVariant,
} from '../../components/ui'
import './SettingsPage.css'

type ThemeOption = {
  id: 'system' | 'dark' | 'light' | 'high-contrast'
  label: string
  description: string
}

type AccentOption = {
  id: 'ember' | 'arcane' | 'gilded'
  label: string
  sample: string
}

type DataConnector = {
  id: string
  label: string
  description: string
  status: string
  statusVariant: StatusBadgeVariant
  lastSync: string
  actionLabel: string
}

type OnboardingTask = {
  id: string
  label: string
  description: string
  completed: boolean
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'system',
    label: 'System',
    description: 'Follow the operating system preference and swap automatically.',
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Use the default dark-first palette tuned for low-light sessions.',
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Switch to parchment inspired tones for bright-room readability.',
  },
  {
    id: 'high-contrast',
    label: 'High contrast',
    description: 'Boost contrast and outline emphasis for assistive clarity.',
  },
]

const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'ember', label: 'Ember', sample: 'linear-gradient(135deg, #fb923c, #f97316)' },
  { id: 'arcane', label: 'Arcane', sample: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' },
  { id: 'gilded', label: 'Gilded', sample: 'linear-gradient(135deg, #fde047, #facc15)' },
]

const DATA_CONNECTORS: DataConnector[] = [
  {
    id: 'cloud-backup',
    label: 'Grail Cloud backup',
    description: 'Persist finds to the hosted service. Mirrors the upcoming /api/user-items endpoints.',
    status: 'Connected',
    statusVariant: 'success',
    lastSync: 'Synced 12 minutes ago',
    actionLabel: 'Manage connection',
  },
  {
    id: 'local-archive',
    label: 'Local archive exports',
    description: 'Generate encrypted JSON + CSV bundles for offline storage and version history.',
    status: 'Scheduled nightly',
    statusVariant: 'info',
    lastSync: 'Next run at 02:00 local time',
    actionLabel: 'Open schedule',
  },
  {
    id: 'd2r-import',
    label: 'Diablo II save import',
    description: 'Upload the latest offline save to merge rune ownership and grail finds.',
    status: 'Awaiting file',
    statusVariant: 'warning',
    lastSync: 'Last merged 3 sessions ago',
    actionLabel: 'Launch importer',
  },
]

const INITIAL_TASKS: OnboardingTask[] = [
  {
    id: 'profile-basics',
    label: 'Complete profile basics',
    description: 'Confirm display name, contact email, and preferred timezone.',
    completed: true,
  },
  {
    id: 'sync-preferences',
    label: 'Review sync preferences',
    description: 'Decide how cloud backups and local exports should coordinate.',
    completed: false,
  },
  {
    id: 'import-history',
    label: 'Import existing grail history',
    description: 'Bring in CSV exports or save files to seed the persistence layer.',
    completed: false,
  },
  {
    id: 'share-progress',
    label: 'Share a progress snapshot',
    description: 'Generate a summary card to celebrate milestones with friends.',
    completed: false,
  },
]

function SettingsPage() {
  const [displayName, setDisplayName] = useState('Aster the Grail Seeker')
  const [tagline, setTagline] = useState('Hunting every unique drop across seasons and ladders.')
  const [email, setEmail] = useState('aster@grail.example')
  const [timezone, setTimezone] = useState('America/Chicago')
  const [shareProfile, setShareProfile] = useState(true)
  const [sessionPresence, setSessionPresence] = useState(true)
  const [notifyFinds, setNotifyFinds] = useState(false)
  const [theme, setTheme] = useState<ThemeOption['id']>('system')
  const [accent, setAccent] = useState<AccentOption['id']>('ember')
  const [enableTooltipContrast, setEnableTooltipContrast] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(true)
  const [tasks, setTasks] = useState<OnboardingTask[]>(INITIAL_TASKS)

  const selectedTheme = useMemo(
    () => THEME_OPTIONS.find((option) => option.id === theme) ?? THEME_OPTIONS[0],
    [theme],
  )
  const selectedAccent = useMemo(
    () => ACCENT_OPTIONS.find((option) => option.id === accent) ?? ACCENT_OPTIONS[0],
    [accent],
  )

  const onboardingProgress = useMemo(() => {
    if (tasks.length === 0) {
      return 0
    }
    const complete = tasks.filter((task) => task.completed).length
    return Math.round((complete / tasks.length) * 100)
  }, [tasks])

  const syncBadgeVariant: StatusBadgeVariant = shareProfile || sessionPresence ? 'success' : 'neutral'

  const toggleTask = (taskId: string) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  return (
    <Container className="page settings-page" maxWidth="xl">
      <header className="page__header settings-page__header">
        <p className="page__eyebrow">Profile management</p>
        <h1>Settings &amp; Data</h1>
        <p className="page__lead">
          Prototype controls for the upcoming user profile and persistence work. Configure identity details, appearance
          preferences, data flows, and onboarding tasks in one place.
        </p>
      </header>

      <section className="settings-section" aria-labelledby="settings-account">
        <div className="settings-section__header">
          <div>
            <h2 id="settings-account" className="settings-section__title">
              Account &amp; profile
            </h2>
            <p className="settings-section__subtitle">
              Manage the basics that will sync with the UserProfiles service and inform grail progress sharing.
            </p>
          </div>
          <StatusBadge variant={syncBadgeVariant} subtle>
            {shareProfile ? 'Autosave enabled' : 'Autosave paused'}
          </StatusBadge>
        </div>

        <Grid className="settings-card-grid" minItemWidth="22rem" gap="lg">
          <Card>
            <CardHeader>
              <CardTitle>Profile basics</CardTitle>
              <CardDescription>These details populate future UserProfile records and sharing overlays.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="settings-form" noValidate>
                <div className="settings-field">
                  <label htmlFor="display-name">Display name</label>
                  <input
                    id="display-name"
                    className="settings-input"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    autoComplete="name"
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="profile-tagline">Tagline</label>
                  <textarea
                    id="profile-tagline"
                    className="settings-input settings-input--multiline"
                    value={tagline}
                    onChange={(event) => setTagline(event.target.value)}
                    rows={3}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="profile-email">Contact email</label>
                  <input
                    id="profile-email"
                    className="settings-input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="profile-timezone">Primary timezone</label>
                  <select
                    id="profile-timezone"
                    className="settings-input"
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                  >
                    <option value="America/Chicago">Central (America/Chicago)</option>
                    <option value="America/Los_Angeles">Pacific (America/Los_Angeles)</option>
                    <option value="America/New_York">Eastern (America/New_York)</option>
                    <option value="Europe/Berlin">Central European (Europe/Berlin)</option>
                    <option value="Asia/Seoul">Korean (Asia/Seoul)</option>
                  </select>
                </div>
              </form>
            </CardContent>
            <CardFooter className="settings-card-footer">
              <Button variant="primary">Save profile draft</Button>
              <Button variant="ghost">Preview public card</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Presence &amp; visibility</CardTitle>
              <CardDescription>Control how your activity surfaces to teammates once auth lands.</CardDescription>
            </CardHeader>
            <CardContent className="settings-card-content--spaced">
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={shareProfile}
                  onChange={(event) => setShareProfile(event.target.checked)}
                />
                <div>
                  <span className="settings-toggle__label">Share profile publicly</span>
                  <span className="settings-toggle__hint">
                    Generates a read-only landing page using the future /api/user-profiles endpoint.
                  </span>
                </div>
              </label>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={sessionPresence}
                  onChange={(event) => setSessionPresence(event.target.checked)}
                />
                <div>
                  <span className="settings-toggle__label">Show session presence to clanmates</span>
                  <span className="settings-toggle__hint">
                    Broadcasts online status and recent runs to approved collaborators.
                  </span>
                </div>
              </label>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={notifyFinds}
                  onChange={(event) => setNotifyFinds(event.target.checked)}
                />
                <div>
                  <span className="settings-toggle__label">Send notifications for notable finds</span>
                  <span className="settings-toggle__hint">
                    Pushes alerts when high-rarity drops sync back to the grail service.
                  </span>
                </div>
              </label>
            </CardContent>
            <CardFooter className="settings-card-footer">
              <Button variant="secondary">Configure collaborators</Button>
              <Button variant="ghost">Pause sharing</Button>
            </CardFooter>
          </Card>
        </Grid>
      </section>

      <section className="settings-section" aria-labelledby="settings-appearance">
        <div className="settings-section__header">
          <div>
            <h2 id="settings-appearance" className="settings-section__title">
              Appearance
            </h2>
            <p className="settings-section__subtitle">
              Pick a theme and accent palette. Final implementation will sync with the device and persisted user
              preferences.
            </p>
          </div>
          <StatusBadge variant="info" subtle>
            Theme sync prototype
          </StatusBadge>
        </div>

        <Grid className="settings-card-grid" minItemWidth="22rem" gap="lg">
          <Card>
            <CardHeader>
              <CardTitle>Theme mode</CardTitle>
              <CardDescription>
                Choose between dark, light, and high-contrast modes or defer to the operating system.
              </CardDescription>
            </CardHeader>
            <CardContent className="settings-card-content--spaced">
              <Stack direction="horizontal" gap="xs" wrap>
                {THEME_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.id}
                    selected={theme === option.id}
                    onClick={() => setTheme(option.id)}
                    aria-pressed={theme === option.id}
                  >
                    {option.label}
                  </FilterChip>
                ))}
              </Stack>
              <p className="settings-chip-help" aria-live="polite">
                {selectedTheme.description}
              </p>
              <div className="settings-theme-preview" data-theme={theme} data-accent={accent}>
                <div className="settings-theme-preview__card">
                  <span className="settings-theme-preview__eyebrow">Preview</span>
                  <span className="settings-theme-preview__title">Grail dashboard</span>
                  <span className="settings-theme-preview__body">{selectedTheme.label} experience with {selectedAccent.label.toLowerCase()} accents.</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="settings-card-footer">
              <Button variant="primary">Apply theme</Button>
              <Button variant="ghost">Reset to default</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accent &amp; readability</CardTitle>
              <CardDescription>Fine-tune contrast and motion to match accessibility requirements.</CardDescription>
            </CardHeader>
            <CardContent className="settings-card-content--spaced">
              <div className="settings-field">
                <span className="settings-field__label">Accent color</span>
                <Stack direction="horizontal" gap="sm" wrap>
                  {ACCENT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={
                        accent === option.id
                          ? 'settings-accent-swatch settings-accent-swatch--selected'
                          : 'settings-accent-swatch'
                      }
                      style={{ ['--swatch-color' as string]: option.sample }}
                      onClick={() => setAccent(option.id)}
                      aria-pressed={accent === option.id}
                    >
                      <span className="settings-accent-swatch__color" aria-hidden="true" />
                      <span className="settings-accent-swatch__label">{option.label}</span>
                    </button>
                  ))}
                </Stack>
              </div>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={enableTooltipContrast}
                  onChange={(event) => setEnableTooltipContrast(event.target.checked)}
                />
                <div>
                  <span className="settings-toggle__label">Enable contrast boosts for tooltips</span>
                  <span className="settings-toggle__hint">
                    Adds thicker outlines and higher foreground values on hover surfaces.
                  </span>
                </div>
              </label>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={reduceMotion}
                  onChange={(event) => setReduceMotion(event.target.checked)}
                />
                <div>
                  <span className="settings-toggle__label">Reduce motion</span>
                  <span className="settings-toggle__hint">
                    Minimizes transitions for accessibility while keeping high-impact feedback.
                  </span>
                </div>
              </label>
            </CardContent>
            <CardFooter className="settings-card-footer">
              <Button variant="secondary">Preview accessibility mode</Button>
            </CardFooter>
          </Card>
        </Grid>
      </section>

      <section className="settings-section" aria-labelledby="settings-data">
        <div className="settings-section__header">
          <div>
            <h2 id="settings-data" className="settings-section__title">
              Data management
            </h2>
            <p className="settings-section__subtitle">
              Outline import/export flows that will back the persistence layer for user items and runeword tracking.
            </p>
          </div>
          <StatusBadge variant="success" subtle>
            Sync healthy
          </StatusBadge>
        </div>

        <Grid className="settings-card-grid" minItemWidth="22rem" gap="lg">
          <Card>
            <CardHeader>
              <CardTitle>Import &amp; export</CardTitle>
              <CardDescription>
                Wire up future endpoints like <code>/api/user-items/export</code> to support offline backups.
              </CardDescription>
            </CardHeader>
            <CardContent className="settings-card-content--spaced">
              <div className="settings-upload">
                <div className="settings-upload__dropzone" role="presentation">
                  <p className="settings-upload__title">Drag &amp; drop a CSV or save file</p>
                  <p className="settings-upload__hint">We will merge entries and surface a diff before committing.</p>
                  <Button variant="surface" size="sm">Browse files</Button>
                </div>
              </div>
              <Stack direction="horizontal" gap="sm" wrap>
                <Button variant="primary">Export progress (CSV)</Button>
                <Button variant="secondary">Download offline bundle</Button>
                <Button variant="ghost">View change log</Button>
              </Stack>
              <p className="settings-chip-help">
                Offline bundles include items, runes, and metadata hashed for quick comparison when re-importing.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connections</CardTitle>
              <CardDescription>Track sync status and initiate manual refreshes when needed.</CardDescription>
            </CardHeader>
            <CardContent className="settings-card-content--stacked">
              {DATA_CONNECTORS.map((connector) => (
                <div key={connector.id} className="settings-connector">
                  <div className="settings-connector__header">
                    <div>
                      <p className="settings-connector__title">{connector.label}</p>
                      <p className="settings-connector__description">{connector.description}</p>
                    </div>
                    <StatusBadge variant={connector.statusVariant}>{connector.status}</StatusBadge>
                  </div>
                  <div className="settings-connector__meta">
                    <span className="settings-connector__sync">{connector.lastSync}</span>
                    <Button variant="ghost" size="sm">
                      {connector.actionLabel}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </section>

      <section className="settings-section" aria-labelledby="settings-onboarding">
        <div className="settings-section__header">
          <div>
            <h2 id="settings-onboarding" className="settings-section__title">
              Onboarding checklist
            </h2>
            <p className="settings-section__subtitle">
              Track the recommended steps before persistence launches so teammates can test drive the experience.
            </p>
          </div>
          <StatusBadge variant={onboardingProgress === 100 ? 'success' : 'info'} subtle>
            {onboardingProgress}% complete
          </StatusBadge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Early access rollout</CardTitle>
            <CardDescription>Mark off tasks as you explore the prototype.</CardDescription>
          </CardHeader>
          <CardContent className="settings-card-content--stacked">
            <div className="settings-progress" role="img" aria-label={`Onboarding progress ${onboardingProgress}%`}>
              <div className="settings-progress__bar" style={{ ['--value' as string]: `${onboardingProgress}%` }} />
            </div>
            <ul className="settings-checklist">
              {tasks.map((task) => (
                <li key={task.id}>
                  <label className="settings-checklist__item">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                    />
                    <div>
                      <span className="settings-checklist__label">{task.label}</span>
                      <span className="settings-checklist__description">{task.description}</span>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="settings-card-footer">
            <Button variant="primary">Mark all complete</Button>
            <Button variant="ghost">Share feedback</Button>
          </CardFooter>
        </Card>
      </section>
    </Container>
  )
}

export default SettingsPage
