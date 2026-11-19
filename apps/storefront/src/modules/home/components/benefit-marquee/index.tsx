const ITEMS = [
  "Bayar bertahap",
  "Gearbox bevel gear",
  "Poros & rangka stainless SS304",
  "Pelampung HDPE 175 cm",
  "Suku cadang asli",
  "Garansi motor 1 tahun",
  "Cek keaslian lewat QR",
  "Kirim ke seluruh Indonesia",
  "Patungan: pesan bersama",
]

/* A slow strip of what the shop promises. Two copies side by side, so sliding
   by half the row loops without a jump; it stands still for reduced motion. */
const BenefitMarquee = () => (
  <section
    aria-label="Keunggulan WANGJIA"
    className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#04121f] py-4 text-[#cfe9f7]"
  >
    <div className="flex w-max gap-10 pr-10 motion-safe:animate-marquee hover:[animation-play-state:paused]">
      {[...ITEMS, ...ITEMS].map((item, i) => (
        <span
          key={i}
          aria-hidden={i >= ITEMS.length}
          className="flex items-center gap-3 whitespace-nowrap text-sm font-medium"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#FFD23F]" />
          {item}
        </span>
      ))}
    </div>
    <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#04121f]" />
    <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#04121f]" />
  </section>
)

export default BenefitMarquee
