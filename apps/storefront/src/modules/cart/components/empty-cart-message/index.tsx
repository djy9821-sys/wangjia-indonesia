import LocalizedClientLink from "@/modules/common/components/localized-client-link"

/*
  The cart with nothing in it: say so in one line and offer the two ways on, the machines and
  their spare parts, instead of a lone text link in the middle of an empty page.
*/
const PILL = "flex h-[52px] items-center rounded-full px-6 text-[16px] font-semibold transition-transform duration-150 active:scale-[0.97]"

const EmptyCartMessage = () => (
  <div className="flex flex-col items-start py-16 small:py-28" data-testid="empty-cart-message">
    <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#121417] small:text-[44px]">
      Keranjang Anda masih kosong
    </h1>
    <p className="mt-3 max-w-[44ch] text-[17px] leading-relaxed text-[#3d4350]">
      Pilih kincir air atau suku cadangnya. Harga tertulis di setiap produk, dan pesanan bisa dibayar bertahap.
    </p>
    <div className="mt-8 flex flex-wrap gap-3">
      <LocalizedClientLink href="/categories/kincir-air" className={`${PILL} bg-[#121417] text-white`}>
        Lihat kincir air
      </LocalizedClientLink>
      <LocalizedClientLink href="/categories/suku-cadang" className={`${PILL} border border-[#121417] text-[#121417]`}>
        Lihat suku cadang
      </LocalizedClientLink>
    </div>
  </div>
)

export default EmptyCartMessage
