import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  fetchUserPreferences,
  updateUserPreferences as updateUserPreferencesRequest,
  type AccentColor,
  type ThemeMode,
  type UserPreferences,
  type UserPreferencesInput,
} from '../settings/settingsApi'
import { useThemeManager, type AccentColor as ClientAccent, type ThemeMode as ClientTheme } from '../../lib/themeManager'
import { queryClient } from '../../lib/queryClient'

type PreferencesContextValue = {
  preferences: UserPreferences | null
  isLoading: boolean
  updateUserPreferences: (input: UserPreferencesInput) => Promise<UserPreferences>
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined)

type PreferencesProviderProps = {
  children: ReactNode
}

export function UserPreferencesProvider({ children }: PreferencesProviderProps) {
  const { setTheme, setAccent } = useThemeManager()

  const mapTheme = useCallback((mode: ThemeMode): ClientTheme => {
    switch (mode) {
      case 'DARK':
        return 'dark'
      case 'LIGHT':
        return 'light'
      case 'HIGH_CONTRAST':
        return 'high-contrast'
      case 'SYSTEM':
      default:
        return 'system'
    }
  }, [])

  const mapAccent = useCallback((accent: AccentColor): ClientAccent => {
    switch (accent) {
      case 'ARCANE':
        return 'arcane'
      case 'GILDED':
        return 'gilded'
      case 'EMBER':
      default:
        return 'ember'
    }
  }, [])

  const preferencesQuery = useQuery({
    queryKey: ['user-preferences'],
    queryFn: fetchUserPreferences,
  })

  useEffect(() => {
    if (!preferencesQuery.data) {
      return
    }
    setTheme(mapTheme(preferencesQuery.data.themeMode))
    setAccent(mapAccent(preferencesQuery.data.accentColor))
  }, [mapAccent, mapTheme, preferencesQuery.data, setAccent, setTheme])

  const mutation = useMutation({
    mutationFn: updateUserPreferencesRequest,
    onSuccess: (data) => {
      queryClient.setQueryData(['user-preferences'], data)
      setTheme(mapTheme(data.themeMode))
      setAccent(mapAccent(data.accentColor))
    },
  })

  const updateUserPreferences = useCallback(
    async (input: UserPreferencesInput) => {
      const result = await mutation.mutateAsync(input)
      return result
    },
    [mutation],
  )

  const value = useMemo<PreferencesContextValue>(() => {
    return {
      preferences: preferencesQuery.data ?? null,
      isLoading: preferencesQuery.isLoading,
      updateUserPreferences,
    }
  }, [preferencesQuery.data, preferencesQuery.isLoading, updateUserPreferences])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUserPreferencesContext(): PreferencesContextValue {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('useUserPreferencesContext must be used within a UserPreferencesProvider')
  }
  return context
}
