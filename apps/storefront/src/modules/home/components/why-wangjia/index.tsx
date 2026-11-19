import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Image from "next/image"
import NumberTicker from "./number-ticker"

const PARTS = ["Impeller", "Gearbox", "Dinamo", "Pelampung", "Poros", "Kopel"]

const GLASS = "rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white"

/* What a farmer gets, as a bento of glass tiles on the night pond: the
   numbers from the catalogue count up when they come into view. */
const WhyWangjia = () => (
  <section className="content-container py-14 small:py-20" aria-labelledby="why-wangjia">
    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#7fdcff]">Kenapa WANGJIA</p>
    <h2
      id="why-wangjia"
      className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight tracking-[-0.02em] text-white small:text-5xl"
    >
      Yang Anda dapat dari setiap kincir WANGJIA.
    </h2>

    <div className="mt-10 grid gap-4 small:grid-cols-3 small:grid-rows-[auto_auto]">
      <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_70%_85%,#0b6c8f_0%,#062a44_50%,#04121f_100%)] p-6 text-white small:col-span-2 small:row-span-2 small:min-h-[340px] small:p-8">
        <p className="text-6xl font-extrabold tracking-[-0.04em] small:text-8xl">
          <NumberTicker value={25} />
          <span className="text-[#7ff0ff]">%</span>
        </p>
        <p className="mt-2 text-lg font-semibold text-[#cfe9f7]">lebih hemat listrik</p>
        <p className="mt-1 max-w-sm text-sm leading-6 text-[#a9c9dd]">
          Dengan gearbox bevel gear dan mechanical seal.
        </p>
        <div
          aria-hidden
          className="absolute bottom-0 right-0 -z-10 aspect-square w-3/4 rounded-full bg-[radial-gradient(circle,rgba(64,220,255,0.35),rgba(64,220,255,0)_65%)] blur-md"
        />
        <Image
          src="/products/kincir-1hp-cutout.webp"
          alt="Kincir air WANGJIA 1 HP"
          width={640}
          height={475}
          className="mt-6 h-auto w-[85%] max-w-md drop-shadow-[0_24px_30px_rgba(0,0,0,0.55)] small:absolute small:bottom-5 small:right-8 small:mt-0 small:w-[36%]"
        />
      </div>

      <div className={GLASS}>
        <p className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-5xl font-extrabold tracking-[-0.03em] text-transparent">
          SS<NumberTicker value={304} />
        </p>
        <p className="mt-2 font-semibold text-[#cfe9f7]">Poros dan rangka stainless steel</p>
      </div>

      <div className={GLASS}>
        <p className="text-5xl font-extrabold tracking-[-0.03em]">
          <NumberTicker value={175} />
          <span className="text-2xl text-[#7ff0ff]"> cm</span>
        </p>
        <p className="mt-2 font-semibold text-[#cfe9f7]">Pelampung HDPE</p>
      </div>

      <LocalizedClientLink
        href="/garansi"
        className="group rounded-3xl bg-[#ffd23f] p-6 text-[#04121f] shadow-[0_20px_50px_-20px_rgba(255,210,63,0.6)] transition hover:-translate-y-0.5"
      >
        <p className="text-5xl font-extrabold tracking-[-0.03em]">
          <NumberTicker value={12} />
          <span className="text-2xl"> bulan</span>
        </p>
        <p className="mt-2 font-semibold">Garansi motor</p>
        <p className="mt-1 text-sm">
          Scan QR di mesin untuk cek keaslian dan aktifkan garansi.{" "}
          <span className="font-bold underline-offset-4 group-hover:underline">Cek keaslian →</span>
        </p>
      </LocalizedClientLink>

      <div className={GLASS}>
        <p className="text-2xl font-bold">Bayar bertahap</p>
        <div aria-hidden className="mt-4 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-2 flex-1 rounded-full ${i < 2 ? "bg-[#7ff0ff]" : "bg-white/15"}`} />
          ))}
        </div>
        <p className="mt-3 text-sm text-[#a9c9dd]">Bayar sesuai jadwal pembayaran pesanan Anda.</p>
      </div>

      <LocalizedClientLink
        href="/categories/suku-cadang"
        className={`group transition hover:-translate-y-0.5 hover:border-white/25 ${GLASS}`}
      >
        <p className="text-2xl font-bold">Suku cadang lengkap</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PARTS.map((part) => (
            <span key={part} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[#7fdcff]">
              {part}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm font-bold text-[#ffd23f] underline-offset-4 group-hover:underline">
          Lihat suku cadang →
        </p>
      </LocalizedClientLink>
    </div>
  </section>
)

export default WhyWangjia
