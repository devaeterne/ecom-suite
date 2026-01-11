import Link from "next/link"
import { Button, Container, Heading, Table, Text } from "@medusajs/ui"
import PageHeader from "@/components/page-header/PageHeader"

export default function InventoryLocationsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="pages.inventory.locations.title"
        subtitleKey="pages.inventory.locations.subtitle"
        actions={
          <Button size="small" variant="primary">
            Create location
          </Button>
        }
      />

      <Container className="p-0 overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Code</Table.HeaderCell>
              <Table.HeaderCell>Default</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {/* Placeholder rows */}
            <Table.Row>
              <Table.Cell>
                <div className="flex flex-col">
                  <Text size="small" weight="plus">Main Warehouse</Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">Podgorica</Text>
                </div>
              </Table.Cell>
              <Table.Cell>MAIN</Table.Cell>
              <Table.Cell>
                <Text size="small">Yes</Text>
              </Table.Cell>
              <Table.Cell className="text-right">
                <Link href="./locations/loc_1">
                  <Button variant="secondary" size="small">View</Button>
                </Link>
              </Table.Cell>
            </Table.Row>

            <Table.Row>
              <Table.Cell>
                <div className="flex flex-col">
                  <Text size="small" weight="plus">Storefront</Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">Kotor</Text>
                </div>
              </Table.Cell>
              <Table.Cell>STORE</Table.Cell>
              <Table.Cell>
                <Text size="small">No</Text>
              </Table.Cell>
              <Table.Cell className="text-right">
                <Link href="./locations/loc_2">
                  <Button variant="secondary" size="small">View</Button>
                </Link>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Container>
    </div>
  )
}
