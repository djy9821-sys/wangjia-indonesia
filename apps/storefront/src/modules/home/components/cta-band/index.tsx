/* Last word on the home page: ask on WhatsApp which aerator suits the pond. */
const CtaBand = () => {
  const text = encodeURIComponent("Halo WANGJIA, saya mau tanya kincir yang cocok untuk kolam saya.")
  const whatsapp = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6281200000000"}?text=${text}`

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-[#020b14] px-6 py-16 text-center text-white small:py-24">
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -z-10 aspect-square w-[90%] max-w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(64,220,255,0.3),rgba(64,220,255,0)_65%)] blur-md motion-safe:animate-night-glow"
      />
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#7fdcff]">Tanya tim WANGJIA</p>
      <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold leading-tight tracking-[-0.02em] small:text-5xl">
        Masih ragu pilih 1 HP atau 2 HP?
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-[#a9c9dd]">
        Ceritakan luas kolam dan jenis budidaya Anda, tim WANGJIA bantu pilihkan.
      </p>
      <a
        href={whatsapp}
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#ffd23f] px-7 py-3 text-sm font-bold text-[#04121f] shadow-[0_10px_30px_-10px_rgba(255,210,63,0.7)] transition hover:-translate-y-0.5 hover:bg-[#ffdd66]"
      >
        Tanya lewat WhatsApp
      </a>
    </section>
  )
}

export default CtaBand
