"use client"

import { useMemo, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Button, Container, Heading, Input, Text } from "@medusajs/ui"

import { useT } from "@/i18n/use-t"
import { setAuth } from "@/components/auth/auth.store"

import { AdminAuthApi } from "@/src/lib/api/auth/admin"
import { AdminTenantApi } from "@/src/lib/api/tenant/admin"
import { setTenantContext } from "@/src/lib/api/_client/tenant"
import { HttpError } from "@/src/lib/api/_client/http"

type LoginResponse = {
  user?: {
    id?: string
    email?: string
    name?: string
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const params = useParams<{ locale: string }>()
  const searchParams = useSearchParams()
  const t = useT()

  const locale = params?.locale ?? "en"

  /**
   * middleware -> /{locale}/login?next=/en/xxx
   * güvenlik: sadece site içi path
   */
  const nextPath = useMemo(() => {
    const next = searchParams?.get("next")
    if (!next || !next.startsWith("/")) {
      return `/${locale}/dashboards`
    }
    return next
  }, [searchParams, locale])

  async function submit() {
    setLoading(true)
    setError(null)

    try {
      /**
       * 1) LOGIN
       * Cookie burada set edilir
       */
      const res = await AdminAuthApi.login({
        email,
        password,
      })

      /**
       * 2) TENANT CONTEXT
       * Backend zorunlu tutuyor
       */
      const tenant = await AdminTenantApi.me()

      setTenantContext({
        tenantId: (tenant as any).id ?? (tenant as any).tenantId,
        tenantCode: (tenant as any).code ?? (tenant as any).tenantCode,
      })

      /**
       * 3) UI auth state (opsiyonel ama pratik)
       */
      setAuth({
        token: "cookie",
        user: {
          email: res?.user?.email ?? email,
        },
      })

      /**
       * 4) Redirect
       */
      router.replace(nextPath)
      router.refresh()
    } catch (e) {
      if (e instanceof HttpError) {
        setError(e.message)
      } else {
        setError(t("auth.login.errorGeneric"))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ui-bg-subtle">
      <Container className="w-full max-w-sm p-6 space-y-4">
        <Heading level="h1">{t("auth.login.title")}</Heading>

        <Text size="small" className="text-ui-fg-subtle">
          {t("auth.login.subtitle")}
        </Text>

        {error && (
          <div className="rounded-md bg-ui-tag-red-bg p-3">
            <Text size="small" className="text-ui-tag-red-text">
              {error}
            </Text>
          </div>
        )}

        <Input
          placeholder={t("auth.login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <Input
          type="password"
          placeholder={t("auth.login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit()
          }}
        />

        <Button
          isLoading={loading}
          onClick={submit}
          className="w-full"
        >
          {t("auth.login.submit")}
        </Button>
      </Container>
    </div>
  )
}
