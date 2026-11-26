import { machinesForPart } from "@/lib/util/machines"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Image from "next/image"

/*
  On a spare-part page: the machines that carry this part and how many each uses, from the
  catalogue's packing lists (lib/util/machines.ts). A farmer checks the fit before the price,
  so it sits right under the buy box. Parts the catalogue does not place on a machine show
  nothing here; their own "Kompatibel" line stays in the specifications.
*/
export default function FitsMachines({ handle }: { handle?: string | null }) {
  const fits = machinesForPart(handle)
  if (!fits.length) {
    return null
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/[0.03] px-5 pb-2 pt-5" data-testid="fits-machines">
      <p className="font-[family-name:var(--font-geist-mono)] text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-3)]">
        Dipakai di
      </p>
      <ul className="mt-2 divide-y divide-[var(--line)]">
        {fits.map(({ machine, qty }) => (
          <li key={machine.handle}>
            <LocalizedClientLink href={`/products/${machine.handle}`} className="flex min-h-[60px] items-center gap-3 py-2">
              <span className="relative h-10 w-[72px] shrink-0">
                <Image src={machine.image.src} alt="" fill sizes="72px" className="object-contain" />
              </span>
              <span className="flex-1 text-[15px] font-medium leading-snug text-[var(--text)]">{machine.name}</span>
              <span className="whitespace-nowrap text-[14px] tabular-nums text-[var(--text-2)]">{qty} pcs per mesin</span>
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
      {fits[0].note && <p className="border-t border-[var(--line)] py-3 text-[13px] text-[var(--text-3)]">Letaknya {fits[0].note}.</p>}
    </div>
  )
}
