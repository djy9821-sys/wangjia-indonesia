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
}

export const MACHINES: MachineInfo[] = [
  {
    handle: "kincir-air-wangjia-2-hp",
    name: "Kincir Air 2 HP",
    tag: "Tambak intensif",
    word: "2 HP",
    specs: ["4 kipas · 3 pelampung", "1,5 kW · 1 / 3 phase"],
    image: { src: "/products/kincir-2hp-oranye-front.webp", width: 1000, height: 475, alt: "Kincir air WANGJIA 2 HP dengan empat kipas oranye" },
  },
  {
    handle: "kincir-air-wangjia-1-hp",
    name: "Kincir Air 1 HP",
    tag: "Udang & ikan",
    word: "1 HP",
    specs: ["2 kipas · 2 pelampung", "0,75 kW · 1 / 3 phase"],
    image: { src: "/products/kincir-1hp-oranye-front.webp", width: 1000, height: 713, alt: "Kincir air WANGJIA 1 HP dengan dua kipas oranye" },
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
