/*
  The four machines as the night pages show them: the range on the home page and the night
  stage at the top of each machine's product page. Cut-outs live in public/products.
  Prices are never typed in here; they always come from the shop.
*/

export type MachineInfo = {
  handle: string
  name: string
  tag: string
  /** The model in a few letters, set huge behind the machine on its product page. */
  word: string
  specs: [string, string]
  image: { src: string; width: number; height: number; alt: string }
  /**
   * The spare parts this machine is made of and how many it carries, from the catalogue's
   * packing list ("Isi paket") and the parts' own descriptions. Only the two gearbox kincir
   * have one: the catalogue does not say which parts fit the YC-055 or the jet aerator.
   */
  parts?: MachinePart[]
}

export type MachinePart = { handle: string; qty: number; note?: string }

// the gearbox kincir share their parts; only the counts differ (2 HP: 4 impellers, 3 floats)
const kincirParts = (impellers: number, floats: number): MachinePart[] => [
  { handle: "impeller-kincir-wangjia", qty: impellers },
  { handle: "pelampung-kincir-wangjia", qty: floats },
  { handle: "gearbox-kincir-wangjia", qty: 1 },
  { handle: "dinamo-motor-kincir-wangjia", qty: 1 },
  { handle: "as-kincir-wangjia", qty: 2 },
  { handle: "kopel-kincir-wangjia", qty: 2 },
  { handle: "pillow-block-kincir-wangjia", qty: 2 },
  { handle: "rangka-kincir-wangjia", qty: 1 },
  { handle: "penutup-motor-kincir-wangjia", qty: 1 },
  { handle: "gear-set-9-spline-wangjia", qty: 1, note: "di dalam gearbox 9 spline" },
  { handle: "mechanical-seal-kincir-wangjia", qty: 1, note: "di dalam gearbox 9 spline" },
]

export const MACHINES: MachineInfo[] = [
  {
    handle: "kincir-air-wangjia-2-hp",
    name: "Kincir Air 2 HP",
    tag: "Tambak intensif",
    word: "2 HP",
    specs: ["4 kipas · 3 pelampung", "1,5 kW · 1 / 3 phase"],
    image: { src: "/products/kincir-2hp-oranye-front.webp", width: 1000, height: 475, alt: "Kincir air WANGJIA 2 HP dengan empat kipas oranye" },
    parts: kincirParts(4, 3),
  },
  {
    handle: "kincir-air-wangjia-1-hp",
    name: "Kincir Air 1 HP",
    tag: "Udang & ikan",
    word: "1 HP",
    specs: ["2 kipas · 2 pelampung", "0,75 kW · 1 / 3 phase"],
    image: { src: "/products/kincir-1hp-oranye-front.webp", width: 1000, height: 713, alt: "Kincir air WANGJIA 1 HP dengan dua kipas oranye" },
    parts: kincirParts(2, 2),
  },
  {
    handle: "kincir-air-wangjia-yc-055",
    name: "Kincir YC-055 tanpa gearbox",
    tag: "Kolam kecil & bundar",
    word: "YC-055",
    specs: ["2 kipas · tanpa oli", "0,55 kW · 1 / 3 phase"],
    image: { src: "/products/yc055-cutout.webp", width: 900, height: 511, alt: "Kincir air WANGJIA YC-055 tanpa gearbox" },
  },
  {
    handle: "jet-aerator-wangjia-2-hp",
    name: "Jet Aerator 2 HP",
    tag: "Kolam dalam",
    word: "JET",
    specs: ["2.800 rpm · 3 phase", "> 0,75 kg O₂/jam"],
    image: { src: "/products/jet-aerator-cutout.webp", width: 800, height: 336, alt: "Jet aerator WANGJIA 2 HP" },
  },
]

export const machineByHandle = (handle?: string | null) => MACHINES.find((m) => m.handle === handle) ?? null

/** The machines a spare part belongs to, with how many each carries. */
export const machinesForPart = (handle?: string | null) =>
  MACHINES.flatMap((m) => {
    const part = m.parts?.find((p) => p.handle === handle)
    return part ? [{ machine: m, qty: part.qty, note: part.note }] : []
  })
