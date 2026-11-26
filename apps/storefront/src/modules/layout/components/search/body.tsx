"use client"

import { PRODUCT_INDEX_NAME, searchClient } from "@/lib/search-client"
import type { SearchClient } from "instantsearch.js"
import { Configure, InstantSearch } from "react-instantsearch"

import SearchPanel from "./panel"

const HITS_PER_PAGE = 12

/*
  The inside of the search drawer: the search library, its adapter and the Medusa SDK, about
  74 KB of compressed JavaScript. It is loaded when the drawer first opens (see index.tsx), so
  the pages people only read no longer carry it.
*/
const SearchBody = ({
  currencyCode,
  onNavigate,
}: {
  currencyCode: string
  onNavigate: () => void
}) => (
  <InstantSearch
    indexName={PRODUCT_INDEX_NAME}
    searchClient={searchClient as unknown as SearchClient}
    future={{ preserveSharedStateOnUnmount: true }}
  >
    <Configure hitsPerPage={HITS_PER_PAGE} />
    <SearchPanel currencyCode={currencyCode} onNavigate={onNavigate} />
  </InstantSearch>
)

export default SearchBody
