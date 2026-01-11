"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button, Container, Heading, Input, Text } from "@medusajs/ui"
import { setAuth } from "@/components/auth/auth.store"
import { useT } from "@/i18n/use-t"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const params = useParams<{ locale: string }>()
  const locale = params?.locale ?? "en"
  const t = useT()

  async function submit() {
    setLoading(true)
    // mock auth
    setTimeout(() => {
      setAuth({
        token: "mock-token",
        user: { email },
      })
      router.replace(`/${locale}/dashboards`)
    }, 600)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ui-bg-subtle">
      <Container className="w-full max-w-sm p-6 space-y-4">
        <Heading level="h1">{t("auth.login.title")}</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {t("auth.login.subtitle")}
        </Text>

        <Input
          placeholder={t("auth.login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder={t("auth.login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
