import { apiRequest } from '../../lib/apiClient'

export type UserProfile = {
  id: number
  displayName: string
  tagline: string | null
  email: string
  timezone: string
  updatedAt: string
}

export type UserProfileInput = {
  displayName: string
  tagline: string
  email: string
  timezone: string
}

export type UserPreferences = {
  id: number
  shareProfile: boolean
  sessionPresence: boolean
  notifyFinds: boolean
  themeMode: ThemeMode
  accentColor: AccentColor
  enableTooltipContrast: boolean
  reduceMotion: boolean
  updatedAt: string
  broadcastVersion: number
}

export type ThemeMode = 'SYSTEM' | 'DARK' | 'LIGHT' | 'HIGH_CONTRAST'
export type AccentColor = 'EMBER' | 'ARCANE' | 'GILDED'

export type UserPreferencesInput = {
  shareProfile: boolean
  sessionPresence: boolean
  notifyFinds: boolean
  themeMode: ThemeMode
  accentColor: AccentColor
  enableTooltipContrast: boolean
  reduceMotion: boolean
}

export type DataConnector = {
  id: string
  label: string
  description: string
  statusVariant: 'NEUTRAL' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'INFO'
  statusMessage: string
  lastSyncSummary: string
  nextSyncSummary: string
  actionLabel: string
  updatedAt: string
}

export type SyncJob = {
  id: number
  type: 'PROFILE_SYNC' | 'CONNECTOR_SYNC' | 'IMPORT' | 'EXPORT'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  progress: number
  message: string | null
  connectorId: string | null
  retryCount: number
  createdAt: string
  updatedAt: string
}

export type UserDataImportResponse = {
  job: SyncJob
  conflictsDetected: boolean
}

export type UserDataExportResponse = {
  job: SyncJob
  downloadUrl: string
}

export type OnboardingTask = {
  id: string
  label: string
  description: string
  completed: boolean
  derivedFromSignals: boolean
}

export type OnboardingTasksResponse = {
  tasks: OnboardingTask[]
  completionPercent: number
}

export async function fetchUserProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/user-profile')
}

export async function updateUserProfile(input: UserProfileInput): Promise<UserProfile> {
  return apiRequest<UserProfile>('/user-profile', { method: 'PUT', body: input })
}

export async function fetchUserPreferences(): Promise<UserPreferences> {
  return apiRequest<UserPreferences>('/user-preferences')
}

export async function updateUserPreferences(input: UserPreferencesInput): Promise<UserPreferences> {
  return apiRequest<UserPreferences>('/user-preferences', { method: 'PUT', body: input })
}

export async function fetchDataConnectors(): Promise<DataConnector[]> {
  return apiRequest<DataConnector[]>('/data-connectors')
}

export async function triggerConnectorAction(
  connectorId: string,
  action: 'manage' | 'schedule' | 'import' | 'sync',
): Promise<SyncJob> {
  return apiRequest<SyncJob>(`/data-connectors/${connectorId}/actions`, {
    method: 'POST',
    body: { action },
  })
}

export async function importUserData(file: File): Promise<UserDataImportResponse> {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequest<UserDataImportResponse>('/user-data/import', {
    method: 'POST',
    body: formData,
  })
}

export async function retryImport(jobId: number): Promise<UserDataImportResponse> {
  return apiRequest<UserDataImportResponse>(`/user-data/import/${jobId}/retry`, {
    method: 'POST',
  })
}

export async function startExport(format: 'csv' | 'json'): Promise<UserDataExportResponse> {
  return apiRequest<UserDataExportResponse>('/user-data/export', {
    method: 'POST',
    body: { format },
  })
}

export async function fetchJob(jobId: number): Promise<SyncJob> {
  return apiRequest<SyncJob>(`/user-data/jobs/${jobId}`)
}

export async function fetchOnboardingTasks(): Promise<OnboardingTasksResponse> {
  return apiRequest<OnboardingTasksResponse>('/onboarding/tasks')
}

export async function updateOnboardingTask(
  taskId: string,
  completed: boolean,
): Promise<OnboardingTask> {
  return apiRequest<OnboardingTask>(`/onboarding/tasks/${taskId}`, {
    method: 'POST',
    body: { completed },
  })
}
