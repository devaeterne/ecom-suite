"use client"

import { Input, Select } from "@medusajs/ui"

export function ProductsFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input placeholder="Search products…" className="w-72" />

      <Select>
        <Select.Trigger className="w-40">
          <Select.Value placeholder="Status" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="draft">Draft</Select.Item>
          <Select.Item value="published">Published</Select.Item>
          <Select.Item value="archived">Archived</Select.Item>
        </Select.Content>
      </Select>
    </div>
  )
}
