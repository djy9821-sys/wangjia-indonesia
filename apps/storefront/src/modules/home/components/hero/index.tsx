import { getProductByHandle } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { getProductPrice } from "@/lib/util/get-product-price"
import HeroSlides, { type HeroSlide } from "./hero-slides"

// After the "Design World" hero on motionsites.ai: giant words, the machine in
// front of them, arrows, dots and an outlined slide number.
const SLIDES: Omit<HeroSlide, "price">[] = [
  {
    handle: "kincir-air-wangjia-2-hp",
    words: ["Kincir", "Air", "2 HP"],
    image: "/products/kincir-2hp-oranye-front.webp",
    width: 1000,
    height: 475,
    alt: "Kincir air WANGJIA 2 HP dengan empat kipas",
    size: "w-[88%] small:w-[60%]",
    line: "Empat kipas, gearbox bevel gear,",
    strong: "poros stainless SS304.",
  },
  {
    handle: "kincir-air-wangjia-1-hp",
    words: ["Kincir", "Air", "1 HP"],
    image: "/products/kincir-1hp-oranye-front.webp",
    width: 1000,
    height: 713,
    alt: "Kincir air WANGJIA 1 HP dengan dua kipas",
    // Taller than the 2 HP photo: kept smaller so the words still read around it.
    size: "w-[62%] small:w-[38%]",
    line: "Dua kipas, gearbox bevel gear,",
    strong: "hemat listrik 25%.",
  },
]

const Hero = async ({ countryCode }: { countryCode: string }) => {
  // Prices come from the shop itself, so the hero never shows a stale one.
  const region = await getRegion(countryCode).catch(() => null)
  const products = region
    ? await Promise.all(SLIDES.map((s) => getProductByHandle(s.handle, region.id).catch(() => null)))
    : []

  const slides = SLIDES.map((slide, i) => {
    const product = products[i]
    return {
      ...slide,
      price: product ? getProductPrice({ product }).cheapestPrice?.calculated_price ?? null : null,
    }
  })

  return <HeroSlides slides={slides} />
}

export default Hero
