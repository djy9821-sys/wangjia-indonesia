import LocalizedClientLink from "@/modules/common/components/localized-client-link"

const STEPS = [
  {
    title: "Pilih kincir",
    text: "1 HP atau 2 HP, atau suku cadang yang Anda perlukan.",
    href: "/store",
    cta: "Lihat produk",
  },
  {
    title: "Bayar bertahap",
    text: "Bayar sesuai jadwal pembayaran pesanan Anda.",
  },
  {
    title: "Dikirim ke tambak",
    text: "Pengiriman ke seluruh Indonesia.",
    href: "/shipping",
    cta: "Info pengiriman",
  },
  {
    title: "Scan QR, garansi aktif",
    text: "Cek keaslian mesin dan aktifkan garansi motor 1 tahun.",
    href: "/garansi",
    cta: "Cek keaslian",
  },
]

/* Four steps from choosing to the warranty, glowing numbers joined by a line
   on wide screens. */
const HowToOrder = () => (
  <section className="content-container pb-16 small:pb-24" aria-labelledby="how-to-order">
    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#7fdcff]">Cara pesan</p>
    <h2
      id="how-to-order"
      className="mt-3 text-3xl font-extrabold tracking-[-0.02em] text-white small:text-5xl"
    >
      Dari pilih kincir sampai garansi aktif.
    </h2>
    <ol className="relative mt-10 grid gap-4 small:grid-cols-4">
      <span
        aria-hidden
        className="absolute left-[12.5%] right-[12.5%] top-6 hidden border-t border-dashed border-white/20 small:block"
      />
      {STEPS.map((step, i) => (
        <li
          key={step.title}
          className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-6 small:border-0 small:bg-transparent small:p-0 small:text-center"
        >
          <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#062a44] text-lg font-bold text-[#7fdcff] shadow-[0_0_30px_rgba(64,220,255,0.35)] ring-1 ring-[#7fdcff]/40 small:mx-auto">
            {i + 1}
          </span>
          <p className="mt-4 text-lg font-bold text-white">{step.title}</p>
          <p className="mt-1 text-sm text-[#a9c9dd]">{step.text}</p>
          {step.href && (
            <LocalizedClientLink
              href={step.href}
              className="mt-2 inline-block text-sm font-bold text-[#ffd23f] underline-offset-4 hover:underline"
            >
              {step.cta} →
            </LocalizedClientLink>
          )}
        </li>
      ))}
    </ol>
  </section>
)

export default HowToOrder
