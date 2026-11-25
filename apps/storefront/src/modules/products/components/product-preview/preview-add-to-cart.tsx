"use client"

import { addToCartEventBus } from "@/lib/data/cart-event-bus"
import { StoreProduct, StoreRegion } from "@medusajs/types"
import ShoppingBag from "@/modules/common/icons/shopping-bag"
import { useState } from "react"

const PreviewAddToCart = ({
  product,
  region,
}: {
  product: StoreProduct
  region: StoreRegion
}) => {
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    if (!product?.variants?.[0]?.id) return null

    setIsAdding(true)

    addToCartEventBus.emitCartAdd({
      lineItems: [
        {
          productVariant: {
            ...product?.variants?.[0],
            product,
          },
          quantity: 1,
        },
      ],
      regionId: region.id,
    })

    setIsAdding(false)
  }
  return (
    <button
      type="button"
      className="grid h-11 w-11 place-items-center rounded-full bg-ui-button-inverted text-ui-fg-on-inverted transition-transform duration-150 active:scale-[0.97] disabled:opacity-60"
      aria-label={`Tambah ${product.title} ke keranjang`}
      onClick={handleAddToCart}
      disabled={isAdding}
    >
      <ShoppingBag fill="currentColor" width={16} height={16} />
    </button>
  )
}

export default PreviewAddToCart
