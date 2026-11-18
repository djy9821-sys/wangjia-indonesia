import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Image from "next/image"

// Bubbles rise from the pond floor at fixed spots, so the server and the
// browser draw the same page.
const BUBBLES = [
  { left: "5%", size: 10, delay: "0s", duration: "8s" },
  { left: "13%", size: 6, delay: "2.5s", duration: "6s" },
  { left: "24%", size: 12, delay: "1s", duration: "9s" },
  { left: "37%", size: 7, delay: "4s", duration: "7s" },
  { left: "52%", size: 9, delay: "0.5s", duration: "8.5s" },
  { left: "66%", size: 6, delay: "3s", duration: "6.5s" },
  { left: "78%", size: 11, delay: "1.8s", duration: "9.5s" },
  { left: "91%", size: 8, delay: "5s", duration: "7.5s" },
]

// Two periods of the same curve: sliding it by half its width loops seamlessly.
const WAVE =
  "M0,48 C240,8 480,8 720,48 C960,88 1200,88 1440,48 C1680,8 1920,8 2160,48 C2400,88 2640,88 2880,48 L2880,96 L0,96 Z"

const Hero = () => {
  const whatsapp = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6281200000000"}`

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-b from-[#0B3A5B] via-[#0A6FA8] to-[#0193DE] text-white">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.22),transparent_55%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {BUBBLES.map((b) => (
          <span
            key={b.left}
            className="absolute bottom-10 rounded-full border border-white/60 bg-white/10 opacity-0 motion-safe:animate-pond-bubble"
            style={{
              left: b.left,
              width: b.size,
              height: b.size,
              animationDelay: b.delay,
              animationDuration: b.duration,
            }}
          />
        ))}
      </div>

      <div className="content-container grid items-center gap-8 pt-10 pb-28 small:grid-cols-[1.05fr_1fr] small:gap-10 small:pt-20 small:pb-36">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-100 ring-1 ring-white/25">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFD23F]" />
            Toko resmi WANGJIA® Indonesia
          </p>
          <h1 className="mt-5 text-[2.6rem] font-semibold leading-[1.05] tracking-tight small:text-6xl">
            Oksigen cukup,
            <br />
            <span className="text-[#FFD23F]">udang tumbuh sehat.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-sky-50/90 small:text-lg">
            Kincir air 1 HP &amp; 2 HP dengan gearbox bevel gear, poros dan
            rangka stainless SS304. Bayar bertahap, kirim ke seluruh Indonesia.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LocalizedClientLink
              href="/store"
              className="rounded-full bg-[#FFD23F] px-6 py-3 text-sm font-semibold text-[#0B3A5B] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#FFDD66]"
            >
              Lihat Produk
            </LocalizedClientLink>
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-white/20"
            >
              Chat WhatsApp
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <Image
            src="/products/kincir-1hp-cutout.webp"
            alt=""
            aria-hidden
            width={640}
            height={475}
            className="absolute -left-1 -top-2 h-auto w-[36%] opacity-80 blur-[1px] motion-safe:animate-pond-bob [animation-delay:-2.5s]"
          />
          <span
            aria-hidden
            className="absolute bottom-[4%] left-1/2 h-14 w-[78%] -translate-x-1/2 rounded-[50%] border-2 border-white/40 motion-safe:animate-pond-ripple"
          />
          <Image
            src="/products/kincir-2hp-cutout.webp"
            alt="Kincir air WANGJIA 2 HP di kolam"
            width={900}
            height={580}
            priority
            className="relative ml-auto h-auto w-[88%] drop-shadow-[0_28px_28px_rgba(3,30,52,0.45)] motion-safe:animate-pond-bob"
          />
        </div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 overflow-hidden">
        <svg
          className="absolute bottom-0 h-20 w-[200%] motion-safe:animate-pond-wave [animation-duration:18s]"
          viewBox="0 0 2880 96"
          preserveAspectRatio="none"
        >
          <path d={WAVE} fill="rgba(255,255,255,0.16)" />
        </svg>
        <svg
          className="absolute bottom-0 h-12 w-[200%] motion-safe:animate-pond-wave [animation-direction:reverse]"
          viewBox="0 0 2880 96"
          preserveAspectRatio="none"
        >
          <path d={WAVE} fill="rgba(255,255,255,0.28)" />
        </svg>
      </div>
    </section>
  )
}

export default Hero
