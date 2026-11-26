"use client"

import { useCart } from "@/lib/context/cart-context"
import { getCheckoutStep } from "@/lib/util/get-checkout-step"
import { MACHINES } from "@/lib/util/machines"
import { convertToLocale } from "@/lib/util/money"
import CartToCsvButton from "@/modules/cart/components/cart-to-csv-button"
import CartTotals from "@/modules/cart/components/cart-totals"
import PromotionCode from "@/modules/checkout/components/promotion-code"
import Button from "@/modules/common/components/button"
import Divider from "@/modules/common/components/divider"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { RequestQuoteConfirmation } from "@/modules/quotes/components/request-quote-confirmation"
import { RequestQuotePrompt } from "@/modules/quotes/components/request-quote-prompt"
import { B2BCustomer } from "@/types"
import { ApprovalStatusType } from "@/types/approval"
import { ExclamationCircle } from "@medusajs/icons"
import { Container } from "@medusajs/ui"

type SummaryProps = {
  customer: B2BCustomer | null
  spendLimitExceeded: boolean
}

const Summary = ({ customer, spendLimitExceeded }: SummaryProps) => {
  const { handleEmptyCart, cart } = useCart()

  if (!cart) return null

  const checkoutStep = getCheckoutStep(cart)
  const checkoutPath = checkoutStep
    ? `/checkout?step=${checkoutStep}`
    : "/checkout"

  const checkoutButtonLink = customer ? checkoutPath : "/account"

  // a machine can be paid in stages (the terms page: usually 30% down, the rest before dispatch)
  const hasMachine = !!cart.items?.some((i) => MACHINES.some((m) => m.handle === i.product_handle))
  const downPayment = convertToLocale({
    amount: Math.round(((cart.total ?? 0) * 0.3) / 1000) * 1000,
    currency_code: cart.currency_code ?? "idr",
  })

  const isPendingApproval = cart?.approvals?.some(
    (approval) => approval?.status === ApprovalStatusType.PENDING
  )

  return (
    <Container className="flex flex-col gap-y-3">
      <CartTotals />
      {hasMachine && (
        <p className="text-[14px] leading-snug text-ui-fg-subtle" data-testid="cart-payment-plan">
          Bisa bayar bertahap: umumnya uang muka 30% saat pesan (sekitar {downPayment}), pelunasan sebelum barang dikirim.{" "}
          <LocalizedClientLink href="/terms" className="underline underline-offset-4">
            Syarat pembayaran
          </LocalizedClientLink>
        </p>
      )}
      <Divider />
      <PromotionCode cart={cart} />
      <Divider className="my-6" />
      {spendLimitExceeded && (
        <div className="flex items-center gap-x-2 bg-neutral-100 p-3 rounded-md shadow-borders-base">
          <ExclamationCircle className="text-orange-500 w-fit overflow-visible" />
          <p className="text-neutral-950 text-xs">
            Pesanan ini melebihi batas belanja Anda.
            <br />
            Hubungi atasan Anda untuk persetujuan.
          </p>
        </div>
      )}
      <LocalizedClientLink
        href={checkoutButtonLink}
        data-testid="checkout-button"
      >
        <Button
          className="w-full h-[52px] rounded-full shadow-none text-[16px]"
          disabled={spendLimitExceeded}
        >
          {customer
            ? spendLimitExceeded
              ? "Melebihi Batas Belanja"
              : "Bayar sekarang"
            : "Masuk untuk Checkout"}
        </Button>
      </LocalizedClientLink>
      {!!customer && (
        <RequestQuoteConfirmation>
          <Button
            className="w-full h-11 rounded-full shadow-borders-base"
            variant="secondary"
            disabled={isPendingApproval}
          >
            Minta Penawaran
          </Button>
        </RequestQuoteConfirmation>
      )}
      {!customer && (
        <RequestQuotePrompt>
          <Button
            className="w-full h-11 rounded-full shadow-borders-base"
            variant="secondary"
            disabled={isPendingApproval}
          >
            Minta Penawaran
          </Button>
        </RequestQuotePrompt>
      )}
      <CartToCsvButton cart={cart} />
      <Button
        onClick={handleEmptyCart}
        className="w-full h-11 rounded-full shadow-borders-base"
        variant="secondary"
        disabled={isPendingApproval}
      >
        Kosongkan Keranjang
      </Button>
    </Container>
  )
}

export default Summary
