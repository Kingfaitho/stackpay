import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({})

export const themes = {
  dark: {
    name: 'dark',
    bgPrimary: '#060908',
    bgSecondary: '#0D1410',
    bgCard: '#141A16',
    bgCard2: '#111815',
    bgInput: '#0F1510',
    bgSidebar: '#0F1510',
    bgTopbar: '#080C0A',
    bgNav: 'rgba(8,12,10,0.85)',
    border: 'rgba(255,255,255,0.07)',
    borderGreen: 'rgba(0,197,102,0.2)',
    textPrimary: '#EDF2EF',
    textSecondary: '#7A9485',
    textMuted: '#4A6055',
    textLabel: '#8A9E92',
    green: '#00C566',
    greenDark: '#00A855',
    accent: '#00C566',
    accentText: '#060908',
    danger: '#ff8080',
    warning: '#f5a623',
    purple: '#7C6AF7',
    sidebarActive: 'rgba(0,197,102,0.1)',
    sidebarActiveBorder: 'rgba(0,197,102,0.2)',
    sidebarActiveText: '#00C566',
    sidebarText: '#8A9E92',
    statsBarBg: '#0F1510',
    footerBg: '#080C0A',
  },
  light: {
    name: 'light',
    bgPrimary: '#F8F6F1',
    bgSecondary: '#F0EDE5',
    bgCard: '#FFFFFF',
    bgCard2: '#FAFAF8',
    bgInput: '#F4F1EA',
    bgSidebar: '#FFFFFF',
    bgTopbar: 'rgba(255,255,255,0.95)',
    bgNav: 'rgba(248,246,241,0.92)',
    border: 'rgba(0,0,0,0.08)',
    borderGreen: 'rgba(0,150,80,0.25)',
    textPrimary: '#1A1C18',
    textSecondary: '#4A5245',
    textMuted: '#8A9080',
    textLabel: '#6A756A',
    green: '#007A3D',
    greenDark: '#005A2D',
    accent: '#C9A84C',
    accentText: '#1A1C18',
    danger: '#CC2200',
    warning: '#B87A00',
    purple: '#5B4EC7',
    sidebarActive: 'rgba(201,168,76,0.1)',
    sidebarActiveBorder: 'rgba(201,168,76,0.3)',
    sidebarActiveText: '#B8860B',
    sidebarText: '#4A5245',
    statsBarBg: '#F0EDE5',
    footerBg: '#EAE7DF',
  },
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('stackpay_theme') || 'light'
  })

  useEffect(() => {
    localStorage.setItem('stackpay_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const colors = themes[theme]

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
