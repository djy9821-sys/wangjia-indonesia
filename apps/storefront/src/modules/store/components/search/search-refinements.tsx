"use client"

import { Adjustments } from "@medusajs/icons"
import { Container, clx } from "@medusajs/ui"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { useState } from "react"
import { useCurrentRefinements } from "react-instantsearch"

import CheckboxFacet from "./checkbox-facet"
import OnSaleFacet, { ON_SALE_ATTRIBUTE } from "./on-sale-facet"
import OptionValuesFacet, {
  OPTION_VALUES_ATTRIBUTE,
} from "./option-values-facet"
import PriceRangeFacet, { PRICE_ATTRIBUTE } from "./price-range-facet"
import SortSelect from "./sort-select"

const CATEGORY_ATTRIBUTE = "category"
const LABELS_ATTRIBUTE = "labels"

/**
 * The store sidebar: the sort control and one section per facet. There is no
 * query box here — the store list is the unfiltered index, which the adapter
 * returns for an empty query. Product search lives in the navbar drawer.
 *
 * Every field here is declared `facetable()` on the product search index —
 * `category`, `labels` and `option_values` as value facets, `min_price_<currency>`
 * as a stats facet, and `on_sale_<currency>` as a boolean. The price facets are
 * per currency, so the region's currency picks which set is refined on.
 *
 * Nothing that protects data belongs here. The published-status and sales
 * channel filters are applied by the core `/store/search` route, where the
 * client cannot drop them.
 */
const SearchRefinements = ({ currencyCode }: { currencyCode: string }) => {
  // On phones the filters fold behind one button next to the sort, so the products start
  // on the first screen; the chosen filters stay visible above the results.
  const [open, setOpen] = useState(false)
  const { items } = useCurrentRefinements()
  const active = items.reduce((n, item) => n + item.refinements.length, 0)

  return (
    <div className="flex w-full flex-col gap-3 small:w-1/5">
      <div className="flex gap-2">
        <Container className="flex min-h-[44px] min-w-0 flex-1 items-center p-0">
          <SortSelect currencyCode={currencyCode} />
        </Container>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="store-filters"
          className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg bg-ui-bg-base px-3 text-sm font-medium text-ui-fg-base shadow-borders-base small:hidden"
        >
          <Adjustments />
          Filter
          {active > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ui-bg-interactive px-1.5 text-xs font-semibold text-ui-fg-on-color">
              {active}
            </span>
          )}
        </button>
      </div>

      <Container
        id="store-filters"
        className={clx("p-0", open ? "block" : "hidden", "small:block")}
      >
        <AccordionPrimitive.Root
          type="multiple"
          defaultValue={[
            PRICE_ATTRIBUTE,
            ON_SALE_ATTRIBUTE,
            CATEGORY_ATTRIBUTE,
            OPTION_VALUES_ATTRIBUTE,
          ]}
          className="divide-y divide-ui-border-base"
        >
          <PriceRangeFacet currencyCode={currencyCode} />
          <OnSaleFacet currencyCode={currencyCode} />
          <CheckboxFacet attribute={CATEGORY_ATTRIBUTE} title="Kategori" />
          <OptionValuesFacet />
          <CheckboxFacet attribute={LABELS_ATTRIBUTE} title="Label" />
        </AccordionPrimitive.Root>
      </Container>
    </div>
  )
}

export default SearchRefinements
