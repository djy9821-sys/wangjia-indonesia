"use client"

import { useSession } from "@/lib/context/session-context"
import { IS_PREVIEW } from "@/lib/util/preview"
import { whatsappLink } from "@/lib/util/whatsapp"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import WhatsAppIcon from "@/modules/common/icons/whatsapp"
import * as Dialog from "@radix-ui/react-dialog"
import { CSSProperties, useState } from "react"

/*
  The menu on phones and tablets (the desktop bar shows its own links). A full-screen night
  sheet on every page: the products first in large type, then help, then WhatsApp and the
  account. Before it a phone had no menu: categories and help were reachable only from the
  footer. Styles and the entrance are under .wj-menu in styles/globals.css.
*/
export type MenuCategory = { name: string; handle: string; count: number }

const HELP = [
  ["Cek keaslian & garansi", "/garansi"],
  ["Panduan pemasangan & perawatan", "/panduan"],
  ["Panduan tambak & kincir air", "/blog"],
  ["Patungan (pesan bersama)", "/patungan"],
  ["Informasi pengiriman", "/shipping"],
  ["Hubungi kami", "/contact"],
] as const

// only the first rows arrive one after another; a long list in sequence feels slow
const step = (i: number) => ({ "--i": Math.min(i, 5) }) as CSSProperties

export default function MobileMenu({ categories }: { categories: MenuCategory[] }) {
  const [open, setOpen] = useState(false)
  const { customer } = useSession()
  // a tapped link closes the sheet, also when it leads to the page already open
  const close = () => setOpen(false)

  const products = [
    { label: "Semua produk", href: "/store", count: null as number | null },
    ...categories.map((c) => ({ label: c.name, href: `/categories/${c.handle}`, count: c.count })),
  ]

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Buka menu"
          className="-ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-full small:hidden"
          data-testid="nav-menu-button"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M3 7.5h16M3 14.5h16" />
          </svg>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          className="wj-menu fixed inset-0 z-[60] flex flex-col overflow-y-auto overscroll-contain bg-[#060b15] text-[#f2f4f7] outline-none small:hidden"
          data-testid="nav-menu"
        >
          <div className="flex h-[56px] shrink-0 items-center justify-between pl-5 pr-2">
            <Dialog.Title className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#7f8aa0]">
              Menu
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Tutup menu" className="grid h-11 w-11 place-items-center rounded-full">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M5 5l12 12M17 5L5 17" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <nav aria-label="Menu utama" className="flex flex-1 flex-col px-5 pb-8">
            <ul className="border-t border-[rgba(190,210,255,0.12)]">
              {products.map((item, i) => (
                <li key={item.href} className="wj-menu-item border-b border-[rgba(190,210,255,0.12)]" style={step(i)}>
                  <LocalizedClientLink
                    href={item.href}
                    onClick={close}
                    className="flex min-h-[64px] items-center justify-between gap-4 py-3 text-[26px] font-medium leading-tight tracking-[-0.02em]"
                  >
                    <span>{item.label}</span>
                    {item.count !== null && (
                      <span className="text-[14px] font-normal tabular-nums tracking-normal text-[#7f8aa0]">{item.count}</span>
                    )}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>

            <ul className="mt-5 flex flex-col">
              {HELP.map(([label, href], i) => (
                <li key={href} className="wj-menu-item" style={step(products.length + i)}>
                  <LocalizedClientLink href={href} onClick={close} className="flex min-h-[48px] items-center text-[17px] text-[#a7b1c4]">
                    {label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col gap-3 pt-8">
              <a
                href={whatsappLink("Halo WANGJIA, saya mau tanya tentang kincir air.")}
                target="_blank"
                rel="noreferrer"
                className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-[rgba(190,210,255,0.24)] text-[16px] font-semibold"
              >
                <WhatsAppIcon className="h-[18px] w-[18px] text-[#25d366]" />
                Tanya lewat WhatsApp
              </a>
              {!IS_PREVIEW && (
                <LocalizedClientLink
                  href="/account"
                  onClick={close}
                  className="flex h-[52px] items-center justify-center rounded-full bg-[#f2f4f7] text-[16px] font-semibold text-[#060b15]"
                >
                  {customer ? `Akun saya · ${customer.first_name}` : "Masuk atau daftar"}
                </LocalizedClientLink>
              )}
              <p className="text-center text-[13px] text-[#7f8aa0]">WhatsApp dibalas Senin–Sabtu 08.00–17.00 WIB</p>
            </div>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
