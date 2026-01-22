import { useState, useEffect, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'theme'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

function applyTheme(theme: Theme) {
  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme
  
  if (effectiveTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_KEY) as Theme | null
      return stored || 'light'
    }
    return 'light'
  })

  const [isDarkMode, setIsDarkMode] = useState(false)

  // Apply theme and track dark mode state
  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(THEME_KEY, theme)
    
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme
    setIsDarkMode(effectiveTheme === 'dark')
  }, [theme])

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      applyTheme('system')
      setIsDarkMode(e.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  // Monitor DOM changes for external toggles
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  const toggleDarkMode = useCallback(() => {
    const newTheme = isDarkMode ? 'light' : 'dark'
    setTheme(newTheme)
  }, [isDarkMode, setTheme])

  return {
    theme,
    setTheme,
    isDarkMode,
    toggleDarkMode
  }
}
