import { useCart } from "@/lib/context/cart-context"
import { clx } from "@medusajs/ui"
import Spinner from "@/modules/common/icons/spinner"
import { useState } from "react"

const DeleteButton = ({
  id,
  className,
  disabled,
}: {
  id: string
  className?: string
  disabled?: boolean
}) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const { handleDeleteItem } = useCart()

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    await handleDeleteItem(id)
  }

  return (
    <div
      className={clx(
        "flex items-center justify-between text-small-regular",
        className
      )}
    >
      <button
        className={clx(
          "flex h-11 items-center justify-center rounded-full px-4 text-[14px] text-neutral-950 shadow-[0_0_0_1px_rgba(0,0,0,0.14)] hover:bg-neutral-100",
          disabled ? "opacity-50 pointer-events-none" : "opacity-100"
        )}
        onClick={() => handleDelete(id)}
        disabled={disabled}
      >
        {isDeleting ? <Spinner size={12} /> : "Hapus"}
      </button>
    </div>
  )
}

export default DeleteButton
