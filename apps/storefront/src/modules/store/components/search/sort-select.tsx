"use client"

import { PRODUCT_INDEX_NAME, priceAttribute } from "@/lib/search-client"
import { ChevronUpDown } from "@medusajs/icons"
import { useSortBy } from "react-instantsearch"

export const getSortItems = (currencyCode: string) => {
  const minPrice = priceAttribute("min_price", currencyCode)

  return [
    { value: PRODUCT_INDEX_NAME, label: "Paling sesuai" },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/created_at:desc`,
      label: "Terbaru",
    },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/${minPrice}:asc`,
      label: "Harga: rendah ke tinggi",
    },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/${minPrice}:desc`,
      label: "Harga: tinggi ke rendah",
    },
  ]
}

const SortSelect = ({ currencyCode }: { currencyCode: string }) => {
  const { currentRefinement, options, refine } = useSortBy({
    items: getSortItems(currencyCode),
  })

  return (
    <div className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm">
      {/* on phones the label gives its room to the choice; the select keeps its name */}
      <span className="hidden text-ui-fg-muted xsmall:inline">Urutkan:</span>
      <div className="relative">
        <select
          className="w-full appearance-none overflow-hidden bg-transparent pr-8 text-ui-fg-base focus:outline-none"
          title="Urutkan"
          aria-label="Urutkan"
          value={currentRefinement}
          onChange={(event) => refine(event.target.value)}
          data-testid="sort-by-container"
        >
          {options.map((option) => (
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

export default SortSelect
