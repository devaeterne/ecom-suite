"use client"

import { Button, Container, Input, Select, StatusBadge, Table, Text } from "@medusajs/ui"
import PageHeader from "@/components/page-header/PageHeader"

export default function InventoryReservationsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="pages.inventory.reservations.title"
        subtitleKey="pages.inventory.reservations.subtitle"
        actions={
          <Button size="small" variant="secondary">
            Export (later)
          </Button>
        }
      />

      <Container className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Search by checkoutId / variantId (later)" />
          <Select>
            <Select.Trigger>
              <Select.Value placeholder="Status" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All</Select.Item>
              <Select.Item value="ACTIVE">ACTIVE</Select.Item>
              <Select.Item value="COMPLETED">COMPLETED</Select.Item>
              <Select.Item value="CANCELED">CANCELED</Select.Item>
              <Select.Item value="EXPIRED">EXPIRED</Select.Item>
            </Select.Content>
          </Select>
          <Select>
            <Select.Trigger>
              <Select.Value placeholder="Location (later)" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All locations</Select.Item>
              <Select.Item value="main">Main Warehouse</Select.Item>
              <Select.Item value="store">Storefront</Select.Item>
            </Select.Content>
          </Select>
          <div className="flex gap-2">
            <Button variant="secondary" size="small">Apply</Button>
            <Button variant="transparent" size="small">Reset</Button>
          </div>
        </div>
      </Container>

      <Container className="p-0 overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Reservation</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Variant</Table.HeaderCell>
              <Table.HeaderCell>Location</Table.HeaderCell>
              <Table.HeaderCell>Qty</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            <Table.Row>
              <Table.Cell>
                <div className="flex flex-col">
                  <Text size="small" weight="plus">res_001</Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">checkout_abc</Text>
                </div>
              </Table.Cell>
              <Table.Cell>
                <StatusBadge color="green">ACTIVE</StatusBadge>
              </Table.Cell>
              <Table.Cell>var_123</Table.Cell>
              <Table.Cell>Main Warehouse</Table.Cell>
              <Table.Cell>2</Table.Cell>
            </Table.Row>

            <Table.Row>
              <Table.Cell>
                <div className="flex flex-col">
                  <Text size="small" weight="plus">res_002</Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">checkout_def</Text>
                </div>
              </Table.Cell>
              <Table.Cell>
                <StatusBadge color="orange">EXPIRED</StatusBadge>
              </Table.Cell>
              <Table.Cell>var_456</Table.Cell>
              <Table.Cell>Storefront</Table.Cell>
              <Table.Cell>1</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Container>
    </div>
  )
}
