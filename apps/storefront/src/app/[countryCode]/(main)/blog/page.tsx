import { ARTICLES } from "@/lib/blog"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { Heading, Text } from "@medusajs/ui"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Panduan Tambak & Kincir Air",
  description: "Artikel praktis memilih, menghitung dan merawat kincir air untuk tambak udang dan ikan, dari tim WANGJIA.",
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })

export default function BlogIndexPage() {
  const list = [...ARTICLES].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  return (
    <div className="content-container py-12 max-w-3xl flex flex-col gap-y-8">
      <div>
        <Heading level="h1" className="text-2xl">Panduan Tambak &amp; Kincir Air</Heading>
        <Text className="text-ui-fg-subtle mt-1">Pengalaman lapangan tim WANGJIA untuk petambak udang dan ikan.</Text>
      </div>
      <ul className="flex flex-col gap-y-6">
        {list.map((a) => (
          <li key={a.slug} className="flex flex-col gap-y-1">
            <LocalizedClientLink href={`/blog/${a.slug}`} className="text-lg font-semibold hover:underline">
              {a.title}
            </LocalizedClientLink>
            <Text className="text-ui-fg-subtle">{a.description}</Text>
            <Text className="txt-small text-ui-fg-muted">{fmt(a.publishedAt)} · {a.readingMinutes} menit baca</Text>
          </li>
        ))}
      </ul>
    </div>
  )
}
