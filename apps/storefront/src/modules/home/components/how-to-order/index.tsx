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

/* Four steps from choosing to the warranty, joined by a line on wide screens. */
const HowToOrder = () => (
  <section className="content-container py-10" aria-labelledby="how-to-order">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0A6FA8]">
      Cara pesan
    </p>
    <h2 id="how-to-order" className="mt-2 text-3xl font-semibold text-[#0B3A5B] small:text-4xl">
      Dari pilih kincir sampai garansi aktif.
    </h2>
    <ol className="relative mt-8 grid gap-4 small:grid-cols-4">
      <span
        aria-hidden
        className="absolute left-[12.5%] right-[12.5%] top-6 hidden border-t-2 border-dashed border-sky-200 small:block"
      />
      {STEPS.map((step, i) => (
        <li key={step.title} className="relative rounded-3xl bg-white p-6 ring-1 ring-slate-200 small:bg-transparent small:p-0 small:text-center small:ring-0">
          <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#0B3A5B] text-lg font-semibold text-[#FFD23F] small:mx-auto">
            {i + 1}
          </span>
          <p className="mt-4 text-lg font-semibold text-[#0B3A5B]">{step.title}</p>
          <p className="mt-1 text-sm text-slate-600">{step.text}</p>
          {step.href && (
            <LocalizedClientLink
              href={step.href}
              className="mt-2 inline-block text-sm font-semibold text-[#0A6FA8] underline-offset-4 hover:underline"
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
