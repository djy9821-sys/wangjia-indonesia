import { Heading } from "@medusajs/ui"
import CheckoutTotals from "@/modules/checkout/components/checkout-totals"
import Help from "@/modules/order/components/help"
import Items from "@/modules/order/components/items"
import OrderDetails from "@/modules/order/components/order-details"
import PaymentDetails from "@/modules/order/components/payment-details"
import ShippingDetails from "@/modules/order/components/shipping-details"
import { B2BOrder } from "@/types/global"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { Button, Text } from "@medusajs/ui"

type OrderCompletedTemplateProps = {
  order: B2BOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full py-10"
          data-testid="order-complete-container"
        >
          <Heading
            level="h1"
            className="flex flex-col gap-y-3 text-ui-fg-base text-3xl mb-4"
          >
            <span>Terima kasih!</span>
            <span>Pesanan Anda berhasil dibuat.</span>
          </Heading>
          {/* Payment happens through the payment plan (auto for small orders, from sales for machines). */}
          <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-5 flex flex-col gap-y-3">
            <Text weight="plus">Langkah berikutnya: pembayaran</Text>
            <Text className="text-ui-fg-subtle txt-small">
              Untuk suku cadang, rencana pembayaran penuh dibuat otomatis dan bisa langsung dibayar (QRIS / VA / e-wallet
              atau transfer). Untuk mesin, tim kami mengirim rencana uang muka & pelunasan lewat WhatsApp. Semuanya ada
              di halaman detail pesanan.
            </Text>
            <LocalizedClientLink href={`/account/orders/details/${order.id}`} className="w-fit">
              <Button>Lihat rencana pembayaran &amp; bayar</Button>
            </LocalizedClientLink>
          </div>
          <OrderDetails order={order} />
          <Heading level="h2" className="flex flex-row text-3xl-regular">
            Summary
          </Heading>
          <Items items={order.items} order={order} />
          <CheckoutTotals cartOrOrder={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}
