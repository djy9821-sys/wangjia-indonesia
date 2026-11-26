import { listCategories } from "@/lib/data/categories"
import { listProducts } from "@/lib/data/products"
import { SEARCH_PRICE_CURRENCIES } from "@/lib/search-client"
import { getProductPrice } from "@/lib/util/get-product-price"
import { MACHINES } from "@/lib/util/machines"
import { IS_PREVIEW } from "@/lib/util/preview"
import { whatsappLink } from "@/lib/util/whatsapp"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import WhatsAppIcon from "@/modules/common/icons/whatsapp"
import MobileMenu from "@/modules/layout/components/mobile-menu"
import NavSessionActions from "@/modules/layout/components/nav-session-actions"
import Search from "@/modules/layout/components/search"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

/*
  The bar of every page, night everywhere. Phones: the menu, the logo, WhatsApp and the cart
  (search, the account and quotes are in the menu). Desktop: the few destinations sit in the
  bar itself, then search, quote, account, WhatsApp and the cart. WhatsApp has a fixed place
  here instead of a button floating over the content.
*/
export async function NavigationHeader({
  currencyCode = SEARCH_PRICE_CURRENCIES[0],
  countryCode,
}: {
  currencyCode?: string
  countryCode: string
}) {
  const [allCategories, machineProducts] = await Promise.all([
    listCategories().catch(() => []),
    listProducts({
      queryParams: { handle: MACHINES.map((m) => m.handle), limit: 10 } as HttpTypes.StoreProductParams,
      countryCode,
    })
      .then(({ response }) => response.products)
      .catch(() => [] as HttpTypes.StoreProduct[]),
  ])

  // top-level categories by the rank set in the admin
  const categories = allCategories
    .filter((c) => !c.parent_category_id)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  // the bar says "Kincir Air", the category page keeps its full name "Kincir Air (Aerator)"
  const links = [
    ["Semua produk", "/store"],
    ...categories.map((c) => [c.name.replace(/\s*\(.*\)\s*$/, ""), `/categories/${c.handle}`]),
    ["Panduan", "/panduan"],
    ["Cek garansi", "/garansi"],
  ]

  // the phone menu names the four machines with their prices; the categories that hold
  // none of them (the spare parts) follow as rows of their own
  const machineHandles = new Set(MACHINES.map((m) => m.handle))
  const machines = MACHINES.flatMap((m) => {
    const product = machineProducts.find((p) => p.handle === m.handle)
    if (!product) return []
    const amounts = new Set(
      (product.variants ?? [])
        .map((v) => v.calculated_price?.calculated_amount)
        .filter((n) => n !== null && n !== undefined)
    )
    return [{ name: m.name, handle: m.handle, price: getProductPrice({ product }).cheapestPrice?.calculated_price ?? null, from: amounts.size > 1 }]
  })
  const otherCategories = categories
    .filter((c) => !c.products?.some((p) => machineHandles.has(p.handle ?? "")))
    .map((c) => ({ name: c.name, handle: c.handle, count: c.products?.length ?? 0 }))

  return (
    <div data-site-header className="sticky top-0 inset-x-0 group bg-[rgba(6,11,21,0.97)] text-[#f2f4f7] small:p-4 p-2 text-sm border-b duration-200 border-[rgba(190,210,255,0.12)] z-50">
      <header className="flex w-full content-container relative small:mx-auto justify-between">
        <div className="small:mx-auto flex justify-between items-center min-w-full">
          <div className="flex items-center small:space-x-4">
            <MobileMenu machines={machines} categories={otherCategories} />
            <LocalizedClientLink
              className="flex min-h-[44px] w-fit shrink-0 items-center"
              href="/"
              aria-label="WANGJIA, ke beranda"
            >
              <span className="small:text-base text-sm font-medium flex items-center">
                <Image src="/wangjia-logo-white.png" alt="WANGJIA" width={289} height={80} priority className="h-9 w-[130px] shrink-0 object-contain max-[359px]:w-[112px]" />
              </span>
            </LocalizedClientLink>

            {/* on desktop the few destinations sit in the bar itself (a hover menu held two categories) */}
            <nav aria-label="Menu utama" className="hidden small:block">
              <ul className="flex items-center gap-1">
                {/* between 1024 and 1280 px the bar is tight: "Semua produk" waits (the two categories hold everything) */}
                {links.map(([label, href]) => (
                  <li key={href} className={href === "/store" ? "hidden medium:block" : undefined}>
                    <LocalizedClientLink href={href} className="whitespace-nowrap rounded-full px-3 py-2 text-[14px] text-[#c9d1e0]">
                      {label}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="flex items-center justify-end gap-1 small:gap-2">
            {/* search, sign-in and quotes need the backend: not in the browse-only copy */}
            {!IS_PREVIEW && (
              <div className="hidden items-center gap-2 small:flex">
                <Search currencyCode={currencyCode} />
                <div className="h-4 w-px bg-neutral-300" />
              </div>
            )}

            <a
              href={whatsappLink("Halo WANGJIA, saya mau tanya tentang kincir air.")}
              target="_blank"
              rel="noreferrer"
              aria-label="Tanya lewat WhatsApp"
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[14px] max-[359px]:w-11 max-[359px]:justify-center max-[359px]:px-0"
              data-testid="nav-whatsapp"
            >
              <WhatsAppIcon className="h-[18px] w-[18px] text-[#25d366] max-[359px]:h-[22px] max-[359px]:w-[22px]" />
              {/* under 360 px (small phones, or a phone set to large display) the mark stands alone */}
              <span className="max-[359px]:hidden">Tanya</span>
            </a>

            <NavSessionActions />
          </div>
        </div>
      </header>
    </div>
  )
}
