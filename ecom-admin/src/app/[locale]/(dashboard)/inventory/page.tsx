import Link from "next/link"
import { Container, Heading, Text, Button } from "@medusajs/ui"
import PageHeader from "@/components/page-header/PageHeader"

export default function InventoryOverviewPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="pages.inventory.overview.title"
        subtitleKey="pages.inventory.overview.subtitle"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Container className="p-6 space-y-3">
          <Heading level="h3">Locations</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Warehouses, stores and stock points
          </Text>
          <Link href="./inventory/locations">
            <Button size="small" variant="secondary">
              Manage locations
            </Button>
          </Link>
        </Container>

        <Container className="p-6 space-y-3">
          <Heading level="h3">Stock levels</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Available and reserved quantities
          </Text>
          <Link href="./inventory/levels">
            <Button size="small" variant="secondary">
              View stock levels
            </Button>
          </Link>
        </Container>

        <Container className="p-6 space-y-3">
          <Heading level="h3">Reservations</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Stock locked by active checkouts
          </Text>
          <Link href="./inventory/reservations">
            <Button size="small" variant="secondary">
              View reservations
            </Button>
          </Link>
        </Container>
      </div>
    </div>
  )
}
