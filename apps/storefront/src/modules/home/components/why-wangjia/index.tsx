import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Image from "next/image"
import NumberTicker from "./number-ticker"

const PARTS = ["Impeller", "Gearbox", "Dinamo", "Pelampung", "Poros", "Kopel"]

/* What a farmer gets, as a bento grid: the numbers from the catalogue count up
   when they come into view. */
const WhyWangjia = () => (
  <section className="content-container py-10" aria-labelledby="why-wangjia">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0A6FA8]">
      Kenapa WANGJIA
    </p>
    <h2 id="why-wangjia" className="mt-2 max-w-2xl text-3xl font-semibold leading-tight text-[#0B3A5B] small:text-4xl">
      Yang Anda dapat dari setiap kincir WANGJIA.
    </h2>

    <div className="mt-8 grid gap-4 small:grid-cols-3 small:grid-rows-[auto_auto]">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B3A5B] to-[#0A6FA8] p-6 text-white small:col-span-2 small:row-span-2 small:p-8">
        <p className="text-6xl font-semibold tracking-tight small:text-7xl">
          <NumberTicker value={25} />%
        </p>
        <p className="mt-2 text-lg font-medium">lebih hemat listrik</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-sky-100">
          Dengan gearbox bevel gear dan mechanical seal.
        </p>
        <Image
          src="/products/kincir-1hp-cutout.webp"
          alt="Kincir air WANGJIA 1 HP"
          width={640}
          height={475}
          className="mt-6 h-auto w-[85%] max-w-md drop-shadow-[0_20px_24px_rgba(0,0,0,0.35)] small:absolute small:bottom-6 small:right-6 small:mt-0 small:w-[46%]"
        />
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-slate-100 to-slate-300 p-6 text-[#0B3A5B]">
        <p className="text-5xl font-semibold tracking-tight">
          SS<NumberTicker value={304} />
        </p>
        <p className="mt-2 font-medium">Poros dan rangka stainless steel</p>
      </div>

      <div className="rounded-3xl bg-sky-50 p-6 text-[#0B3A5B] ring-1 ring-sky-100">
        <p className="text-5xl font-semibold tracking-tight">
          <NumberTicker value={175} />
          <span className="text-2xl"> cm</span>
        </p>
        <p className="mt-2 font-medium">Pelampung HDPE</p>
      </div>

      <LocalizedClientLink
        href="/garansi"
        className="group rounded-3xl bg-[#FFD23F] p-6 text-[#0B3A5B] transition hover:-translate-y-0.5"
      >
        <p className="text-5xl font-semibold tracking-tight">
          <NumberTicker value={12} />
          <span className="text-2xl"> bulan</span>
        </p>
        <p className="mt-2 font-medium">Garansi motor</p>
        <p className="mt-1 text-sm">
          Scan QR di mesin untuk cek keaslian dan aktifkan garansi.{" "}
          <span className="font-semibold underline-offset-4 group-hover:underline">Cek keaslian →</span>
        </p>
      </LocalizedClientLink>

      <div className="rounded-3xl bg-white p-6 text-[#0B3A5B] ring-1 ring-slate-200">
        <p className="text-2xl font-semibold">Bayar bertahap</p>
        <div aria-hidden className="mt-4 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-2 flex-1 rounded-full ${i < 2 ? "bg-[#0A6FA8]" : "bg-slate-200"}`} />
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Bayar sesuai jadwal pembayaran pesanan Anda.
        </p>
      </div>

      <LocalizedClientLink
        href="/categories/suku-cadang"
        className="group rounded-3xl bg-white p-6 text-[#0B3A5B] ring-1 ring-slate-200 transition hover:-translate-y-0.5"
      >
        <p className="text-2xl font-semibold">Suku cadang lengkap</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PARTS.map((part) => (
            <span key={part} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-[#0A6FA8]">
              {part}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm font-semibold underline-offset-4 group-hover:underline">
          Lihat suku cadang →
        </p>
      </LocalizedClientLink>
    </div>
  </section>
)

export default WhyWangjia
