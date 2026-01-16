//src/app/[locale]/(dashboard)/dashboard/page.tsx

import { Container, Text } from "@medusajs/ui"
import PageHeader from "@/components/page-header/PageHeader"
import { Button } from "@medusajs/ui"

export default function DashboardsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="topbar.title.dashboard"
        subtitleKey="pages.dashboards.subtitle"
        actions={
          <>
            <Button variant="secondary" size="small">
              Export
            </Button>
            <Button variant="primary" size="small">
              Create
            </Button>
          </>
        }
      />

      <Container className="p-6">
        <Text>Shell + Medusa UI + Theme toggle ready.</Text>
      </Container>
    </div>
  )
}
