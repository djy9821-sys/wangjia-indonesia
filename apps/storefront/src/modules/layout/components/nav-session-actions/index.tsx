"use client"

import { useSession } from "@/lib/context/session-context"
import { IS_PREVIEW } from "@/lib/util/preview"
import AccountButton from "@/modules/account/components/account-button"
import CartButton from "@/modules/cart/components/cart-button"
import FilePlus from "@/modules/common/icons/file-plus"
import { RequestQuoteConfirmation } from "@/modules/quotes/components/request-quote-confirmation"
import { RequestQuotePrompt } from "@/modules/quotes/components/request-quote-prompt"

const QuoteButton = () => (
  <button
    type="button"
    aria-label="Minta penawaran"
    className="flex min-h-[36px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl px-2 py-1"
  >
    <FilePlus size={15} />
    {/* the word from 1280 px up; narrower desktops keep the icon */}
    <span className="hidden medium:inline-block">Penawaran</span>
  </button>
)

export default function NavSessionActions() {
  const { customer, cart } = useSession()

  if (IS_PREVIEW) {
    return <CartButton />
  }

  return (
    <>
      {/* on phones the bar keeps search and the cart: the account is in the menu, a quote starts from the cart page */}
      <div className="hidden items-center gap-2 small:flex">
        {customer && cart?.items && cart.items.length > 0 ? (
          <RequestQuoteConfirmation>
            <QuoteButton />
          </RequestQuoteConfirmation>
        ) : (
          <RequestQuotePrompt>
            <QuoteButton />
          </RequestQuotePrompt>
        )}

        <AccountButton customer={customer} />
      </div>

      <CartButton />
    </>
  )
}
