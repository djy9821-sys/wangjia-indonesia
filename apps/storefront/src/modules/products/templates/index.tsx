import { archivo } from "@/lib/fonts/archivo"
import GroupBuyOffer from "@/modules/products/components/group-buy-offer"
import ImageGallery from "@/modules/products/components/image-gallery"
import ProductActions from "@/modules/products/components/product-actions"
import ProductDetails from "@/modules/products/components/product-details"
import RelatedProducts from "@/modules/products/components/related-products"
import WarrantyTrust from "@/modules/products/components/warranty-trust"
import ProductInfo from "@/modules/products/templates/product-info"
import SkeletonRelatedProducts from "@/modules/skeletons/templates/skeleton-related-products"
import { HttpTypes } from "@medusajs/types"
import { GeistMono } from "geist/font/mono"
import { notFound } from "next/navigation"
import React, { Suspense } from "react"
import ProductFacts from "../components/product-facts"
import "./product.css"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

/*
  The buy page (the home page is the story): light and plain like the hardware buy pages,
  in the shop's type and accent. Gallery on the left and sticky on desktop, the buy box on
  the right; on phones the buy box follows the picture. Specifications are always open.
*/
const ProductTemplate: React.FC<ProductTemplateProps> = ({ product, region, countryCode }) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <div data-wj-product className={`${archivo.variable} ${GeistMono.variable} bg-[#f6f4ef] text-[#121417]`}>
      <div className="content-container grid grid-cols-1 gap-8 py-6 small:grid-cols-12 small:gap-12 small:py-12" data-testid="product-container">
        <div className="small:col-span-7">
          <div className="small:sticky small:top-28">
            <ImageGallery product={product} />
          </div>
        </div>
        <div className="flex flex-col gap-8 small:col-span-5">
          <ProductInfo product={product} />
          <ProductActions product={product} region={region} />
          <Suspense fallback={null}>
            <GroupBuyOffer productId={product.id} countryCode={countryCode} />
          </Suspense>
          <WarrantyTrust />
          <ProductFacts product={product} />
        </div>
      </div>
      <ProductDetails product={product} />
      <div className="content-container pb-28" data-testid="related-products-container">
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </div>
  )
}

export default ProductTemplate
