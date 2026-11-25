"use client"

import { ChevronUpDown } from "@medusajs/icons"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const sortOptions = [
  {
    value: "created_at",
    label: "Terbaru",
  },
  {
    value: "price_asc",
    label: "Harga: rendah ke tinggi",
  },
  {
    value: "price_desc",
    label: "Harga: tinggi ke rendah",
  },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (value: SortOptions) => {
    setQueryParams("sortBy", value)
  }

  return (
    <div className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm">
      <span className="text-ui-fg-muted">Urutkan:</span>
      <div className="relative">
        <select
          className="w-full appearance-none overflow-hidden bg-transparent pr-8 text-ui-fg-base focus:outline-none"
          title="Urutkan"
          value={sortBy}
          onChange={(e) => handleChange(e.target.value as SortOptions)}
          data-testid={dataTestId}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronUpDown className="w-4 h-4 text-ui-fg-muted" />
        </div>
      </div>
    </div>
  )
}

export default SortProducts
