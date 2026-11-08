import { ArrowUturnLeft } from "@medusajs/icons"
import React from "react"

import { HttpTypes } from "@medusajs/types"
import { Container, Table } from "@medusajs/ui"
import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Item from "@/modules/order/components/item"
import OrderDetails from "@/modules/order/components/order-details"
import OrderSummary from "@/modules/order/components/order-summary"
import ShippingDetails from "@/modules/order/components/shipping-details"
import BillingDetails from "@/modules/order/components/billing-details"
import PaymentPlan from "@/modules/order/components/payment-plan"
import { StorePaymentPlan } from "@/lib/data/payment-plan"
import type { OrderUnit, Shipment } from "@/lib/data/order-extras"
import OrderTracking from "@/modules/order/components/order-tracking"
import OrderUnits from "@/modules/order/components/order-units"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
  paymentPlan?: StorePaymentPlan | null
  invoiceUrl?: string | null
  shipments?: Shipment[]
  units?: OrderUnit[]
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
  paymentPlan = null,
  invoiceUrl = null,
  shipments = [],
  units = [],
}) => {
  return (
    <div className="flex flex-col justify-center gap-y-2">
      <div className="flex gap-2 justify-between items-center mb-2">
        <LocalizedClientLink
          href="/account/orders"
          className="flex gap-2 items-center text-ui-fg-subtle hover:text-ui-fg-base"
          data-testid="back-to-overview-button"
        >
          <Button variant="secondary">
            <ArrowUturnLeft /> Kembali
          </Button>
        </LocalizedClientLink>
      </div>

      <div className="small:grid small:grid-cols-6 gap-4 flex flex-col-reverse">
        <div className="small:col-span-4 flex flex-col gap-y-2">
          <Container>
            <Table>
              <Table.Body>
                {order.items?.map((item) => (
                  <Item key={item.id} item={item} order={order} />
                ))}
              </Table.Body>
            </Table>
          </Container>

          <Container>
            <OrderSummary order={order} />
          </Container>

          <Container>
            <PaymentPlan plan={paymentPlan} orderId={order.id} invoiceUrl={invoiceUrl} />
          </Container>

          {shipments.length > 0 && (
            <Container>
              <OrderTracking shipments={shipments} />
            </Container>
          )}

          <Container>
            <OrderUnits units={units} />
          </Container>
        </div>

        <div className="small:col-span-2 flex flex-col gap-y-2">
          <Container>
            <OrderDetails order={order} />
          </Container>

          {(!!order.shipping_address || !!order.shipping_methods?.length) && (
            <Container>
              <ShippingDetails order={order} />
            </Container>
          )}
          {!!order.billing_address && (
            <Container>
              <BillingDetails order={order} />
            </Container>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
