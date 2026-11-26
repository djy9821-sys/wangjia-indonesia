import { SEARCH_PRICE_CURRENCIES } from "@/lib/search-client"
import { IS_PREVIEW } from "@/lib/util/preview"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import LogoIcon from "@/modules/common/icons/logo"
import { listCategories } from "@/lib/data/categories"
import { MegaMenuWrapper } from "@/modules/layout/components/mega-menu"
import MobileMenu from "@/modules/layout/components/mobile-menu"
import NavSessionActions from "@/modules/layout/components/nav-session-actions"
import Search from "@/modules/layout/components/search"
import SkeletonMegaMenu from "@/modules/skeletons/components/skeleton-mega-menu"
import Image from "next/image"
import { Suspense } from "react"

export async function NavigationHeader({
  currencyCode = SEARCH_PRICE_CURRENCIES[0],
}: {
  currencyCode?: string
}) {
  // top-level categories for the phone menu (the same cached list the desktop menu reads)
  const categories = (await listCategories().catch(() => []))
    .filter((c) => !c.parent_category_id)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((c) => ({ name: c.name, handle: c.handle, count: c.products?.length ?? 0 }))

  return (
    <div data-site-header className="sticky top-0 inset-x-0 group bg-[rgba(6,11,21,0.97)] text-[#f2f4f7] small:p-4 p-2 text-sm border-b duration-200 border-[rgba(190,210,255,0.12)] z-50">
      <header className="flex w-full content-container relative small:mx-auto justify-between">
        <div className="small:mx-auto flex justify-between items-center min-w-full">
          <div className="flex items-center small:space-x-4">
            <MobileMenu categories={categories} />
            <LocalizedClientLink
              className="flex items-center w-fit shrink-0"
              href="/"
            >
              <span className="small:text-base text-sm font-medium flex items-center">
                <Image src="/wangjia-logo-white.png" alt="WANGJIA" width={289} height={80} priority className="h-9 w-[130px] shrink-0 object-contain" />
              </span>
            </LocalizedClientLink>

            <nav>
              <ul className="space-x-4 hidden small:flex">
                <li>
                  <Suspense fallback={<SkeletonMegaMenu />}>
                    <MegaMenuWrapper />
                  </Suspense>
                </li>
              </ul>
            </nav>
          </div>
          <div className="flex justify-end items-center gap-2">
            {/* search, sign-in and quotes need the backend: not in the browse-only copy */}
            {!IS_PREVIEW && (
              <>
                <Search currencyCode={currencyCode} />
                <div className="h-4 w-px bg-neutral-300" />
              </>
            )}

            <NavSessionActions />
          </div>
        </div>
      </header>
    </div>
  )
}
