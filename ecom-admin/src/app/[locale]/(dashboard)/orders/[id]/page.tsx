"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Button,
  Container,
  Heading,
  StatusBadge,
  Table,
  Text,
} from "@medusajs/ui"
import PageHeader from "@/components/page-header/PageHeader"
import { useT } from "@/i18n/use-t"

type ItemRow = {
  id: string
  title: string
  sku: string
  qty: number
  unitPrice: string
  total: string
}

const MOCK = {
  displayId: "#1001",
  status: "paid" as const, // pending|paid|fulfilled|canceled
  createdAt: "2026-01-11 14:22",
  customerName: "Buyer One",
  customerEmail: "buyer1@acme.com",

  payment: {
    method: "Manual",
    status: "paid" as const, // paid|unpaid
    transaction: "tx_8f21a",
    paidAt: "2026-01-11 14:25",
  },

  shipping: {
    method: "Standard",
    status: "unfulfilled" as const, // fulfilled|unfulfilled
    address: "Podgorica, 81000, Montenegro",
    tracking: "—",
  },

  totals: {
    itemsCount: 3,
    total: "$129.00",
  },

  items: [
    {
      id: "li_1",
      title: "Smoke Candle — Hero",
      sku: "SMK-001",
      qty: 1,
      unitPrice: "$59.00",
      total: "$59.00",
    },
    {
      id: "li_2",
      title: "Glass Jar — Medium",
      sku: "JAR-214",
      qty: 2,
      unitPrice: "$35.00",
      total: "$70.00",
    },
  ] satisfies ItemRow[],

  timeline: [
    { at: "2026-01-11 14:22", text: "Order created" },
    { at: "2026-01-11 14:25", text: "Payment captured" },
    { at: "2026-01-11 14:26", text: "Confirmation email sent" },
  ],
}

export default function OrderDetailPage() {
  const t = useT()
  const params = useParams<{ locale: string; id: string }>()
  const locale = params?.locale ?? "en"
  const id = params?.id ?? "—"

  const o = { ...MOCK, id }

  const paymentBadge =
    o.payment.status === "paid"
      ? { color: "green" as const, label: t("orders.detail.badges.paid") }
      : { color: "grey" as const, label: t("orders.detail.badges.unpaid") }

  const fulfillmentBadge =
    o.shipping.status === "fulfilled"
      ? { color: "green" as const, label: t("orders.detail.badges.fulfilled") }
      : { color: "grey" as const, label: t("orders.detail.badges.unfulfilled") }

  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="orders.detail.title"
        subtitleKey="orders.detail.subtitle"
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => window.location.href = `/${locale}/orders/${id}/shipment`} variant="secondary" size="small">
              {t("shipment.actions.create")}
            </Button>
            <Button variant="secondary" size="small">
              {t("orders.detail.actions.resend_invoice")}
            </Button>
            <Button variant="secondary" size="small">
              {t("orders.detail.actions.refund")}
            </Button>
            <Button variant="secondary" size="small" className="text-red-600">
              {t("orders.detail.actions.cancel")}
            </Button>
            <Button asChild variant="secondary" size="small">
              <Link href={`/${locale}/orders`}>{t("orders.detail.actions.back")}</Link>
            </Button>
          </div>
        }
      />

      {/* Header strip */}
      <Container className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <Heading level="h2">{o.displayId}</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {t("orders.detail.fields.order_id")}: {o.id}
            </Text>
            <div className="mt-2">
              <Text size="small">
                {o.customerName} •{" "}
                <span className="text-ui-fg-subtle">{o.customerEmail}</span>
              </Text>
              <Text size="xsmall" className="text-ui-fg-subtle">
                {t("orders.detail.fields.created_at")}: {o.createdAt}
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge color={paymentBadge.color}>{paymentBadge.label}</StatusBadge>
            <StatusBadge color={fulfillmentBadge.color}>
              {fulfillmentBadge.label}
            </StatusBadge>
          </div>
        </div>
      </Container>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi title={t("orders.detail.kpi.total")} value={o.totals.total} />
        <Kpi title={t("orders.detail.kpi.payment")} value={paymentBadge.label} />
        <Kpi
          title={t("orders.detail.kpi.fulfillment")}
          value={fulfillmentBadge.label}
        />
        <Kpi title={t("orders.detail.kpi.items")} value={String(o.totals.itemsCount)} />
      </div>

      {/* Items + side panels */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Container className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Heading level="h3">{t("orders.detail.items.title")}</Heading>
          </div>

          <div className="mt-4">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>{t("orders.detail.items.columns.item")}</Table.HeaderCell>
                  <Table.HeaderCell>{t("orders.detail.items.columns.sku")}</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">
                    {t("orders.detail.items.columns.qty")}
                  </Table.HeaderCell>
                  <Table.HeaderCell className="text-right">
                    {t("orders.detail.items.columns.unit_price")}
                  </Table.HeaderCell>
                  <Table.HeaderCell className="text-right">
                    {t("orders.detail.items.columns.total")}
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {o.items.map((it) => (
                  <Table.Row key={it.id}>
                    <Table.Cell>
                      <Text weight="plus">{it.title}</Text>
                    </Table.Cell>
                    <Table.Cell className="text-ui-fg-subtle">{it.sku}</Table.Cell>
                    <Table.Cell className="text-right">{it.qty}</Table.Cell>
                    <Table.Cell className="text-right">{it.unitPrice}</Table.Cell>
                    <Table.Cell className="text-right">{it.total}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </Container>

        <div className="space-y-4">
          <Container className="p-6">
            <Heading level="h3">{t("orders.detail.payment.title")}</Heading>
            <div className="mt-4 space-y-2">
              <Row label={t("orders.detail.payment.method")} value={o.payment.method} />
              <Row label={t("orders.detail.payment.status")} value={paymentBadge.label} />
              <Row label={t("orders.detail.payment.transaction")} value={o.payment.transaction} />
              <Row label={t("orders.detail.payment.paid_at")} value={o.payment.paidAt} />
            </div>
          </Container>

          <Container className="p-6">
            <Heading level="h3">{t("orders.detail.shipping.title")}</Heading>
            <div className="mt-4 space-y-2">
              <Row label={t("orders.detail.shipping.method")} value={o.shipping.method} />
              <Row label={t("orders.detail.shipping.status")} value={fulfillmentBadge.label} />
              <Row label={t("orders.detail.shipping.address")} value={o.shipping.address} />
              <Row label={t("orders.detail.shipping.tracking")} value={o.shipping.tracking} />
            </div>
          </Container>

          <Container className="p-6">
            <Heading level="h3">{t("orders.detail.timeline.title")}</Heading>
            <div className="mt-4 space-y-3">
              {o.timeline.map((e) => (
                <div key={e.at} className="flex items-start justify-between gap-4">
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {e.at}
                  </Text>
                  <Text size="small" className="text-right">
                    {e.text}
                  </Text>
                </div>
              ))}
            </div>
          </Container>
        </div>
      </div>
    </div>
  )
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <Container className="p-6">
      <Text size="xsmall" className="text-ui-fg-subtle">
        {title}
      </Text>
      <Heading level="h2" className="mt-2">
        {value}
      </Heading>
    </Container>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Text size="small" className="text-ui-fg-subtle">
        {label}
      </Text>
      <Text size="small" weight="plus" className="text-right">
        {value}
      </Text>
    </div>
  )
}
