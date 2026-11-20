import { getProductByHandle } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
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

export type Machine = {
  handle: string
  name: string
  tag: string
  specs: [string, string]
  image: { src: string; width: number; height: number; alt: string }
  price: Price | null
}

export type PartKey = "motor" | "gearbox" | "shaft" | "impeller" | "float"

const MACHINES: Omit<Machine, "price">[] = [
  {
    handle: "kincir-air-wangjia-2-hp",
    name: "Kincir Air 2 HP",
    tag: "Tambak intensif",
    specs: ["4 kipas · 3 pelampung", "1,5 kW · 1 / 3 phase"],
    image: { src: "/products/kincir-2hp-oranye-front.webp", width: 1000, height: 475, alt: "Kincir air WANGJIA 2 HP dengan empat kipas oranye" },
  },
  {
    handle: "kincir-air-wangjia-1-hp",
    name: "Kincir Air 1 HP",
    tag: "Udang & ikan",
    specs: ["2 kipas · 2 pelampung", "0,75 kW · 1 / 3 phase"],
    image: { src: "/products/kincir-1hp-oranye-front.webp", width: 1000, height: 713, alt: "Kincir air WANGJIA 1 HP dengan dua kipas oranye" },
  },
  {
    handle: "kincir-air-wangjia-yc-055",
    name: "Kincir YC-055 tanpa gearbox",
    tag: "Kolam kecil & bundar",
    specs: ["2 kipas · tanpa oli", "0,55 kW · 1 / 3 phase"],
    image: { src: "/products/yc055-cutout.webp", width: 900, height: 511, alt: "Kincir air WANGJIA YC-055 tanpa gearbox" },
  },
  {
    handle: "jet-aerator-wangjia-2-hp",
    name: "Jet Aerator 2 HP",
    tag: "Kolam dalam",
    specs: ["2.800 rpm · 3 phase", "> 0,75 kg O₂/jam"],
    image: { src: "/products/jet-aerator-cutout.webp", width: 800, height: 336, alt: "Jet aerator WANGJIA 2 HP" },
  },
]

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
