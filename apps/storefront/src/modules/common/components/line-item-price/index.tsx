import { convertToLocale } from "@/lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx, Text } from "@medusajs/ui"

type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  className?: string
  currencyCode: string
}

const LineItemPrice = ({
  item,
  style = "default",
  className,
  currencyCode,
}: LineItemPriceProps) => {
  // Lines show amounts before PPN, like the product pages and the subtotal under them; PPN
  // is added once, in the totals. With the total (PPN included) a Rp 6.500.000 machine read
  // Rp 7.215.000 above a subtotal of Rp 6.500.000.
  const originalPrice = item.subtotal ?? 0
  const discount = (item.discount_total ?? 0) - (item.discount_tax_total ?? 0)
  const currentPrice = originalPrice - discount

  const hasReducedPrice = discount > 0

  return (
    <Text
      className={clx(
        "flex flex-col gap-x-2 text-ui-fg-subtle items-end",
        className
      )}
    >
      <span className="flex flex-col text-left">
        {hasReducedPrice && (
          <>
            <span
              className="line-through text-ui-fg-muted"
              data-testid="product-original-price"
            >
              {convertToLocale({
                amount: originalPrice,
                currency_code: currencyCode ?? "eur",
              })}
            </span>

            {style === "default" && (
              <span className="text-base-regular text-ui-fg-interactive">
                -
                {convertToLocale({
                  amount: discount,
                  currency_code: currencyCode ?? "eur",
                })}
              </span>
            )}
          </>
        )}
        <span className="text-base-regular" data-testid="product-price">
          {convertToLocale({
            amount: currentPrice,
            currency_code: currencyCode ?? "eur",
          })}
        </span>
      </span>
    </Text>
  )
}

export default LineItemPrice
