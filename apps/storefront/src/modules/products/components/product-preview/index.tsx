import { getProductPrice } from "@/lib/util/get-product-price"
import { isVariantInStock } from "@/lib/util/inventory"
import { HttpTypes } from "@medusajs/types"
import ProductCard from "../product-card"
import PreviewAddToCart from "./preview-add-to-cart"

export default async function ProductPreview({
  product,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  if (!product?.handle) {
    return null
  }

  const { cheapestPrice } = getProductPrice({ product })
  const variants = product.variants ?? []
  const inStock = variants.some((variant) => isVariantInStock(variant))
  const left = variants.reduce((n, v) => n + (v?.inventory_quantity || 0), 0)
  const amounts = new Set(
    variants
      .map((v) => v.calculated_price?.calculated_amount)
      .filter((n) => n !== null && n !== undefined)
  )
  const sale = cheapestPrice?.price_type === "sale"

  return (
    <ProductCard
      handle={product.handle}
      title={product.title}
      thumbnail={product.thumbnail ?? product.images?.[0]?.url}
      note={
        !inStock ? "Stok habis" : left > 0 && left <= 5 ? `Sisa ${left} unit` : null
      }
      price={
        cheapestPrice
          ? {
              amount: cheapestPrice.calculated_price,
              from: amounts.size > 1,
              original: sale ? cheapestPrice.original_price : null,
              discount: sale ? cheapestPrice.percentage_diff : null,
            }
          : null
      }
      // Machines come in 1 phase and 3 phase: adding the first variant blindly could
      // send the wrong machine, so only products with a single variant get the quick add.
      action={
        variants.length === 1 && inStock ? (
          <PreviewAddToCart product={product} region={region} />
        ) : null
      }
    />
  )
}
