import { getRegion } from "@/lib/data/regions"
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

  return <SearchStoreTemplate currencyCode={region.currency_code} />
}
