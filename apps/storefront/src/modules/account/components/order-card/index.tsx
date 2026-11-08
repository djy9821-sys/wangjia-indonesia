import { convertToLocale } from "@/lib/util/money"
import {
  formatDateId,
  fulfillmentColor,
  fulfillmentLabel,
  paymentColor,
  paymentLabel,
} from "@/lib/util/order-status"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { Badge, Button, Container } from "@medusajs/ui"
import Image from "next/image"
import { useMemo } from "react"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(
    () => order.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0,
    [order]
  )
  const thumbnail = order.items?.find((i) => i.thumbnail)?.thumbnail
  const titles = (order.items ?? [])
    .map((i) => `${i.title} ×${i.quantity}`)
    .join(", ")

  return (
    <Container className="bg-white flex flex-col small:flex-row gap-4 p-4 rounded-md small:items-center">
      <div className="flex gap-x-4 items-start flex-1 min-w-0">
        <div className="w-16 h-16 shrink-0 rounded-md bg-neutral-100 overflow-hidden relative">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={order.items?.[0]?.title ?? ""}
              fill
              sizes="64px"
              className="object-cover"
              draggable={false}
            />
          ) : (
            <Image
              src="/products/aerator-2hp.png"
              alt=""
              fill
              sizes="64px"
              className="object-cover opacity-70"
              draggable={false}
            />
          )}
        </div>
        <div className="flex flex-col gap-y-1 min-w-0">
          <div className="flex items-baseline gap-x-2 flex-wrap">
            <span className="text-base-semi" data-testid="order-display-id">
              Pesanan #{order.display_id}
            </span>
            <span
              className="text-small-regular text-neutral-500"
              data-testid="order-created-at"
            >
              {formatDateId(order.created_at)} · {numberOfLines} barang
            </span>
          </div>
          <span className="text-small-regular text-neutral-700 truncate">
            {titles}
          </span>
          <div className="flex gap-x-2 flex-wrap mt-1">
            <Badge size="2xsmall" color={fulfillmentColor(order.fulfillment_status)}>
              {fulfillmentLabel(order.fulfillment_status)}
            </Badge>
            <Badge size="2xsmall" color={paymentColor(order.payment_status)}>
              {paymentLabel(order.payment_status)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between small:justify-end gap-x-4 w-full small:w-auto">
        <span className="text-base-semi text-neutral-950" data-testid="order-amount">
          {convertToLocale({
            amount: order.total,
            currency_code: order.currency_code,
          })}
        </span>
        <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
          <Button
            data-testid="card-details-link"
            variant="secondary"
            className="rounded-full text-xs"
          >
            Detail
          </Button>
        </LocalizedClientLink>
      </div>
    </Container>
  )
}

export default OrderCard
