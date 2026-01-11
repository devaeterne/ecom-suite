"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

type Theme = "light" | "dark"
type ThemeCtx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }

const ThemeContext = createContext<ThemeCtx | null>(null)

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)
  root.dataset.theme = theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")

  useEffect(() => {
    const saved = (localStorage.getItem("admin_theme") as Theme | null) ?? "light"
    setThemeState(saved)
    applyTheme(saved)
  }, [])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem("admin_theme", t)
    applyTheme(t)
  }

  const value = useMemo(
    () => ({ theme, setTheme, toggle: () => setTheme(theme === "light" ? "dark" : "light") }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
