import { listCategories } from "@/lib/data/categories"
import { getRegion } from "@/lib/data/regions"
import { IS_PREVIEW } from "@/lib/util/preview"
import StoreTemplate from "@/modules/store/templates"
import SearchStoreTemplate from "@/modules/store/templates/search-store"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const dynamicParams = true

export const metadata: Metadata = {
  title: "Produk",
  description: "Semua kincir air dan suku cadang WANGJIA.",
}

export default async function StorePage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  if (IS_PREVIEW) {
    // the browse-only copy has no search service: every product, rendered on the server
    const categories = await listCategories()
    return <StoreTemplate countryCode={countryCode} categories={categories} />
  }

  return <SearchStoreTemplate currencyCode={region.currency_code} />
}
