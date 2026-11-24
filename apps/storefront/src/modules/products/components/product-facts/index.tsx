import {
  CheckCircleSolid,
  ExclamationCircleSolid,
  InformationCircleSolid,
} from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"

const ProductFacts = ({ product }: { product: HttpTypes.StoreProduct }) => {
  const managedVariants = product.variants?.filter(
    (variant) => variant.manage_inventory !== false
  )

  const inventoryQuantity =
    managedVariants?.reduce(
      (acc, variant) => acc + (variant.inventory_quantity ?? 0),
      0
    ) || 0

  const hasManageInventory = !!managedVariants?.length

  return (
    <div className="flex flex-col gap-y-2 w-full">
      {hasManageInventory && (inventoryQuantity > 10 ? (
        <span className="flex items-center gap-x-2 text-[var(--text-2)] text-sm">
          <CheckCircleSolid className="text-green-500" /> Siap kirim
          ({inventoryQuantity} unit tersedia)
        </span>
      ) : (
        <span className="flex items-center gap-x-2 text-[var(--text-2)] text-sm ">
          <ExclamationCircleSolid className="text-orange-500" />
          Stok terbatas ({inventoryQuantity} unit tersedia)
        </span>
      ))}
      <span className="flex items-center gap-x-2 text-[var(--text-2)] text-sm">
        {product.mid_code && (
          <>
            <InformationCircleSolid />
            MID: {product.mid_code}
          </>
        )}
      </span>
    </div>
  )
}

export default ProductFacts
