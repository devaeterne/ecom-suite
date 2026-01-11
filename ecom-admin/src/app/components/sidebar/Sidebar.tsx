"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { Text, clx } from "@medusajs/ui"
import { useT } from "@/i18n/use-t"
import { NAV } from "@/components/nav/nav.config"

export default function Sidebar() {
  const t = useT()
  const params = useParams<{ locale: string }>()
  const pathname = usePathname()
  const locale = params?.locale ?? "en"

  return (
    <aside className="w-64 border-r border-ui-border-base bg-ui-bg-base px-3 py-4">
      <div className="px-3 py-2">
        <Text size="small" weight="plus">
          {t("brand.name")}
        </Text>
        <Text size="xsmall" className="text-ui-fg-subtle">
          {t("brand.subtitle")}
        </Text>
      </div>

      <div className="mt-4 space-y-1">
        {NAV.map((item) => {
          const fullHref = `/${locale}${item.href}`
          const active = pathname === fullHref || pathname.startsWith(fullHref + "/")

          return (
            <Link
              key={item.href}
              href={fullHref}
              className={clx(
                "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                "text-ui-fg-subtle hover:bg-ui-bg-subtle hover:text-ui-fg-base",
                active && "bg-ui-bg-subtle text-ui-fg-base"
              )}
            >
              <span
                className={clx(
                  "h-2 w-2 rounded-full transition-opacity",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                )}
              />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
