"use client"

import { usePathname, useParams, useRouter } from "next/navigation"
import { Button, DropdownMenu, Text } from "@medusajs/ui"
import { Moon, Sun, EllipsisHorizontal } from "@medusajs/icons"
import { useTheme } from "@/components/theme/ThemeProvider"
import { useT } from "@/i18n/use-t"
import { getPageMetaFromPath } from "@/components/nav/nav.config" // ✅ bunu import et
import { clearUser } from "@/components/auth/auth.store"

export default function Topbar() {
  const { theme, toggle } = useTheme()
  const pathname = usePathname()
  const t = useT()

  const router = useRouter()
  const params = useParams<{ locale: string }>()
  const locale = params?.locale ?? "en"

  // "/en/products/1" -> "/products/1"
  const normalized = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "")
  const { titleKey } = getPageMetaFromPath(normalized)

  function logout() {
    clearUser()
    router.replace(`/${locale}/login`)
  }

  return (
    <header className="h-14 border-b border-ui-border-base bg-ui-bg-base px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Text size="xsmall" className="text-ui-fg-subtle">
          {t("topbar.scope")}
        </Text>
        <span className="h-4 w-px bg-ui-border-base" />
        <Text size="small" weight="plus">
          {t(titleKey)}
        </Text>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="small" onClick={toggle}>
          {theme === "light" ? <Moon /> : <Sun />}
          <span className="ml-2">
            {theme === "light" ? t("topbar.theme.dark") : t("topbar.theme.light")}
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="secondary" size="small">
              <EllipsisHorizontal />
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content align="end">
            <DropdownMenu.Item>{t("topbar.menu.profile")}</DropdownMenu.Item>
            <DropdownMenu.Item>{t("topbar.menu.account_settings")}</DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item className="text-red-600" onClick={logout}>
              {t("auth.logout")}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </header>
  )
}
