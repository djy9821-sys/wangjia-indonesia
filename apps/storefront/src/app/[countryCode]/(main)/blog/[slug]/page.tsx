import { ARTICLES, getArticle } from "@/lib/blog"
import { listRegions } from "@/lib/data/regions"
import { getSiteOrigin, listCountryCodes } from "@/lib/util/site"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { Button, Heading, Text } from "@medusajs/ui"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = { params: Promise<{ slug: string; countryCode: string }> }

export async function generateStaticParams() {
  const countries = await listRegions().then((regions) => listCountryCodes(regions)).catch(() => ["id"])
  return countries.flatMap((countryCode) => ARTICLES.map((a) => ({ countryCode, slug: a.slug })))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, countryCode } = await props.params
  const a = getArticle(slug)
  if (!a) return {}
  const origin = await getSiteOrigin()
  const url = `${origin}/${countryCode}/blog/${a.slug}`
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: url },
    openGraph: { title: a.title, description: a.description, url, type: "article", publishedTime: a.publishedAt },
  }
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })

export default async function ArticlePage(props: Props) {
  const { slug, countryCode } = await props.params
  const a = getArticle(slug)
  if (!a) notFound()
  const origin = await getSiteOrigin()
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    datePublished: a.publishedAt,
    dateModified: a.updatedAt ?? a.publishedAt,
    inLanguage: "id-ID",
    author: { "@type": "Organization", name: "WANGJIA Indonesia" },
    publisher: { "@type": "Organization", name: "PT Adhinusa Lestari Jaya" },
    mainEntityOfPage: `${origin}/${countryCode}/blog/${a.slug}`,
  }
  const others = ARTICLES.filter((x) => x.slug !== a.slug).slice(0, 3)
  return (
    <article className="content-container py-12 max-w-3xl flex flex-col gap-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LocalizedClientLink href="/blog" className="txt-small text-ui-fg-interactive underline w-fit">← Semua artikel</LocalizedClientLink>
      <Heading level="h1" className="text-3xl">{a.title}</Heading>
      <Text className="txt-small text-ui-fg-muted">{fmt(a.publishedAt)} · {a.readingMinutes} menit baca · {a.tags.join(", ")}</Text>
      <div className="flex flex-col gap-y-4 text-ui-fg-base">{a.body}</div>
      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-5 flex flex-col gap-y-3 mt-4">
        <Text weight="plus">Lihat kincir air WANGJIA 1 HP &amp; 2 HP</Text>
        <Text className="txt-small text-ui-fg-subtle">Garansi resmi 12 bulan, suku cadang asli, pembayaran bertahap, pengiriman ke seluruh Indonesia.</Text>
        <div className="flex gap-2 flex-wrap">
          <LocalizedClientLink href="/store"><Button>Lihat produk</Button></LocalizedClientLink>
          <LocalizedClientLink href="/garansi"><Button variant="secondary">Cek keaslian</Button></LocalizedClientLink>
        </div>
      </div>
      {others.length > 0 && (
        <div className="flex flex-col gap-y-2">
          <Text weight="plus">Artikel lain</Text>
          {others.map((o) => (
            <LocalizedClientLink key={o.slug} href={`/blog/${o.slug}`} className="text-ui-fg-interactive hover:underline">
              {o.title}
            </LocalizedClientLink>
          ))}
        </div>
      )}
    </article>
  )
}
