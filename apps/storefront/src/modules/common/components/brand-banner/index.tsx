import Image from "next/image"
import { clx } from "@medusajs/ui"

/**
 * Brand block used instead of the starter's stock photos: the night of the home page, the
 * WANGJIA wordmark and the 2 HP machine's cut-out. Swap the image for a real field photo
 * once the owner provides one.
 */
const BrandBanner = ({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) => (
  <div
    className={clx(
      "relative overflow-hidden rounded-md text-white w-full",
      "bg-[linear-gradient(160deg,#121d3d_0%,#060b15_70%)]",
      className
    )}
  >
    <div
      className={clx(
        "relative z-10 flex flex-col justify-center h-full",
        compact ? "px-5 py-4 gap-1" : "px-8 py-8 gap-2"
      )}
    >
      <span
        className={clx(
          "font-extrabold tracking-[0.25em]",
          compact ? "text-lg" : "text-3xl"
        )}
      >
        WANGJIA®
      </span>
      <span className={clx("text-white/80", compact ? "text-xs" : "text-sm")}>
        Kincir air untuk tambak udang &amp; ikan · Toko resmi · Garansi 12 bulan
      </span>
      {!compact && (
        <div className="flex flex-wrap gap-2 mt-2 text-xs">
          {["Bayar bertahap", "Kirim se-Indonesia", "QR keaslian"].map((t) => (
            <span key={t} className="rounded-full bg-white/15 px-3 py-1">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
    <Image
      src="/products/kincir-2hp-oranye-front.webp"
      alt=""
      width={1000}
      height={475}
      priority
      className={clx(
        "absolute right-3 object-contain object-right-bottom pointer-events-none select-none",
        compact ? "bottom-2 h-[70%] w-auto max-w-[42%]" : "bottom-4 h-[62%] w-auto max-w-[52%]"
      )}
    />
  </div>
)

export default BrandBanner
