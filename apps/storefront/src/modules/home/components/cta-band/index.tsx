const WAVE =
  "M0,48 C240,8 480,8 720,48 C960,88 1200,88 1440,48 C1680,8 1920,8 2160,48 C2400,88 2640,88 2880,48 L2880,96 L0,96 Z"

/* Last word on the home page: ask on WhatsApp which aerator suits the pond. */
const CtaBand = () => {
  const text = encodeURIComponent("Halo WANGJIA, saya mau tanya kincir yang cocok untuk kolam saya.")
  const whatsapp = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6281200000000"}?text=${text}`

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-[#0B3A5B] px-6 py-12 text-center text-white small:py-16">
      <svg
        aria-hidden
        className="absolute bottom-0 left-0 -z-10 h-16 w-[200%] motion-safe:animate-pond-wave [animation-duration:20s]"
        viewBox="0 0 2880 96"
        preserveAspectRatio="none"
      >
        <path d={WAVE} fill="rgba(1,147,222,0.35)" />
      </svg>
      <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight small:text-4xl">
        Masih ragu pilih 1 HP atau 2 HP?
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sky-100">
        Ceritakan luas kolam dan jenis budidaya Anda, tim WANGJIA bantu pilihkan.
      </p>
      <a
        href={whatsapp}
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#FFD23F] px-7 py-3 text-sm font-semibold text-[#0B3A5B] shadow-lg shadow-black/25 transition hover:-translate-y-0.5 hover:bg-[#FFDD66]"
      >
        Tanya lewat WhatsApp
      </a>
    </section>
  )
}

export default CtaBand
