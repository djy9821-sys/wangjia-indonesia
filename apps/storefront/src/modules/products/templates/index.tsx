import { archivo } from "@/lib/fonts/archivo"
import { machineByHandle } from "@/lib/util/machines"
import FitsMachines from "@/modules/products/components/fits-machines"
import GroupBuyOffer from "@/modules/products/components/group-buy-offer"
import CompareMachines from "@/modules/products/components/compare-machines"
import ImageGallery from "@/modules/products/components/image-gallery"
import MachineParts from "@/modules/products/components/machine-parts"
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
  The buy page in the night of the home page (mock-up A2, which the owner picked): the same
  ink, type and one accent. Gallery on the left and sticky on desktop, the buy box on the
  right; on phones the buy box follows the picture. Specifications are always open. The
  related products sit on a light band below, where the night ends.
*/
const ProductTemplate: React.FC<ProductTemplateProps> = ({ product, region, countryCode }) => {
  if (!product || !product.id) {
    return notFound()
  }
  const machine = machineByHandle(product.handle)

  return (
    <div data-wj-product className={`wj-pdp ${archivo.variable} ${GeistMono.variable}`}>
      <div className="content-container grid grid-cols-1 gap-8 py-6 small:grid-cols-12 small:gap-12 small:py-12" data-testid="product-container">
        <div className="small:col-span-7">
          <div className="small:sticky small:top-28">
            <ImageGallery product={product} stage={machine} />
          </div>
        </div>
        <div className="flex flex-col gap-8 small:col-span-5">
          <ProductInfo product={product} />
          <ProductActions product={product} region={region} />
          <FitsMachines handle={product.handle} />
          <Suspense fallback={null}>
            <GroupBuyOffer productId={product.id} countryCode={countryCode} />
          </Suspense>
          <WarrantyTrust />
          <ProductFacts product={product} />
        </div>
      </div>
      {machine?.parts && (
        <Suspense fallback={null}>
          <MachineParts machine={machine} region={region} countryCode={countryCode} />
        </Suspense>
      )}
      <ProductDetails product={product} />
      {machine && (
        <Suspense fallback={null}>
          <CompareMachines current={machine.handle} region={region} countryCode={countryCode} />
        </Suspense>
      )}
      <Suspense
        fallback={
          <div className="bg-[#f6f4ef] pb-28">
            <div className="content-container">
              <SkeletonRelatedProducts />
            </div>
          </div>
        }
      >
        <RelatedProducts product={product} countryCode={countryCode} />
      </Suspense>
    </div>
  )
}

export default ProductTemplate
