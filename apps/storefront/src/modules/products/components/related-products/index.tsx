import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { HttpTypes } from "@medusajs/types"
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

  // edit this function to define your related products logic
  const queryParams: HttpTypes.StoreProductParams & {
    tag_id?: string[]
    collection_id?: string[]
    is_giftcard?: boolean
  } = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  if (product.tags) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return response.products.filter(
      (responseProduct) => responseProduct.id !== product.id
    )
  })

  if (!products.length) {
    return null
  }

  // where the night ends: the shop's light cards on a paper band, as on the listing pages
  return (
    <section className="bg-[#f6f4ef] text-[#121417]" data-testid="related-products-container">
      <div className="content-container flex flex-col gap-y-6 pb-28 pt-12 small:pt-16">
        <Heading level="h2" className="text-[24px] font-semibold tracking-[-0.02em] text-[#121417]">
          Produk lain yang sering dilihat
        </Heading>
        <ul className="grid grid-cols-1 small:grid-cols-3 medium:grid-cols-4 gap-x-2 gap-y-8">
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
