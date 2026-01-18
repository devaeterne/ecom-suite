"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Badge,
  Button,
  DropdownMenu,
  Input,
  Switch,
  Table,
  Text,
  clx,
} from "@medusajs/ui";
import { EllipsisHorizontal } from "@medusajs/icons";
import { useT } from "@/i18n/use-t";
import CategoryDeleteDialog from "./category-delete-dialog";
import {
  CategoriesApi,
  type Category,
  type CategorySortBy,
  type SortDir,
} from "@/src/lib/api/product/categories";

type FilterActive = "all" | "active" | "inactive";

type Row = {
  id: string;
  title: string;
  handle?: string;
  parentId?: string | null;
  isActive: boolean;
  productCount: number;
  createdAt?: string;
  updatedAt?: string;
};

function toRow(c: Category): Row {
  return {
    id: c.id,
    title: c.name,
    handle: c.handle,
    parentId: c.parentId,
    isActive: !!c.isActive,
    productCount: typeof c.productCount === "number" ? c.productCount : 0,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

const DEFAULT_LIMIT = 10;

export default function CategoryTable() {
  const t = useT();
  const { locale } = useParams<{ locale: string }>();

  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterActive>("all");

  // pagination
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);

  // sorting
  const [sortBy, setSortBy] = useState<CategorySortBy>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  const page = Math.floor(offset / limit) + 1;
  const pageCount = Math.max(1, Math.ceil((total || 0) / limit));
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  function resolveIsActive() {
    return activeFilter === "all"
      ? undefined
      : activeFilter === "active"
        ? true
        : false;
  }

  async function load(next?: Partial<{ offset: number; limit: number }>) {
    setLoading(true);
    try {
      const isActive = resolveIsActive();

      const nextOffset =
        typeof next?.offset === "number" ? next.offset : offset;
      const nextLimit = typeof next?.limit === "number" ? next.limit : limit;

      const r = await CategoriesApi.list({
        q: q || undefined,
        view: "flat",
        isActive,
        offset: nextOffset,
        limit: nextLimit,
        sortBy,
        sortDir,
      });

      setItems((r.items ?? []).map(toRow));

      const p = r.pagination;
      if (p) {
        setOffset(p.offset);
        setLimit(p.limit);
        setTotal(p.total);
      } else {
        // fallback (backend pagination yoksa)
        setOffset(nextOffset);
        setLimit(nextLimit);
        setTotal(r.items?.length ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }

  // filter/sort değişince sayfa 1’e dön
  useEffect(() => {
    setOffset(0);
    load({ offset: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, sortBy, sortDir]);

  const filtered = useMemo(() => items, [items]);

  async function toggleActive(row: Row, next: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === row.id ? { ...i, isActive: next } : i)),
    );

    try {
      await CategoriesApi.update(row.id, { isActive: next });
      await load();
    } catch (e) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === row.id ? { ...i, isActive: row.isActive } : i,
        ),
      );
      console.error(e);
    }
  }

  function toggleSort(nextBy: CategorySortBy) {
    if (sortBy !== nextBy) {
      setSortBy(nextBy);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }

  function SortIndicator({ col }: { col: CategorySortBy }) {
    if (sortBy !== col) return <span className="opacity-40">↕</span>;
    return <span>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div className="space-y-4">
      {/* filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("categories.search")}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setOffset(0);
              load({ offset: 0 });
            }}
          >
            {t("categories.actions.search")}
          </Button>
          <Button
            variant="transparent"
            onClick={() => {
              setQ("");
              setActiveFilter("all");
              setOffset(0);
              queueMicrotask(() => load({ offset: 0 }));
            }}
          >
            {t("categories.actions.clear")}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeFilter === "all" ? "secondary" : "transparent"}
            onClick={() => setActiveFilter("all")}
          >
            {t("categories.filters.statusAll")}
          </Button>
          <Button
            variant={activeFilter === "active" ? "secondary" : "transparent"}
            onClick={() => setActiveFilter("active")}
          >
            {t("categories.common.active")}
          </Button>
          <Button
            variant={activeFilter === "inactive" ? "secondary" : "transparent"}
            onClick={() => setActiveFilter("inactive")}
          >
            {t("categories.common.inactive")}
          </Button>
        </div>
      </div>

      {/* table */}
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>
              <button
                className="inline-flex items-center gap-2"
                onClick={() => toggleSort("name")}
                type="button"
              >
                {t("categories.columns.title")} <SortIndicator col="name" />
              </button>
            </Table.HeaderCell>

            <Table.HeaderCell>
              <button
                className="inline-flex items-center gap-2"
                onClick={() => toggleSort("handle")}
                type="button"
              >
                {t("categories.columns.handle")} <SortIndicator col="handle" />
              </button>
            </Table.HeaderCell>

            <Table.HeaderCell>
              {t("categories.columns.active")}
            </Table.HeaderCell>

            <Table.HeaderCell>
              <button
                className="inline-flex items-center gap-2"
                onClick={() => toggleSort("productCount")}
                type="button"
              >
                {t("categories.columns.count")}{" "}
                <SortIndicator col="productCount" />
              </button>
            </Table.HeaderCell>

            <Table.HeaderCell className="text-right">
              {t("categories.columns.actions")}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {loading ? (
            <Table.Row>
              <Table.Cell colSpan={5}>
                <Text size="small" className="text-ui-fg-subtle">
                  {t("categories.common.loading")}
                </Text>
              </Table.Cell>
            </Table.Row>
          ) : filtered.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={5}>
                <Text size="small" className="text-ui-fg-subtle">
                  {t("categories.empty")}
                </Text>
              </Table.Cell>
            </Table.Row>
          ) : (
            filtered.map((row) => {
              const editHref = `/${locale}/categories/${row.id}`;

              return (
                <Table.Row key={row.id}>
                  <Table.Cell className="font-medium">{row.title}</Table.Cell>

                  <Table.Cell className="text-ui-fg-subtle">
                    {row.handle ?? t("categories.common.emptyDash")}
                  </Table.Cell>

                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!!row.isActive}
                        onCheckedChange={(v) => toggleActive(row, !!v)}
                      />
                      <Badge className={clx(row.isActive ? "" : "opacity-70")}>
                        {row.isActive
                          ? t("categories.common.active")
                          : t("categories.common.inactive")}
                      </Badge>
                    </div>
                  </Table.Cell>

                  <Table.Cell className="text-ui-fg-subtle">
                    {row.productCount ?? 0}
                  </Table.Cell>

                  <Table.Cell className="text-right">
                    <DropdownMenu
                      open={menuOpenFor === row.id}
                      onOpenChange={(open) =>
                        setMenuOpenFor(open ? row.id : null)
                      }
                    >
                      <DropdownMenu.Trigger asChild>
                        <Button
                          variant="transparent"
                          size="small"
                          aria-label={t("actions.openRowMenu")}
                        >
                          <EllipsisHorizontal />
                        </Button>
                      </DropdownMenu.Trigger>

                      <DropdownMenu.Content>
                        <DropdownMenu.Item asChild>
                          <Link href={editHref}>
                            {t("categories.common.edit")}
                          </Link>
                        </DropdownMenu.Item>

                        <DropdownMenu.Separator />

                        <DropdownMenu.Item
                          className="text-ui-fg-error"
                          onClick={() => {
                            setMenuOpenFor(null);
                            queueMicrotask(() => setDeleteId(row.id));
                          }}
                        >
                          {t("categories.common.delete")}
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu>
                  </Table.Cell>
                </Table.Row>
              );
            })
          )}
        </Table.Body>
      </Table>

      {/* pagination footer */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Text size="small" className="text-ui-fg-subtle">
          {total > 0
            ? `Showing ${offset + 1}-${Math.min(offset + limit, total)} of ${total}`
            : "—"}
        </Text>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={!canPrev || loading}
            onClick={() => load({ offset: Math.max(0, offset - limit) })}
          >
            Prev
          </Button>
          <Text size="small" className="text-ui-fg-subtle">
            Page {page} / {pageCount}
          </Text>
          <Button
            variant="secondary"
            disabled={!canNext || loading}
            onClick={() => load({ offset: offset + limit })}
          >
            Next
          </Button>

          <Button
            variant="transparent"
            disabled={loading}
            onClick={() => load({ offset })}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* delete dialog mount/unmount */}
      {deleteId ? (
        <CategoryDeleteDialog
          key={deleteId}
          categoryId={deleteId}
          onClose={() => setDeleteId(null)}
          onDeleted={() => {
            setDeleteId(null);
            queueMicrotask(() => load({ offset })); // aynı sayfada kal
          }}
        />
      ) : null}
    </div>
  );
}
