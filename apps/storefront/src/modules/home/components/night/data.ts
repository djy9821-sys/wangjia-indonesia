import { getProductByHandle } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { MACHINES, MachineInfo } from "@/lib/util/machines"
import { convertToLocale } from "@/lib/util/money"
import { HttpTypes } from "@medusajs/types"

/* Everything the night home page shows that comes from the shop: prices are never typed in. */

export type Price = {
  /** The lowest variant price, formatted ("Rp 6.500.000"). */
  from: string
  /** True when variants cost different amounts, so the price reads "mulai". */
  varies: boolean
  /** Each variant with its own price, for the comparison table. */
  variants: { title: string; price: string }[]
}

export type Machine = MachineInfo & { price: Price | null }

export type PartKey = "motor" | "gearbox" | "shaft" | "impeller" | "float"

/** The spare part sold for each labelled part of the 2 HP. */
const PART_HANDLES: Record<PartKey, string> = {
  motor: "dinamo-motor-kincir-wangjia",
  gearbox: "gearbox-kincir-wangjia",
  shaft: "as-kincir-wangjia",
  impeller: "impeller-kincir-wangjia",
  float: "pelampung-kincir-wangjia",
}

function priceOf(product: HttpTypes.StoreProduct | null | undefined): Price | null {
  const priced = (product?.variants ?? []).flatMap((v) => {
    const cp = v.calculated_price
    return cp?.calculated_amount != null && cp.currency_code ? [{ title: v.title ?? "", amount: Number(cp.calculated_amount), currency: cp.currency_code }] : []
  })
  if (!priced.length) return null
  const amounts = priced.map((p) => p.amount)
  const min = Math.min(...amounts)
  const fmt = (amount: number) => convertToLocale({ amount, currency_code: priced[0].currency })
  return {
    from: fmt(min),
    varies: Math.max(...amounts) > min,
    variants: [...priced].sort((a, b) => a.amount - b.amount).map((p) => ({ title: p.title, price: fmt(p.amount) })),
  }
}

export async function getNightHomeData(countryCode: string) {
  const region = await getRegion(countryCode).catch(() => null)
  const fetchOne = (handle: string) => (region ? getProductByHandle(handle, region.id).catch(() => null) : Promise.resolve(null))

  const partKeys = Object.keys(PART_HANDLES) as PartKey[]
  const [machines, parts] = await Promise.all([
    Promise.all(MACHINES.map((m) => fetchOne(m.handle))),
    Promise.all(partKeys.map((k) => fetchOne(PART_HANDLES[k]))),
  ])

  return {
    machines: MACHINES.map((m, i) => ({ ...m, price: priceOf(machines[i]) })) as Machine[],
    parts: Object.fromEntries(partKeys.map((k, i) => [k, priceOf(parts[i])])) as Record<PartKey, Price | null>,
    partHandles: PART_HANDLES,
  }
}

export type NightHomeData = Awaited<ReturnType<typeof getNightHomeData>>
