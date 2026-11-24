import { HttpTypes } from "@medusajs/types"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

/* Brand label, the product name and its one-line type description (from the catalogue subtitle). */
const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info" className="flex flex-col gap-3">
      <p className="font-[family-name:var(--font-geist-mono)] text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-3)]">
        <span translate="no">WANGJIA®</span> · Produk resmi
      </p>
      <h1 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--text)] [text-wrap:balance] small:text-[38px]" data-testid="product-title">
        {product.title}
      </h1>
      {product.subtitle && (
        <p className="whitespace-pre-line text-[17px] text-[var(--text-2)]" data-testid="product-description">
          {product.subtitle}
        </p>
      )}
    </div>
  )
}

export default ProductInfo
