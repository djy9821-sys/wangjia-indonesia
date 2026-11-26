"use client"

import { PRODUCT_INDEX_NAME, searchClient } from "@/lib/search-client"
import AppliedRefinements from "@/modules/store/components/search/applied-refinements"
import SearchRefinements from "@/modules/store/components/search/search-refinements"
import SearchResults from "@/modules/store/components/search/search-results"
import StoreBreadcrumb from "@/modules/store/components/store-breadcrumb"
import "@/modules/store/templates/listing.css"
import type { SearchClient } from "instantsearch.js"
import { Configure, InstantSearch } from "react-instantsearch"

// the whole range on one page: 15 products do not need a second one
const HITS_PER_PAGE = 24

const SearchStoreTemplate = ({ currencyCode }: { currencyCode: string }) => (
  <div data-wj-list className="wj-list">
    <div
      className="flex flex-col py-6 content-container gap-4"
      data-testid="category-container"
    >
      <StoreBreadcrumb />

      <InstantSearch
        indexName={PRODUCT_INDEX_NAME}
        searchClient={searchClient as unknown as SearchClient}
        routing
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure hitsPerPage={HITS_PER_PAGE} />

        <div className="flex flex-col small:flex-row small:items-start gap-3">
          <SearchRefinements currencyCode={currencyCode} />
          <div className="w-full flex flex-col gap-3">
            <AppliedRefinements currencyCode={currencyCode} />
            <SearchResults currencyCode={currencyCode} />
          </div>
        </div>
      </InstantSearch>
    </div>
  </div>
)

export default SearchStoreTemplate
