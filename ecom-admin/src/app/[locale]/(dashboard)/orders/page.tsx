"use client"

import { useMemo, useState } from "react"
import PageHeader from "@/components/page-header/PageHeader"
import {
  Button,
  Container,
  DropdownMenu,
  Input,
  StatusBadge,
  Table,
  Text,
} from "@medusajs/ui"
import { EllipsisHorizontal, Funnel } from "@medusajs/icons"
import { useT } from "@/i18n/use-t"

type OrderStatus = "pending" | "paid" | "fulfilled" | "canceled"

type OrderRow = {
  id: string
  displayId: string
  customer: string
  status: OrderStatus
  total: string
  createdAt: string
}

const MOCK: OrderRow[] = [
  {
    id: "ord_1",
    displayId: "#1001",
    customer: "Ada Lovelace",
    status: "paid",
    total: "$124.00",
    createdAt: "2026-01-10",
  },
  {
    id: "ord_2",
    displayId: "#1002",
    customer: "Grace Hopper",
    status: "pending",
    total: "$59.00",
    createdAt: "2026-01-09",
  },
  {
    id: "ord_3",
    displayId: "#1003",
    customer: "Linus Torvalds",
    status: "fulfilled",
    total: "$240.00",
    createdAt: "2026-01-06",
  },
  {
    id: "ord_4",
    displayId: "#1004",
    customer: "Margaret Hamilton",
    status: "canceled",
    total: "$12.00",
    createdAt: "2026-01-03",
  },
]

function getBadgeColor(status: OrderStatus) {
  switch (status) {
    case "paid":
      return "green"
    case "fulfilled":
      return "blue"
    case "pending":
      return "orange"
    case "canceled":
      return "red"
    default:
      return "grey"
  }
}

function StatusPill({ status }: { status: OrderStatus }) {
  const t = useT()
  return <StatusBadge color={getBadgeColor(status)}>{t(`orders.status.${status}`)}</StatusBadge>
}

export default function OrdersPage() {
  const t = useT()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<OrderStatus | "all">("all")

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return MOCK.filter((o) => {
      const matchesQuery =
        !s ||
        o.displayId.toLowerCase().includes(s) ||
        o.customer.toLowerCase().includes(s) ||
        o.id.toLowerCase().includes(s)

      const matchesStatus = status === "all" || o.status === status
      return matchesQuery && matchesStatus
    })
  }, [q, status])

  return (
    <div className="space-y-4">
      <PageHeader titleKey="topbar.title.orders" subtitleKey="pages.orders.subtitle" />

      <Container className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="w-full md:max-w-sm">
              <Input
                placeholder={t("orders.search")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button variant="secondary" size="small">
                  <Funnel />
                  <span className="ml-2">{t("orders.filters")}</span>
                </Button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Content align="start">
                <DropdownMenu.Label>Status</DropdownMenu.Label>
                <DropdownMenu.Separator />

                <DropdownMenu.Item onClick={() => setStatus("all")}>
                  All
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => setStatus("pending")}>
                  {t("orders.status.pending")}
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => setStatus("paid")}>
                  {t("orders.status.paid")}
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => setStatus("fulfilled")}>
                  {t("orders.status.fulfilled")}
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => setStatus("canceled")}>
                  {t("orders.status.canceled")}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Text size="xsmall" className="text-ui-fg-subtle">
              {rows.length} items
            </Text>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-ui-border-base">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t("orders.columns.order")}</Table.HeaderCell>
                <Table.HeaderCell>{t("orders.columns.customer")}</Table.HeaderCell>
                <Table.HeaderCell>{t("orders.columns.status")}</Table.HeaderCell>
                <Table.HeaderCell>{t("orders.columns.total")}</Table.HeaderCell>
                <Table.HeaderCell>{t("orders.columns.date")}</Table.HeaderCell>
                <Table.HeaderCell className="text-right">
                  {t("orders.columns.actions")}
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {rows.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6}>
                    <div className="py-10 text-center">
                      <Text weight="plus">{t("orders.empty.title")}</Text>
                      <Text size="small" className="text-ui-fg-subtle mt-1">
                        {t("orders.empty.body")}
                      </Text>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : (
                rows.map((o) => (
                  <Table.Row key={o.id}>
                    <Table.Cell>
                      <div className="min-w-0">
                        <Text weight="plus" className="truncate">
                          {o.displayId}
                        </Text>
                        <Text size="xsmall" className="text-ui-fg-subtle">
                          {o.id}
                        </Text>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <Text size="small">{o.customer}</Text>
                    </Table.Cell>

                    <Table.Cell>
                      <StatusPill status={o.status} />
                    </Table.Cell>

                    <Table.Cell>
                      <Text size="small">{o.total}</Text>
                    </Table.Cell>

                    <Table.Cell>
                      <Text size="small" className="text-ui-fg-subtle">
                        {o.createdAt}
                      </Text>
                    </Table.Cell>

                    <Table.Cell className="text-right">
                      <DropdownMenu>
                        <DropdownMenu.Trigger asChild>
                          <Button variant="secondary" size="small">
                            <EllipsisHorizontal />
                          </Button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Content align="end">
                          <DropdownMenu.Item>{t("orders.row.view")}</DropdownMenu.Item>
                          <DropdownMenu.Item>{t("orders.row.refund")}</DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item className="text-red-600">
                            {t("orders.row.cancel")}
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button variant="secondary" size="small" disabled>
            {t("orders.pagination.prev")}
          </Button>

          <Text size="xsmall" className="text-ui-fg-subtle">
            Page 1 of 1
          </Text>

          <Button variant="secondary" size="small" disabled>
            {t("orders.pagination.next")}
          </Button>
        </div>
      </Container>
    </div>
  )
}
