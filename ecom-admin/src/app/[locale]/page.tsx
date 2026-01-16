// src/app/[locale]/page.tsx
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

type Props = { params: { locale: string } }
const AUTH_COOKIE = "adminAccessCookie"

export default function LocaleRootPage({ params }: Props) {
  const locale = params.locale || "en"
  const token = cookies().get(AUTH_COOKIE)?.value

  if (token) redirect(`/${locale}/dashboards`)
  redirect(`/${locale}/login`)
}
