"use client"
import { Button, Container, Input, Select, Table, Text } from "@medusajs/ui"
import PageHeader from "@/components/page-header/PageHeader"

export default function InventoryLevelsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="pages.inventory.levels.title"
        subtitleKey="pages.inventory.levels.subtitle"
        actions={
          <Button size="small" variant="secondary">
            Upsert levels
          </Button>
        }
      />

      <Container className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Search by variantId or SKU (later)" />
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
              <Table.HeaderCell>Variant</Table.HeaderCell>
              <Table.HeaderCell>Location</Table.HeaderCell>
              <Table.HeaderCell>In stock</Table.HeaderCell>
              <Table.HeaderCell>Reserved</Table.HeaderCell>
              <Table.HeaderCell>Available</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>
                <div className="flex flex-col">
                  <Text size="small" weight="plus">var_123</Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">SKU-001</Text>
                </div>
              </Table.Cell>
              <Table.Cell>Main Warehouse</Table.Cell>
              <Table.Cell>50</Table.Cell>
              <Table.Cell>5</Table.Cell>
              <Table.Cell>45</Table.Cell>
            </Table.Row>

            <Table.Row>
              <Table.Cell>
                <div className="flex flex-col">
                  <Text size="small" weight="plus">var_456</Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">SKU-002</Text>
                </div>
              </Table.Cell>
              <Table.Cell>Storefront</Table.Cell>
              <Table.Cell>10</Table.Cell>
              <Table.Cell>2</Table.Cell>
              <Table.Cell>8</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Container>
    </div>
  )
}
