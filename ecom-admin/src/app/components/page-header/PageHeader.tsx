"use client"

import { ReactNode } from "react"
import { Heading, Text, clx } from "@medusajs/ui"
import { useT } from "@/i18n/use-t"

type PageHeaderProps = {
  titleKey: string
  subtitleKey?: string
  actions?: ReactNode
  className?: string
}

export default function PageHeader({
  titleKey,
  subtitleKey,
  actions,
  className,
}: PageHeaderProps) {
  const t = useT()

  return (
    <div className={clx("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <Heading level="h1" className="truncate">
          {t(titleKey)}
        </Heading>
        {subtitleKey ? (
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {t(subtitleKey)}
          </Text>
        ) : null}
      </div>

      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}
