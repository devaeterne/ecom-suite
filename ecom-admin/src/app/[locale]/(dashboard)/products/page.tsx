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
  clx,
} from "@medusajs/ui"
import { EllipsisHorizontal, Funnel } from "@medusajs/icons"
import { useT } from "@/i18n/use-t"

type ProductRow = {
  id: string
  title: string
  status: "active" | "draft"
  inventory: number
  price: string
  updatedAt: string
}

const MOCK: ProductRow[] = [
  {
    id: "prod_1",
    title: "Smoke Hero Candle",
    status: "active",
    inventory: 142,
    price: "$24.00",
    updatedAt: "2026-01-10",
  },
  {
    id: "prod_2",
    title: "Minimal Hoodie",
    status: "draft",
    inventory: 0,
    price: "$59.00",
    updatedAt: "2026-01-08",
  },
  {
    id: "prod_3",
    title: "Everyday Mug",
    status: "active",
    inventory: 38,
    price: "$12.00",
    updatedAt: "2026-01-04",
  },
]

function StatusPill({ status }: { status: ProductRow["status"] }) {
  const t = useT()
  return (
    <StatusBadge color={status === "active" ? "green" : "grey"}>
      {status === "active" ? t("products.status.active") : t("products.status.draft")}
    </StatusBadge>
  )
}

export default function ProductsPage() {
  const t = useT()
  const [q, setQ] = useState("")

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return MOCK
    return MOCK.filter((p) => p.title.toLowerCase().includes(s))
  }, [q])

  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="topbar.title.products"
        subtitleKey="pages.products.subtitle"
        actions={
          <>
            <Button variant="secondary" size="small">
              {t("pages.products.actions.import")}
            </Button>
            <Button variant="primary" size="small">
              {t("pages.products.actions.new")}
            </Button>
          </>
        }
      />

      <Container className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="w-full md:max-w-sm">
              <Input
                placeholder={t("products.search")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button variant="secondary" size="small">
                  <Funnel />
                  <span className="ml-2">{t("products.filters")}</span>
                </Button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Content align="start">
                <DropdownMenu.Label>Coming soon</DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Item disabled>Status</DropdownMenu.Item>
                <DropdownMenu.Item disabled>Collection</DropdownMenu.Item>
                <DropdownMenu.Item disabled>Tags</DropdownMenu.Item>
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
                <Table.HeaderCell>{t("products.columns.title")}</Table.HeaderCell>
                <Table.HeaderCell>{t("products.columns.status")}</Table.HeaderCell>
                <Table.HeaderCell>{t("products.columns.inventory")}</Table.HeaderCell>
                <Table.HeaderCell>{t("products.columns.price")}</Table.HeaderCell>
                <Table.HeaderCell>{t("products.columns.updated")}</Table.HeaderCell>
                <Table.HeaderCell className="text-right">
                  {t("products.columns.actions")}
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {rows.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6}>
                    <div className="py-10 text-center">
                      <Text weight="plus">{t("products.empty.title")}</Text>
                      <Text size="small" className="text-ui-fg-subtle mt-1">
                        {t("products.empty.body")}
                      </Text>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : (
                rows.map((p) => (
                  <Table.Row key={p.id}>
                    <Table.Cell>
                      <div className="min-w-0">
                        <Text weight="plus" className="truncate">
                          {p.title}
                        </Text>
                        <Text size="xsmall" className="text-ui-fg-subtle">
                          {p.id}
                        </Text>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <StatusPill status={p.status} />
                    </Table.Cell>

                    <Table.Cell>
                      <Text
                        size="small"
                        className={clx(p.inventory === 0 && "text-ui-fg-subtle")}
                      >
                        {p.inventory}
                      </Text>
                    </Table.Cell>

                    <Table.Cell>
                      <Text size="small">{p.price}</Text>
                    </Table.Cell>

                    <Table.Cell>
                      <Text size="small" className="text-ui-fg-subtle">
                        {p.updatedAt}
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
                          <DropdownMenu.Item>{t("products.row.edit")}</DropdownMenu.Item>
                          <DropdownMenu.Item>{t("products.row.duplicate")}</DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item className="text-red-600">
                            {t("products.row.archive")}
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

        {/* Pagination placeholder */}
        <div className="mt-4 flex items-center justify-between">
          <Button variant="secondary" size="small" disabled>
            {t("products.pagination.prev")}
          </Button>

          <Text size="xsmall" className="text-ui-fg-subtle">
            Page 1 of 1
          </Text>

          <Button variant="secondary" size="small" disabled>
            {t("products.pagination.next")}
          </Button>
        </div>
      </Container>
    </div>
  )
}
