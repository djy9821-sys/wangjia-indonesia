import { retrieveOrder } from "@/lib/data/orders"
import { retrieveInvoiceLink, retrievePaymentPlan } from "@/lib/data/payment-plan"
import { listOrderTracking, listOrderUnits } from "@/lib/data/order-extras"
import OrderDetailsTemplate from "@/modules/order/templates/order-details-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  return {
    title: `Order #${order.display_id}`,
    description: `View your order`,
  }
}

export default async function OrderDetailPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  const [paymentPlan, invoiceUrl, shipments, units] = await Promise.all([
    retrievePaymentPlan(order.id),
    retrieveInvoiceLink(order.id),
    listOrderTracking(order.id),
    listOrderUnits(order.id),
  ])

  return (
    <OrderDetailsTemplate
      order={order}
      paymentPlan={paymentPlan}
      invoiceUrl={invoiceUrl}
      shipments={shipments}
      units={units}
    />
  )
}
