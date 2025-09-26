import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ThemeMode = 'system' | 'dark' | 'light' | 'high-contrast'
type AccentColor = 'ember' | 'arcane' | 'gilded'

type ThemeContextValue = {
  theme: ThemeMode
  accent: AccentColor
  systemTheme: 'dark' | 'light'
  setTheme: (mode: ThemeMode) => void
  setAccent: (accent: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const THEME_STORAGE_KEY = 'grail-theme-mode'
const ACCENT_STORAGE_KEY = 'grail-accent-color'

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'system'
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
  return stored ?? 'system'
}

function getInitialAccent(): AccentColor {
  if (typeof window === 'undefined') {
    return 'ember'
  }
  const stored = window.localStorage.getItem(ACCENT_STORAGE_KEY) as AccentColor | null
  return stored ?? 'ember'
}

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: ThemeMode, accent: AccentColor, systemTheme: 'dark' | 'light') {
  if (typeof document === 'undefined') {
    return
  }
  const mode = theme === 'system' ? systemTheme : theme
  document.documentElement.dataset.theme = mode
  document.documentElement.dataset.accent = accent
}

type ThemeProviderProps = {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme)
  const [accent, setAccentState] = useState<AccentColor>(getInitialAccent)
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(getSystemTheme)

  useEffect(() => {
    applyTheme(theme, accent, systemTheme)
  }, [theme, accent, systemTheme])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode)
    }
  }, [])

  const setAccent = useCallback((value: AccentColor) => {
    setAccentState(value)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, value)
    }
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, accent, systemTheme, setTheme, setAccent }),
    [accent, setAccent, setTheme, systemTheme, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeManager(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeManager must be used within a ThemeProvider')
  }
  return context
}

export type { AccentColor, ThemeMode }
