/** Indonesian labels for Medusa order statuses (shared by account pages). */
export const fulfillmentLabel = (status?: string | null) =>
  ({
    not_fulfilled: "Diproses",
    partially_fulfilled: "Sebagian disiapkan",
    fulfilled: "Disiapkan di gudang",
    partially_shipped: "Sebagian dikirim",
    shipped: "Dalam pengiriman",
    partially_delivered: "Sebagian diterima",
    delivered: "Diterima",
    canceled: "Dibatalkan",
  })[status ?? ""] ?? "Diproses"

export const fulfillmentColor = (
  status?: string | null
): "grey" | "blue" | "green" | "red" | "purple" => {
  switch (status) {
    case "shipped":
    case "partially_shipped":
      return "blue"
    case "delivered":
    case "partially_delivered":
      return "green"
    case "fulfilled":
    case "partially_fulfilled":
      return "purple"
    case "canceled":
      return "red"
    default:
      return "grey"
  }
}

export const paymentLabel = (status?: string | null) =>
  ({
    captured: "Lunas",
    partially_captured: "Sebagian dibayar",
    authorized: "Menunggu konfirmasi",
    awaiting: "Belum dibayar",
    not_paid: "Belum dibayar",
    refunded: "Dikembalikan",
    partially_refunded: "Dikembalikan sebagian",
    canceled: "Dibatalkan",
  })[status ?? ""] ?? "Belum dibayar"

export const paymentColor = (
  status?: string | null
): "grey" | "orange" | "green" | "red" | "purple" => {
  switch (status) {
    case "captured":
      return "green"
    case "partially_captured":
    case "authorized":
      return "orange"
    case "refunded":
    case "partially_refunded":
      return "purple"
    case "canceled":
      return "red"
    default:
      return "grey"
  }
}

export const formatDateId = (iso: string | Date, long = false) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: long ? "long" : "short",
    year: "numeric",
  })
