"use client"

import React, { createContext, useContext, useMemo } from "react"
import type { Locale } from "./config"

type Dict = Record<string, any>

type I18nCtx = {
  locale: Locale
  messages: Dict
}

const Ctx = createContext<I18nCtx | null>(null)

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale
  messages: Dict
  children: React.ReactNode
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
