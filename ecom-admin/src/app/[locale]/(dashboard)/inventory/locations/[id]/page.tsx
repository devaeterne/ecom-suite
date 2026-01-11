import Link from "next/link"
import { Button, Container, Divider, Heading, Text } from "@medusajs/ui"
import PageHeader from "@/components/page-header/PageHeader"

export default function InventoryLocationDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const id = params.id

  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="pages.inventory.location_detail.title"
        subtitleKey="pages.inventory.location_detail.subtitle"
        actions={
          <div className="flex items-center gap-2">
            <Button size="small" variant="secondary">Edit</Button>
            <Button size="small" variant="secondary">Set default</Button>
            <Button size="small" variant="danger">Delete</Button>
          </div>
        }
      />

      <Container className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Text size="xsmall" className="text-ui-fg-subtle">Location ID</Text>
            <Text size="small" weight="plus">{id}</Text>
          </div>
          <Link href="../..">
            <Button variant="secondary" size="small">Back to locations</Button>
          </Link>
        </div>

        <Divider />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Text size="xsmall" className="text-ui-fg-subtle">Name</Text>
            <Text size="small">Main Warehouse</Text>
          </div>
          <div>
            <Text size="xsmall" className="text-ui-fg-subtle">Code</Text>
            <Text size="small">MAIN</Text>
          </div>
          <div>
            <Text size="xsmall" className="text-ui-fg-subtle">Default</Text>
            <Text size="small">Yes</Text>
          </div>
        </div>

        <Divider />

        <div className="flex items-center justify-between">
          <div>
            <Heading level="h2">Quick links</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Jump into stock views filtered by this location (later we’ll pass locationId).
            </Text>
          </div>
          <div className="flex gap-2">
            <Link href="/inventory/levels">
              <Button variant="secondary" size="small">Stock levels</Button>
            </Link>
            <Link href="/inventory/reservations">
              <Button variant="secondary" size="small">Reservations</Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  )
}
