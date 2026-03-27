"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, HttpError } from "@/src/lib/api/_client/http";
import { useT } from "@/i18n/use-t";
import { toast, Button, Container, Heading, Input, Label, Table, Text, Textarea } from "@medusajs/ui";
import PageHeader from "@/components/page-header/PageHeader";

type Fulfillment = {
  id: string;
  status?: string | null;
  carrierId?: string | null;
  trackingNo?: string | null;
  createdAt?: string | null;
};

type Shipment = {
  id: string;
  fulfillmentId: string;
  carrierId?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  providerShipmentId?: string | null;
  status?: string | null;
  createdAt?: string | null;
  deliveredAt?: string | null;
};

function errMsg(e: any) {
  // apiFetch HttpError -> message + data
  if (e instanceof HttpError) {
    return e.data?.message || e.message;
  }
  return e?.message || String(e);
}

export default function OrderShipmentPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ locale: string; id: string }>();

  const locale = params?.locale ?? "en";
  const orderId = params?.id ?? "";

  const [loading, setLoading] = useState(true);

  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [selectedFulfillmentId, setSelectedFulfillmentId] = useState<string>("");

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [creating, setCreating] = useState(false);
  const [marking, setMarking] = useState<string | null>(null);

  // create form (MVP)
  const [carrierId, setCarrierId] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [labelUrl, setLabelUrl] = useState("");
  const [providerShipmentId, setProviderShipmentId] = useState("");
  const [metadataText, setMetadataText] = useState("");

  const canCreate = useMemo(() => {
    if (creating) return false;
    if (!selectedFulfillmentId) return false;
    return carrierId.trim().length > 0;
  }, [creating, selectedFulfillmentId, carrierId]);

  async function loadFulfillments() {
    const list = await apiFetch<Fulfillment[]>(
      `/api/admin/orders/${orderId}/fulfillments`,
      {
        method: "GET",
        credentials: "include",
        // auth: "admin", // istersen aç: refresh retry devreye girer
      }
    );
    return Array.isArray(list) ? list : [];
  }

  async function loadShipments(fulfillmentId: string) {
    const list = await apiFetch<Shipment[]>(
      `/api/admin/fulfillments/${fulfillmentId}/shipments`,
      {
        method: "GET",
        credentials: "include",
        // auth: "admin",
      }
    );
    return Array.isArray(list) ? list : [];
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!orderId) return;
      setLoading(true);

      try {
        const f = await loadFulfillments();
        if (!alive) return;

        setFulfillments(f);

        const fid = f[0]?.id ?? "";
        setSelectedFulfillmentId(fid);

        if (fid) {
          const s = await loadShipments(fid);
          if (!alive) return;
          setShipments(s);
        } else {
          setShipments([]);
        }
      } catch (e) {
        console.error("[OrderShipmentPage] load failed", e);
        if (!alive) return;
        toast.error(errMsg(e) || t("notifications.loadFailed"));
        setFulfillments([]);
        setShipments([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!selectedFulfillmentId) return;
      try {
        const s = await loadShipments(selectedFulfillmentId);
        if (!alive) return;
        setShipments(s);
      } catch (e) {
        console.error("[OrderShipmentPage] shipments load failed", e);
        if (!alive) return;
        toast.error(errMsg(e) || t("notifications.loadFailed"));
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFulfillmentId]);

  function norm(v: string) {
    const s = String(v ?? "").trim();
    return s.length ? s : null;
  }

  function parseMeta(text: string) {
    const s = String(text ?? "").trim();
    if (!s.length) return null;
    try {
      return JSON.parse(s);
    } catch {
      return "__INVALID__";
    }
  }

  async function onCreate() {
    if (!selectedFulfillmentId) return;

    const meta = parseMeta(metadataText);
    if (meta === "__INVALID__") {
      toast.error(t("shipment.validation.invalidMetadata"));
      return;
    }

    setCreating(true);
    try {
      await apiFetch(`/api/admin/fulfillments/${selectedFulfillmentId}/shipments`, {
        method: "POST",
        credentials: "include",
        // auth: "admin",
        body: {
          carrierId: norm(carrierId),
          trackingNumber: norm(trackingNumber),
          trackingUrl: norm(trackingUrl),
          labelUrl: norm(labelUrl),
          providerShipmentId: norm(providerShipmentId),
          metadata: meta,
        },
      });

      toast.success(t("shipment.notifications.created"));

      // reload shipments
      const s = await loadShipments(selectedFulfillmentId);
      setShipments(s);

      // reset minimal
      setCarrierId("");
      setTrackingNumber("");
      setTrackingUrl("");
      setLabelUrl("");
      setProviderShipmentId("");
      setMetadataText("");

      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error(errMsg(e) || t("shipment.notifications.createFailed"));
    } finally {
      setCreating(false);
    }
  }

  async function onMarkDelivered(shipmentId: string) {
    if (!shipmentId) return;

    setMarking(shipmentId);
    try {
      await apiFetch(`/api/admin/shipments/${shipmentId}/mark-delivered`, {
        method: "POST",
        credentials: "include",
        // auth: "admin",
        body: {},
      });

      toast.success(t("shipment.notifications.delivered"));

      if (selectedFulfillmentId) {
        const s = await loadShipments(selectedFulfillmentId);
        setShipments(s);
      }
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error(errMsg(e) || t("shipment.notifications.deliverFailed"));
    } finally {
      setMarking(null);
    }
  }

  if (loading) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-subtle">{t("common.loading")}</Text>
      </Container>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="shipment.title"
        subtitleKey="shipment.subtitle"
        actions={
          <Button asChild variant="secondary" size="small">
            <Link href={`/${locale}/orders/${orderId}`}>
              {t("shipment.actions.backToOrder")}
            </Link>
          </Button>
        }
      />

      {/* Fulfillment select */}
      <Container className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <Heading level="h3">{t("shipment.sections.fulfillment")}</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              {t("shipment.hints.fulfillment")}
            </Text>
          </div>

          <div className="min-w-[280px]">
            <Label>{t("shipment.fields.fulfillment")}</Label>
            <select
              className="mt-2 h-9 w-full rounded-md border bg-background px-2 text-sm"
              value={selectedFulfillmentId}
              onChange={(e) => setSelectedFulfillmentId(e.target.value)}
            >
              {fulfillments.length === 0 ? (
                <option value="">{t("shipment.empty.noFulfillments")}</option>
              ) : (
                fulfillments.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.id}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {fulfillments.length === 0 && (
          <div className="mt-4">
            <Text className="text-ui-fg-subtle">{t("shipment.empty.noFulfillmentsBody")}</Text>
          </div>
        )}
      </Container>

      {/* Existing shipments */}
      <Container className="p-6">
        <Heading level="h3">{t("shipment.sections.existing")}</Heading>
        <div className="mt-4">
          {shipments.length === 0 ? (
            <Text className="text-ui-fg-subtle">{t("shipment.empty.noShipments")}</Text>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>{t("shipment.columns.shipmentId")}</Table.HeaderCell>
                  <Table.HeaderCell>{t("shipment.columns.carrier")}</Table.HeaderCell>
                  <Table.HeaderCell>{t("shipment.columns.tracking")}</Table.HeaderCell>
                  <Table.HeaderCell>{t("shipment.columns.status")}</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">
                    {t("shipment.columns.actions")}
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {shipments.map((s) => (
                  <Table.Row key={s.id}>
                    <Table.Cell>
                      <Text weight="plus">{s.id}</Text>
                    </Table.Cell>
                    <Table.Cell className="text-ui-fg-subtle">
                      {s.carrierId ?? t("common.emptyDash")}
                    </Table.Cell>
                    <Table.Cell className="text-ui-fg-subtle">
                      {s.trackingNumber ?? t("common.emptyDash")}
                    </Table.Cell>
                    <Table.Cell className="text-ui-fg-subtle">
                      {s.status ?? t("common.emptyDash")}
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <Button
                        variant="secondary"
                        size="small"
                        isLoading={marking === s.id}
                        onClick={() => onMarkDelivered(s.id)}
                      >
                        {t("shipment.actions.markDelivered")}
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </div>
      </Container>

      {/* Create shipment */}
      <Container className="p-6">
        <Heading level="h3">{t("shipment.sections.create")}</Heading>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          {t("shipment.hints.create")}
        </Text>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("shipment.fields.carrierId")}</Label>
            <Input
              value={carrierId}
              placeholder={t("shipment.placeholders.carrierId")}
              onChange={(e) => setCarrierId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("shipment.fields.trackingNumber")}</Label>
            <Input
              value={trackingNumber}
              placeholder={t("shipment.placeholders.trackingNumber")}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("shipment.fields.trackingUrl")}</Label>
            <Input
              value={trackingUrl}
              placeholder={t("shipment.placeholders.trackingUrl")}
              onChange={(e) => setTrackingUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("shipment.fields.labelUrl")}</Label>
            <Input
              value={labelUrl}
              placeholder={t("shipment.placeholders.labelUrl")}
              onChange={(e) => setLabelUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>{t("shipment.fields.providerShipmentId")}</Label>
            <Input
              value={providerShipmentId}
              placeholder={t("shipment.placeholders.providerShipmentId")}
              onChange={(e) => setProviderShipmentId(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>{t("shipment.fields.metadata")}</Label>
            <Textarea
              value={metadataText}
              placeholder={t("shipment.placeholders.metadata")}
              onChange={(e) => setMetadataText(e.target.value)}
            />
            <Text size="xsmall" className="text-ui-fg-subtle">
              {t("shipment.hints.metadata")}
            </Text>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            size="small"
            disabled={!canCreate}
            isLoading={creating}
            onClick={onCreate}
          >
            {creating ? t("common.saving") : t("shipment.actions.create")}
          </Button>
        </div>
      </Container>
    </div>
  );
}
