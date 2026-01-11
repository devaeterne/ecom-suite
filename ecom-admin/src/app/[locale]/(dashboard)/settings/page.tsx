"use client"

import { useMemo, useState } from "react"
import PageHeader from "@/components/page-header/PageHeader"
import {
  Button,
  Container,
  Divider,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Tabs,
  Text,
} from "@medusajs/ui"
import { useT } from "@/i18n/use-t"

type TabKey = "general" | "localization" | "tax" | "notifications"

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div>
        <Heading level="h2" className="text-base">
          {title}
        </Heading>
        {subtitle ? (
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {subtitle}
          </Text>
        ) : null}
      </div>

      <Divider />

      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {hint ? (
        <Text size="xsmall" className="text-ui-fg-subtle">
          {hint}
        </Text>
      ) : null}
    </div>
  )
}

export default function SettingsPage() {
  const t = useT()
  const [tab, setTab] = useState<TabKey>("general")
  const [dirty, setDirty] = useState(false)

  // UI-only form state (mock)
  const [storeName, setStoreName] = useState("Ecom Store")
  const [supportEmail, setSupportEmail] = useState("support@ecom.local")
  const [supportPhone, setSupportPhone] = useState("+382 20 000 000")

  const [language, setLanguage] = useState("en")
  const [currency, setCurrency] = useState("USD")
  const [timezone, setTimezone] = useState("Europe/Podgorica")

  const [taxInclusive, setTaxInclusive] = useState(false)

  const [notifyOrders, setNotifyOrders] = useState(true)
  const [notifyLowStock, setNotifyLowStock] = useState(false)

  const actions = useMemo(() => {
    return (
      <Button
        variant="primary"
        size="small"
        disabled={!dirty}
        onClick={() => setDirty(false)}
      >
        {t("pages.settings.actions.save")}
      </Button>
    )
  }, [dirty, t])

  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="topbar.title.settings"
        subtitleKey="pages.settings.subtitle"
        actions={actions}
      />

      <Container className="p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <Tabs.List>
            <Tabs.Trigger value="general">{t("settings.tabs.general")}</Tabs.Trigger>
            <Tabs.Trigger value="localization">{t("settings.tabs.localization")}</Tabs.Trigger>
            <Tabs.Trigger value="tax">{t("settings.tabs.tax")}</Tabs.Trigger>
            <Tabs.Trigger value="notifications">{t("settings.tabs.notifications")}</Tabs.Trigger>
          </Tabs.List>

          <div className="mt-4">
            <Tabs.Content value="general">
              <Section
                title={t("settings.general.title")}
                subtitle={t("settings.general.subtitle")}
              >
                <Field label={t("settings.general.name")}>
                  <Input
                    value={storeName}
                    onChange={(e) => {
                      setStoreName(e.target.value)
                      setDirty(true)
                    }}
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t("settings.general.email")}>
                    <Input
                      value={supportEmail}
                      onChange={(e) => {
                        setSupportEmail(e.target.value)
                        setDirty(true)
                      }}
                    />
                  </Field>

                  <Field label={t("settings.general.phone")}>
                    <Input
                      value={supportPhone}
                      onChange={(e) => {
                        setSupportPhone(e.target.value)
                        setDirty(true)
                      }}
                    />
                  </Field>
                </div>
              </Section>
            </Tabs.Content>

            <Tabs.Content value="localization">
              <Section
                title={t("settings.localization.title")}
                subtitle={t("settings.localization.subtitle")}
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label={t("settings.localization.default_language")}>
                    <Select
                      value={language}
                      onValueChange={(v) => {
                        setLanguage(v)
                        setDirty(true)
                      }}
                    >
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value="en">English</Select.Item>
                        <Select.Item value="tr">Türkçe</Select.Item>
                      </Select.Content>
                    </Select>
                  </Field>

                  <Field label={t("settings.localization.default_currency")}>
                    <Select
                      value={currency}
                      onValueChange={(v) => {
                        setCurrency(v)
                        setDirty(true)
                      }}
                    >
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value="USD">USD</Select.Item>
                        <Select.Item value="EUR">EUR</Select.Item>
                        <Select.Item value="TRY">TRY</Select.Item>
                      </Select.Content>
                    </Select>
                  </Field>

                  <Field label={t("settings.localization.timezone")}>
                    <Input
                      value={timezone}
                      onChange={(e) => {
                        setTimezone(e.target.value)
                        setDirty(true)
                      }}
                    />
                  </Field>
                </div>
              </Section>
            </Tabs.Content>

            <Tabs.Content value="tax">
              <Section
                title={t("settings.tax.title")}
                subtitle={t("settings.tax.subtitle")}
              >
                <div className="flex items-center justify-between gap-4 rounded-lg border border-ui-border-base p-4">
                  <div>
                    <Text weight="plus">{t("settings.tax.inclusive")}</Text>
                    <Text size="small" className="text-ui-fg-subtle mt-1">
                      {t("settings.tax.inclusive_hint")}
                    </Text>
                  </div>

                  <Switch
                    checked={taxInclusive}
                    onCheckedChange={(v) => {
                      setTaxInclusive(Boolean(v))
                      setDirty(true)
                    }}
                  />
                </div>
              </Section>
            </Tabs.Content>

            <Tabs.Content value="notifications">
              <Section
                title={t("settings.notifications.title")}
                subtitle={t("settings.notifications.subtitle")}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-ui-border-base p-4">
                    <div>
                      <Text weight="plus">{t("settings.notifications.orders")}</Text>
                      <Text size="small" className="text-ui-fg-subtle mt-1">
                        Email notifications for order events (placeholder)
                      </Text>
                    </div>

                    <Switch
                      checked={notifyOrders}
                      onCheckedChange={(v) => {
                        setNotifyOrders(Boolean(v))
                        setDirty(true)
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-lg border border-ui-border-base p-4">
                    <div>
                      <Text weight="plus">
                        {t("settings.notifications.low_stock")}
                      </Text>
                      <Text size="small" className="text-ui-fg-subtle mt-1">
                        Notify when inventory goes below threshold (placeholder)
                      </Text>
                    </div>

                    <Switch
                      checked={notifyLowStock}
                      onCheckedChange={(v) => {
                        setNotifyLowStock(Boolean(v))
                        setDirty(true)
                      }}
                    />
                  </div>
                </div>
              </Section>
            </Tabs.Content>
          </div>
        </Tabs>
      </Container>
    </div>
  )
}
