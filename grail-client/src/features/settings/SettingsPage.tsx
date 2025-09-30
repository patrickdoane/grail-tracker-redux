import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import {
  fetchDataConnectors,
  fetchOnboardingTasks,
  fetchUserProfile,
  importUserData,
  retryImport,
  startExport,
  triggerConnectorAction,
  updateOnboardingTask,
  updateUserProfile,
  type DataConnector,
  type OnboardingTask,
  type OnboardingTasksResponse,
  type SyncJob,
  type UserProfile,
} from './settingsApi'
import { useUserPreferencesContext } from '../users/UserPreferencesContext'
import { useThemeManager } from '../../lib/themeManager'
import { getApiErrorMessage } from '../../lib/apiClient'
import { trackTelemetryEvent } from '../../lib/telemetry'
import './SettingsPage.css'

type ThemeOption = {
  id: 'system' | 'dark' | 'light' | 'high-contrast'
  label: string
  description: string
  serverValue: 'SYSTEM' | 'DARK' | 'LIGHT' | 'HIGH_CONTRAST'
}

type AccentOption = {
  id: 'ember' | 'arcane' | 'gilded'
  label: string
  sample: string
  serverValue: 'EMBER' | 'ARCANE' | 'GILDED'
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'system',
    label: 'System',
    description: 'Follow the operating system preference and swap automatically.',
    serverValue: 'SYSTEM',
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Use the default dark-first palette tuned for low-light sessions.',
    serverValue: 'DARK',
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Switch to parchment inspired tones for bright-room readability.',
    serverValue: 'LIGHT',
  },
  {
    id: 'high-contrast',
    label: 'High contrast',
    description: 'Boost contrast and outline emphasis for assistive clarity.',
    serverValue: 'HIGH_CONTRAST',
  },
]

const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'ember', label: 'Ember', sample: 'linear-gradient(135deg, #fb923c, #f97316)', serverValue: 'EMBER' },
  { id: 'arcane', label: 'Arcane', sample: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', serverValue: 'ARCANE' },
  { id: 'gilded', label: 'Gilded', sample: 'linear-gradient(135deg, #fde047, #facc15)', serverValue: 'GILDED' },
]

const CONNECTOR_VARIANT_MAP: Record<DataConnector['statusVariant'], StatusBadgeVariant> = {
  NEUTRAL: 'neutral',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
  INFO: 'info',
}

type ProfileDraft = {
  displayName: string
  tagline: string
  email: string
  timezone: string
}

type InlineMessage = {
  variant: StatusBadgeVariant
  text: string
}

const TIMEZONE_OPTIONS = [
  'America/Chicago',
  'America/Los_Angeles',
  'America/New_York',
  'Europe/Berlin',
  'Asia/Seoul',
  'UTC',
]

function SettingsPage() {
  const queryClient = useQueryClient()
  const { theme, accent } = useThemeManager()
  const { preferences, isLoading: isPreferencesLoading, updateUserPreferences } = useUserPreferencesContext()

  const profileQuery = useQuery({ queryKey: ['user-profile'], queryFn: fetchUserProfile })
  const connectorsQuery = useQuery({ queryKey: ['data-connectors'], queryFn: fetchDataConnectors })
  const onboardingQuery = useQuery({ queryKey: ['onboarding-tasks'], queryFn: fetchOnboardingTasks })

  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    displayName: '',
    tagline: '',
    email: '',
    timezone: 'America/Chicago',
  })
  const [profileMessage, setProfileMessage] = useState<InlineMessage | null>(null)
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})

  const [preferenceMessage, setPreferenceMessage] = useState<InlineMessage | null>(null)
  const [preferenceError, setPreferenceError] = useState<string | null>(null)

  const [importJob, setImportJob] = useState<SyncJob | null>(null)
  const [importConflict, setImportConflict] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const [exportJob, setExportJob] = useState<SyncJob | null>(null)
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    if (!profileQuery.data) {
      return
    }
    setProfileDraft({
      displayName: profileQuery.data.displayName,
      tagline: profileQuery.data.tagline ?? '',
      email: profileQuery.data.email,
      timezone: profileQuery.data.timezone,
    })
  }, [profileQuery.data])

  const profileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data: UserProfile) => {
      queryClient.setQueryData(['user-profile'], data)
      setProfileMessage({ variant: 'success', text: 'Profile saved successfully.' })
      setProfileErrors({})
    },
    onError: (error: unknown) => {
      setProfileMessage({ variant: 'danger', text: getApiErrorMessage(error) })
    },
  })

  const selectedTheme = useMemo(
    () => THEME_OPTIONS.find((option) => option.id === theme) ?? THEME_OPTIONS[0],
    [theme],
  )
  const selectedAccent = useMemo(
    () => ACCENT_OPTIONS.find((option) => option.id === accent) ?? ACCENT_OPTIONS[0],
    [accent],
  )

  const onboardingTasks = onboardingQuery.data?.tasks ?? []
  const onboardingProgress = onboardingQuery.data?.completionPercent ?? 0

  const validateProfile = (draft: ProfileDraft) => {
    const nextErrors: Record<string, string> = {}
    if (!draft.displayName.trim()) {
      nextErrors.displayName = 'Display name is required.'
    }
    if (!draft.email.trim() || !/^\S+@\S+\.\S+$/.test(draft.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!isValidTimezone(draft.timezone)) {
      nextErrors.timezone = 'Choose a valid timezone.'
    }
    setProfileErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileMessage(null)
    if (!validateProfile(profileDraft)) {
      return
    }
    profileMutation.mutate(profileDraft)
  }

  const persistPreferences = async (
    overrides: Partial<{
      shareProfile: boolean
      sessionPresence: boolean
      notifyFinds: boolean
      themeMode: ThemeOption['serverValue']
      accentColor: AccentOption['serverValue']
      enableTooltipContrast: boolean
      reduceMotion: boolean
    }>,
  ) => {
    if (!preferences) {
      return
    }
    setPreferenceError(null)
    try {
      const payload = {
        shareProfile: overrides.shareProfile ?? preferences.shareProfile,
        sessionPresence: overrides.sessionPresence ?? preferences.sessionPresence,
        notifyFinds: overrides.notifyFinds ?? preferences.notifyFinds,
        themeMode: overrides.themeMode ?? preferences.themeMode,
        accentColor: overrides.accentColor ?? preferences.accentColor,
        enableTooltipContrast: overrides.enableTooltipContrast ?? preferences.enableTooltipContrast,
        reduceMotion: overrides.reduceMotion ?? preferences.reduceMotion,
      }
      const response = await updateUserPreferences(payload)
      queryClient.setQueryData(['user-preferences'], response)
      setPreferenceMessage({ variant: 'success', text: 'Preferences updated.' })
    } catch (error) {
      const message = getApiErrorMessage(error)
      setPreferenceError(message)
      setPreferenceMessage({ variant: 'danger', text: message })
      throw error
    }
  }

  const handleThemeSelect = async (option: ThemeOption) => {
    await persistPreferences({ themeMode: option.serverValue })
  }

  const handleAccentSelect = async (option: AccentOption) => {
    await persistPreferences({ accentColor: option.serverValue })
  }

  const handleImportFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }
    const file = files[0]
    setIsImporting(true)
    setImportError(null)
    try {
      const response = await importUserData(file)
      setImportJob(response.job)
      setImportConflict(response.conflictsDetected)
      if (response.conflictsDetected) {
        trackTelemetryEvent('import_conflict_detected', { jobId: response.job.id, fileName: file.name })
      } else {
        trackTelemetryEvent('import_completed', { jobId: response.job.id, recordCount: response.job.message })
      }
      queryClient.invalidateQueries({ queryKey: ['onboarding-tasks'] })
    } catch (error) {
      const message = getApiErrorMessage(error)
      setImportError(message)
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportRetry = async () => {
    if (!importJob) {
      return
    }
    try {
      const response = await retryImport(importJob.id)
      setImportJob(response.job)
      setImportConflict(response.conflictsDetected)
      queryClient.invalidateQueries({ queryKey: ['onboarding-tasks'] })
      trackTelemetryEvent('import_retry', { jobId: response.job.id })
    } catch (error) {
      setImportError(getApiErrorMessage(error))
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    setExportError(null)
    try {
      const response = await startExport(format)
      setExportJob(response.job)
      setExportDownloadUrl(response.downloadUrl)
      queryClient.invalidateQueries({ queryKey: ['onboarding-tasks'] })
      trackTelemetryEvent('export_started', { jobId: response.job.id, format })
      if (response.job.status === 'COMPLETED') {
        window.location.assign(response.downloadUrl)
      }
    } catch (error) {
      setExportError(getApiErrorMessage(error))
    }
  }

  const handleConnectorAction = async (connectorId: string, action: 'manage' | 'schedule' | 'import' | 'sync') => {
    await triggerConnectorAction(connectorId, action)
    await queryClient.invalidateQueries({ queryKey: ['data-connectors'] })
    trackTelemetryEvent('connector_action', { connectorId, action })
  }

  const handleTaskToggle = async (task: OnboardingTask) => {
    const next = !task.completed
    trackTelemetryEvent('onboarding_task_toggle', {
      taskId: task.id,
      completed: next,
      derived: task.derivedFromSignals,
    })
    try {
      const updated = await updateOnboardingTask(task.id, next)
      queryClient.setQueryData(['onboarding-tasks'], (current: OnboardingTasksResponse | undefined) => {
        if (!current) {
          return current
        }
        const tasks = current.tasks.map((existing) => (existing.id === updated.id ? updated : existing))
        const percent = Math.round(
          (tasks.filter((item) => item.completed).length / Math.max(tasks.length, 1)) * 100,
        )
        return { ...current, tasks, completionPercent: percent }
      })
    } catch (error) {
      setPreferenceMessage({ variant: 'danger', text: getApiErrorMessage(error) })
    }
  }

  const shareProfile = preferences?.shareProfile ?? false
  const sessionPresence = preferences?.sessionPresence ?? false
  const notifyFinds = preferences?.notifyFinds ?? false
  const enableTooltipContrast = preferences?.enableTooltipContrast ?? false
  const reduceMotion = preferences?.reduceMotion ?? false

  const syncBadgeVariant: StatusBadgeVariant = shareProfile || sessionPresence ? 'success' : 'neutral'

  return (
    <Container className="page settings-page" maxWidth="xl">
      <header className="page__header settings-page__header">
        <p className="page__eyebrow">Profile management</p>
        <h1>Settings &amp; Data</h1>
        <p className="page__lead">
          Configure identity details, appearance preferences, data flows, and onboarding tasks. All changes save to the
          live persistence prototype and broadcast across the client.
        </p>
      </header>

      <section className="settings-section" aria-labelledby="settings-account">
        <div className="settings-section__header">
          <div>
            <h2 id="settings-account" className="settings-section__title">
              Account &amp; profile
            </h2>
            <p className="settings-section__subtitle">
              Manage the basics that sync with the UserProfiles service and inform grail progress sharing.
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
              <CardDescription>These details populate UserProfile records and sharing overlays.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="settings-form" noValidate onSubmit={handleProfileSubmit}>
                <div className="settings-field">
                  <label htmlFor="display-name">Display name</label>
                  <input
                    id="display-name"
                    className={`settings-input${profileErrors.displayName ? ' settings-input--error' : ''}`}
                    value={profileDraft.displayName}
                    onChange={(event) =>
                      setProfileDraft((previous) => ({ ...previous, displayName: event.target.value }))
                    }
                    autoComplete="name"
                    disabled={profileMutation.isPending || profileQuery.isLoading}
                  />
                  {profileErrors.displayName && (
                    <span className="settings-input__error">{profileErrors.displayName}</span>
                  )}
                </div>
                <div className="settings-field">
                  <label htmlFor="profile-tagline">Tagline</label>
                  <textarea
                    id="profile-tagline"
                    className="settings-input settings-input--multiline"
                    value={profileDraft.tagline}
                    onChange={(event) =>
                      setProfileDraft((previous) => ({ ...previous, tagline: event.target.value }))
                    }
                    rows={3}
                    disabled={profileMutation.isPending || profileQuery.isLoading}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="profile-email">Contact email</label>
                  <input
                    id="profile-email"
                    className={`settings-input${profileErrors.email ? ' settings-input--error' : ''}`}
                    value={profileDraft.email}
                    onChange={(event) =>
                      setProfileDraft((previous) => ({ ...previous, email: event.target.value }))
                    }
                    type="email"
                    autoComplete="email"
                    disabled={profileMutation.isPending || profileQuery.isLoading}
                  />
                  {profileErrors.email && <span className="settings-input__error">{profileErrors.email}</span>}
                </div>
                <div className="settings-field">
                  <label htmlFor="profile-timezone">Primary timezone</label>
                  <select
                    id="profile-timezone"
                    className={`settings-input${profileErrors.timezone ? ' settings-input--error' : ''}`}
                    value={profileDraft.timezone}
                    onChange={(event) =>
                      setProfileDraft((previous) => ({ ...previous, timezone: event.target.value }))
                    }
                    disabled={profileMutation.isPending || profileQuery.isLoading}
                  >
                    {TIMEZONE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {profileErrors.timezone && <span className="settings-input__error">{profileErrors.timezone}</span>}
                </div>
                <div className="settings-inline-status">
                  {profileMessage && <StatusBadge variant={profileMessage.variant}>{profileMessage.text}</StatusBadge>}
                </div>
                <div className="settings-card-footer settings-card-footer--form">
                  <Button type="submit" variant="primary" disabled={profileMutation.isPending}>
                    {profileMutation.isPending ? 'Saving…' : 'Save profile'}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="settings-card-footer">
              <Button variant="ghost" type="button" onClick={() => window.open('/profile/preview', '_blank')}>
                Preview public card
              </Button>
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
                  disabled={isPreferencesLoading}
                  onChange={(event) => {
                    void persistPreferences({ shareProfile: event.target.checked })
                  }}
                />
                <div>
                  <span className="settings-toggle__label">Share profile publicly</span>
                  <span className="settings-toggle__hint">
                    Generates a read-only landing page using the `/api/user-profile` endpoint.
                  </span>
                </div>
              </label>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={sessionPresence}
                  disabled={isPreferencesLoading}
                  onChange={(event) => {
                    void persistPreferences({ sessionPresence: event.target.checked })
                  }}
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
                  disabled={isPreferencesLoading}
                  onChange={(event) => {
                    void persistPreferences({ notifyFinds: event.target.checked })
                  }}
                />
                <div>
                  <span className="settings-toggle__label">Send notifications for notable finds</span>
                  <span className="settings-toggle__hint">
                    Pushes alerts when high-rarity drops sync back to the grail service.
                  </span>
                </div>
              </label>
              <div className="settings-inline-status">
                {preferenceMessage && (
                  <StatusBadge variant={preferenceMessage.variant}>{preferenceMessage.text}</StatusBadge>
                )}
                {preferenceError && <p className="settings-inline-error">{preferenceError}</p>}
              </div>
            </CardContent>
            <CardFooter className="settings-card-footer">
              <Button variant="secondary">Configure collaborators</Button>
              <Button variant="ghost" onClick={() => void persistPreferences({ shareProfile: false })}>
                Pause sharing
              </Button>
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
              Pick a theme and accent palette. Final implementation syncs with the device and persisted preferences.
            </p>
          </div>
          <StatusBadge variant="info" subtle>
            Theme sync active
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
                    onClick={() => void handleThemeSelect(option)}
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
                  <span className="settings-theme-preview__body">
                    {selectedTheme.label} experience with {selectedAccent.label.toLowerCase()} accents.
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="settings-card-footer">
              <Button variant="primary" onClick={() => void persistPreferences({ themeMode: selectedTheme.serverValue })}>
                Apply theme
              </Button>
              <Button variant="ghost" onClick={() => void persistPreferences({ themeMode: 'SYSTEM' })}>
                Reset to default
              </Button>
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
                      onClick={() => void handleAccentSelect(option)}
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
                  disabled={isPreferencesLoading}
                  onChange={(event) => void persistPreferences({ enableTooltipContrast: event.target.checked })}
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
                  disabled={isPreferencesLoading}
                  onChange={(event) => void persistPreferences({ reduceMotion: event.target.checked })}
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
              Wire import/export flows that back the persistence layer for user items and runeword tracking.
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
                Wire up endpoints like <code>/api/user-data/import</code> and <code>/api/user-data/export</code> to
                support offline backups.
              </CardDescription>
            </CardHeader>
            <CardContent className="settings-card-content--spaced">
              <div className="settings-upload">
                <div
                  className="settings-upload__dropzone"
                  role="presentation"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    void handleImportFiles(event.dataTransfer.files)
                  }}
                >
                  <p className="settings-upload__title">Drag &amp; drop a CSV or save file</p>
                  <p className="settings-upload__hint">We will merge entries and surface a diff before committing.</p>
                  <label className="settings-upload__button">
                    <input
                      type="file"
                      accept=".csv,.json,.txt"
                      onChange={(event) => void handleImportFiles(event.target.files)}
                      disabled={isImporting}
                    />
                    <span>{isImporting ? 'Uploading…' : 'Browse files'}</span>
                  </label>
                </div>
              </div>
              {importJob && (
                <div className="settings-upload__status">
                  <StatusBadge variant={importJob.status === 'FAILED' ? 'danger' : 'success'}>
                    {importJob.status === 'FAILED' ? 'Import blocked' : 'Import processed'}
                  </StatusBadge>
                  <p>{importJob.message}</p>
                </div>
              )}
              {importConflict && (
                <div className="settings-upload__conflict">
                  <p>Conflicts detected. Review the diff before committing changes.</p>
                  <Button variant="secondary" size="sm" onClick={() => void handleImportRetry()}>
                    Retry import
                  </Button>
                </div>
              )}
              {importError && <p className="settings-inline-error">{importError}</p>}
              <Stack direction="horizontal" gap="sm" wrap>
                <Button variant="primary" onClick={() => void handleExport('csv')}>
                  Export progress (CSV)
                </Button>
                <Button variant="secondary" onClick={() => void handleExport('json')}>
                  Download offline bundle
                </Button>
                <Button variant="ghost" onClick={() => window.open('/docs/settings.md', '_blank')}>
                  View change log
                </Button>
              </Stack>
              {exportJob && (
                <div className="settings-upload__status">
                  <StatusBadge variant={exportJob.status === 'FAILED' ? 'danger' : 'success'}>
                    {exportJob.status === 'FAILED' ? 'Export failed' : 'Export ready'}
                  </StatusBadge>
                  <p>{exportJob.message}</p>
                  {exportDownloadUrl && (
                    <Button variant="surface" size="sm" onClick={() => window.location.assign(exportDownloadUrl)}>
                      Download latest bundle
                    </Button>
                  )}
                </div>
              )}
              {exportError && <p className="settings-inline-error">{exportError}</p>}
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
              {(connectorsQuery.data ?? []).map((connector) => (
                <div key={connector.id} className="settings-connector">
                  <div className="settings-connector__header">
                    <div>
                      <p className="settings-connector__title">{connector.label}</p>
                      <p className="settings-connector__description">{connector.description}</p>
                    </div>
                    <StatusBadge variant={CONNECTOR_VARIANT_MAP[connector.statusVariant]}>
                      {connector.statusMessage}
                    </StatusBadge>
                  </div>
                  <div className="settings-connector__meta">
                    <span className="settings-connector__sync">{connector.lastSyncSummary}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleConnectorAction(connector.id, inferAction(connector))}
                    >
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
              {onboardingTasks.map((task) => (
                <li key={task.id}>
                  <label className="settings-checklist__item">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => void handleTaskToggle(task)}
                      disabled={task.derivedFromSignals}
                    />
                    <div>
                      <span className="settings-checklist__label">{task.label}</span>
                      <span className="settings-checklist__description">{task.description}</span>
                      {task.derivedFromSignals && (
                        <span className="settings-checklist__hint">Completed automatically</span>
                      )}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="settings-card-footer">
            <Button
              variant="primary"
              onClick={() =>
                onboardingTasks
                  .filter((task) => !task.completed && !task.derivedFromSignals)
                  .forEach((task) => {
                    void handleTaskToggle(task)
                  })
              }
            >
              Mark all complete
            </Button>
            <Button variant="ghost">Share feedback</Button>
          </CardFooter>
        </Card>
      </section>
    </Container>
  )
}

function inferAction(connector: DataConnector): 'manage' | 'schedule' | 'import' | 'sync' {
  switch (connector.id) {
    case 'cloud-backup':
      return 'manage'
    case 'local-archive':
      return 'schedule'
    case 'd2r-import':
      return 'import'
    default:
      return 'sync'
  }
}

function isValidTimezone(timezone: string): boolean {
  if (!timezone) {
    return false
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

export default SettingsPage
