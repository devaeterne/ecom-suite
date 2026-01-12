"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Button, DropdownMenu, Table } from "@medusajs/ui"
import { EllipsisHorizontal } from "@medusajs/icons"

import type { AdminProductListItem } from "../_types/products.types"
import { ProductStatusBadge } from "./product-status-badge"
import { InventoryBadge } from "./inventory-badge"

export function ProductsTable({
  items,
  labels,
}: {
  items: AdminProductListItem[]
  labels: {
    product: string
    status: string
    variants: string
    inventory: string
    updated: string
    actions: string
    view: string
  }
}) {
  const params = useParams<{ locale: string }>()
  const locale = params?.locale ?? "en"

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{labels.product}</Table.HeaderCell>
          <Table.HeaderCell>{labels.status}</Table.HeaderCell>
          <Table.HeaderCell>{labels.variants}</Table.HeaderCell>
          <Table.HeaderCell>{labels.inventory}</Table.HeaderCell>
          <Table.HeaderCell>{labels.updated}</Table.HeaderCell>
          <Table.HeaderCell className="text-right">{labels.actions}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {items.map((p) => (
          <Table.Row key={p.id}>
            <Table.Cell>
              <div className="flex flex-col">
                <span className="font-medium">{p.title}</span>
                {p.handle ? (
                  <span className="text-ui-fg-subtle text-xs">@{p.handle}</span>
                ) : null}
              </div>
            </Table.Cell>

            <Table.Cell>
              <ProductStatusBadge status={p.status} />
            </Table.Cell>

            <Table.Cell>{p.variantsCount}</Table.Cell>

            <Table.Cell>
              <InventoryBadge status={p.inventoryStatus} />
            </Table.Cell>

            <Table.Cell>{new Date(p.updatedAt).toLocaleDateString()}</Table.Cell>

            <Table.Cell className="text-right">
              <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                  <Button size="small" variant="secondary">
                    <EllipsisHorizontal />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Item asChild>
                    <Link href={`/${locale}/products/${p.id}`}>{labels.view}</Link>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}
