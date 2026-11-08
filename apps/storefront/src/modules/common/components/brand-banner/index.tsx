import Image from "next/image"
import { clx } from "@medusajs/ui"

/**
 * Brand block used instead of the starter's stock photos: blue→green gradient,
 * the WANGJIA wordmark and the 2 HP aerator illustration. Swap the image for a
 * real field photo once 李总 provides one.
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
      "bg-[linear-gradient(120deg,#0E5A8A_0%,#1B8A5A_100%)]",
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
      src="/products/aerator-2hp.png"
      alt=""
      width={640}
      height={480}
      priority
      className={clx(
        "absolute right-0 bottom-0 object-contain pointer-events-none select-none opacity-95",
        compact ? "h-full w-auto max-w-[45%]" : "h-[115%] w-auto max-w-[55%] -mb-4"
      )}
    />
  </div>
)

export default BrandBanner
