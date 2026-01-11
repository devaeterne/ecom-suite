import { ReactNode } from "react"
import { notFound } from "next/navigation"
import { I18nProvider } from "@/i18n/i18n-provider"
import { getMessages } from "@/i18n/get-messages"
import { isLocale, type Locale } from "@/i18n/config"

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { locale: string }
}) {
  const locale = params.locale

  if (!isLocale(locale)) notFound()

  const messages = await getMessages(locale as Locale)

  return (
    <I18nProvider locale={locale as Locale} messages={messages}>
      {children}
    </I18nProvider>
  )
}
