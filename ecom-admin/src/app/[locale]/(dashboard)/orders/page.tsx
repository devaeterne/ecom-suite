"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Button, DropdownMenu, Table, Text } from "@medusajs/ui"
import { EllipsisHorizontal } from "@medusajs/icons"
import PageHeader from "@/components/page-header/PageHeader"
import { useT } from "@/i18n/use-t"

type OrderRow = {
  id: string
  displayId: string
  customer: string
  status: "pending" | "paid" | "fulfilled" | "canceled"
  total: string
  date: string
}

const MOCK: OrderRow[] = [
  { id: "o_1", displayId: "#1001", customer: "Buyer One", status: "paid", total: "$129.00", date: "2026-01-11" },
  { id: "o_2", displayId: "#1002", customer: "Buyer Two", status: "pending", total: "$59.00", date: "2026-01-10" }
]

export default function OrdersPage() {
  const t = useT()
  const params = useParams<{ locale: string }>()
  const locale = params?.locale ?? "en"

  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="topbar.title.orders"
        subtitleKey="pages.orders.subtitle"
      />

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t("orders.columns.order")}</Table.HeaderCell>
            <Table.HeaderCell>{t("orders.columns.customer")}</Table.HeaderCell>
            <Table.HeaderCell>{t("orders.columns.status")}</Table.HeaderCell>
            <Table.HeaderCell className="text-right">{t("orders.columns.total")}</Table.HeaderCell>
            <Table.HeaderCell>{t("orders.columns.date")}</Table.HeaderCell>
            <Table.HeaderCell className="text-right">{t("orders.columns.actions")}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {MOCK.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={6}>
                <div className="py-8 text-center">
                  <Text weight="plus">{t("orders.empty.title")}</Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    {t("orders.empty.body")}
                  </Text>
                </div>
              </Table.Cell>
            </Table.Row>
          ) : (
            MOCK.map((o) => (
              <Table.Row key={o.id}>
                <Table.Cell>{o.displayId}</Table.Cell>
                <Table.Cell>{o.customer}</Table.Cell>
                <Table.Cell>{t(`orders.status.${o.status}`)}</Table.Cell>
                <Table.Cell className="text-right">{o.total}</Table.Cell>
                <Table.Cell>{o.date}</Table.Cell>
                <Table.Cell className="text-right">
                  <DropdownMenu>
                    <DropdownMenu.Trigger asChild>
                      <Button size="small" variant="secondary">
                        <EllipsisHorizontal />
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item asChild>
                        <Link href={`/${locale}/orders/${o.id}`}>{t("orders.row.view")}</Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item>{t("orders.row.refund")}</DropdownMenu.Item>
                      <DropdownMenu.Item className="text-red-600">{t("orders.row.cancel")}</DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </div>
  )
}
