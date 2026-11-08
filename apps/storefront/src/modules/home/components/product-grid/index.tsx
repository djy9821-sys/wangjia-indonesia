import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import ProductPreview from "@/modules/products/components/product-preview"

/* Home: the catalogue itself, right under the hero, so visitors see prices at once. */
const ProductGrid = async ({ countryCode }: { countryCode: string }) => {
  const region = await getRegion(countryCode)
  if (!region) return null
  const {
    response: { products, count },
  } = await listProducts({ countryCode, queryParams: { limit: 8 } })
  if (!products.length) return null
  return (
    <section className="content-container py-8" data-testid="home-product-grid">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl-semi text-ui-fg-base">Semua produk</h2>
          <p className="text-sm text-ui-fg-subtle">Kincir air 1 HP / 2 HP, jet aerator, dan suku cadang asli WANGJIA.</p>
        </div>
        <LocalizedClientLink href="/store" className="shrink-0">
          <Button variant="secondary" className="rounded-full">
            Lihat semua ({count})
          </Button>
        </LocalizedClientLink>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-4 gap-y-6">
        {products.map((p) => (
          <li key={p.id}>
            <ProductPreview product={p} region={region} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ProductGrid
