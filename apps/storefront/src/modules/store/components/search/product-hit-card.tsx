"use client"

import { convertToLocale } from "@/lib/util/money"
import {
  hitPricing,
  type ProductHit,
} from "@/modules/layout/components/search/hit"
import ProductCard from "@/modules/products/components/product-card"

const ProductHitCard = ({
  hit,
  currencyCode,
}: {
  hit: ProductHit
  currencyCode: string
}) => {
  // Without a handle there's no product page to link to.
  if (!hit.handle) {
    return null
  }

  const pricing = hitPricing(hit, currencyCode)
  const format = (value: number) =>
    convertToLocale({ amount: value, currency_code: pricing.currency_code })

  const max = pricing.max_price ?? pricing.min_price
  const isRange = pricing.min_price !== null && (max ?? 0) > pricing.min_price
  // A range already spans the discount, so the struck-through original would
  // describe only the cheapest variant.
  const sale = !isRange && pricing.on_sale

  return (
    <ProductCard
      handle={hit.handle}
      title={hit.title ?? ""}
      thumbnail={hit.thumbnail}
      price={
        pricing.min_price === null
          ? null
          : {
              amount: format(pricing.min_price),
              from: isRange,
              original: sale ? format(pricing.original_price!) : null,
              discount: sale ? pricing.discount_percentage : null,
            }
      }
    />
  )
}

export default ProductHitCard
