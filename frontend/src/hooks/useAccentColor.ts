import { useState, useEffect, useCallback } from 'react'

export type AccentColorKey = 'blue' | 'cyan' | 'navy' | 'teal'

export interface AccentColor {
  key: AccentColorKey
  name: string
  light: string // HSL values for light mode
  dark: string  // HSL values for dark mode
  lightBg: string // Background tint for light mode
  darkBg: string  // Background tint for dark mode
}

export const accentColors: AccentColor[] = [
  {
    key: 'cyan',
    name: 'Cyan',
    light: '197 100% 45%',  // #009fe3
    dark: '199 89% 48%',    // #0ea5e9
    lightBg: '197 100% 95%',
    darkBg: '199 50% 20%'
  },
  {
    key: 'blue',
    name: 'Blue',
    light: '217 74% 51%',   // #4a7eb8
    dark: '217 74% 60%',
    lightBg: '217 74% 95%',
    darkBg: '217 50% 20%'
  },
  {
    key: 'navy',
    name: 'Navy',
    light: '210 40% 37%',   // #3d5a80
    dark: '210 40% 50%',
    lightBg: '210 40% 95%',
    darkBg: '210 30% 20%'
  },
  {
    key: 'teal',
    name: 'Teal',
    light: '172 66% 30%',   // #0d9488
    dark: '172 66% 40%',
    lightBg: '172 66% 95%',
    darkBg: '172 40% 20%'
  }
]

const ACCENT_COLOR_KEY = 'accentColor'

function getStoredAccentColor(): AccentColorKey {
  if (typeof window === 'undefined') return 'cyan'
  const stored = localStorage.getItem(ACCENT_COLOR_KEY)
  if (stored && accentColors.some(c => c.key === stored)) {
    return stored as AccentColorKey
  }
  return 'cyan'
}

function applyAccentColor(colorKey: AccentColorKey, isDark: boolean) {
  const color = accentColors.find(c => c.key === colorKey)
  if (!color) return

  const root = document.documentElement
  root.style.setProperty('--accent-primary', isDark ? color.dark : color.light)
  root.style.setProperty('--accent-primary-foreground', isDark ? '213 32% 14%' : '0 0% 100%')
  root.style.setProperty('--accent-bg', isDark ? color.darkBg : color.lightBg)
}

export function useAccentColor() {
  const [accentColor, setAccentColorState] = useState<AccentColorKey>(getStoredAccentColor)

  // Check if dark mode is active
  const isDark = document.documentElement.classList.contains('dark')

  const setAccentColor = useCallback((colorKey: AccentColorKey) => {
    setAccentColorState(colorKey)
    localStorage.setItem(ACCENT_COLOR_KEY, colorKey)
    applyAccentColor(colorKey, document.documentElement.classList.contains('dark'))
  }, [])

  // Apply accent color on mount and when theme changes
  useEffect(() => {
    applyAccentColor(accentColor, isDark)
  }, [accentColor, isDark])

  // Watch for theme changes via class mutations
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkNow = document.documentElement.classList.contains('dark')
          applyAccentColor(accentColor, isDarkNow)
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [accentColor])

  return {
    accentColor,
    setAccentColor,
    accentColors
  }
}
