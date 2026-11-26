"use client"

import Spinner from "@/modules/common/icons/spinner"
import { MagnifyingGlass } from "@medusajs/icons"
import { Drawer } from "@medusajs/ui"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

// The search itself arrives when it is first wanted: a pointer or finger on the button starts
// the download, opening the drawer shows it.
const loadBody = () => import("./body")
const SearchBody = dynamic(loadBody, {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-10">
      <Spinner />
    </div>
  ),
})

const Search = ({ currencyCode }: { currencyCode: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  // stays mounted after the first opening, so a query survives closing the drawer
  const [wanted, setWanted] = useState(false)
  const pathname = usePathname()
  const { countryCode } = useParams<{ countryCode: string }>()

  // Close the panel when a hit navigates, matching the cart drawer.
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      {/* A real link so search works without JavaScript; with JS it opens the drawer instead. */}
      <Link
        href={`/${countryCode}/search`}
        onClick={(event) => {
          event.preventDefault()
          setWanted(true)
          setIsOpen(true)
        }}
        onPointerEnter={loadBody}
        onTouchStart={loadBody}
        onFocus={loadBody}
        aria-label="Cari produk"
        title="Cari produk"
        className="transition-fg inline-flex w-fit items-center justify-center outline-none px-3 py-1.5 rounded-full hover:bg-neutral-100"
        data-testid="nav-search-button"
      >
        <MagnifyingGlass />
      </Link>

      <Drawer.Content
        className="z-50 rounded-none m-0 p-0 inset-y-0 sm:right-0 [&_kbd]:hidden small:[&_kbd]:inline-flex"
        data-testid="search-drawer"
      >
        <Drawer.Header className="flex self-center">
          <Drawer.Title>Cari produk</Drawer.Title>
        </Drawer.Header>

        <div className="flex flex-col h-full overflow-hidden">
          {wanted && (
            <SearchBody
              currencyCode={currencyCode}
              onNavigate={() => setIsOpen(false)}
            />
          )}
        </div>
      </Drawer.Content>
    </Drawer>
  )
}

export default Search
