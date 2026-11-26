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
  sheet on every page: the four machines by name with their prices, the spare parts, then
  help, WhatsApp and the account. With four machines the menu can be the range itself, one
  tap from any page. Before it a phone had no menu: products and help were reachable only
  from the footer. Styles and the entrance are under .wj-menu in styles/globals.css.
*/
export type MenuMachine = { name: string; handle: string; price: string | null; from: boolean }
export type MenuCategory = { name: string; handle: string; count: number }

const HELP: readonly (readonly [string, string])[] = [
  ["Cek keaslian & garansi", "/garansi"],
  ["Panduan pemasangan & perawatan", "/panduan"],
  ["Panduan tambak & kincir air", "/blog"],
  ["Patungan (pesan bersama)", "/patungan"],
  ["Informasi pengiriman", "/shipping"],
  ["Hubungi kami", "/contact"],
]

// only the first rows arrive one after another; a long list in sequence feels slow
const step = (i: number) => ({ "--i": Math.min(i, 5) }) as CSSProperties

const ROW = "flex min-h-[52px] items-center justify-between gap-4 py-2 text-[20px] font-medium leading-tight tracking-[-0.01em]"
const SIDE = "shrink-0 whitespace-nowrap text-[14px] font-normal tabular-nums tracking-normal text-[#a7b1c4]"

export default function MobileMenu({ machines, categories }: { machines: MenuMachine[]; categories: MenuCategory[] }) {
  const [open, setOpen] = useState(false)
  const { customer } = useSession()
  // a tapped link closes the sheet, also when it leads to the page already open
  const close = () => setOpen(false)
  // the search page needs the backend, which the browse-only copy does not have
  const help = IS_PREVIEW ? HELP : [...HELP, ["Cari produk", "/search"] as const]

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
              {machines.map((m, i) => (
                <li key={m.handle} className="wj-menu-item border-b border-[rgba(190,210,255,0.12)]" style={step(i)}>
                  <LocalizedClientLink href={`/products/${m.handle}`} onClick={close} className={ROW}>
                    <span>{m.name}</span>
                    {m.price && (
                      <span className={SIDE}>
                        {m.from ? "mulai " : ""}
                        {m.price}
                      </span>
                    )}
                  </LocalizedClientLink>
                </li>
              ))}
              {categories.map((c, i) => (
                <li key={c.handle} className="wj-menu-item border-b border-[rgba(190,210,255,0.12)]" style={step(machines.length + i)}>
                  <LocalizedClientLink href={`/categories/${c.handle}`} onClick={close} className={ROW}>
                    <span>{c.name}</span>
                    <span className={SIDE}>{c.count} produk</span>
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>

            <ul className="mt-4 flex flex-col">
              {help.map(([label, href]) => (
                <li key={href} className="wj-menu-item" style={step(5)}>
                  <LocalizedClientLink href={href} onClick={close} className="flex min-h-[44px] items-center text-[16px] text-[#a7b1c4]">
                    {label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col gap-3 pt-6">
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
