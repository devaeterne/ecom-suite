"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { isAuthed } from "./auth.store"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const params = useParams<{ locale: string }>()
  const locale = params?.locale ?? "en"

  useEffect(() => {
    if (!isAuthed()) {
      router.replace(`/${locale}/login`)
    }
  }, [router, locale])

  return <>{children}</>
}
