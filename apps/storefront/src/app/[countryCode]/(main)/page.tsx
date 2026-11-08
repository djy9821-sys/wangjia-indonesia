import { listRegions } from "@/lib/data/regions"
import { toJsonLd } from "@/lib/util/product-structured-data"
import { getSiteOrigin, listCountryCodes, STORE_NAME } from "@/lib/util/site"
import { buildRegionsReturnPolicies } from "@/lib/util/store-policies"
import FeaturedProducts from "@/modules/home/components/featured-products"
import GroupBuyStrip from "@/modules/home/components/group-buy-strip"
import Hero from "@/modules/home/components/hero"
import ProductGrid from "@/modules/home/components/product-grid"
import SkeletonFeaturedProducts from "@/modules/skeletons/templates/skeleton-featured-products"
import { Metadata } from "next"
import { Suspense } from "react"

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])

  return {
    title: "WANGJIA Kincir Air — Aerator Tambak Indonesia",
    description:
      "Toko resmi WANGJIA® Indonesia: kincir air / aerator tambak 1 HP & 2 HP untuk udang dan ikan, suku cadang asli, pembayaran bertahap, pengiriman ke seluruh Indonesia, garansi 1 tahun.",
    keywords: ["kincir air", "aerator tambak", "paddle wheel aerator", "WANGJIA", "kincir tambak udang", "aerator 1 HP", "aerator 2 HP", "增氧机 印尼"],
    alternates: {
      canonical: `${origin}/${countryCode}`,
      languages: {
        ...Object.fromEntries(
          listCountryCodes(regions).map((code) => [
            code === "id" ? "id-ID" : `en-${code.toUpperCase()}`,
            `${origin}/${code}`,
          ])
        ),
        "x-default": origin,
      },
    },
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])
  const homeUrl = `${origin}/${countryCode}`
  const returnPolicies = buildRegionsReturnPolicies(regions)
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: STORE_NAME,
      url: origin,
      ...(returnPolicies.length
        ? { hasMerchantReturnPolicy: returnPolicies }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: STORE_NAME,
      url: homeUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${homeUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ]

  return (
    <div className="flex flex-col gap-y-2 m-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
      />
      <Hero />
      <Suspense fallback={null}>
        <GroupBuyStrip countryCode={countryCode} />
      </Suspense>
      <Suspense fallback={<SkeletonFeaturedProducts />}>
        <ProductGrid countryCode={countryCode} />
      </Suspense>
      <Suspense fallback={null}>
        <FeaturedProducts countryCode={countryCode} />
      </Suspense>
    </div>
  )
}
