import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Image from "next/image"

// Fine film grain over the night water; an inline SVG, so no extra request.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")"

const CHIPS = [
  { value: "25%", label: "hemat listrik", place: "small:left-[4%] small:top-[2%]" },
  { value: "SS304", label: "poros & rangka", place: "small:right-0 small:top-[14%]" },
  { value: "12 bulan", label: "garansi motor", place: "small:right-[6%] small:bottom-[2%]" },
]

/* The pond at night: the aerator lit from below the water, the catalogue's
   numbers floating beside it on frosted glass. */
const Hero = () => {
  const whatsapp = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6281200000000"}`

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-[#020b14] text-[#eaf6ff]">
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_65%_70%_at_72%_55%,#0b6c8f_0%,#062a44_45%,#020b14_100%)]"
      />
      <div
        aria-hidden
        className="absolute right-[6%] top-[22%] -z-10 aspect-square w-[70%] rounded-full bg-[radial-gradient(circle,rgba(64,220,255,0.45),rgba(64,220,255,0)_65%)] blur-md motion-safe:animate-night-glow small:top-[14%] small:w-[46%]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />

      <div className="content-container grid items-center gap-10 pt-12 pb-16 small:grid-cols-[1fr_1.15fr] small:gap-6 small:px-16 small:pt-24 small:pb-24">
        <div className="relative z-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#7fdcff]">
            Kincir air · Aerator tambak
          </p>
          <h1 className="mt-5 text-[2.8rem] font-extrabold leading-[0.98] tracking-[-0.035em] small:text-7xl">
            Oksigen cukup.
            <br />
            <span className="bg-gradient-to-r from-[#7ff0ff] to-[#ffd23f] bg-clip-text text-transparent">
              Panen lebih tenang.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#a9c9dd] small:text-lg">
            Kincir air 1 HP &amp; 2 HP dengan gearbox bevel gear dan poros
            stainless SS304. Bayar bertahap, kirim ke seluruh Indonesia.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LocalizedClientLink
              href="/store"
              className="rounded-full bg-[#ffd23f] px-6 py-3 text-sm font-bold text-[#04121f] shadow-[0_10px_30px_-10px_rgba(255,210,63,0.7)] transition hover:-translate-y-0.5 hover:bg-[#ffdd66]"
            >
              Lihat produk
            </LocalizedClientLink>
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/25 bg-white/[0.06] px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/[0.12]"
            >
              Chat WhatsApp
            </a>
          </div>
        </div>

        <div className="relative">
          <Image
            src="/products/kincir-2hp-cutout.webp"
            alt="Kincir air WANGJIA 2 HP"
            width={900}
            height={580}
            priority
            className="relative z-[1] mx-auto h-auto w-full max-w-[620px] drop-shadow-[0_40px_40px_rgba(0,0,0,0.6)] motion-safe:animate-pond-bob"
          />
          <ul className="mt-6 grid grid-cols-3 gap-2 small:mt-0">
            {CHIPS.map((chip) => (
              <li
                key={chip.value}
                className={`z-[2] rounded-2xl border border-white/[0.18] bg-white/[0.08] px-3 py-2.5 text-[12px] text-[#cfe9f7] backdrop-blur-md small:absolute small:px-4 small:py-3 small:text-[13px] ${chip.place}`}
              >
                <b className="block text-lg font-bold tracking-tight text-white small:text-2xl">{chip.value}</b>
                {chip.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-b from-transparent to-[#020b14]/90" />
    </section>
  )
}

export default Hero
