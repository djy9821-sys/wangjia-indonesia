import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import { machineByHandle } from "@/lib/util/machines"
import { Heading } from "@medusajs/ui"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // The catalogue is small (four machines and their spare parts), so the four cards come
  // from all of it: the same kind first (machines for a machine, parts for a part), then
  // the other kind. The starter's rule (same collection and tags) found one product at most.
  const isMachine = (p: HttpTypes.StoreProduct) => machineByHandle(p.handle) !== null
  const all = await listProducts({
    queryParams: { region_id: region.id, limit: 50, is_giftcard: false } as HttpTypes.StoreProductParams,
    countryCode,
  }).then(({ response }) => response.products.filter((p) => p.id !== product.id))
  const products = [
    ...all.filter((p) => isMachine(p) === isMachine(product)),
    ...all.filter((p) => isMachine(p) !== isMachine(product)),
  ].slice(0, 4)

  if (!products.length) {
    return null
  }

  // where the night ends: the shop's light cards on a paper band, as on the listing pages
  return (
    <section className="bg-[#f6f4ef] text-[#121417]" data-testid="related-products-container">
      <div className="content-container flex flex-col gap-y-6 pb-28 pt-12 small:pt-16">
        <Heading level="h2" className="text-[24px] font-semibold tracking-[-0.02em] text-[#121417]">
          Lihat juga
        </Heading>
        <ul className="grid grid-cols-2 gap-3 small:grid-cols-3 medium:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <Product region={region} product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
